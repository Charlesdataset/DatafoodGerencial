import React, { forwardRef } from "react";
import styles from "./Switch.module.scss";

export type SwitchVariant = "primary" | "secondary" | "success" | "danger" | "warning" | "info" | "outline" | "filled";

export type SwitchSize = "sm" | "md" | "lg";
export type SwitchLabelPosition = "left" | "right";
export type SwitchLayout = "inline" | "stacked";

export interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size" | "onChange"> {
  /** Variante visual do switch */
  variant?: SwitchVariant;
  /** Tamanho do switch */
  size?: SwitchSize;
  /** Posição do label em relação ao toggle */
  labelPosition?: SwitchLabelPosition;
  /** Layout do switch (inline ou stacked) */
  layout?: SwitchLayout;
  /** Texto do label */
  label?: string;
  /** Texto de ajuda/descrição */
  helpText?: string;
  /** Se o switch está marcado */
  checked?: boolean;
  /** Se o switch está desabilitado */
  disabled?: boolean;
  /** Adiciona animação de pulso */
  pulse?: boolean;
  /** Mostra ícone dentro do toggle */
  withIcon?: boolean;
  /** Classe CSS adicional */
  className?: string;
  /** Callback quando o estado muda */
  onChange?: (checked: boolean) => void;
}

/**
 * Componente Switch reutilizável
 *
 * @example
 * <Switch label="Notificações" checked={true} onChange={handleChange} />
 * <Switch variant="success" size="sm" label="Status" />
 * <Switch variant="outline" labelPosition="left" label="Modo escuro" />
 */
export const Switch = forwardRef<HTMLInputElement, SwitchProps>(
  (
    {
      variant = "primary",
      size = "md",
      labelPosition = "right",
      layout = "inline",
      label,
      helpText,
      checked = false,
      disabled = false,
      pulse = false,
      withIcon = false,
      className = "",
      onChange,
      id,
      ...rest
    },
    ref,
  ) => {
    const switchId = id || `switch-${Math.random().toString(36).substr(2, 9)}`;

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      if (disabled) return;
      onChange?.(event.target.checked);
    };

    const getToggleClasses = () => {
      const classes = [styles.toggle];

      if (checked) classes.push(styles.toggleChecked);
      if (disabled) classes.push(styles.toggleDisabled);
      if (size !== "md") classes.push(styles[`toggle${size.charAt(0).toUpperCase() + size.slice(1)}`]);
      if (variant !== "primary") classes.push(styles[`toggle${variant.charAt(0).toUpperCase() + variant.slice(1)}`]);
      if (pulse) classes.push(styles.togglePulse);
      if (withIcon) classes.push(styles.toggleWithIcon);

      return classes.join(" ");
    };

    const getContainerClasses = () => {
      const classes = [styles.switch, className];

      if (layout === "stacked") classes.push(styles.switchStacked);
      if (layout === "inline") classes.push(styles.switchInline);
      if (disabled) classes.push(styles.switchDisabled);

      return classes.join(" ");
    };

    const getLabelClasses = () => {
      const classes = [styles.label];

      if (labelPosition === "left") classes.push(styles.labelLeft);
      if (labelPosition === "right") classes.push(styles.labelRight);

      return classes.join(" ");
    };

    return (
      <div className={getContainerClasses()}>
        <input
          ref={ref}
          type="checkbox"
          id={switchId}
          className={styles.input}
          checked={checked}
          disabled={disabled}
          onChange={handleChange}
          aria-checked={checked}
          aria-describedby={helpText ? `${switchId}-help` : undefined}
          {...rest}
        />

        <label htmlFor={switchId} className={getToggleClasses()} />

        {label && (
          <label htmlFor={switchId} className={getLabelClasses()}>
            {label}
          </label>
        )}

        {helpText && (
          <div id={`${switchId}-help`} className={styles.help}>
            {helpText}
          </div>
        )}
      </div>
    );
  },
);

Switch.displayName = "Switch";

export default Switch;
