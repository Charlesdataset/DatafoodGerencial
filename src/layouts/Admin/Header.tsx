import {
  faArrowLeft,
  faArrowRightFromBracket,
  faCancel,
  faChartPie,
  faMobileRetro,
  faSave,
  faUser
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "../../components/Button";
import { DateRangePicker } from "../../components/DatePicker/DateRangePicker";
import { FormButton } from "../../components/Inputs/Button/FormButton";
import MultiTextBox from "../../components/Inputs/MultiTextBox/MultiTextBox";
import { Flex } from "../../components/Layout";
import SelectModal from "../../components/Modal/SelectModal/SelectModal";
import { useApp } from "../../contexts/AppContext";
import { useNavigation } from "../../contexts/NavigationContext";
import { api } from "../../services/api";
import styles from "./Header.module.scss";

interface HeaderProps {
  onMenuClick: () => void;
}

// Ícones para cada página
const pageIcons: Record<string, any> = {
  "/": faChartPie,
  "/dashboard": faChartPie,
  "/reports": faChartPie,

};

const pageTitles: Record<string, string> = {
  "/": "Dashboard",
  "/dashboard": "Dashboard",
  "/reports": 'Relatórios',
};

export const Header = ({ onMenuClick }: HeaderProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, setIsAuthenticated, dataInicial, dataFinal, tipoTurnos, setTipoTurnos, turnosSelecionados, setTurnosSelecionados, setDataInicial, setDataFinal } =
    useApp();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [inAction, setInAction] = useState(false);
  const [inLoad, setInLoad] = useState(false);
  const [showBackButton, setShowBackButton] = useState(false);

  const currentIcon = pageIcons[location.pathname] || "📌";
  const currentTitle = pageTitles[location.pathname] || "TicketFlow";
  const isMobile = window.innerWidth <= 992;


  const { emit, subscribe } = useNavigation();






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

    const usubscribeShowBackButton = subscribe("showBackButton", () => {
      setShowBackButton(true);
    });

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      unsubscribeOnRegister();
      unsubscribeIsCommited();
      unsubscribeRefresh();
      usubscribeShowBackButton();
    };
  }, []);

  useEffect(() => {

    if (inAction && !location.search.includes("action")) {
      setInAction(false);
    }
  }, [location, inAction])

  const handleLogout = () => {
    const cnpj = localStorage.getItem("cnpj");
    localStorage.clear();
    setIsAuthenticated(false)
    navigate(`/login?cnpj=${cnpj}`);
  };
  const [isTipoTurnoSearchOpen, setIsTipoTurnoSearchOpen] = useState(false);



  return (
    <>
      <SelectModal
        isOpen={isTipoTurnoSearchOpen}
        onClose={() => {
          setIsTipoTurnoSearchOpen(false);
        }}
        icon={<FontAwesomeIcon icon={faMobileRetro} />}
        key={'id'}
        keyShow={{
          primary: [
            {
              key: "id",
              prefix: "Cód.  ",
              mask: "number",
              padChar: "0",
              padStart: 6,
            },

          ],
          secondary: [{ key: "label", prefix: "Descrição : ", marginStart: 5 },]

        }}
        mode="multi"
        selectedData={turnosSelecionados}
        title="Selecione as turnos"
        fetchItems={() =>
          api.get(`/turnos/tipo-turnos`).then((r) => r.data.tipoTurnos.map(x => ({ id: x.value, label: x.name })) || [])
        }
        onMultiSelect={(e) => {
          setTurnosSelecionados((prev) => [...prev, ...e.map((x) => x.raw)]);
        }}
      />

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
                {showBackButton &&
                  (
                    <>
                      <Button onClick={() => {
                        emit('backView');
                        setShowBackButton(false);
                      }}>


                        <FontAwesomeIcon icon={faArrowLeft} />
                        voltar
                      </Button>
                    </>
                  )}
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


            <MultiTextBox

              colorMode="multicolor"
              onChange={(labels) => {
                setTurnosSelecionados((prev) =>
                  prev.filter((t) => labels.includes(`${t.label}`))
                )
              }}
              values={turnosSelecionados.map((t) => `${t.label}`)} boxHeight={40} className="mb-0" placeholder="Tipos de turnos"
              onInputClick={() => {
                setIsTipoTurnoSearchOpen(true);
              }} />


            <DateRangePicker startDate={dataInicial} endDate={dataFinal} onChange={(s, e) => {
              setDataInicial(s);
              setDataFinal(e)
            }} />


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
    </>
  );
};
