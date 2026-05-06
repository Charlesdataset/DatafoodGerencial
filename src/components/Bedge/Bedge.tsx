import type { HTMLAttributes } from "react";
import styles from "./Bedge.module.scss";

interface BedgeProps extends HTMLAttributes<HTMLSpanElement> {
  value: string;
  variant?: "primary" | "success" | "danger" | "warning" | "info" | "secondary";
  outlined?: boolean;
  rounded?: boolean;
}

const Bedge: React.FC<BedgeProps> = ({ value, variant = "primary", outlined = false, rounded = false, className = "", ...props }) => {
  const bedgeClasses = [styles.bedge, styles[`bedge--${variant}`], outlined && styles["bedge--outlined"], rounded && styles["bedge--rounded"], className].filter(Boolean).join(" ");

  return (
    <span {...props} className={bedgeClasses}>
      {value}
    </span>
  );
};

export default Bedge;
