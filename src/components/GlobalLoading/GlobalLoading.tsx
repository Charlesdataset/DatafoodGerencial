import styles from "./GlobalLoading.module.scss";

interface GlobalLoadingProps {
  isLoading?: boolean;
  title?: string;
  subtitle?: string;
}

export default function GlobalLoading({ isLoading = true, title = "Carregando...", subtitle = "Aguarde um momento" }: GlobalLoadingProps) {
  if (!isLoading) return null;

  return (
    <div className={styles.backdrop}>
      <div className={styles.card}>
        <div className={styles.spinnerContainer}>
          <div className={styles.spinner} />
        </div>
        <div className={styles.textContainer}>
          <h3>{title}</h3>
          <p>{subtitle}</p>
        </div>
      </div>
    </div>
  );
}
