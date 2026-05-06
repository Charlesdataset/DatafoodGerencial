import React from "react";
import styles from "./Layout.module.scss";

interface FlexProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  direction?: "row" | "column" | "row-reverse" | "column-reverse";
  directionSm?: "row" | "column" | "row-reverse" | "column-reverse";
  directionMd?: "row" | "column" | "row-reverse" | "column-reverse";
  directionLg?: "row" | "column" | "row-reverse" | "column-reverse";
  directionXl?: "row" | "column" | "row-reverse" | "column-reverse";
  wrap?: "nowrap" | "wrap" | "wrap-reverse";
  wrapSm?: "nowrap" | "wrap" | "wrap-reverse";
  wrapMd?: "nowrap" | "wrap" | "wrap-reverse";
  wrapLg?: "nowrap" | "wrap" | "wrap-reverse";
  wrapXl?: "nowrap" | "wrap" | "wrap-reverse";
  align?: "start" | "center" | "end" | "stretch" | "baseline";
  justify?: "start" | "center" | "end" | "between" | "around" | "evenly";
  gap?: "none" | "xs" | "sm" | "md" | "lg" | "xl";
  gapSm?: "none" | "xs" | "sm" | "md" | "lg" | "xl";
  gapMd?: "none" | "xs" | "sm" | "md" | "lg" | "xl";
  gapLg?: "none" | "xs" | "sm" | "md" | "lg" | "xl";
  gapXl?: "none" | "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}

const Flex: React.FC<FlexProps> = ({
  children,
  direction = "row",
  directionSm,
  directionMd,
  directionLg,
  directionXl,
  wrap = "nowrap",
  wrapSm,
  wrapMd,
  wrapLg,
  wrapXl,
  align = "stretch",
  justify = "start",
  gap = "md",
  gapSm,
  gapMd,
  gapLg,
  gapXl,
  className = "",
  ...props
}) => {
  const flexClasses = [
    styles.flex,
    styles[`flex-direction-${direction}`],
    styles[`flex-wrap-${wrap}`],
    styles[`flex-align-${align}`],
    styles[`flex-justify-${justify}`],
    styles[`flex-gap-${gap}`],
    // Responsivo
    directionSm && styles[`flex-direction-sm-${directionSm}`],
    directionMd && styles[`flex-direction-md-${directionMd}`],
    directionLg && styles[`flex-direction-lg-${directionLg}`],
    directionXl && styles[`flex-direction-xl-${directionXl}`],
    wrapSm && styles[`flex-wrap-sm-${wrapSm}`],
    wrapMd && styles[`flex-wrap-md-${wrapMd}`],
    wrapLg && styles[`flex-wrap-lg-${wrapLg}`],
    wrapXl && styles[`flex-wrap-xl-${wrapXl}`],
    gapSm && styles[`flex-gap-sm-${gapSm}`],
    gapMd && styles[`flex-gap-md-${gapMd}`],
    gapLg && styles[`flex-gap-lg-${gapLg}`],
    gapXl && styles[`flex-gap-xl-${gapXl}`],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={flexClasses} {...props}>
      {children}
    </div>
  );
};

export default Flex;
