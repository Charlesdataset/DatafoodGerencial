import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import styles from "./NoData.module.scss";

interface NoDataProps {
  message?: string;
}

export default function NoData({ message = "Sem evento" }: NoDataProps) {
  return (
    <div className={styles.container}>
      <span style={{ fontSize: "4rem", opacity: 0.5 }}>
        <FontAwesomeIcon icon={faMagnifyingGlass} />
      </span>
      <h3>{message}</h3>
    </div>
  );
}
