// VendasPorVendedorCard.tsx
import { faUsers } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useMemo } from "react";
import Card from "../../../components/Card/Card";
import NoData from "../../../components/NoData/NoData";
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

const COLORS = [
    { bar: "linear-gradient(90deg, #2C7BE5, #60a5fa)", text: "#2C7BE5", bg: "#eff6ff" },
    { bar: "linear-gradient(90deg, #10b981, #34d399)", text: "#10b981", bg: "#ecfdf5" },
    { bar: "linear-gradient(90deg, #f59e0b, #fbbf24)", text: "#d97706", bg: "#fffbeb" },
    { bar: "linear-gradient(90deg, #8b5cf6, #a78bfa)", text: "#7c3aed", bg: "#f5f3ff" },
    { bar: "linear-gradient(90deg, #ef4444, #f87171)", text: "#dc2626", bg: "#fef2f2" },
    { bar: "linear-gradient(90deg, #06b6d4, #22d3ee)", text: "#0891b2", bg: "#ecfeff" },
];

const initials = (name: string) =>
    name
        .split(" ")
        .slice(0, 2)
        .map((word) => word[0])
        .join("")
        .toUpperCase();

function VendedorItem({
    item,
    index,
    maxValue,
}: {
    item: VendedorData;
    index: number;
    maxValue: number;
}) {
    const color = COLORS[index % COLORS.length];
    const barWidth = (item.value / maxValue) * 100;

    return (
        <li
            key={item.name}
            className={styles.item}
            style={{ animationDelay: String(index * 80) + "ms" }}
        >
            <div className={styles.avatarWrapper}>
                <div className={styles.avatar} style={{ background: color.bg, color: color.text }}>
                    {initials(item.name)}
                </div>
                <span className={styles.rankBadge}>{index + 1}°</span>
            </div>
            <div className={styles.content}>
                <div className={styles.topRow}>
                    <span className={styles.name}>{item.name}</span>
                    <div className={styles.stats}>
                        <span className={styles.value} style={{ color: color.text }}>
                            {formatCurrency(item.value)}
                        </span>
                        <span className={styles.pctBadge} style={{ background: color.bg, color: color.text }}>
                            {item.percentage}%
                        </span>
                    </div>
                </div>
                <div className={styles.barTrack}>
                    <div
                        className={styles.barFill}
                        style={{
                            width: String(barWidth) + "%",
                            background: color.bar,
                            transitionDelay: String(index * 80) + "ms",
                        }}
                    >
                        <span className={styles.shimmer} />
                    </div>
                </div>
            </div>
        </li>
    );
}

export default function VendasPorVendedorCard({ data, titulo = "Vendas por Vendedores", period }: VendasPorVendedorCardProps) {
    const sorted = useMemo(() => [...data].sort((a, b) => b.value - a.value), [data]);
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
            <Card.Body className={styles.cardBody}>
                {sorted.length === 0 ? (
                    <NoData message="Sem vendedores" subtext="Nenhum vendedor encontrado no período selecionado." />
                ) : (
                    <ol className={styles.list}>
                        {sorted.map((item, index) => (
                            <VendedorItem key={item.name} item={item} index={index} maxValue={maxValue} />
                        ))}
                    </ol>
                )}
            </Card.Body>
        </Card>
    );
}

const formatCurrency = (v: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 }).format(v);
