import type { IconProp } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type React from "react";

interface LoadingIconProps {
  icon: IconProp;
  isLoading?: boolean;
  spin?: boolean;
  className?: string;
  size?: "xs" | "sm" | "lg" | "1x" | "2x" | "3x" | "4x" | "5x" | "6x" | "7x" | "8x" | "9x" | "10x";
  title?: string;
}

const LoadingIcon: React.FC<LoadingIconProps> = ({ icon, isLoading = false, spin = false, className = "", size, title }) => {
  const shouldSpin = isLoading || spin;
  const wrapperStyle: React.CSSProperties | undefined = shouldSpin
    ? {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        animationName: "loading-icon-spin",
        animationDuration: "0.9s",
        animationTimingFunction: "linear",
        animationIterationCount: "infinite",
      }
    : undefined;

  return (
    <span className={className} style={wrapperStyle} title={title}>
      <FontAwesomeIcon icon={icon} size={size} />
    </span>
  );
};

export default LoadingIcon;
