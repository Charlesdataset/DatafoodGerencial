import { faBars, faBarsStaggered } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import Separator from "../../components/Separator/Separator";
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
  const [backgroundColor, setBackgroundColor] = useState('linear-gradient(-45deg, rgba(33, 69, 95, 0.86), #42AB8A)');
  const [backgroundMobile, setBackgroundMobile] = useState("#369878")
  const { secondaryColor, currLogo, version, companyInfo } = useApp();

  useEffect(() => {

    switch (companyInfo.franquia) {
      case "DATASET":
        setBackgroundColor('linear-gradient(-45deg, rgba(33, 69, 95, 0.86), #42AB8A)');
        setBackgroundMobile("#369878")
        break;
      case 'ARS':
        setBackgroundColor('linear-gradient(-20deg, rgba(15, 79, 153, 0.86), #5bc6d0)');
        setBackgroundMobile('#5bc6d0')
        break;

      case 'GIGABYTE':
        setBackgroundColor('linear-gradient(-45deg, rgb(0, 0, 0),rgb(0, 0, 0)');
        setBackgroundMobile('#000')
        break;

    }

  }, [companyInfo])




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

      <div style={{ '--backgroundColor': backgroundColor, '--mobileBackground': backgroundMobile } as React.CSSProperties} >

        {isOpen && isMobile && <div className={styles.overlay} onClick={onClose} />}

        <aside className={`${styles.sidebar} ${isCollapsed && !isMobile ? styles.collapsed : ""} ${isOpen && isMobile ? styles.mobileOpen : ""}`}>

          <div className={styles.container}>

            <div className={styles.sidebarHeader}>
              {!isMobile && (
                <button
                  className={styles.collapseBtn}
                  onClick={() => onCollapsedChange(!isCollapsed)}

                >
                  <FontAwesomeIcon icon={!isCollapsed ? faBars : faBarsStaggered} />
                </button>
              )}

              <Link to="/" className={styles.logo} onClick={handleLinkClick}>
                {isCollapsed ? <img src={currLogo} alt="Logo" style={{ width: 35 }} /> : <img src={!isCollapsed || isMobile ? currLogo : currLogo} alt="Logo" style={isMobile ? { width: 250 } : { width: 150 }} />}
              </Link>
            </div>
            <div className={styles.containerSidebar}>
              <div className={styles.linkHeader}>
                <p >Dashboard</p>
                {!isMobile && (<Separator variant="light" size="xs" type="solid" />)}
              </div>
              <SidebarMenu isCollapsed={isCollapsed || false} onLinkClick={handleLinkClick} />


              <div className={styles.sidebarFooter}>
                <div className={styles.version}>{version}</div>
              </div>
            </div>
          </div>

        </aside>

        {/* Botão de minimizar fora do sidebar para sobrepor */}

      </div>
    </>
  );
};
