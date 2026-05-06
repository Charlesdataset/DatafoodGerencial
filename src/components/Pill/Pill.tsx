import React from "react";
import styles from "./Pill.module.scss";

export type PillSize = "sm" | "md" | "lg";
export type PillVariant = "solid" | "outline";

export interface PillProps {
  /** Texto exibido dentro do pill */
  label: string;
  /**
   * Cor de fundo (solid) ou borda/texto (outline).
   * Aceita qualquer valor CSS válido: hex, rgb, variável, etc.
   * @default "#94a3b8"
   */
  color?: string;
  /** Tamanho do pill */
  size?: PillSize;
  /** Estilo visual */
  variant?: PillVariant;
  /** Callback ao clicar no × — se omitido, o botão não aparece */
  onRemove?: () => void;
  /** Classe extra no container */
  className?: string;
  /** Qualquer prop HTML adicional */
  style?: React.CSSProperties;
}

const Pill: React.FC<PillProps> = ({ label, color = "#94a3b8", size = "md", variant = "solid", onRemove, className = "", style }) => {
  const isSolid = variant === "solid";

  const containerStyle: React.CSSProperties = {
    backgroundColor: isSolid ? color : "transparent",
    borderColor: color,
    color: isSolid ? getContrastColor(color) : color,
    ...style,
  };

  return (
    <span className={[styles.pill, styles[size], styles[variant], className].filter(Boolean).join(" ")} style={containerStyle} title={label}>
      <span className={styles.label}>{label}</span>

      {onRemove && (
        <button
          type="button"
          className={styles.removeBtn}
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          aria-label={`Remover ${label}`}
          style={{ color: isSolid ? getContrastColor(color) : color }}
        >
          ✕
        </button>
      )}
    </span>
  );
};

// ── Utilitário: contraste automático branco / escuro ─────────────────────────
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const clean = hex.replace("#", "");
  if (clean.length === 3) {
    const r = parseInt(clean[0] + clean[0], 16);
    const g = parseInt(clean[1] + clean[1], 16);
    const b = parseInt(clean[2] + clean[2], 16);
    return { r, g, b };
  }
  if (clean.length === 6) {
    const r = parseInt(clean.slice(0, 2), 16);
    const g = parseInt(clean.slice(2, 4), 16);
    const b = parseInt(clean.slice(4, 6), 16);
    return { r, g, b };
  }
  return null;
}

function getContrastColor(color: string): string {
  const rgb = hexToRgb(color);
  if (!rgb) return "#ffffff"; // fallback para não-hex
  // Luminância relativa (W3C)
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  return luminance > 0.55 ? "#1e293b" : "#ffffff";
}

export default Pill;
