// FormasPagamentoCard.tsx
import { faChartSimple, faCreditCard, faList } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";
import Card from "../../../components/Card/Card";
import styles from './FormaPagamentoCard.module.scss';

interface FormaPagamento {
    id: string;
    nome: string;
    valor: number;
    percentual: number;
    cor?: string;
    icon: any;
}

interface FormasPagamentoCardProps {
    titulo?: string;
    dados: FormaPagamento[];
    totalVendas?: number;
}

type VisaoType = 'lista' | 'grafico';

export default function FormasPagamentoCard({
    titulo = "Formas de Recebimento",
    dados,
    totalVendas
}: FormasPagamentoCardProps) {

    const [visao, setVisao] = useState<VisaoType>('lista');
    const total = totalVendas || dados.reduce((acc, item) => acc + item.valor, 0);

    // Ordena por valor (maior para menor)
    const dadosOrdenados = [...dados].sort((a, b) => b.valor - a.valor);

    // Paleta neutra de cinzas (se não tiver cores definidas)
    const coresNeutras = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4'];

    return (
        <Card className={styles.formasPagamentoCard}>
            <Card.Header className={styles.cardHeader}>
                <div className={styles.headerLeft}>
                    <span className={styles.icon}>
                        <FontAwesomeIcon icon={faCreditCard} />
                    </span>
                    <span className={styles.title}>{titulo}</span>
                </div>

                {/* Botão Toggle Lista/Gráfico */}
                <div className={styles.toggleContainer}>
                    <button
                        className={`${styles.toggleBtn} ${visao === 'lista' ? styles.active : ''}`}
                        onClick={() => setVisao('lista')}
                    >
                        <FontAwesomeIcon icon={faList} />
                        <span>Lista</span>
                    </button>
                    <button
                        className={`${styles.toggleBtn} ${visao === 'grafico' ? styles.active : ''}`}
                        onClick={() => setVisao('grafico')}
                    >
                        <FontAwesomeIcon icon={faChartSimple} />
                        <span>Gráfico</span>
                    </button>
                </div>
            </Card.Header>

            <Card.Body className={styles.cardBody}>
                {/* Total das Vendas */}
                <div className={styles.totalSection}>
                    <span className={styles.totalLabel}>Total das Vendas</span>
                    <span className={styles.totalValue}>
                        {formatCurrency(total)}
                    </span>
                </div>

                {/* Conteúdo que alterna entre Lista e Gráfico */}
                <div className={styles.contentArea}>
                    {visao === 'lista' ? (
                        <div className={styles.listaSection}>
                            {dadosOrdenados.map((item, index) => (
                                <div key={item.id} className={styles.listaItem}>
                                    <div className={styles.listaItemLeft}>
                                        <span className={styles.posicao}>
                                            {index + 1}º
                                        </span>
                                        <span className={styles.nome}>
                                            <FontAwesomeIcon
                                                icon={item.icon}
                                                className={styles.itemIcon}
                                            />
                                            {item.nome}
                                        </span>
                                    </div>
                                    <div className={styles.listaItemRight}>
                                        <span className={styles.valor}>
                                            {formatCurrency(item.valor)}
                                        </span>
                                        <span className={styles.percentual}>
                                            {formatPercentual(item.percentual || (item.valor / total) * 100)}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className={styles.graficoSection}>
                            {dadosOrdenados.map((item, index) => {
                                const percentualBarra = (item.valor / total) * 100;
                                const barColor = item.cor || coresNeutras[index % coresNeutras.length];
                                return (
                                    <div key={item.id} className={styles.barraWrapper}>
                                        <div className={styles.barraHeader}>
                                            <span className={styles.barraNome}>
                                                <FontAwesomeIcon
                                                    icon={item.icon}
                                                    className={styles.barraIcon}
                                                />
                                                {item.nome}
                                            </span>
                                            <span className={styles.barraValue}>
                                                {formatCurrency(item.valor)}
                                            </span>
                                        </div>
                                        <div className={styles.barraBase}>
                                            <div
                                                className={styles.barraPreenchida}
                                                style={{
                                                    width: `${percentualBarra}%`,
                                                    backgroundColor: barColor
                                                }}
                                            />
                                        </div>
                                        <span className={styles.barraPercentual}>
                                            {formatPercentual(percentualBarra)}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Mini legendas (apenas cores) */}
                <div className={styles.legendas}>
                    {dadosOrdenados.map((item, index) => (
                        <div key={item.id} className={styles.legendaItem}>
                            <span
                                className={styles.legendaCor}
                                style={{ backgroundColor: item.cor || coresNeutras[index % coresNeutras.length] }}
                            />
                            <span className={styles.legendaNome}>{item.nome}</span>
                        </div>
                    ))}
                </div>
            </Card.Body>
        </Card>
    );
}

// Utilitários de formatação
const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2
    }).format(value);
};

const formatPercentual = (value: number): string => {
    return `${value.toFixed(2)}%`;
};