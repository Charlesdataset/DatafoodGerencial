// src/components/Layout/Fluid/Fluid.tsx
import React, { useEffect, useMemo, useRef } from "react";
import styles from "./Fluid.module.scss";

type FluidSize = number | "auto" | "expand";

interface FluidLayoutProps {
  children: React.ReactNode;
  xs?: FluidSize[];
  sm?: FluidSize[];
  md?: FluidSize[];
  nt?: FluidSize[];
  lg?: FluidSize[];
  xl?: FluidSize[];
  xxl?: FluidSize[];
  gap?: number | string;
  rowGap?: number | string;
  columnGap?: number | string;
  align?: "start" | "center" | "end" | "stretch";
  justify?: "start" | "center" | "end" | "between" | "around" | "evenly";
  wrap?: "wrap" | "nowrap" | "wrap-reverse";
  className?: string;
}

const BREAKPOINTS: { key: string; value: number }[] = [
  { key: "xs", value: 0 },
  { key: "sm", value: 576 },
  { key: "nt", value: 992 },
  { key: "md", value: 768 },
  { key: "lg", value: 1332 },
  { key: "xl", value: 1595 },
  { key: "xxl", value: 1900 },
];

const Fluid: React.FC<FluidLayoutProps> = ({
  children,
  xs = [],
  sm = [],
  md = [],
  nt = [],
  lg = [],
  xl = [],
  xxl = [],
  gap = 16,
  rowGap,
  columnGap,
  align = "stretch",
  justify = "start",
  wrap = "wrap",
  className = "",
}) => {
  const childrenArray = React.Children.toArray(children);
  const styleRef = useRef<HTMLStyleElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const uniqueId = useMemo(
    () => `fluid-${Math.random().toString(36).substr(2, 9)}`,
    [],
  );

  const resolveGap = (val?: number | string) =>
    typeof val === "number" ? `${val}px` : val;

  const resolvedColumnGap = resolveGap(columnGap) ?? resolveGap(gap) ?? "16px";
  const resolvedRowGap = resolveGap(rowGap) ?? resolveGap(gap) ?? "16px";

  // Para cálculo de width usamos o columnGap (gap horizontal)
  const gapCss = resolvedColumnGap;

  const generateStyles = useMemo(() => {
    const bpMap: Record<string, FluidSize[]> = { xs, sm, md, nt, lg, xl, xxl };
    const styleRules: string[] = [];

    BREAKPOINTS.forEach(({ key, value }) => {
      const sizes = bpMap[key];
      if (!sizes || sizes.length === 0) return;

      const mediaQuery = value === 0 ? "" : `@media (min-width: ${value}px)`;

      childrenArray.forEach((_, index) => {
        const sizeIndex = Math.min(index, sizes.length - 1);
        const size = sizes[sizeIndex];

        let cssProps = "";

        if (size === "auto") {
          cssProps = `
            width: auto !important;
            flex: 0 0 auto !important;
          `;
        } else if (size === "expand") {
          cssProps = `
            flex: 1 1 0% !important;
            min-width: 0 !important;
            width: auto !important;
          `;
        } else if (typeof size === "number") {
          const gapFraction = (1 - size / 100).toFixed(4);
          cssProps = `
            width: calc(${size}% - ${gapCss} * ${gapFraction}) !important;
            flex: 0 0 auto !important;
          `;
        }

        const cls = `.fluid-item-${uniqueId}-${index}`;
        const rule = mediaQuery
          ? `${mediaQuery} { ${cls} { ${cssProps} } }`
          : `${cls} { ${cssProps} }`;

        styleRules.push(rule);
      });
    });

    return styleRules.join("\n");
  }, [xs, sm, md, nt, lg, xl, xxl, childrenArray.length, uniqueId, gapCss]);

  useEffect(() => {
    if (!styleRef.current) {
      styleRef.current = document.createElement("style");
      styleRef.current.setAttribute("data-fluid-id", uniqueId);
      document.head.appendChild(styleRef.current);
    }

    styleRef.current.textContent = generateStyles;

    return () => {
      if (styleRef.current) {
        styleRef.current.remove();
        styleRef.current = null;
      }
    };
  }, [generateStyles, uniqueId]);

  const containerStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "row",
    flexWrap: wrap,
    alignItems: align,
    justifyContent:
      justify === "start"
        ? "flex-start"
        : justify === "center"
          ? "center"
          : justify === "end"
            ? "flex-end"
            : justify === "between"
              ? "space-between"
              : justify === "around"
                ? "space-around"
                : justify === "evenly"
                  ? "space-evenly"
                  : "flex-start",
    columnGap: resolvedColumnGap,
    rowGap: resolvedRowGap,
    width: "100%",
  };

  const getBaseStyle = (index: number): React.CSSProperties => {
    if (!xs || xs.length === 0) return {};

    const sizeIndex = Math.min(index, xs.length - 1);
    const size = xs[sizeIndex];

    if (size === "auto") {
      return { width: "auto", flex: "0 0 auto" };
    } else if (size === "expand") {
      return { flex: "1 1 0%", minWidth: 0, width: "auto" };
    } else if (typeof size === "number") {
      const gapFraction = (1 - size / 100).toFixed(4);
      return {
        width: `calc(${size}% - ${gapCss} * ${gapFraction})`,
        flex: "0 0 auto",
      };
    }

    return {};
  };

  return (
    <div
      ref={containerRef}
      className={`${styles.fluidContainer} ${className}`}
      style={containerStyle}
    >
      {childrenArray.map((child, index) => (
        <div
          key={index}
          className={`${styles.fluidItem} fluid-item-${uniqueId}-${index}`}
          style={getBaseStyle(index)}
        >
          {child}
        </div>
      ))}
    </div>
  );
};

export default Fluid;
