import { faChevronCircleLeft, faChevronCircleRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { useApp } from "../../contexts/AppContext";
import { useNavigation } from "../../contexts/NavigationContext";
import { SidebarMenu } from "./SideBarMenu";
import styles from "./Sidebar.module.scss";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isCollapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
  isMobile: boolean;
}

export const Sidebar = ({ isOpen, onClose, isCollapsed, onCollapsedChange, isMobile }: SidebarProps) => {
  const { emit } = useNavigation();
  const { secondaryColor , currLogo} = useApp();
  
  // Trava o scroll do body quando sidebar mobile está aberto
  useEffect(() => {
    if (isMobile && isOpen) {
      document.body.style.overflow = "hidden";
      document.body.style.position = "fixed";
      document.body.style.width = "100%";
      document.body.style.height = "100dvh";
    } else {
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.width = "";
      document.body.style.height = "";
    }

    return () => {
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.width = "";
      document.body.style.height = "";
    };
  }, [isMobile, isOpen]);

  useEffect(() => {
    if (!isMobile && isOpen) {
      onClose();
    }
  }, [isMobile, isOpen, onClose]);

  const handleLinkClick = () => {
    emit("refresh")
    if (isMobile) {
      onClose();
    }
  };



  return (
    <>
      <div style={{ '--secondary-color': secondaryColor } as React.CSSProperties} >

        {isOpen && isMobile && <div className={styles.overlay} onClick={onClose} />}

        <aside className={`${styles.sidebar} ${isCollapsed && !isMobile ? styles.collapsed : ""} ${isOpen && isMobile ? styles.mobileOpen : ""}`}>
          <div className={styles.sidebarHeader}>
            <Link to="/" className={styles.logo} onClick={handleLinkClick}>
              {isCollapsed ? <img src={currLogo} alt="Logo" style={{ width: 35 }} /> : <img src={!isCollapsed || isMobile ? currLogo : currLogo} alt="Logo" style={{ width: 180 }} />}
            </Link>
          </div>

          <SidebarMenu isCollapsed={isCollapsed || false} onLinkClick={handleLinkClick} />

          <div className={styles.sidebarFooter}>
            <div className={styles.version}>V 1.0.0</div>
          </div>
        </aside>

        {/* Botão de minimizar fora do sidebar para sobrepor */}
        {!isMobile && (
          <button
            className={styles.collapseBtn}
            onClick={() => onCollapsedChange(!isCollapsed)}
            style={{ left: isCollapsed ? 38 : 187 }} // 200 - 12 = 188, 50 - 12 = 38
          >
            <FontAwesomeIcon icon={!isCollapsed ? faChevronCircleLeft : faChevronCircleRight} />
          </button>
        )}
      </div>
    </>
  );
};
