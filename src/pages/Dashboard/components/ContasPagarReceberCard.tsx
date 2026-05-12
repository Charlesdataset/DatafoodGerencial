// ContasPagarReceber.tsx
import { faArrowTrendDown, faArrowTrendUp, faWallet } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Card from "../../../components/Card/Card";
import styles from './ContasPagarReceberCard.module.scss';

interface ContasPagarReceberData {
    toPay: number;
    toReceive: number;
    period: string;
}

interface ContasPagarReceberProps {
    data: ContasPagarReceberData;
    titulo?: string;
    pagarLabel?: string;
    receberLabel?: string;
}

export default function ContasPagarReceber({
    data,
    titulo = "Contas a Pagar e Receber",
    pagarLabel = "A Pagar",
    receberLabel = "A Receber"
}: ContasPagarReceberProps) {

    const { toPay, toReceive, period } = data;

    // Cálculos
    const saldo = toReceive - toPay;
    const saldoPositivo = saldo >= 0;
    const totalGeral = toPay + toReceive;

    // Percentuais para o gráfico de barras empilhadas
    const percentualPagar = totalGeral > 0 ? (toPay / totalGeral) * 100 : 0;
    const percentualReceber = totalGeral > 0 ? (toReceive / totalGeral) * 100 : 0;

    return (
        <Card className={styles.contasCard}>
            <Card.Header className={styles.cardHeader}>
                <div className={styles.headerLeft}>
                    <span className={styles.icon}>
                        <FontAwesomeIcon icon={faWallet} />
                    </span>
                    <span className={styles.title}>{titulo}</span>
                </div>
                {period && (
                    <span className={styles.period}>{period}</span>
                )}
            </Card.Header>

            <Card.Body className={styles.cardBody}>
                <div className={styles.contentWrapper}>
                    {/* Cards de valores */}
                    <div className={styles.valuesGrid}>
                        <div className={styles.valueCard}>
                            <div className={styles.valueHeader}>
                                <FontAwesomeIcon icon={faArrowTrendDown} className={styles.pagarIcon} />
                                <span className={styles.valueLabel}>{pagarLabel}</span>
                                <div className={styles.valueFooter}>
                                    <span className={styles.percentLabel}>
                                        {percentualPagar.toFixed(1)}% do total
                                    </span>
                                </div>
                            </div>
                            <div className={styles.valueAmount}>
                                {formatCurrency(toPay)}
                            </div>

                        </div>

                        <div className={styles.valueCard}>
                            <div className={styles.valueHeader}>
                                <FontAwesomeIcon icon={faArrowTrendUp} className={styles.receberIcon} />
                                <span className={styles.valueLabel}>{receberLabel}</span>
                                <div className={styles.valueFooter}>
                                    <span className={styles.percentLabel}>
                                        {percentualReceber.toFixed(1)}% do total
                                    </span>
                                </div>
                            </div>
                            <div className={styles.valueAmount}>
                                {formatCurrency(toReceive)}
                            </div>

                        </div>
                    </div>

                    {/* Barra de progresso empilhada */}
                    {totalGeral > 0 && (
                        <div className={styles.progressStack}>
                            <div
                                className={styles.progressPagar}
                                style={{ width: `${percentualPagar}%` }}
                            />
                            <div
                                className={styles.progressReceber}
                                style={{ width: `${percentualReceber}%` }}
                            />
                        </div>
                    )}

                    {/* Saldo
                    <div className={styles.saldoSection}>
                        <div className={styles.saldoLabel}>
                            <FontAwesomeIcon icon={faMoneyBillTrendUp} />
                            <span>Saldo</span>
                        </div>
                        <div className={`${styles.saldoValue} ${saldoPositivo ? styles.positive : styles.negative}`}>
                            {saldoPositivo ? '+' : '-'}{formatCurrency(Math.abs(saldo))}
                        </div>
                    </div> */}
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