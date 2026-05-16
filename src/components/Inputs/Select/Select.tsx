import { faChevronRight, faTimes } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import styles from "./Select.module.scss";

export interface Option {
  value: string;
  label: string;
}

interface SelectProps {
  required?: boolean;
  label?: string;
  name?: string;
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  error?: string;
  onBlur?: () => void;
  onClear?: () => void; // Função opcional para limpar o select
  clearButtonLabel?: string; // Label acessível para o botão de limpar
}

export default function Select({
  label,
  name,
  value,
  onChange,
  options,
  placeholder = "Selecione",
  disabled = false,
  className = "",
  required = false,
  error,
  onBlur,
  onClear,
  clearButtonLabel = "Limpar seleção",
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
  });
  const wrapperRef = useRef<HTMLDivElement>(null);
  const selectRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const hiddenInputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  const calculateDropdownPosition = () => {
    if (selectRef.current) {
      const rect = selectRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
  };

  const handleOpen = () => {
    if (disabled) return;
    calculateDropdownPosition();
    setIsOpen(!isOpen);
  };

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    
    if (hiddenInputRef.current) {
      hiddenInputRef.current.value = optionValue;
      const changeEvent = new Event('change', { bubbles: true });
      hiddenInputRef.current.dispatchEvent(changeEvent);
    }
    
    if (onBlur) onBlur();
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation(); // Evita que o clique abra/fecha o dropdown
    
    if (onClear) {
      onClear();
      onChange(""); // Opcional: limpar o valor também
    }
    
    // Atualizar o input hidden
    if (hiddenInputRef.current) {
      hiddenInputRef.current.value = "";
      const changeEvent = new Event('change', { bubbles: true });
      hiddenInputRef.current.dispatchEvent(changeEvent);
    }
    
    if (onBlur) onBlur();
  };

  const handleBlur = () => {
    if (onBlur) onBlur();
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        handleBlur();
      }
    };

    const handleScroll = () => {
      if (isOpen) {
        calculateDropdownPosition();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        setIsOpen(false);
        handleBlur();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", handleScroll);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  const showError = !!error;
  const showClearButton = !!onClear && !!value && !disabled;

  return (
    <div className={`${styles.selectWrapper} ${className}`} ref={wrapperRef}>
      {label && (
        <label className={styles.label}>
          {label}
          {required && <span className={styles.required}>*</span>}
        </label>
      )}
      
      {name && (
        <input
          ref={hiddenInputRef}
          type="hidden"
          name={name}
          value={value}
        />
      )}
      
      <div
        className={`${styles.selectContainer} ${disabled ? styles.disabled : ""} ${isOpen ? styles.open : ""} ${showError ? styles.error : ""} ${showClearButton ? styles.hasClear : ""}`}
        onClick={handleOpen}
        ref={selectRef}
      >
        <span
          className={`${styles.selectedValue} ${!selectedOption ? styles.placeholder : ""}`}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        
        <div className={styles.actions}>
          {showClearButton && (
            <button
              type="button"
              className={styles.clearButton}
              onClick={handleClear}
              aria-label={clearButtonLabel}
              title={clearButtonLabel}
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>
          )}
          
          <span className={`${styles.arrow} ${isOpen ? styles.arrowUp : ""}`}>
            <FontAwesomeIcon icon={faChevronRight} />
          </span>
        </div>
      </div>

      {showError && (
        <div className={styles.errorMessage}>{error}</div>
      )}

      {isOpen && !disabled && createPortal(
        <div
          ref={dropdownRef}
          className={styles.dropdown}
          style={{
            position: "absolute",
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`,
            width: `${dropdownPosition.width}px`,
            zIndex: 9999,
          }}
        >
          <div className={styles.dropdownList}>
            {options.map((option) => (
              <div
                key={option.value}
                className={`${styles.dropdownItem} ${option.value === value ? styles.selected : ""}`}
                onClick={() => handleSelect(option.value)}
              >
                {option.label}
              </div>
            ))}
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}