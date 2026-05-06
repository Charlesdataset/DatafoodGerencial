import { useNavigate } from "react-router-dom";
import styles from "./Header.module.scss";

export function Header() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>🎫</span>
          <span className={styles.logoText}>TicketFlow</span>
        </div>

        <nav className={styles.nav}>
          <button onClick={() => navigate("/")}>Dashboard</button>
          <button onClick={handleLogout} className={styles.logout}>
            Sair
          </button>
        </nav>
      </div>
    </header>
  );
}
