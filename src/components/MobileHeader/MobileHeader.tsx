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
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useApp } from "../../contexts/AppContext";
import { DateRangePicker } from "../DatePicker/DateRangePicker";
import { EventSelector } from "../EventSelector/EventSelector";
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
  const { dataInicial, dataFinal, setDataInicial, setDataFinal } = useApp();

  const currentIcon = pageIcons[location.pathname] || "📌";
  const currentTitle = pageTitles[location.pathname] || "TicketFlow";
  const showDateRangePicker =
    location.pathname === "/" || location.pathname === "/dashboard";

  const parseDate = (dateStr: string | null): Date | null => {
    if (!dateStr) return null;
    const [date, time] = dateStr.split(" ");
    const [year, month, day] = date.split("-");
    const [hour, minute] = time?.split(":") || ["00", "00"];
    return new Date(
      parseInt(year),
      parseInt(month) - 1,
      parseInt(day),
      parseInt(hour),
      parseInt(minute),
    );
  };

 
  const formatDateToString = (date: Date | null): string => {
    if (!date) return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  };

  const handleDateRangeChange = (start: Date | null, end: Date | null) => {
    setDataInicial(start ? formatDateToString(start) : "");
    setDataFinal(end ? formatDateToString(end) : "");
  };

  return (
    <div className={styles.mobileHeader}>
      <div className={styles.pageTitle}>
        <span className={styles.pageIcon}>
          <FontAwesomeIcon icon={currentIcon} />
        </span>
        <h2>{currentTitle}</h2>
      </div>

      <div className={styles.mobileControls}>
        <EventSelector />
        {showDateRangePicker && (
          <DateRangePicker
            startDate={parseDate(dataInicial)}
            endDate={parseDate(dataFinal)}
            onChange={handleDateRangeChange}
          />
        )}
      </div>
    </div>
  );
};

export default MobileHeader;
