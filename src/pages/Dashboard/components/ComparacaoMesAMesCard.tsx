// ComparacaoMesAMesCard.tsx (com scroll sticky)
import { faChartSimple } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Card from "../../../components/Card/Card";
import styles from './ComparacaoMesAMesCard.module.scss';
import { useEffect, useRef } from "react";

interface DadosMes {
    mes: string;
    valor1: number;
    valor2: number;
}

interface BarChartLadoALadoProps {
    items: [string, number, number][];
    period: string;
    titulo?: string;
    label1?: string;
    label2?: string;
    cor1?: string;
    cor2?: string;
    formatador?: (value: number) => string;
    formatadorEixo?: (value: number) => string;
}

export default function ComparacaoMesAMesCard({
    items,
    period,
    titulo = "Comparativo Mensal",
    label1 = "Valor 1",
    label2 = "Valor 2",
    cor1 = "#3b82f6",
    cor2 = "#f59e0b",
    formatador = formatCurrency,
    formatadorEixo = formatEixoY,
}: BarChartLadoALadoProps) {

    const chartRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const dados: DadosMes[] = items.map(([mes, v1, v2]) => ({
        mes, valor1: v1, valor2: v2
    }));

    const maxValor = Math.max(...dados.flatMap(d => [d.valor1, d.valor2]), 1);

    // Calcular ticks do eixo Y (5 linhas)
    const tickCount = 5;
    const tickStep = Math.ceil(maxValor / tickCount / 1000) * 1000;
    const ticks = Array.from({ length: tickCount + 1 }, (_, i) => i * tickStep);
    const maxTick = ticks[ticks.length - 1];

    // Scroll para o final quando o componente montar ou quando items mudar
    useEffect(() => {
        if (scrollContainerRef.current) {
            // Pequeno delay para garantir que o DOM foi renderizado
            setTimeout(() => {
                if (scrollContainerRef.current) {
                    scrollContainerRef.current.scrollLeft = scrollContainerRef.current.scrollWidth;
                }
            }, 100);
        }
    }, [items]);

    // Animação ao montar
    useEffect(() => {
        const bars = chartRef.current?.querySelectorAll<HTMLElement>(`.${styles.bar}`);
        if (!bars) return;
        bars.forEach((bar) => {
            const finalHeight = bar.dataset.height || "0";
            bar.style.height = "0%";
            requestAnimationFrame(() => {
                setTimeout(() => {
                    bar.style.height = `${finalHeight}%`;
                }, 80);
            });
        });
    }, [items]);

    return (
        <Card className={styles.barChartCard}>
            <Card.Header className={styles.cardHeader}>
                <div className={styles.headerLeft}>
                    <span className={styles.icon}>
                        <FontAwesomeIcon icon={faChartSimple} />
                    </span>
                    <span className={styles.title}>{titulo}</span>
                </div>
                <span className={styles.period}>{period}</span>
            </Card.Header>

            <Card.Body className={styles.cardBody}>
                <div className={styles.legends}>
                    <div className={styles.legendItem}>
                        <span className={styles.legendDot} style={{ backgroundColor: cor1 }} />
                        <span className={styles.legendText}>{label1}</span>
                    </div>
                    <div className={styles.legendItem}>
                        <span className={styles.legendDot} style={{ backgroundColor: cor2 }} />
                        <span className={styles.legendText}>{label2}</span>
                    </div>
                </div>

                {/* Container com scroll horizontal */}
                <div className={styles.scrollWrapper}>
                    <div className={styles.chartArea}>
                        {/* Eixo Y - STICKY */}
                        <div className={styles.yAxisSticky}>
                            <div className={styles.yAxisInner}>
                                {[...ticks].reverse().map((tick, i) => (
                                    <span key={i} className={styles.yLabel}>
                                        {formatadorEixo(tick)}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Container rolável */}
                        <div 
                            className={styles.scrollContainer} 
                            ref={scrollContainerRef}
                            onWheel={(e) => {
                                // Scroll horizontal com wheel
                                if (scrollContainerRef.current) {
                                    scrollContainerRef.current.scrollLeft += e.deltaY;
                                    e.preventDefault();
                                }
                            }}
                        >
                            <div className={styles.chartInner} ref={chartRef}>
                                {/* Linhas de grade */}
                                <div className={styles.gridLines}>
                                    {ticks.map((_, i) => (
                                        <div key={i} className={styles.gridLine} />
                                    ))}
                                </div>

                                {/* Barras */}
                                <div className={styles.chartContainer}>
                                    {dados.map((item, idx) => {
                                        const altura1 = (item.valor1 / maxTick) * 100;
                                        const altura2 = (item.valor2 / maxTick) * 100;

                                        return (
                                            <div key={idx} className={styles.barGroup}>
                                                <div className={styles.bars}>
                                                    {[
                                                        { altura: altura1, valor: item.valor1, cor: cor1 },
                                                        { altura: altura2, valor: item.valor2, cor: cor2 },
                                                    ].map((b, bi) => (
                                                        <div key={bi} className={styles.barWrapper}>
                                                            <div
                                                                className={styles.bar}
                                                                data-height={b.altura}
                                                                style={{
                                                                    height: `${b.altura}%`,
                                                                    backgroundColor: b.cor,
                                                                    minHeight: b.valor > 0 ? '4px' : '0',
                                                                }}
                                                            >
                                                                {b.valor > 0 && (
                                                                    <span className={styles.barValue}>
                                                                        {formatador(b.valor)}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className={styles.mesLabel}>{item.mes}</div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </Card.Body>
        </Card>
    );
}

const formatCurrency = (value: number): string =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 }).format(value);

const formatEixoY = (value: number): string => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
    return `${value}`;
};