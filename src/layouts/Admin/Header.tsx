import {
  faArrowRightFromBracket,
  faBox,
  faBoxes,
  faBuilding,
  faCalendar,
  faCancel,
  faCashRegister,
  faChartPie,
  faCog,
  faDashboard,
  faDollarSign,
  faExchangeAlt,
  faFilePdf,
  faFlask,
  faHandHoldingDollar,
  faMagnifyingGlass,
  faMobileRetro,
  faMoneyBill,
  faSave,
  faTicket,
  faUser,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { DateRangePicker } from "../../components/DatePicker/DateRangePicker";
import { EventSelector } from "../../components/EventSelector/EventSelector";
import { FormButton } from "../../components/Inputs/Button/FormButton";
import { Flex } from "../../components/Layout";
import { useApp } from "../../contexts/AppContext";
import { useNavigation } from "../../contexts/NavigationContext";
import { formatDateToString, parseDate } from "../../utils/format";
import styles from "./Header.module.scss";

interface HeaderProps {
  onMenuClick: () => void;
}

// Ícones para cada página
const pageIcons: Record<string, any> = {
  "/": faChartPie,
  "/dashboard": faChartPie,
  "/eventos": faCalendar,
  "/grupos": faBoxes,
  "/produtos": faBox,
  "/usuarios": faUser,
  "/caixa": faCashRegister,
  "/forma-pagto": faMoneyBill,
  "/formaPagamentoEvento": faMoneyBill,
  "/devices": faMobileRetro,
  "/auditoria": faMagnifyingGlass,
  "/company": faBuilding,
  "/funcionarios": faUser,
  "/entradaSaidas": faDashboard,
  "/relatorios": faDashboard,
  "/configuracoes": faCog,
  "/tickets": faTicket,
  "/historico-liberacao": faDollarSign,
  "/pdf-premium-editor": faFilePdf,
  "/entrada-saida": faExchangeAlt,
  "/saida-pagamento": faHandHoldingDollar,
  "/saida-produto": faBoxes,
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
  "/forma-pagto": "Formas de Pagamentos",
  "/formaPagamentoEvento": "Formas de Pagamentos Evento",
  "/devices": "Maquininhas",
  "/auditoria": "Auditoria",
  "/company": "Empresas",
  "/funcionarios": "Funcionários",
  "/entradaSaidas": "Entradas e Saídas",
  "/relatorios": "Relatórios",
  "/configuracoes": "Configurações",
  "/tickets": "Tickets",
  "/historico-liberacao": "Histórico de liberação",
  "/entrada-saida": "Entrada/Saída",
  "/saida-pagamento": "Saída por forma de pagamento",
  "/saida-produto": "Saída por produto",
  "/report-lab": "Report Lab",
};

export const Header = ({ onMenuClick }: HeaderProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, dataInicial, dataFinal, setDataInicial, setDataFinal } =
    useApp();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [inAction, setInAction] = useState(false);
  const [inLoad, setInLoad] = useState(false);

  const currentIcon = pageIcons[location.pathname] || "📌";
  const currentTitle = pageTitles[location.pathname] || "TicketFlow";
  const isMobile = window.innerWidth <= 992;
  const showDateRangePicker =
    (location.pathname === "/" || location.pathname === "/dashboard") &&
    !isMobile;
  const showEventSelector = !isMobile;

  const { emit, subscribe } = useNavigation();

  const handleDateRangeChange = (start: Date | null, end: Date | null) => {
    setDataInicial(start ? formatDateToString(start) : "");
    setDataFinal(end ? formatDateToString(end) : "");
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const backAction = () => {
      setInAction(false);
      setInLoad(false);
      params.delete("action");
      navigate({ pathname: location.pathname, search: params.toString() });
    };
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    const action = params.get("action");
    if (action === "register" || action === "update") {
      setInAction(true);
    } else {
      setInLoad(false);
    }
    const unsubscribeOnRegister = subscribe("onRegister", () => {
      setInAction(true);
    });

    const unsubscribeIsCommited = subscribe("isCommited", (v) => {
      setInLoad(false);
      if (v) {
        backAction();
      } else {
        setInAction(true);
      }
    });

    const unsubscribeRefresh = subscribe("refresh", () => {
      backAction();
    });

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      unsubscribeOnRegister();
      unsubscribeIsCommited();
      unsubscribeRefresh();
    };
  }, []);

  useEffect(() => {
  
    if(inAction && !location.search.includes("action")) {
      setInAction(false);
    }
  }, [location, inAction])

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <header className={styles.header}>
      <div className={styles.headerContent}>
        <div className={styles.leftSection}>
          <button
            className={styles.hamburgerBtn}
            onClick={onMenuClick}
            aria-label="Menu"
          >
            <span className={styles.hamburgerIcon}>☰</span>
          </button>

          {/* Logo centralizada no mobile */}
          <div className={styles.mobileLogo}>
            <span className={styles.mobileLogoIcon}>DataTicket</span>
          </div>

          {/* Título com ícone - visível apenas no desktop */}
          <div className={styles.pageTitle}>
            <span className={styles.pageIcon}>
              <FontAwesomeIcon icon={currentIcon} />
            </span>
            <h1 className={styles.title}>{currentTitle}</h1>
          </div>
        </div>
        {inAction && !isMobile ? (
          <>
            <Flex>
              <FormButton
                variant="secondary"
                onClick={() => {
                  emit("onRollback");
                  setInAction(false);
                  setInLoad(false);
                  const params = new URLSearchParams(location.search);
                  params.delete("action");
                  navigate({
                    pathname: location.pathname,
                    search: params.toString(),
                  });
                }}
              >
                <FontAwesomeIcon icon={faCancel} />
                Cancelar alterações
              </FormButton>
              <FormButton
                variant="primary"
                isLoading={inLoad}
                onClick={() => {
                  emit("onRequestCommit");
                }}
              >
                <FontAwesomeIcon icon={faSave} />
                Salvar
              </FormButton>
            </Flex>
          </>
        ) : null}

        <div
          className={styles.headerRight}
          style={{ display: inAction && !isMobile ? "none" : undefined }}
        >
          {/* DateRangePicker - apenas desktop e dashboard */}
          {showDateRangePicker && (
            <DateRangePicker
               
              startDate={parseDate(dataInicial)}
              endDate={parseDate(dataFinal)}
              onChange={handleDateRangeChange}
              placeholderStart="Data inicial"
              placeholderEnd="Data final"
            />
          )}

          {/* EventSelector - apenas desktop */}
          {showEventSelector && <EventSelector />}

          {/* Dropdown do usuário - apenas avatar */}
          <div className={styles.userDropdown} ref={dropdownRef}>
            <button
              className={styles.userTrigger}
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              <div className={styles.userAvatar}>
                <FontAwesomeIcon icon={faUser} />
              </div>
            </button>

            {isDropdownOpen && (
              <div className={styles.dropdownMenu}>
                <div className={styles.dropdownHeader}>
                  <h6>
                    <span className={styles.welcomeText}>Olá, </span>
                    <span className={styles.userNameText}>
                      {user?.nomeUsuario || "Usuário"}
                    </span>
                  </h6>
                </div>

                <div className={styles.dropdownDivider} />

                <button
                  className={`${styles.dropdownItem} ${styles.logoutItem}`}
                  onClick={handleLogout}
                >
                  <FontAwesomeIcon
                    icon={faArrowRightFromBracket}
                    className={styles.dropdownIcon}
                  />
                  Sair
                </button>

                <div className={styles.dropdownDivider} />

                <div className={styles.dropdownFooter}>
                  <div className={styles.footerContent}>
                    <a
                      href="https://datasetsistemas.com.br"
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.footerLink}
                    >
                      DataSet Sistemas
                    </a>
                    <span className={styles.versionText}>V.1.0.0</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
