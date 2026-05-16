// TopProdutosCard.tsx
import { faTrophy } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useMemo } from "react";
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

function ProdutoItem({
    item,
    index,
    maxRevenue,
    cor,
}: {
    item: TopProduto;
    index: number;
    maxRevenue: number;
    cor: string;
}) {
    const medal = MEDALS[index];
    const barWidth = (item.revenue / maxRevenue) * 100;
    const pct = parseFloat(item.percentage || "0");
    const className = styles.item + (medal ? " " + styles['item--' + medal.className] : "");

    return (
        <li className={className} style={{ animationDelay: String(index * 60) + "ms" }}>
            <div className={styles.rank}>
                {medal ? (
                    <span className={`${styles.medal} ${styles[medal.className]}`}>
                        {medal.label}
                    </span>
                ) : (
                    <span className={styles.rankNumber}>{index + 1}</span>
                )}
            </div>
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
                <div className={styles.barTrack}>
                    <div
                        className={styles.barFill}
                        style={{
                            width: String(barWidth) + "%",
                            background: medal ? medalGradient(medal.className) : "linear-gradient(90deg, " + cor + "cc, " + cor + "88)",
                            transitionDelay: String(index * 60) + "ms",
                        }}
                    />
                </div>
            </div>
        </li>
    );
}

export default function TopProdutosCard({
    data,
    titulo = "Top Produtos",
    period,
    cor = "#2C7BE5",
}: TopProdutosCardProps) {
    const sorted = useMemo(() => [...data].sort((a, b) => b.revenue - a.revenue), [data]);
    const maxRevenue = sorted[0]?.revenue ?? 1;

    return (
        <Card className={styles.card}>
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
            <Card.Body className={styles.cardBody}>
                {sorted.length === 0 ? (
                    <div className={styles.emptyState}>Nenhum produto encontrado.</div>
                ) : (
                    <ol className={styles.list}>
                        {sorted.map((item, index) => (
                            <ProdutoItem key={item.id} item={item} index={index} maxRevenue={maxRevenue} cor={cor} />
                        ))}
                    </ol>
                )}
            </Card.Body>
        </Card>
    );
}

const formatCurrency = (v: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 }).format(v);

const medalGradient = (cls: string) => {
    if (cls === "gold") return "linear-gradient(90deg, #f59e0b, #fbbf24)";
    if (cls === "silver") return "linear-gradient(90deg, #94a3b8, #cbd5e1)";
    if (cls === "bronze") return "linear-gradient(90deg, #d97706, #f59e0b88)";
    return "#e2e8f0";
};
