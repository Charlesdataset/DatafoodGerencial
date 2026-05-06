import React from "react";
import styles from "./Spinner.module.scss";

export interface SpinnerProps {
  /** border (padrão, igual Bootstrap) ou grow (pulso) */
  variant?: "border" | "grow";
  /** sm = 16px, md = 24px (padrão), lg = 36px, xl = 48px */
  size?: "sm" | "md" | "lg" | "xl";
  /** Cor via variável — usa $text-primary por padrão */
  color?: string;
  className?: string;
  /** Texto para leitores de tela */
  label?: string;
}

const Spinner: React.FC<SpinnerProps> = ({
  variant = "border",
  size = "md",
  color,
  className = "",
  label = "Carregando...",
}) => (
  <span
    className={[styles.spinner, styles[variant], styles[size], className]
      .filter(Boolean)
      .join(" ")}
    style={
      color ? ({ "--spinner-color": color } as React.CSSProperties) : undefined
    }
    role="status"
    aria-label={label}
  >
    <span className={styles.srOnly}>{label}</span>
  </span>
);

export default Spinner;
