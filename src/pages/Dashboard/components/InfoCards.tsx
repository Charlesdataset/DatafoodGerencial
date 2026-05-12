import { faCreditCard } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Card from "../../../components/Card/Card";
import styles from './InfoCards.module.scss';


export default function InfoCards({ children }) {
    return (
        <>
            <Card>
                <Card.Header>
                    <span className={styles.icon}><FontAwesomeIcon icon={faCreditCard} /></span> <span className={styles.title}>Vendas por forma de pagamento</span>
                </Card.Header>
                <Card.Body>
                    {children}
                </Card.Body>
            </Card>
        </>
    )
}