// TopProdutosCard.tsx
import { faTrophy } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useRef, useState } from "react";
import Card from "../../../components/Card/Card";
import styles from "./TopProdutosCard.module.scss";

export interface TopProduto {
    id: number;
    name: string;
    revenue: number;
    percentage?: string;
}

interface TopProdutosCardProps {
    data: TopProduto[];
    titulo?: string;
    period?: string;
    cor?: string;
}

const MEDALS: Record<number, { label: string; className: string }> = {
    0: { label: "🥇", className: "gold" },
    1: { label: "🥈", className: "silver" },
    2: { label: "🥉", className: "bronze" },
};

export default function TopProdutosCard({
    data,
    titulo = "Top Produtos",
    period,
    cor = "#2C7BE5",
}: TopProdutosCardProps) {
    const [animated, setAnimated] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    // Dispara animação quando o card entra na viewport
    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) setAnimated(true); },
            { threshold: 0.15 }
        );
        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, []);

    const maxRevenue = data[0]?.revenue ?? 1;

    return (
        <Card className={styles.card} >
            <Card.Header className={styles.cardHeader}>
                <div className={styles.headerLeft}>
                    <span className={styles.icon} style={{ background: `${cor}1a`, color: cor }}>
                        <FontAwesomeIcon icon={faTrophy} />
                    </span>
                    <span className={styles.title}>{titulo}</span>
                    <span className={styles.countBadge}>{data.length} produtos</span>
                </div>
                {period && <span className={styles.period}>{period}</span>}
            </Card.Header>
            <div ref={ref}>

            </div>
            <Card.Body className={styles.cardBody} >
                <ol className={styles.list}>
                    {data.map((item, index) => {
                        const medal = MEDALS[index];
                        const barWidth = (item.revenue / maxRevenue) * 100;
                        const pct = parseFloat(item.percentage);

                        return (
                            <li
                                key={item.id}
                                className={`${styles.item} ${medal ? styles[`item--${medal.className}`] : ''}`}
                                style={{ animationDelay: `${index * 60}ms` }}
                            >
                                {/* Ranking */}
                                <div className={styles.rank}>
                                    {medal ? (
                                        <span className={`${styles.medal} ${styles[medal.className]}`}>
                                            {medal.label}
                                        </span>
                                    ) : (
                                        <span className={styles.rankNumber}>{index + 1}</span>
                                    )}
                                </div>

                                {/* Info + barra */}
                                <div className={styles.info}>
                                    <div className={styles.infoTop}>
                                        <span className={styles.name} title={item.name}>
                                            {item.name}
                                        </span>
                                        <div className={styles.values}>
                                            <span className={styles.revenue} style={{ color: index === 0 ? cor : undefined }}>
                                                {formatCurrency(item.revenue)}
                                            </span>
                                            <span className={styles.pct}>{pct.toFixed(1)}%</span>
                                        </div>
                                    </div>

                                    {/* Barra de progresso animada */}
                                    <div className={styles.barTrack}>
                                        <div
                                            className={styles.barFill}
                                            style={{
                                                width: animated ? `${barWidth}%` : "0%",
                                                background: medal
                                                    ? medalGradient(medal.className)
                                                    : `linear-gradient(90deg, ${cor}cc, ${cor}88)`,
                                                transitionDelay: `${index * 60}ms`,
                                            }}
                                        />
                                    </div>
                                </div>
                            </li>
                        );
                    })}
                </ol>
            </Card.Body>
        </Card>
    );
}

// ─── helpers ──────────────────────────────────────────────
const formatCurrency = (v: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 }).format(v);

const medalGradient = (cls: string) => {
    if (cls === "gold") return "linear-gradient(90deg, #f59e0b, #fbbf24)";
    if (cls === "silver") return "linear-gradient(90deg, #94a3b8, #cbd5e1)";
    if (cls === "bronze") return "linear-gradient(90deg, #d97706, #f59e0b88)";
    return "#e2e8f0";
};
