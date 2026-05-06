import type { ReactNode } from "react";
import styles from "./Label.module.scss";

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  children: ReactNode;
  required?: boolean;
  bold?: boolean;
  weight?: "normal" | "medium" | "semibold" | "bold" | "extrabold";
  size?: "xs" | "sm" | "md" | "lg" | "xl";
}

export const Label = ({ 
  children, 
  required = false, 
  bold = false,
  weight,
  size = "md",
  className = "",
  ...props 
}: LabelProps) => {
  const weightMap = {
    normal: styles.weightNormal,
    medium: styles.weightMedium,
    semibold: styles.weightSemibold,
    bold: styles.weightBold,
    extrabold: styles.weightExtrabold,
  };

  const sizeMap = {
    xs: styles.sizeXs,
    sm: styles.sizeSm,
    md: styles.sizeMd,
    lg: styles.sizeLg,
    xl: styles.sizeXl,
  };

  const weightClass = weight ? weightMap[weight] : (bold ? styles.weightBold : "");
  const sizeClass = sizeMap[size];

  return (
    <label 
      className={`${styles.label} ${sizeClass} ${weightClass} ${className}`} 
      {...props}
    >
      {children}
      {required && <span className={styles.required}>*</span>}
    </label>
  );
};