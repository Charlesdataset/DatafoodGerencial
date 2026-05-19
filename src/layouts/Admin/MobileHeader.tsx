import {
  faChartPie
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useLocation } from "react-router-dom";
import styles from "./MobileHeader.module.scss";

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
