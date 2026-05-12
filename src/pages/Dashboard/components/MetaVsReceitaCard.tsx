// MetaVsReceitaCompact.tsx
import { faArrowTrendDown, faArrowTrendUp, faBullseye, faChartLine } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Card from "../../../components/Card/Card";
import styles from './MetaVsReceitaCard.module.scss';

interface MetaVsReceitaData {
    goal: number;
    revenue: number;
    period: string;
}

interface MetaVsReceitaCompactProps {
    data: MetaVsReceitaData;
    titulo?: string;
    metaLabel?: string;
    receitaLabel?: string;
}

export default function MetaVsReceitaCard({
    data,
    titulo = "Meta vs Receita",
    metaLabel = "Meta",
    receitaLabel = "Realizado"
}: MetaVsReceitaCompactProps) {

    const { goal, revenue, period } = data;

    // Cálculos
    const percentualAtingido = goal > 0 ? (revenue / goal) * 100 : 0;
    const diferenca = revenue - goal;
    const metaAtingida = revenue >= goal;
    const percentualFormatado = percentualAtingido.toFixed(1);

    // Ângulos para o donut chart (360 graus)
    const anguloAtingido = Math.min((percentualAtingido / 100) * 360, 360);
    const anguloRestante = 360 - anguloAtingido;

    // Cor baseada no percentual
    const getCorPrincipal = () => {
        if (percentualAtingido >= 100) return '#10b981';
        if (percentualAtingido >= 75) return '#f59e0b';
        if (percentualAtingido >= 50) return '#f97316';
        return '#ef4444';
    };

    const corPrincipal = getCorPrincipal();
    const corFundo = '#eef2f6';

    return (
        <Card className={styles.metaVsReceitaCompact}>
            <Card.Header className={styles.cardHeader}>
                <div className={styles.headerLeft}>
                    <span className={styles.icon}>
                        <FontAwesomeIcon icon={faBullseye} />
                    </span>
                    <span className={styles.title}>{titulo}</span>
                </div>
                <span className={styles.period}>{period}</span>
            </Card.Header>

            <Card.Body className={styles.cardBody}>
                <div className={styles.contentWrapper}>
                    {/* Donut Chart */}
                    <div className={styles.donutArea}>
                        <div className={styles.donutContainer}>
                            <svg viewBox="0 0 100 100" className={styles.donutSvg}>
                                {/* Círculo de fundo */}
                                <circle
                                    cx="50"
                                    cy="50"
                                    r="42"
                                    fill="none"
                                    stroke={corFundo}
                                    strokeWidth="10"
                                    strokeDasharray={`${anguloRestante} ${360 - anguloRestante}`}
                                    strokeDashoffset="0"
                                    transform="rotate(-90 50 50)"
                                    strokeLinecap="round"
                                />
                                {/* Círculo de progresso */}
                                <circle
                                    cx="50"
                                    cy="50"
                                    r="42"
                                    fill="none"
                                    stroke={corPrincipal}
                                    strokeWidth="10"
                                    strokeDasharray={`${anguloAtingido} ${360 - anguloAtingido}`}
                                    strokeDashoffset="0"
                                    transform="rotate(-90 50 50)"
                                    strokeLinecap="round"
                                    className={styles.progressCircle}
                                />
                                {/* Texto central */}
                                <text
                                    x="50"
                                    y="46"
                                    textAnchor="middle"
                                    dominantBaseline="middle"
                                    className={styles.percentText}
                                >
                                    {percentualFormatado}%
                                </text>
                                <text
                                    x="50"
                                    y="60"
                                    textAnchor="middle"
                                    dominantBaseline="middle"
                                    className={styles.percentLabel}
                                >
                                    atingido
                                </text>
                            </svg>
                        </div>
                    </div>

                    {/* Métricas */}
                    <div className={styles.metricsArea}>
                        <div className={styles.metricRow}>
                            <div className={styles.metricItem}>
                                <span className={styles.metricLabel}>
                                    <FontAwesomeIcon icon={faChartLine} />
                                    {metaLabel}
                                </span>
                                <span className={styles.metricValue}>
                                    {formatCurrency(goal)}
                                </span>
                            </div>
                            <div className={styles.metricItem}>
                                <span className={styles.metricLabel}>
                                    <FontAwesomeIcon icon={faArrowTrendUp} />
                                    {receitaLabel}
                                </span>
                                <span className={styles.metricValue}>
                                    {formatCurrency(revenue)}
                                </span>
                            </div>
                        </div>

                        <div className={styles.divider} />

                        <div className={styles.resultItem}>
                            <span className={styles.resultLabel}>
                                <FontAwesomeIcon icon={metaAtingida ? faArrowTrendUp : faArrowTrendDown} />
                                {metaAtingida ? 'Superou' : 'Faltou'}
                            </span>
                            <span className={`${styles.resultValue} ${metaAtingida ? styles.positive : styles.negative}`}>
                                {metaAtingida ? '+' : '-'}{formatCurrency(Math.abs(diferenca))}
                            </span>
                        </div>

                        <div className={styles.statusBadge}>
                            {metaAtingida ? (
                                <span className={styles.badgeSuccess}>
                                    Meta atingida! 🎯
                                </span>
                            ) : (
                                <span className={styles.badgeWarning}>
                                    Faltam {formatCurrency(Math.abs(diferenca))}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </Card.Body>
        </Card>
    );
}

// Utilitários
const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2
    }).format(value);
};