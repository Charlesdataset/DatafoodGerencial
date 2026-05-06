import React from "react";
import styles from "./Grid.module.scss";

interface GridProps {
  children: React.ReactNode;

  // modo tradicional
  cols?: number;
  colsSm?: number;
  colsMd?: number;
  colsLg?: number;
  colsXl?: number;

  // 🔥 NOVO: modo automático
  autoFit?: boolean;
  autoFill?: boolean;
  minWidth?: number; // largura mínima do item (ex: 180)

  gap?: "none" | "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}

const Grid: React.FC<GridProps> = ({
  children,
  cols = 1,
  colsSm,
  colsMd,
  colsLg,
  colsXl,

  autoFit = false,
  autoFill = false,
  minWidth = 180,

  gap = "md",
  className = "",
}) => {
  // fallback normal (igual seu atual)
  const finalColsSm = colsSm ?? cols;
  const finalColsMd = colsMd ?? finalColsSm;
  const finalColsLg = colsLg ?? finalColsMd;
  const finalColsXl = colsXl ?? finalColsLg;

  // 🔥 estilo dinâmico (auto-fit)
  const dynamicStyle =
    autoFit || autoFill
      ? {
          gridTemplateColumns: `repeat(${
            autoFit ? "auto-fit" : "auto-fill"
          }, minmax(${minWidth}px, 1fr))`,
        }
      : undefined;

  const gridClasses = [
    styles.grid,
    styles[`gap-${gap}`],

    // só aplica cols se NÃO for auto
    !autoFit && !autoFill && styles[`cols-${cols}`],
    !autoFit && !autoFill && styles[`cols-sm-${finalColsSm}`],
    !autoFit && !autoFill && styles[`cols-md-${finalColsMd}`],
    !autoFit && !autoFill && styles[`cols-lg-${finalColsLg}`],
    !autoFit && !autoFill && styles[`cols-xl-${finalColsXl}`],

    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={gridClasses} style={dynamicStyle}>
      {children}
    </div>
  );
};

export default Grid;