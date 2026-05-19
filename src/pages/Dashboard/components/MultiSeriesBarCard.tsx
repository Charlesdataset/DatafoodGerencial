import { faChartBar } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useEffect, useRef, useState } from 'react';
import Card from '../../../components/Card/Card';
import NoData from '../../../components/NoData/NoData';
import styles from './MultiSeriesBarCard.module.scss';

// ─── constants ────────────────────────────────────────────────────────────────
const DEFAULT_COLORS = [
    '#55BACA', '#FE8B43', '#10b981', '#ea384c', '#8b5cf6', '#f59e0b', '#06b6d4', '#ec4899',
];
const CHART_HEIGHT = 160;
const MIN_COL_W    = 40;
const BAR_GAP      = 8;
const TICK_COUNT   = 4;
const Y_AXIS_W     = 44;
const BAR_RADIUS   = 3;

function shortNumber(v: number): string {
    if (v >= 1000000) return `${(v / 1000000).toFixed(1).replace(/\.0$/, '')}M`;
    if (v >= 1000)    return `${(v / 1000).toFixed(1).replace(/\.0$/, '')}k`;
    return String(Math.round(v));
}

// ─── public types ─────────────────────────────────────────────────────────────
export interface SeriesDef {
    nome: string;
    cor?: string;
}

export interface ChartTotalItem {
    nome?: string;
    valor?: number;
    quantidade?: number;
    percentual?: string;
    [key: string]: unknown;
}

export interface MultiSeriesBarData {
    /** cada linha: [label, valor1, valor2, …] */
    items: (string | number)[][];
    totals?: ChartTotalItem[];
    period?: string;
}

// ─── internal types ───────────────────────────────────────────────────────────
interface TooltipState {
    label: string;
    values: { nome: string; cor: string; value: number }[];
    total: number;
}

interface Props {
    data?: MultiSeriesBarData | null;
    /** define nome/cor de cada série (sobrescreve totals[i].nome) */
    series?: SeriesDef[];
    titulo?: string;
    /** cor primária — usada na série 0 quando series[0].cor não definido */
    cor?: string;
    valueFormatter?: (v: number) => string;
    labelFormatter?: (l: string) => string;
}

// ─── component ────────────────────────────────────────────────────────────────
const MultiSeriesBarCard: React.FC<Props> = ({
    data,
    series,
    titulo = 'Gráfico',
    cor = '#55BACA',
    valueFormatter = (v) =>
        v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }),
    labelFormatter = (l) => l,
}) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [containerW, setContainerW] = useState(0);
    const [tooltip, setTooltip]       = useState<TooltipState | null>(null);

    // mede largura do scrollContainer (estável, sem feedback loop)
    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;
        const ro = new ResizeObserver(entries => {
            setContainerW(entries[0].contentRect.width);
        });
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    const items   = data?.items  ?? [];
    const totals  = data?.totals ?? [];
    const period  = data?.period ?? '';
    const hasData = items.length > 0;

    const seriesCount = items.length > 0 ? items[0].length - 1 : (series?.length ?? 0);

    // resolve nome + cor de cada série
    const resolvedSeries: { nome: string; cor: string }[] = Array.from(
        { length: seriesCount },
        (_, i) => {
            const fromProp  = series?.[i];
            const fromTotal = totals?.[i];
            const nome      = fromProp?.nome ?? fromTotal?.nome ?? `Série ${i + 1}`;
            let color: string;
            if (fromProp?.cor) {
                color = fromProp.cor;
            } else if (i === 0) {
                color = cor;
            } else {
                color = DEFAULT_COLORS[i % DEFAULT_COLORS.length];
            }
            return { nome, cor: color };
        },
    );

    // normaliza linhas
    const rows = items.map(row => ({
        label:  String(row[0]),
        values: Array.from({ length: seriesCount }, (_, i) => Number(row[i + 1] ?? 0)),
    }));

    // Y-axis ticks
    const maxStack = Math.max(...rows.map(r => r.values.reduce((a, b) => a + b, 0)), 1);
    const rawStep  = maxStack / TICK_COUNT;
    const mag      = Math.pow(10, Math.floor(Math.log10(Math.max(rawStep, 1))));
    const tickStep = Math.max(1, Math.ceil(rawStep / mag) * mag) || 1;
    const ticks    = Array.from({ length: TICK_COUNT + 1 }, (_, i) => Math.round(i * tickStep));
    const maxTick  = ticks[ticks.length - 1];

    // largura dinâmica das colunas
    const count       = Math.max(rows.length, 1);
    const colWidth    = containerW > 0 && containerW / count >= MIN_COL_W
        ? containerW / count
        : MIN_COL_W;
    const svgWidth    = colWidth * count;
    const needsScroll = containerW > 0 && svgWidth > containerW + 1;
    const barW        = Math.max(colWidth - BAR_GAP, 4);

    // segmentos de cada barra
    const bars = rows.map((row, colIdx) => {
        const cx    = colIdx * colWidth + colWidth / 2;
        const total = row.values.reduce((a, b) => a + b, 0);
        let lastNonZero = -1;
        for (let i = row.values.length - 1; i >= 0; i--) {
            if (row.values[i] > 0) { lastNonZero = i; break; }
        }
        let cumH = 0;
        const segments = row.values.map((v, si) => {
            const h = maxTick > 0 ? (v / maxTick) * CHART_HEIGHT : 0;
            const y = CHART_HEIGHT - cumH - h;
            cumH += h;
            return { v, h, y, isTop: si === lastNonZero };
        });
        return { cx, total, segments, label: row.label };
    });

    const visibleTotals = totals.filter(t => (t.valor ?? 0) > 0 || (t.quantidade ?? 0) > 0);

    return (
        <Card className={styles.card}>
            <Card.Header className={styles.cardHeader}>
                <div className={styles.headerLeft}>
                    <span className={styles.icon} style={{ background: `${cor}1a`, color: cor }}>
                        <FontAwesomeIcon icon={faChartBar} />
                    </span>
                    <span className={styles.title}>{titulo}</span>
                </div>
                <span className={styles.period}>{period}</span>
            </Card.Header>

            <Card.Body className={styles.cardBody}>
                {/* Legenda */}
                <div className={styles.legend}>
                    {resolvedSeries.map((s, i) => (
                        <span key={i} className={styles.legendItem}>
                            <span className={styles.legendDot} style={{ background: s.cor }} />
                            {s.nome}
                        </span>
                    ))}
                </div>

                {hasData ? (
                    <>
                        {/* Área do gráfico */}
                        <div className={styles.chartArea}>
                            {/* Eixo Y */}
                            <div className={styles.yAxis}>
                                <div className={styles.yAxisInner}>
                                    {[...ticks].reverse().map((t, i) => (
                                        <span key={i} className={styles.yLabel}>{shortNumber(t)}</span>
                                    ))}
                                </div>
                            </div>

                            {/* Barras roláveis */}
                            <div
                                className={styles.scrollContainer}
                                ref={scrollRef}
                                style={{ overflowX: needsScroll ? 'auto' : 'hidden' }}
                                onWheel={e => {
                                    if (needsScroll && scrollRef.current)
                                        scrollRef.current.scrollLeft += e.deltaY;
                                    if (needsScroll) e.preventDefault();
                                }}
                            >
                                <div
                                    className={styles.chartInner}
                                    style={{ width: '100%', minWidth: needsScroll ? svgWidth : undefined }}
                                >
                                    <svg
                                        width={svgWidth}
                                        height={CHART_HEIGHT}
                                        className={styles.svg}
                                        onMouseLeave={() => setTooltip(null)}
                                    >
                                        {/* Linhas de grade */}
                                        {ticks.slice(1).map((t, i) => {
                                            const gy = CHART_HEIGHT - (t / maxTick) * CHART_HEIGHT;
                                            return (
                                                <line
                                                    key={i}
                                                    x1={0} y1={gy}
                                                    x2={svgWidth} y2={gy}
                                                    stroke="#f1f5f9"
                                                    strokeWidth={1}
                                                />
                                            );
                                        })}

                                        {/* Barras empilhadas */}
                                        {bars.map((bar, bi) => (
                                            <g
                                                key={bi}
                                                className={styles.barGroup}
                                                onMouseEnter={() => setTooltip({
                                                    label:  bar.label,
                                                    values: resolvedSeries.map((s, si) => ({
                                                        nome:  s.nome,
                                                        cor:   s.cor,
                                                        value: bar.segments[si]?.v ?? 0,
                                                    })),
                                                    total: bar.total,
                                                })}
                                            >
                                                {bar.segments.map((seg, si) => {
                                                    if (seg.h < 0.5) return null;
                                                    return (
                                                        <rect
                                                            key={si}
                                                            x={bar.cx - barW / 2}
                                                            y={seg.y}
                                                            width={barW}
                                                            height={seg.h}
                                                            fill={resolvedSeries[si].cor}
                                                            rx={seg.isTop ? BAR_RADIUS : 0}
                                                            ry={seg.isTop ? BAR_RADIUS : 0}
                                                        />
                                                    );
                                                })}
                                            </g>
                                        ))}
                                    </svg>

                                    {/* Eixo X */}
                                    <div className={styles.xAxis} style={{ width: svgWidth }}>
                                        {bars.map((bar, i) => (
                                            <span
                                                key={i}
                                                className={styles.xLabel}
                                                style={{ width: colWidth, left: i * colWidth }}
                                            >
                                                {labelFormatter(bar.label)}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Tooltip */}
                        {tooltip && (
                            <div className={styles.tooltip} style={{ borderColor: cor }}>
                                <span className={styles.tooltipDate}>{tooltip.label}</span>
                                {tooltip.values
                                    .filter(v => v.value > 0)
                                    .map((v, i) => (
                                        <span key={i} className={styles.tooltipRow}>
                                            <span className={styles.tooltipDot} style={{ background: v.cor }} />
                                            <span className={styles.tooltipName}>{v.nome}</span>
                                            <span className={styles.tooltipVal} style={{ color: v.cor }}>
                                                {valueFormatter(v.value)}
                                            </span>
                                        </span>
                                    ))}
                                <span className={styles.tooltipTotal}>
                                    Total: <strong>{valueFormatter(tooltip.total)}</strong>
                                </span>
                            </div>
                        )}

                        {/* Faixa de totais */}
                        {visibleTotals.length > 0 && (
                            <div className={styles.totalsStrip}>
                                {visibleTotals.map((t, i) => {
                                    const si    = resolvedSeries.findIndex(s => s.nome === t.nome);
                                    const color = si >= 0
                                        ? resolvedSeries[si].cor
                                        : DEFAULT_COLORS[i % DEFAULT_COLORS.length];
                                    return (
                                        <div key={i} className={styles.totalPill}>
                                            <span className={styles.totalDot} style={{ background: color }} />
                                            <div className={styles.totalInfo}>
                                                <span className={styles.totalNome}>{t.nome}</span>
                                                <span className={styles.totalValor} style={{ color }}>
                                                    {valueFormatter(t.valor ?? 0)}
                                                </span>
                                            </div>
                                            <span className={styles.totalPct}>{t.percentual}%</span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </>
                ) : (
                    <NoData message="Sem dados" subtext="Nenhum dado encontrado para o período selecionado." />
                )}
            </Card.Body>
        </Card>
    );
};

export default MultiSeriesBarCard;
