// src/components/Card/SelectCard.tsx
import React from "react";
import styles from "./SelectCard.module.scss";

export interface SelectCardOption {
  value: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
}

interface SelectCardProps {
  options: SelectCardOption[];
  selectedValue: string;
  onChange: (value: string) => void;
  label?: string;
  required?: boolean;
  error?: string;
  disabled?: boolean;
  className?: string;
  /** Direção dos cards: "column" (vertical) ou "row" (horizontal) */
  direction?: "column" | "row";
}

export default function SelectCard({
  options,
  selectedValue,
  onChange,
  label,
  required = false,
  error,
  disabled = false,
  className = "",
  direction = "column",
}: SelectCardProps) {
  const showError = !!error;

  const handleSelect = (value: string) => {
    if (!disabled) {
      onChange(value);
    }
  };

  return (
    <div className={`${styles.selectCardWrapper} ${className}`}>
      {label && (
        <label className={styles.label}>
          {label}
          {required && <span className={styles.required}>*</span>}
        </label>
      )}

      <div className={`${styles.optionsContainer} ${styles[`direction${direction.charAt(0).toUpperCase() + direction.slice(1)}`]}`}>
        {options.map((option) => {
          const isSelected = selectedValue === option.value;
          
          return (
            <div
              key={option.value}
              onClick={() => handleSelect(option.value)}
              className={`${styles.optionCard} ${isSelected ? styles.selected : ""} ${disabled ? styles.disabled : ""}`}
            >
              {option.icon && (
                <div className={styles.iconWrapper}>
                  {option.icon}
                </div>
              )}
              
              <div className={styles.content}>
                <div className={styles.labelText}>
                  {option.label}
                </div>
                {option.description && (
                  <div className={styles.descriptionText}>
                    {option.description}
                  </div>
                )}
              </div>

              <div className={styles.radioCircle}>
                {isSelected && <div className={styles.radioDot} />}
              </div>
            </div>
          );
        })}
      </div>

      {showError && (
        <div className={styles.errorMessage}>{error}</div>
      )}
    </div>
  );
}