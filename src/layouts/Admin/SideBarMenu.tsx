import {
  faChartPie,
  faChevronRight,
  faPrint
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
      
    },
    {
      name: "Relatorios",
      icon: faPrint,
      to: "/reports",
      
    },
  
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
