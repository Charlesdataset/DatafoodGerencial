import {
  faBox,
  faBoxes,
  faBuilding,
  faCalendar,
  faCashRegister,
  faChartPie,
  faCog,
  faDollarSign,
  faExchangeAlt,
  faFlask,
  faHandHoldingDollar,
  faMagnifyingGlass,
  faMobileRetro,
  faMoneyBill,
  faTicket,
  faUser,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useLocation } from "react-router-dom";
import styles from "./MobileHeader.module.scss";

const pageIcons: Record<string, any> = {
  "/": faChartPie,
  "/dashboard": faChartPie,
  "/eventos": faCalendar,
  "/grupos": faBoxes,
  "/produtos": faBox,
  "/usuarios": faUser,
  "/caixa": faCashRegister,
  "/forma-pagto": faDollarSign,
  "/formaPagamentoEvento": faMoneyBill,
  "/devices": faMobileRetro,
  "/auditoria": faMagnifyingGlass,
  "/company": faBuilding,
  "/funcionarios": faUser,
  "/historico-liberacao": faDollarSign,
  "/entrada-saida": faExchangeAlt,
  "/saida-pagamento": faHandHoldingDollar,
  "/saida-produto": faBoxes,
  "/configuracoes": faCog,
  "/tickets": faTicket,
  "/report-lab": faFlask,
};

const pageTitles: Record<string, string> = {
  "/": "Dashboard",
  "/dashboard": "Dashboard",
  "/eventos": "Eventos",
  "/grupos": "Grupos",
  "/produtos": "Produtos",
  "/usuarios": "Usuários",
  "/caixa": "Caixa",
  "/forma-pagto": "Formas de Pagamento",
  "/formaPagamentoEvento": "Formas de pagto Evento",
  "/devices": "Maquininhas",
  "/auditoria": "Auditoria",
  "/company": "Empresas",
  "/funcionarios": "Funcionários",
  "/relatorios": "Relatórios",
  "/historico-liberacao": "Histórico liberações",
  "/entrada-saida": "Entrada/Saida",
  "/saida-pagamento": "Saída forma pagamento",
  "/saida-produto": "Saída por produto",
  "/configuracoes": "Configurações",
  "/tickets": "Tickets",
  "/report-lab": "Report Lab",
};
const MobileHeader = () => {
  const location = useLocation();
  

  const currentIcon = pageIcons[location.pathname] || "📌";
  const currentTitle = pageTitles[location.pathname] || "TicketFlow";
 

 

  return (
    <div className={styles.mobileHeader}>
      <div className={styles.pageTitle}>
        <span className={styles.pageIcon}>
          <FontAwesomeIcon icon={currentIcon} />
        </span>
        <h2>{currentTitle}</h2>
      </div>

   
    </div>
  );
};

export default MobileHeader;
