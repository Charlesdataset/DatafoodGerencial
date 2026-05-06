// components/Inputs/Checkbox/Checkbox.tsx
import { faCheck, faMinus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { forwardRef, type InputHTMLAttributes } from "react";
import styles from "./CheckBox.module.scss";

interface CheckboxProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type"
> {
  label?: string;
  error?: string;
  indeterminate?: boolean;
  fullWidth?: boolean;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      label,
      error,
      indeterminate = false,
      fullWidth = false,
      className = "",
      disabled,
      ...props
    },
    ref,
  ) => {
    const checkboxClasses = [
      styles.checkbox,
      fullWidth ? styles.fullWidth : "",
      disabled ? styles.disabled : "",
      className,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <label className={checkboxClasses}>
        <div className={styles.wrapper}>
          <input
            ref={ref}
            type="checkbox"
            className={styles.input}
            disabled={disabled}
            {...props}
          />
          <span
            className={`${styles.custom} ${indeterminate ? styles.indeterminate : ""}`}
          >
            {indeterminate && (
              <FontAwesomeIcon icon={faMinus} className={styles.icon} />
            )}
            {!indeterminate && (
              <FontAwesomeIcon icon={faCheck} className={styles.icon} />
            )}
          </span>
        </div>
        {label && (
          <span
            className={`${styles.label} ${disabled ? styles.labelDisabled : ""}`}
          >
            {label}
          </span>
        )}
        {error && <span className={styles.error}>{error}</span>}
      </label>
    );
  },
);

Checkbox.displayName = "Checkbox";
