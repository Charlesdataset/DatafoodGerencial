import { faSearch, faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { forwardRef, useState } from "react";
import styles from "./TextSearch.module.scss";

interface TextSearchProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onClear?: () => void;
  onSearch?: (value: string) => void;
  isLoading?: boolean;
}

export const TextSearch = forwardRef<HTMLInputElement, TextSearchProps>(
  (
    { onClear, onSearch, onChange, value, isLoading = false, ...props },
    ref,
  ) => {
    const [internalValue, setInternalValue] = useState(value || "");

    const currentValue = value !== undefined ? value : internalValue;
    const hasText = String(currentValue).length > 0;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      if (value === undefined) setInternalValue(newValue);
      onChange?.(e);
      onSearch?.(newValue);
    };

    const handleClear = () => {
      if (value === undefined) setInternalValue("");
      if (onClear) onClear();
      else if (onSearch) onSearch("");

      // Simular evento de change para quem usa onChange
      const fakeEvent = {
        target: { value: "" },
      } as React.ChangeEvent<HTMLInputElement>;
      onChange?.(fakeEvent);
    };

    return (
      <div className={styles.searchWrapper}>
        <input
          ref={ref}
          type="text"
          className={styles.searchInput}
          value={currentValue}
          onChange={handleChange}
          {...props}
        />
        <button
          type="button"
          className={styles.searchIcon}
          onClick={hasText ? handleClear : undefined}
        >
          {!isLoading ? (
            <FontAwesomeIcon icon={hasText ? faXmark : faSearch} />
          ) : (
            <span className="btn__spinner_search " />
          )}
        </button>
      </div>
    );
  },
);

TextSearch.displayName = "TextSearch";
