import {
  faBox,
  faBoxes,
  faBuilding,
  faCalendarAlt,
  faCashRegister,
  faChartPie,
  faChevronRight,
  faClipboardList,
  faCog,
  faDollarSign,
  faExchangeAlt,
  faHandHoldingUsd,
  faLayerGroup,
  faMagnifyingGlass,
  faMobileAlt,
  faPrint,
  faTicketAlt,
  faUserFriends,
  faUsers
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";
import { NavLink } from "react-router-dom";
import { useApp } from "../../contexts/AppContext";
import styles from "./Sidebar.module.scss";

interface SidebarMenuProps {
  isCollapsed: boolean;
  onLinkClick: () => void;
}

interface MenuItem {
  name: string;
  icon: any;
  to?: string;
  condition?: boolean;
  children?: MenuItem[];
}

export const SidebarMenu = ({ isCollapsed, onLinkClick }: SidebarMenuProps) => {
  const { user } = useApp();
  const [openMenus, setOpenMenus] = useState<{ [key: string]: boolean }>({});

  const canCadView =
    user?.idEmpresa === 1 ||
    user?.permissoes?.maqView === true ||
    user?.permissoes?.grupView === true ||
    user?.permissoes?.usuView === true;

  const menuItems: MenuItem[] = [
    {
      name: "Dashboard",
      icon: faChartPie,
      to: "/dashboard",
      condition: user?.permissoes?.dashView === true || user?.idEmpresa === 1,
    },
    {
      name: "Eventos",
      icon: faCalendarAlt,
      to: "/eventos",
      condition: user?.permissoes?.eventView === true || user?.idEmpresa === 1,
    },
    {
      name: "Cadastros",
      icon: faClipboardList,
      condition: canCadView || user?.idEmpresa === 1,
      children: [
        {
          name: "Grupos",
          icon: faLayerGroup,
          to: "/grupos",
          condition: user?.permissoes?.grupView === true,
        },
        {
          name: "Produtos",
          icon: faBox,
          to: "/produtos",
          condition:
            user?.permissoes?.prodView === true || user?.idEmpresa === 1,
        },
        {
          name: "Usuários",
          icon: faUsers,
          to: "/usuarios",
          condition:
            user?.permissoes?.usuView === true || user?.idEmpresa === 1,
        },
        {
          name: "Formas Pagto.",
          icon: faDollarSign,
          to: "/forma-pagto",
          condition: user?.idEmpresa === 1,
        },
        {
          name:
            user?.idEmpresa === 1 ? "Formas Pagto. Evento" : "Formas Pagto.",
          icon: faDollarSign,
          to: "/formaPagamentoEvento",
          condition:
            user?.permissoes?.frmpView === true || user?.idEmpresa === 1,
        },
        {
          name: "Maquininhas",
          icon: faMobileAlt,
          to: "/devices",
          condition:
            user?.idEmpresa === 1 || user?.permissoes?.maqView === true,
        },
        {
          name: "Empresas",
          icon: faBuilding,
          to: "/company",
          condition: user?.idEmpresa === 1,
        },
        { name: "Funcionarios", icon: faUserFriends, to: "/funcionarios" },
      ],
    },
    {
      name: "Auditoria",
      icon: faMagnifyingGlass,
      to: "/auditoria",
      condition: user?.idEmpresa === 1,
    },
    {
      name: "Caixa",
      icon: faCashRegister,
      to: "/caixa",
      condition: user?.permissoes?.caixaView === true || user?.idEmpresa === 1,
    },
    {
      name: "Relatorios",
      icon: faPrint,
      children: [
        {
          name: "Saída forma pagamento",
          icon: faHandHoldingUsd,
          to: "/saida-pagamento",
        },
        { name: "Saída por produto", icon: faBoxes, to: "/saida-produto" },
        {
          name: "Histórico de liberação",
          icon: faHandHoldingUsd,
          to: "/historico-liberacao",
          condition: user?.idEmpresa === 1,
        },
        // {
        //   name: "Report Builder",
        //   icon: faMagicWandSparkles,
        //   to: "/report-builder",
        // },
        // {
        //   name: "PDF Premium editor",
        //   icon: faFilePdf,
        //   to: "/pdf-premium-editor",
        // },
        // {
        //   name: "FlexReport Lab 🧪",
        //   icon: faFlask,
        //   to: "/flex-report-lab",
        //   condition: user?.idEmpresa === 1,
        // },
      ],
    },
    {
      name: "Entrada/Saída",
      icon: faExchangeAlt,
      to: "/entrada-saida",
    },
    {
      name: "Tickets",
      icon: faTicketAlt,
      to: "/tickets",
    },
    {
      name: "Configurações",
      icon: faCog,
      to: "/configuracoes",
      condition: user?.idEmpresa === 1,
    },
    // {
    //   name: "Simulação",
    //   icon: faBug,
    //   to: "/Simulador",
    //   condition: user?.idEmpresa === 1,
    // },
    // {
    //   name: "Componentes Builder",
    //   icon: faCode,
    //   to: "/test-components",
    //   condition: user?.idEmpresa === 1,
    // },
    // {
    //   name: "Report Lab",
    //   icon: faFlask,
    //   to: "/report-lab",
    //   condition: user?.idEmpresa === 1,
    // },
    // {
    //   name: "V3 test",
    //   icon: faFlask,
    //   to: "/v3Test",
    //   condition: user?.idEmpresa === 1,
    // },
  ];

  const toggleMenu = (menuName: string) => {
    if (!isCollapsed) {
      setOpenMenus((prev) => ({ ...prev, [menuName]: !prev[menuName] }));
    }
  };

  const filteredMenu = menuItems.filter((item) => item.condition !== false);

  const renderMenuItem = (item: MenuItem, isChild: boolean = false) => {
    const hasChildren = item.children && item.children.length > 0;
    const isOpen = openMenus[item.name];

    if (hasChildren && item.children != undefined) {
      const filteredChildren = item.children.filter(
        (child) => child.condition !== false,
      );
      if (filteredChildren.length === 0) return null;

      return (
        <div key={item.name} className={styles.menuItem}>
          <button
            className={`${styles.menuButton} ${isOpen ? styles.open : ""}`}
            onClick={() => {
              toggleMenu(item.name);
            }}
          >
            <FontAwesomeIcon icon={item.icon} className={styles.menuIcon} />
            {!isCollapsed && (
              <span className={styles.menuLabel}>{item.name}</span>
            )}
            {!isCollapsed && (
              <span
                className={`${styles.menuArrow} ${isOpen ? styles.arrowOpen : ""}`}
              >
                <FontAwesomeIcon icon={faChevronRight} />
              </span>
            )}
          </button>
          {!isCollapsed && isOpen && (
            <div className={styles.subMenu}>
              {filteredChildren.map((child) => renderMenuItem(child, true))}
            </div>
          )}
        </div>
      );
    }

    const linkClassName = `${styles.menuLink} ${isChild ? styles.childLink : ""}`;

    return (
      <NavLink
        key={item.name}
        to={item.to!}
        onClick={onLinkClick}
        className={({ isActive }) =>
          `${linkClassName} ${isActive ? styles.active : ""}`
        }
      >
        <FontAwesomeIcon icon={item.icon} className={styles.menuIcon} />
        {!isCollapsed && <span className={styles.menuLabel}>{item.name}</span>}
      </NavLink>
    );
  };

  return (
    <nav className={styles.sidebarNav}>
      {filteredMenu.map((item) => renderMenuItem(item, false))}
    </nav>
  );
};
