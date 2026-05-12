import { faArrowTrendDown, faArrowTrendUp } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Card from "../../../components/Card/Card";
import styles from './InfoCards.module.scss';

interface KPICardProps {
    titulo: string;
    valor: string;
    subtitulo?: string;
    tendencia?: number;
    icon: any;
    cor?: string;
}

export default function InfoCards({
    titulo,
    valor,
    subtitulo,
    tendencia,
    icon,
    cor = '#2C7BE5',
}: KPICardProps) {
    const tendenciaPositiva = tendencia !== undefined && tendencia >= 0;

    return (
        <Card className={styles.kpiCard}>
            <Card.Body className={styles.cardBody}>
                <div className={styles.header}>
                    <span className={styles.titulo}>{titulo}</span>
                    <span
                        className={styles.icon}
                        style={{ backgroundColor: `${cor}1a`, color: cor }}
                    >
                        <FontAwesomeIcon icon={icon} />
                    </span>
                </div>
                <div className={styles.valor}>{valor}</div>
                {(subtitulo || tendencia !== undefined) && (
                    <div className={styles.footer}>
                        {tendencia !== undefined && (
                            <span
                                className={`${styles.tendencia} ${tendenciaPositiva ? styles.positiva : styles.negativa}`}
                            >
                                <FontAwesomeIcon
                                    icon={tendenciaPositiva ? faArrowTrendUp : faArrowTrendDown}
                                />
                                {Math.abs(tendencia)}%
                            </span>
                        )}
                        {subtitulo && (
                            <span className={styles.subtitulo}>{subtitulo}</span>
                        )}
                    </div>
                )}
            </Card.Body>
        </Card>
    );
}