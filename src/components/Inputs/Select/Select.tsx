import { faChevronRight } from "@fortawesome/free-solid-svg-icons";
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
  name?: string; // Adicionado suporte a name
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  error?: string; // Mensagem de erro
  onBlur?: () => void; // Evento de blur
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
  
  // Ref para o input hidden que vai armazenar o valor
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
    
    // Atualizar o input hidden com o valor selecionado
    if (hiddenInputRef.current) {
      hiddenInputRef.current.value = optionValue;
      // Disparar evento change para formulários React
      const changeEvent = new Event('change', { bubbles: true });
      hiddenInputRef.current.dispatchEvent(changeEvent);
    }
    
    // Disparar onBlur após selecionar
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

  // Determinar se deve mostrar erro
  const showError = !!error;

  return (
    <div className={`${styles.selectWrapper} ${className}`} ref={wrapperRef}>
      {label && (
        <label className={styles.label}>
          {label}
          {required && <span className={styles.required}>*</span>}
        </label>
      )}
      
      {/* Input hidden para suportar formulários HTML nativos */}
      {name && (
        <input
          ref={hiddenInputRef}
          type="hidden"
          name={name}
          value={value}
        />
      )}
      
      <div
        className={`${styles.selectContainer} ${disabled ? styles.disabled : ""} ${isOpen ? styles.open : ""} ${showError ? styles.error : ""}`}
        onClick={handleOpen}
        ref={selectRef}
      >
        <span
          className={`${styles.selectedValue} ${!selectedOption ? styles.placeholder : ""}`}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <span className={`${styles.arrow} ${isOpen ? styles.arrowUp : ""}`}>
          <FontAwesomeIcon icon={faChevronRight} />
        </span>
      </div>

      {/* Mensagem de erro */}
      {showError && (
        <div className={styles.errorMessage}>{error}</div>
      )}

      {isOpen &&
        !disabled &&
        createPortal(
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