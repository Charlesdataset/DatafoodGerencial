// MetaVsReceitaCard.tsx
import { faArrowTrendDown, faArrowTrendUp, faBullseye } from "@fortawesome/free-solid-svg-icons";
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
    /** Formata os valores exibidos. Padrão: moeda BRL. */
    formatter?: (value: number) => string;
    primaryColor?: string;
}

const RADIUS = 40;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function MetaVsReceitaCard({
    data,
    titulo = "Meta vs Receita",
    metaLabel = "Meta",
    receitaLabel = "Realizado",
    formatter = formatCurrency,
    primaryColor = "#10b981",
}: MetaVsReceitaCompactProps) {

    const { goal, revenue, period } = data;
    const semMeta = goal <= 0;

    const percentualAtingido = !semMeta ? Math.min((revenue / goal) * 100, 100) : 0;
    const percentualReal     = !semMeta ? (revenue / goal) * 100 : 0;
    const diferenca          = revenue - goal;
    const metaAtingida       = revenue >= goal;

    // Comprimento de arco correto para o donut
    const progressArc  = (percentualAtingido / 100) * CIRCUMFERENCE;
    const remainingArc = CIRCUMFERENCE - progressArc;

    const getCorPrincipal = () => {
        if (semMeta)               return '#94a3b8';
        if (percentualReal >= 100) return primaryColor;
        if (percentualReal >= 75)  return '#f59e0b';
        if (percentualReal >= 50)  return '#f97316';
        return '#ef4444';
    };

    const cor = getCorPrincipal();

    return (
        <Card className={styles.card}>
            <Card.Header className={styles.cardHeader}>
                <div className={styles.headerLeft}>
                    <span className={styles.icon} style={{ background: `${cor}1a`, color: cor }}>
                        <FontAwesomeIcon icon={faBullseye} />
                    </span>
                    <span className={styles.title}>{titulo}</span>
                </div>
                <span className={styles.period}>{period}</span>
            </Card.Header>

            <Card.Body className={styles.cardBody}>
                <div className={styles.contentWrapper}>

                    {/* Donut Chart */}
                    <div className={styles.donutWrapper}>
                        <svg viewBox="0 0 100 100" className={styles.donutSvg}>
                            {/* Trilha de fundo */}
                            <circle
                                cx="50" cy="50" r={RADIUS}
                                fill="none"
                                stroke="#eef2f6"
                                strokeWidth="9"
                            />
                            {/* Arco de progresso — começa no topo via rotate(-90) */}
                            <circle
                                cx="50" cy="50" r={RADIUS}
                                fill="none"
                                stroke={cor}
                                strokeWidth="9"
                                strokeLinecap="round"
                                strokeDasharray={`${progressArc} ${remainingArc}`}
                                strokeDashoffset="0"
                                transform="rotate(-90 50 50)"
                                className={styles.progressArc}
                            />
                            {/* % central */}
                            {semMeta ? (
                                <>
                                    <text x="50" y="45" textAnchor="middle" className={styles.donutPercent} style={{ fontSize: 13 }}>
                                        {formatter(revenue)}
                                    </text>
                                    <text x="50" y="59" textAnchor="middle" className={styles.donutLabel}>
                                        sem meta
                                    </text>
                                </>
                            ) : (
                                <>
                                    <text x="50" y="45" textAnchor="middle" className={styles.donutPercent}>
                                        {percentualReal.toFixed(0)}%
                                    </text>
                                    <text x="50" y="59" textAnchor="middle" className={styles.donutLabel}>
                                        atingido
                                    </text>
                                </>
                            )}
                        </svg>
                    </div>

                    {/* Stats */}
                    <div className={styles.statsArea}>
                        <div className={styles.statItem}>
                            <span className={styles.statLabel}>{metaLabel}</span>
                            <span className={styles.statValue}>
                                {semMeta ? '—' : formatter(goal)}
                            </span>
                        </div>

                        <div className={styles.statDivider} />

                        <div className={styles.statItem}>
                            <span className={styles.statLabel}>{receitaLabel}</span>
                            <span className={styles.statValue} style={{ color: cor }}>
                                {formatter(revenue)}
                            </span>
                        </div>

                        <div className={styles.statDivider} />

                        {semMeta ? (
                            <div
                                className={styles.resultBadge}
                                style={{ background: '#f1f5f9', color: '#64748b' }}
                            >
                                <FontAwesomeIcon icon={faBullseye} />
                                <span>Meta não definida</span>
                            </div>
                        ) : (
                            <div
                                className={styles.resultBadge}
                                style={{
                                    background: metaAtingida ? `${primaryColor}1a` : '#fef2f2',
                                    color:      metaAtingida ? primaryColor : '#dc2626',
                                }}
                            >
                                <FontAwesomeIcon icon={metaAtingida ? faArrowTrendUp : faArrowTrendDown} />
                                <span>
                                    {metaAtingida ? 'Superou em ' : 'Faltam '}
                                    <strong>{formatter(Math.abs(diferenca))}</strong>
                                </span>
                            </div>
                        )}
                    </div>

                </div>
            </Card.Body>
        </Card>
    );
}

const formatCurrency = (value: number): string =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 }).format(value);