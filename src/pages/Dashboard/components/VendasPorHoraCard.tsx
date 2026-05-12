// VendasPorHoraCard.tsx
import { faChartLine } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useRef, useState } from "react";
import Card from "../../../components/Card/Card";
import styles from "./VendasPorHoraCard.module.scss";

interface VendasPorHoraData {
    hours: string[];
    values: number[];
    period: string;
}

interface VendasPorHoraCardProps {
    data: VendasPorHoraData;
    titulo?: string;
    cor?: string;
    /** Formata cada label do eixo X. Padrão: HH:mm a partir de ISO. */
    labelFormatter?: (label: string) => string;
    /** Formata o valor no tooltip. Padrão: moeda BRL. */
    valueFormatter?: (value: number) => string;
    /** Formata os ticks do eixo Y. Padrão: abreviação K/M. */
    yAxisFormatter?: (value: number) => string;
}

const CHART_HEIGHT = 200;
const TICK_COUNT   = 5;
const MIN_COL_W    = 44;

export default function VendasPorHoraCard({
    data,
    titulo = "Vendas por Hora",
    cor = "#2C7BE5",
    labelFormatter = formatHour,
  
    yAxisFormatter = formatEixo,

    valueFormatter = formatCurrency,

}: VendasPorHoraCardProps) {
    const { hours, values, period } = data;
    const scrollRef  = useRef<HTMLDivElement>(null);
    const [tooltip, setTooltip] = useState<{ x: number; y: number; label: string; value: number } | null>(null);

    const maxVal   = Math.max(...values, 1);
    const rawStep  = maxVal / TICK_COUNT;
    const mag      = Math.pow(10, Math.floor(Math.log10(rawStep || 1)));
    const tickStep = Math.ceil(rawStep / mag) * mag || 1;
    const ticks    = Array.from({ length: TICK_COUNT + 1 }, (_, i) => i * tickStep);
    const maxTick  = ticks[ticks.length - 1];

    const colWidth  = Math.max(MIN_COL_W, 800 / hours.length);
    const svgWidth  = colWidth * hours.length;

    // pontos normalizados
    const points = values.map((v, i) => ({
        x: i * colWidth + colWidth / 2,
        y: CHART_HEIGHT - (v / maxTick) * CHART_HEIGHT,
        value: v,
        label: labelFormatter(hours[i]),
    }));

    // polyline e área de preenchimento
    const pointsStr = points.map(p => `${p.x},${p.y}`).join(" ");
    const areaPath  = [
        `M ${points[0].x},${CHART_HEIGHT}`,
        ...points.map(p => `L ${p.x},${p.y}`),
        `L ${points[points.length - 1].x},${CHART_HEIGHT}`,
        "Z",
    ].join(" ");

    // scroll para o final ao montar
    useEffect(() => {
        setTimeout(() => {
            if (scrollRef.current)
                scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
        }, 80);
    }, [data]);

    return (
        <Card className={styles.card}>
            <Card.Header className={styles.cardHeader}>
                <div className={styles.headerLeft}>
                    <span className={styles.icon} style={{ background: `${cor}1a`, color: cor }}>
                        <FontAwesomeIcon icon={faChartLine} />
                    </span>
                    <span className={styles.title}>{titulo}</span>
                </div>
                <span className={styles.period}>{period}</span>
            </Card.Header>

            <Card.Body className={styles.cardBody}>
                <div className={styles.scrollWrapper}>
                    <div className={styles.chartArea}>

                        {/* Eixo Y sticky */}
                        <div className={styles.yAxis}>
                            <div className={styles.yAxisInner}>
                                {[...ticks].reverse().map((t, i) => (
                                    <span key={i} className={styles.yLabel}>
                                        {yAxisFormatter(t)}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Área rolável */}
                        <div
                            className={styles.scrollContainer}
                            ref={scrollRef}
                            onWheel={e => {
                                if (scrollRef.current) scrollRef.current.scrollLeft += e.deltaY;
                                e.preventDefault();
                            }}
                        >
                            <div className={styles.chartInner} style={{ width: svgWidth }}>

                                {/* SVG com linha e área */}
                                <svg
                                    width={svgWidth}
                                    height={CHART_HEIGHT}
                                    className={styles.svg}
                                    onMouseLeave={() => setTooltip(null)}
                                >
                                    <defs>
                                        <linearGradient id="lineAreaGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%"   stopColor={cor} stopOpacity="0.18" />
                                            <stop offset="100%" stopColor={cor} stopOpacity="0.01" />
                                        </linearGradient>
                                    </defs>

                                    {/* Linhas de grade horizontais */}
                                    {ticks.map((_, i) => {
                                        const y = (i / TICK_COUNT) * CHART_HEIGHT;
                                        return (
                                            <line
                                                key={i}
                                                x1={0} y1={y}
                                                x2={svgWidth} y2={y}
                                                stroke="#edf2f7"
                                                strokeWidth={1}
                                                strokeDasharray="4 4"
                                            />
                                        );
                                    })}

                                    {/* Área de preenchimento */}
                                    <path
                                        d={areaPath}
                                        fill="url(#lineAreaGrad)"
                                    />

                                    {/* Linha */}
                                    <polyline
                                        points={pointsStr}
                                        fill="none"
                                        stroke={cor}
                                        strokeWidth={2.2}
                                        strokeLinejoin="round"
                                        strokeLinecap="round"
                                        className={styles.line}
                                    />

                                    {/* Pontos */}
                                    {points.map((p, i) => (
                                        <g key={i}>
                                            {/* área invisível maior para facilitar o hover */}
                                            <circle
                                                cx={p.x} cy={p.y} r={12}
                                                fill="transparent"
                                                onMouseEnter={() => setTooltip(p)}
                                            />
                                            <circle
                                                cx={p.x} cy={p.y} r={4}
                                                fill="#fff"
                                                stroke={cor}
                                                strokeWidth={2}
                                                className={styles.dot}
                                            />
                                        </g>
                                    ))}
                                </svg>

                                {/* Labels do eixo X */}
                                <div className={styles.xAxis} style={{ width: svgWidth }}>
                                    {points.map((p, i) => (
                                        <span
                                            key={i}
                                            className={styles.xLabel}
                                            style={{ width: colWidth, left: i * colWidth }}
                                        >
                                            {p.label}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tooltip */}
                {tooltip && (
                    <div
                        className={styles.tooltip}
                        style={{ borderColor: cor }}
                    >
                        <span className={styles.tooltipHour}>{tooltip.label}</span>
                        <span className={styles.tooltipValue} style={{ color: cor }}>
                            {valueFormatter(tooltip.value)}
                        </span>
                    </div>
                )}
            </Card.Body>
        </Card>
    );
}

// ─── helpers ───────────────────────────────────────────
const formatHour = (iso: string) => {
    const d = new Date(iso);
    return `${String(d.getHours()).padStart(2, "0")}h`;
};

const formatEixo = (v: number) => {
    if (v >= 1000) return `${(v / 1000).toFixed(0)}K`;
    return String(v);
};

const formatCurrency = (v: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 }).format(v);
