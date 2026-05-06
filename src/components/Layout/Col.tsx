import React from "react";
import styles from "./Layout.module.scss";

interface ColProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  xs?: number | "auto";
  sm?: number | "auto";
  nt?: number | "auto";
  md?: number | "auto";
  lg?: number | "auto";
  xl?: number | "auto";
  offsetXs?: number;
  offsetSm?: number;
  offsetNt?: number;
  offsetMd?: number;
  offsetLg?: number;
  offsetXl?: number;
  // Expand responsivo
  expand?: boolean; // Expande em todos os breakpoints
  expandXs?: boolean; // Expande apenas em xs
  expandSm?: boolean; // Expande apenas em sm
  expandNt?: boolean; // Expande apenas em nt
  expandMd?: boolean; // Expande apenas em md
  expandLg?: boolean; // Expande apenas em lg
  expandXl?: boolean; // Expande apenas em xl
  className?: string;
}

const Col: React.FC<ColProps> = ({
  children,
  xs,
  sm,
  nt,
  md,
  lg,
  xl,
  offsetXs = 0,
  offsetSm = 0,
  offsetMd = 0,
  offsetNt = 0,
  offsetLg = 0,
  offsetXl = 0,
  expand = false,
  expandXs = false,
  expandSm = false,
  expandNt = false,
  expandMd = false,
  expandLg = false,
  expandXl = false,
  className = "",
  ...props
}) => {
  const colClasses = [
    styles.col,
    // Expand geral (todos os breakpoints)
    expand && styles["col-expand"],
    // Classes de grid SEMPRE são aplicadas (não dependem do expand)
    // Pois cada breakpoint tem seu próprio comportamento
    xs !== undefined && styles[`col-xs-${xs}`],
    sm !== undefined && styles[`col-sm-${sm}`],
    nt !== undefined && styles[`col-nt-${nt}`],
    md !== undefined && styles[`col-md-${md}`],
    lg !== undefined && styles[`col-lg-${lg}`],
    xl !== undefined && styles[`col-xl-${xl}`],
    // Auto classes
    xs === "auto" && styles["col-xs-auto"],
    sm === "auto" && styles["col-sm-auto"],
    nt === "auto" && styles["col-nt-auto"],
    md === "auto" && styles["col-md-auto"],
    lg === "auto" && styles["col-lg-auto"],
    xl === "auto" && styles["col-xl-auto"],
    // Expand responsivo - aplicado em conjunto com as classes de grid
    expandXs && styles["col-expand-xs"],
    expandSm && styles["col-expand-sm"],
    expandNt && styles["col-expand-nt"],
    expandMd && styles["col-expand-md"],
    expandLg && styles["col-expand-lg"],
    expandXl && styles["col-expand-xl"],
    // Offsets
    offsetXs > 0 && styles[`col-xs-offset-${offsetXs}`],
    offsetSm > 0 && styles[`col-sm-offset-${offsetSm}`],
    offsetNt > 0 && styles[`col-nt-offset-${offsetNt}`],
    offsetMd > 0 && styles[`col-md-offset-${offsetMd}`],
    offsetLg > 0 && styles[`col-lg-offset-${offsetLg}`],
    offsetXl > 0 && styles[`col-xl-offset-${offsetXl}`],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={colClasses} {...props}>
      {children}
    </div>
  );
};

export default Col;
