// TopClientesCard.tsx
import { faStar } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useRef, useState } from "react";
import Card from "../../../components/Card/Card";
import styles from "./TopClientesCard.module.scss";

export interface TopCliente {
    clientId: number;
    client: string;
    value: number;
}

interface TopClientesCardProps {
    data: TopCliente[];
    titulo?: string;
    period?: string;
    cor?: string;
}

const MEDALS: Record<number, { label: string; cls: string }> = {
    0: { label: "🥇", cls: "gold" },
    1: { label: "🥈", cls: "silver" },
    2: { label: "🥉", cls: "bronze" },
};

export default function TopClientesCard({
    data,
    titulo = "Melhores Clientes",
    period,
    cor = "#2C7BE5",
}: TopClientesCardProps) {
    const [animated, setAnimated] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) setAnimated(true); },
            { threshold: 0.15 }
        );
        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, []);

    const maxValue = data[0]?.value ?? 1;

    return (
        <Card className={styles.card}>
            <Card.Header className={styles.cardHeader}>
                <div className={styles.headerLeft}>
                    <span className={styles.icon} style={{ background: `${cor}1a`, color: cor }}>
                        <FontAwesomeIcon icon={faStar} />
                    </span>
                    <span className={styles.title}>{titulo}</span>
                    <span className={styles.countBadge}>{data.length} clientes</span>
                </div>
                {period && <span className={styles.period}>{period}</span>}
            </Card.Header>

            <Card.Body className={styles.cardBody} ref={ref as any}>
                <ol className={styles.list}>
                    {data.map((item, index) => {
                        const medal = MEDALS[index];
                        const barWidth = (item.value / maxValue) * 100;

                        return (
                            <li
                                key={item.clientId}
                                className={`${styles.item} ${medal ? styles[`item--${medal.cls}`] : ""}`}
                                style={{ animationDelay: `${index * 55}ms` }}
                            >
                                {/* Ranking */}
                                <div className={styles.rank}>
                                    {medal ? (
                                        <span className={`${styles.medal} ${styles[medal.cls]}`}>
                                            {medal.label}
                                        </span>
                                    ) : (
                                        <span className={styles.rankNumber}>{index + 1}</span>
                                    )}
                                </div>

                                {/* Info + barra */}
                                <div className={styles.info}>
                                    <div className={styles.infoTop}>
                                        <span className={styles.name} title={item.client}>
                                            {item.client}
                                        </span>
                                        <span
                                            className={styles.value}
                                            style={{ color: index === 0 ? cor : undefined }}
                                        >
                                            {formatCurrency(item.value)}
                                        </span>
                                    </div>

                                    <div className={styles.barTrack}>
                                        <div
                                            className={styles.barFill}
                                            style={{
                                                width: animated ? `${barWidth}%` : "0%",
                                                background: medal
                                                    ? medalGradient(medal.cls)
                                                    : `linear-gradient(90deg, ${cor}cc, ${cor}55)`,
                                                transitionDelay: `${index * 55}ms`,
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

const formatCurrency = (v: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 }).format(v);

const medalGradient = (cls: string) => {
    if (cls === "gold")   return "linear-gradient(90deg, #f59e0b, #fbbf24)";
    if (cls === "silver") return "linear-gradient(90deg, #94a3b8, #cbd5e1)";
    if (cls === "bronze") return "linear-gradient(90deg, #d97706, #fbbf2488)";
    return "#e2e8f0";
};
