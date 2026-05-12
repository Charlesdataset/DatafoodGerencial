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
}

const RADIUS = 40;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function MetaVsReceitaCard({
    data,
    titulo = "Meta vs Receita",
    metaLabel = "Meta",
    receitaLabel = "Realizado"
}: MetaVsReceitaCompactProps) {

    const { goal, revenue, period } = data;

    const percentualAtingido = goal > 0 ? Math.min((revenue / goal) * 100, 100) : 0;
    const percentualReal    = goal > 0 ? (revenue / goal) * 100 : 0;
    const diferenca          = revenue - goal;
    const metaAtingida       = revenue >= goal;

    // Comprimento de arco correto para o donut
    const progressArc  = (percentualAtingido / 100) * CIRCUMFERENCE;
    const remainingArc = CIRCUMFERENCE - progressArc;

    const getCorPrincipal = () => {
        if (percentualReal >= 100) return '#10b981';
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
                            <text x="50" y="45" textAnchor="middle" className={styles.donutPercent}>
                                {percentualReal.toFixed(0)}%
                            </text>
                            <text x="50" y="59" textAnchor="middle" className={styles.donutLabel}>
                                atingido
                            </text>
                        </svg>
                    </div>

                    {/* Stats */}
                    <div className={styles.statsArea}>
                        <div className={styles.statItem}>
                            <span className={styles.statLabel}>{metaLabel}</span>
                            <span className={styles.statValue}>{formatCurrency(goal)}</span>
                        </div>

                        <div className={styles.statDivider} />

                        <div className={styles.statItem}>
                            <span className={styles.statLabel}>{receitaLabel}</span>
                            <span className={styles.statValue} style={{ color: cor }}>
                                {formatCurrency(revenue)}
                            </span>
                        </div>

                        <div className={styles.statDivider} />

                        <div
                            className={styles.resultBadge}
                            style={{
                                background: metaAtingida ? '#ecfdf5' : '#fef2f2',
                                color:      metaAtingida ? '#059669' : '#dc2626',
                            }}
                        >
                            <FontAwesomeIcon icon={metaAtingida ? faArrowTrendUp : faArrowTrendDown} />
                            <span>
                                {metaAtingida ? 'Superou em ' : 'Faltam '}
                                <strong>{formatCurrency(Math.abs(diferenca))}</strong>
                            </span>
                        </div>
                    </div>

                </div>
            </Card.Body>
        </Card>
    );
}

const formatCurrency = (value: number): string =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 }).format(value);