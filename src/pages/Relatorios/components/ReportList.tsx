import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useNavigate } from "react-router-dom";
import ListViewCliente from "./ListViewCliente";
import styles from "./ReportList.module.scss";

export interface ReportListProps {
    icon: any;
    title: string;
    reports: ReportItemProp[];
    accentColor?: string;
    accentBg?: string;
}

export interface ReportItemProp {
    name: string;
    onClick: () => void;
}

const ReportList: React.FC<ReportListProps> = ({
    icon,
    title,
    reports,
    accentColor,
    accentBg,
}) => {

   
    

    return (
        <>
            <div
                style={{
                    ["--accent-color" as any]: accentColor,
                    ["--accent-bg-color" as any]: accentBg,
                }}
            >
                <div className={styles.reportList}>
                    <div className={styles.iconContainer}>
                        <FontAwesomeIcon icon={icon} className={styles.icon} />
                    </div>
                    <span className={styles.title}>{title}</span>
                </div>

                <div className={styles.containerItems}>
                    {reports.map((report, index) => (
                        <div
                            key={index}
                            onClick={report.onClick}
                            className={styles.titleWrarp}
                        >
                            <span className={styles.titleList}>{report.name}</span>
                            <span className={styles.arrow}>›</span>
                        </div>
                    ))}
                </div>
            </div>

          
        </>
    );
};

export default ReportList;