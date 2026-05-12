// VendasPorVendedorCard.tsx
import { faUsers } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useRef, useState } from "react";
import Card from "../../../components/Card/Card";
import styles from "./VendasPorVendedorCard.module.scss";

export interface VendedorData {
    name: string;
    value: number;
    percentage: number;
}

interface VendasPorVendedorCardProps {
    data: VendedorData[];
    titulo?: string;
    period?: string;
}

// Paleta de cores por posição
const COLORS = [
    { bar: "linear-gradient(90deg, #2C7BE5, #60a5fa)", text: "#2C7BE5", bg: "#eff6ff" },
    { bar: "linear-gradient(90deg, #10b981, #34d399)", text: "#10b981", bg: "#ecfdf5" },
    { bar: "linear-gradient(90deg, #f59e0b, #fbbf24)", text: "#d97706", bg: "#fffbeb" },
    { bar: "linear-gradient(90deg, #8b5cf6, #a78bfa)", text: "#7c3aed", bg: "#f5f3ff" },
    { bar: "linear-gradient(90deg, #ef4444, #f87171)", text: "#dc2626", bg: "#fef2f2" },
    { bar: "linear-gradient(90deg, #06b6d4, #22d3ee)", text: "#0891b2", bg: "#ecfeff" },
];

// Gera iniciais do nome
const initials = (name: string) =>
    name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();

export default function VendasPorVendedorCard({
    data,
    titulo = "Vendas por Vendedores",
    period,
}: VendasPorVendedorCardProps) {
    const [animated, setAnimated] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) setAnimated(true); },
            { threshold: 0.2 }
        );
        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, []);

    const sorted = [...data].sort((a, b) => b.value - a.value);
    const maxValue = sorted[0]?.value ?? 1;

    return (
        <Card className={styles.card}>
            <Card.Header className={styles.cardHeader}>
                <div className={styles.headerLeft}>
                    <span className={styles.icon}>
                        <FontAwesomeIcon icon={faUsers} />
                    </span>
                    <span className={styles.title}>{titulo}</span>
                </div>
                <div className={styles.headerRight}>
                    {period && <span className={styles.period}>{period}</span>}
                    <span className={styles.totalBadge}>{data.length} vendedores</span>
                </div>
            </Card.Header>

            <Card.Body className={styles.cardBody} ref={ref as any}>
                <ol className={styles.list}>
                    {sorted.map((item, index) => {
                        const color = COLORS[index % COLORS.length];
                        const barWidth = (item.value / maxValue) * 100;

                        return (
                            <li
                                key={item.name}
                                className={styles.item}
                                style={{ animationDelay: `${index * 80}ms` }}
                            >
                                {/* Avatar + ranking */}
                                <div className={styles.avatarWrapper}>
                                    <div
                                        className={styles.avatar}
                                        style={{ background: color.bg, color: color.text }}
                                    >
                                        {initials(item.name)}
                                    </div>
                                    <span className={styles.rankBadge}>{index + 1}°</span>
                                </div>

                                {/* Conteúdo */}
                                <div className={styles.content}>
                                    <div className={styles.topRow}>
                                        <span className={styles.name}>{item.name}</span>
                                        <div className={styles.stats}>
                                            <span className={styles.value} style={{ color: color.text }}>
                                                {formatCurrency(item.value)}
                                            </span>
                                            <span
                                                className={styles.pctBadge}
                                                style={{ background: color.bg, color: color.text }}
                                            >
                                                {item.percentage}%
                                            </span>
                                        </div>
                                    </div>

                                    {/* Barra racing */}
                                    <div className={styles.barTrack}>
                                        <div
                                            className={styles.barFill}
                                            style={{
                                                width: animated ? `${barWidth}%` : "0%",
                                                background: color.bar,
                                                transitionDelay: `${index * 80}ms`,
                                            }}
                                        >
                                            {/* Brilho animado */}
                                            <span className={styles.shimmer} />
                                        </div>
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
