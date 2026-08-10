import {
  faChevronRight,
  faHome,
  faIdCard,
  faUser,
  faHeadset,
  faBusinessTime,
  faDashboard,
  faLocationDot,
  faPrint,
  faMoneyCheckDollar,
  faCalculator
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";
import { NavLink } from "react-router-dom";
import { useApp } from "../../contexts/AppContext";
import Separator from "../../components/Separator/Separator";
import styles from "./Sidebar.module.scss";

interface SidebarMenuProps {
  isCollapsed: boolean;
  onLinkClick: () => void;
  isMobile?: boolean;
}

interface MenuItem {
  name: string;
  icon: any;
  to?: string;
  condition?: boolean;
  children?: MenuItem[];
}

export const SidebarMenu = ({ isCollapsed, onLinkClick, isMobile = false }: SidebarMenuProps) => {
  const { user } = useApp();
  const [openMenus, setOpenMenus] = useState<{ [key: string]: boolean }>({});

  
  const deliveryItems: MenuItem[] = [
    {
      name: "Início",
      icon: faHome,
      to: "/dashboard",
    }
  ];

const suporteItems: MenuItem[] = [
  {
    name: "Cadastros",
    icon: faIdCard,
    children: [
      {
        name: "Clientes",
        icon: faUser,
        to: "/clientes"
      },
      {
        name: "Cidades",
        icon: faLocationDot,
        to: "/cidades"
      },
    ]
  },
];

  const toggleMenu = (menuName: string) => {
    if (!isCollapsed) {
      setOpenMenus((prev) => ({ ...prev, [menuName]: !prev[menuName] }));
    }
  };

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
            onClick={() => toggleMenu(item.name)}
          >
            <FontAwesomeIcon icon={item.icon} className={styles.menuIcon} />
            {!isCollapsed && (
              <span className={styles.menuLabel}>{item.name}</span>
            )}
            {!isCollapsed && (
              <span className={`${styles.menuArrow} ${isOpen ? styles.arrowOpen : ""}`}>
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

  const renderSection = (title: string, items: MenuItem[]) => {
    const filteredItems = items.filter((item) => item.condition !== false);
    if (filteredItems.length === 0) return null;

    return (
      <div className={styles.menuSection}>
        <div className={styles.linkHeader}>
          <p>{title}</p>
          {!isMobile && <Separator variant="light" size="xs" type="solid" />}
        </div>
        <nav className={styles.sidebarNav}>
          {filteredItems.map((item) => renderMenuItem(item, false))}
        </nav>
      </div>
    );
  };

  return (
    <>
     
      {renderSection("DELIVERY", deliveryItems)}
    
      {renderSection("SUPORTE", suporteItems)}
    </>
  );
};