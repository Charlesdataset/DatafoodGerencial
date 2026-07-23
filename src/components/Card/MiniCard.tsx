// src/components/Card/MiniCard.tsx
import { Switch } from "../Switch/Switch";
import styles from "./MiniCard.module.scss";

interface MiniCardProps {
  label?: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  required?: boolean;
  error?: string;
  disabled?: boolean;
}

export default function MiniCard({
  label,
  description = "Quando desativado não aparecer para seleção",
  checked,
  onChange,
  required = false,
  error,
  disabled = false,
}: MiniCardProps) {
  const showError = !!error;

  const handleCardClick = () => {
    if (!disabled) {
      onChange(!checked);
    }
  };

  const handleSwitchChange = (newChecked: boolean) => {
    if (!disabled) {
      onChange(newChecked);
    }
  };

  return (
    <div className={styles.miniCardWrapper}>
      {label && (
        <label className={styles.label}>
          {label}
          {required && <span className={styles.required}>*</span>}
        </label>
      )}

      <div
        className={`${styles.miniCardContainer} ${disabled ? styles.disabled : ""} ${showError ? styles.error : ""}`}
        onClick={handleCardClick}
      >
        <span className={styles.description}>
          {description}
        </span>

        <div className={styles.actions} onClick={(e) => e.stopPropagation()}>
          <Switch
            checked={checked}
            onChange={handleSwitchChange}
            disabled={disabled}
          />
        </div>
      </div>

      {showError && (
        <div className={styles.errorMessage}>{error}</div>
      )}
    </div>
  );
}