import React, { forwardRef } from 'react';
import styles from './Separator.module.scss';

export type SeparatorVariant =
  | 'primary'
  | 'secondary'
  | 'success'
  | 'danger'
  | 'warning'
  | 'info'
  | 'light'
  | 'dark';

export type SeparatorType =
  | 'solid'
  | 'dashed'
  | 'dotted'
  | 'double'
  | 'gradient';

export type SeparatorOrientation = 'horizontal' | 'vertical';
export type SeparatorSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type SeparatorLabelPosition = 'center' | 'left' | 'right';

export interface SeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Variante visual do separator */
  variant?: SeparatorVariant;
  /** Tipo da linha */
  type?: SeparatorType;
  /** Orientação do separator */
  orientation?: SeparatorOrientation;
  /** Tamanho/espessura da linha */
  size?: SeparatorSize;
  /** Comprimento personalizado (px, %, rem, etc.) */
  length?: string | number;
  /** Texto do label (apenas para orientação horizontal) */
  label?: string;
  /** Posição do label */
  labelPosition?: SeparatorLabelPosition;
  /** Se o separator é invisível (mantém espaçamento) */
  invisible?: boolean;
  /** Classe CSS adicional */
  className?: string;
}

/**
 * Componente Separator reutilizável
 *
 * @example
 * <Separator />
 * <Separator variant="primary" type="dashed" size="lg" />
 * <Separator orientation="vertical" size="md" />
 * <Separator label="Ou" labelPosition="center" />
 */
export const Separator = forwardRef<HTMLDivElement, SeparatorProps>(
  (
    {
      variant = 'primary',
      type = 'solid',
      orientation = 'horizontal',
      size = 'md',
      length,
      label,
      labelPosition = 'center',
      invisible = false,
      className = '',
      ...rest
    },
    ref
  ) => {
    const separatorId = `separator-${Math.random().toString(36).substr(2, 9)}`;

    const getSeparatorClasses = () => {
      const classes = [styles.separator, className];

      // Orientação
      if (orientation === 'horizontal') classes.push(styles.separatorHorizontal);
      if (orientation === 'vertical') classes.push(styles.separatorVertical);

      // Variante de cor
      if (variant !== 'primary') classes.push(styles[`separator${variant.charAt(0).toUpperCase() + variant.slice(1)}`]);

      // Tipo de linha
      if (type !== 'solid') classes.push(styles[`separator${type.charAt(0).toUpperCase() + type.slice(1)}`]);

      // Tamanho
      if (size !== 'md') classes.push(styles[`separator${size.charAt(0).toUpperCase() + size.slice(1)}`]);

      // Invisível
      if (invisible) classes.push(styles.separatorInvisible);

      // Com label
      if (label) classes.push(styles.separatorWithLabel);

      return classes.join(' ');
    };

    const getLabelClasses = () => {
      const classes = [styles.label];

      if (labelPosition === 'center') classes.push(styles.labelCenter);
      if (labelPosition === 'left') classes.push(styles.labelLeft);
      if (labelPosition === 'right') classes.push(styles.labelRight);

      return classes.join(' ');
    };

    const getSeparatorStyle = (): React.CSSProperties => {
      const style: React.CSSProperties = {};

      if (length) {
        if (orientation === 'horizontal') {
          style.width = typeof length === 'number' ? `${length}px` : length;
        } else {
          style.height = typeof length === 'number' ? `${length}px` : length;
        }
      }

      return style;
    };

    return (
      <div
        ref={ref}
        id={separatorId}
        className={getSeparatorClasses()}
        style={getSeparatorStyle()}
        role="separator"
        aria-orientation={orientation}
        aria-label={label || undefined}
        {...rest}
      >
        {label && orientation === 'horizontal' ? (
          <>
            <span className={styles.line} />
            <span className={getLabelClasses()}>{label}</span>
            <span className={styles.line} />
          </>
        ) : (
          <span className={styles.line} />
        )}
      </div>
    );
  }
);

Separator.displayName = 'Separator';

export default Separator;