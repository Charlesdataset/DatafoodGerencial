// components/Inputs/TextBox/TextBox.tsx
import React, { forwardRef, useCallback, useEffect, useState } from "react";
import styles from "./TextBox.module.scss";

// Tipos de máscara pré-definidas
type MaskType =
  | "monetary"
  | "cpf"
  | "cnpj"
  | "document"
  | "phone"
  | "cep"
  | "number"
  | "decimal"
  | "percent"
  | "email";

interface TextBoxProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "size"
> {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  validated?: boolean;
  showErrorOnBlur?: boolean;
  maxLength?: number;
  showCharCount?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRightIconClick?: () => void;
  clearable?: boolean;
  onClear?: () => void;
  mask?: MaskType | ((value: string) => string);
  format?: (value: string) => string;
  loading?: boolean;
  success?: boolean;
  inputSize?: "sm" | "md" | "lg";
  trimValue?: boolean;
  uppercase?: boolean;
  lowercase?: boolean;
  capitalize?: boolean;
  classnames?: string;
}

const TextBox = forwardRef<HTMLInputElement, TextBoxProps>(
  (
    {
      label,
      error,
      helperText,
      required = false,
      value = "",
      onChange,
      onBlur,
      disabled = false,
      placeholder,
      className = "",
      validated = false,
      showErrorOnBlur = true,
      maxLength,
      showCharCount = false,
      leftIcon,
      rightIcon,
      onRightIconClick,
      clearable = false,
      onClear,
      mask,
      format,
      loading = false,
      success = false,
      inputSize = "md",
      trimValue = false,
      uppercase = false,
      lowercase = false,
      capitalize = false,
      classnames = "",
      ...props
    },
    ref,
  ) => {
    const [isFocused, setIsFocused] = useState(false);
    const [showError, setShowError] = useState(!showErrorOnBlur);
    const [internalValue, setInternalValue] = useState(value as string);

    useEffect(() => {
      setInternalValue(value as string);
    }, [value]);
    useEffect(() => {
      if (error) {
        setShowError(true);
      }
    }, [error]);

    // ============================================
    // FUNÇÃO PARA DETERMINAR O TIPO DE INPUT
    // ============================================
    const getInputType = (): string => {
      // Se for email, retorna email
      if (mask === "email") return "email";

      // Se for número puro, retorna number (mostra teclado numérico)
      if (mask === "number") return "number";

      // Se for monetário, decimal ou percentual, mostra teclado numérico com decimal
      if (mask === "monetary" || mask === "decimal" || mask === "percent") {
        return "tel"; // tel mostra teclado numérico em alguns dispositivos
      }

      // Se for telefone, CPF, CNPJ, documento, CEP - mostra teclado numérico
      if (
        mask === "phone" ||
        mask === "cpf" ||
        mask === "cnpj" ||
        mask === "document" ||
        mask === "cep"
      ) {
        return "tel"; // tel mostra teclado numérico
      }

      // Se o usuário especificou type, usa ele
      if (props.type) return props.type;

      // Padrão: text
      return "text";
    };

    // ============================================
    // FUNÇÃO PARA DETERMINAR O PADRÃO DE INPUT (inputMode)
    // ============================================
    const getInputMode =
      (): React.HTMLAttributes<HTMLInputElement>["inputMode"] => {
        if (mask === "email") return "email";
        if (mask === "number") return "numeric";
        if (mask === "monetary" || mask === "decimal" || mask === "percent")
          return "decimal";
        if (
          mask === "phone" ||
          mask === "cpf" ||
          mask === "cnpj" ||
          mask === "document" ||
          mask === "cep"
        ) {
          return "numeric";
        }
        return "text";
      };

    const applyTextTransform = useCallback(
      (text: string): string => {
        let transformed = text;
        if (uppercase) transformed = transformed.toUpperCase();
        if (lowercase) transformed = transformed.toLowerCase();
        if (capitalize) {
          transformed = transformed.replace(/\b\w/g, (char) =>
            char.toUpperCase(),
          );
        }
        if (trimValue) transformed = transformed.trim();
        return transformed;
      },
      [uppercase, lowercase, capitalize, trimValue],
    );

    const applyPredefinedMask = useCallback(
      (value: string, maskType: MaskType): string => {
        const numbers = value.replace(/\D/g, "");

        switch (maskType) {
          case "email": {
            let emailValue = value.replace(/\s/g, "");
            emailValue = emailValue.toLowerCase();
            emailValue = emailValue.replace(/[^a-z0-9@._-]/g, "");
            const atCount = (emailValue.match(/@/g) || []).length;
            if (atCount > 1) {
              emailValue = emailValue.slice(0, emailValue.lastIndexOf("@"));
            }
            return emailValue;
          }

          case "monetary": {
            if (!numbers) return "";
            let numericValue = parseInt(numbers, 10) / 100;
            return numericValue.toLocaleString("pt-BR", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            });
          }

          case "document": {
            if (numbers.length <= 11) {
              if (numbers.length <= 3) return numbers;
              if (numbers.length <= 6)
                return numbers.replace(/(\d{3})(\d+)/, "$1.$2");
              if (numbers.length <= 9)
                return numbers.replace(/(\d{3})(\d{3})(\d+)/, "$1.$2.$3");
              return numbers
                .replace(/(\d{3})(\d{3})(\d{3})(\d+)/, "$1.$2.$3-$4")
                .slice(0, 14);
            } else {
              if (numbers.length <= 2) return numbers;
              if (numbers.length <= 5)
                return numbers.replace(/(\d{2})(\d+)/, "$1.$2");
              if (numbers.length <= 8)
                return numbers.replace(/(\d{2})(\d{3})(\d+)/, "$1.$2.$3");
              if (numbers.length <= 12)
                return numbers.replace(
                  /(\d{2})(\d{3})(\d{3})(\d+)/,
                  "$1.$2.$3/$4",
                );
              return numbers
                .replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d+)/, "$1.$2.$3/$4-$5")
                .slice(0, 18);
            }
          }

          case "cpf": {
            if (numbers.length <= 3) return numbers;
            if (numbers.length <= 6)
              return numbers.replace(/(\d{3})(\d+)/, "$1.$2");
            if (numbers.length <= 9)
              return numbers.replace(/(\d{3})(\d{3})(\d+)/, "$1.$2.$3");
            return numbers
              .replace(/(\d{3})(\d{3})(\d{3})(\d+)/, "$1.$2.$3-$4")
              .slice(0, 14);
          }

          case "cnpj": {
            if (numbers.length <= 2) return numbers;
            if (numbers.length <= 5)
              return numbers.replace(/(\d{2})(\d+)/, "$1.$2");
            if (numbers.length <= 8)
              return numbers.replace(/(\d{2})(\d{3})(\d+)/, "$1.$2.$3");
            if (numbers.length <= 12)
              return numbers.replace(
                /(\d{2})(\d{3})(\d{3})(\d+)/,
                "$1.$2.$3/$4",
              );
            return numbers
              .replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d+)/, "$1.$2.$3/$4-$5")
              .slice(0, 18);
          }

          case "phone": {
            if (numbers.length === 0) return "";
            if (numbers.length <= 2) return `(${numbers}`;
            if (numbers.length <= 7)
              return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
            if (numbers.length <= 11) {
              return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
            }
            return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
          }

          case "cep": {
            if (numbers.length <= 5) return numbers;
            return numbers.replace(/(\d{5})(\d+)/, "$1-$2").slice(0, 9);
          }

          case "number": {
            return numbers;
          }

          case "decimal": {
            if (!numbers) return "";
            let numericValue = parseInt(numbers, 10) / 100;
            return numericValue.toLocaleString("pt-BR", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            });
          }

          case "percent": {
            let digits = value.replace(/[^0-9]/g, "");
            if (digits === "") return "";
            let number = parseInt(digits, 10);
            if (isNaN(number)) return "";
            if (number > 1000000) number = 1000000;
            let percentValue = number / 100;
            let formatted = percentValue.toLocaleString("pt-BR", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            });
            return formatted;
          }

          default:
            return value;
        }
      },
      [],
    );

    const applyMaskOrFormat = useCallback(
      (text: string): string => {
        if (mask && typeof mask === "string") {
          return applyPredefinedMask(text, mask);
        }
        if (mask && typeof mask === "function") {
          return mask(text);
        }
        if (format) return format(text);
        return text;
      },
      [mask, format, applyPredefinedMask],
    );

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let newValue = e.target.value;
      newValue = applyTextTransform(newValue);
      newValue = applyMaskOrFormat(newValue);

      if (maxLength && newValue.length > maxLength) {
        newValue = newValue.slice(0, maxLength);
      }

      setInternalValue(newValue);

      if (onChange) {
        const newEvent = { ...e, target: { ...e.target, value: newValue } };
        onChange(newEvent);
      }
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      if (showErrorOnBlur) {
        setShowError(true);
      }
      if (onBlur) onBlur(e);
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      setShowError(false);
      if (props.onFocus) props.onFocus(e);
    };

    const handleClear = () => {
      const newValue = "";
      setInternalValue(newValue);
      if (onClear) onClear();
      if (onChange) {
        const fakeEvent = {
          target: { value: newValue },
        } as React.ChangeEvent<HTMLInputElement>;
        onChange(fakeEvent);
      }
    };

    // Validação de email
    const validateEmail = (email: string): boolean => {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      return emailRegex.test(email);
    };

    const shouldShowError =
      error ||
      (validated && (!internalValue || !internalValue.trim())) ||
      (mask === "email" &&
        validated &&
        internalValue &&
        !validateEmail(internalValue));

    const displayError = shouldShowError && (showError || !showErrorOnBlur);

    const getErrorMessage = (): string => {
      if (error) return error;
      if (validated && !internalValue?.trim()) return "Campo obrigatório";
      if (
        mask === "email" &&
        validated &&
        internalValue &&
        !validateEmail(internalValue)
      )
        return "Email inválido";
      return "";
    };

    const errorMessage = getErrorMessage();

    const getPlaceholderByMask = (): string => {
      if (placeholder) return placeholder;
      if (typeof mask === "string") {
        switch (mask) {
          case "monetary":
            return "R$ 0,00";
          case "document":
            return "CPF ou CNPJ";
          case "cpf":
            return "000.000.000-00";
          case "cnpj":
            return "00.000.000/0000-00";
          case "phone":
            return "(00) 00000-0000";
          case "cep":
            return "00000-000";
          case "percent":
            return "0,00";
          case "email":
            return "usuario@email.com";
          default:
            return "";
        }
      }
      return "";
    };

    const inputClasses = [
      styles.input,
      styles[`input-${inputSize}`],
      displayError && styles.inputError,
      success && styles.inputSuccess,
      loading && styles.inputLoading,
      leftIcon && styles.hasLeftIcon,
      (rightIcon || clearable) && styles.hasRightIcon,
      isFocused && styles.inputFocused,
      className,
    ]
      .filter(Boolean)
      .join(" ");

    const currentLength = (internalValue as string)?.length || 0;
    const isNearLimit = maxLength ? currentLength >= maxLength * 0.8 : false;
    const isAtLimit = maxLength ? currentLength >= maxLength : false;

    // Define o type do input baseado na máscara
    const inputType = getInputType();
    const inputMode = getInputMode();

    return (
      <div
        className={`${classnames} ${styles.formField} ${disabled ? styles.disabled : ""}`}
      >
        {label && (
          <label className={styles.label}>
            {label}
            {required && <span className={styles.required}>*</span>}
          </label>
        )}

        <div className={styles.inputWrapper}>
          {leftIcon && <div className={styles.leftIcon}>{leftIcon}</div>}

          <input
            ref={ref}
            type={inputType}
            inputMode={inputMode}
            value={internalValue}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            disabled={disabled || loading}
            placeholder={getPlaceholderByMask()}
            maxLength={maxLength}
            className={inputClasses}
            {...props}
          />

          {loading && (
            <div className={styles.rightIcon}>
              <div className={styles.spinner} />
            </div>
          )}

          {clearable && !loading && internalValue && (
            <button
              type="button"
              className={styles.clearButton}
              onClick={handleClear}
              aria-label="Limpar campo"
            >
              ✕
            </button>
          )}

          {rightIcon && !loading && !clearable && (
            <button
              type="button"
              className={styles.rightIconButton}
              onClick={onRightIconClick}
              disabled={disabled}
            >
              {rightIcon}
            </button>
          )}
        </div>

        {helperText && !displayError && (
          <div className={styles.helperText}>{helperText}</div>
        )}

        {displayError && errorMessage && (
          <div className={styles.errorMessage}>{errorMessage}</div>
        )}

        {showCharCount && maxLength && (
          <div
            className={`${styles.charCount} ${isNearLimit ? styles.nearLimit : ""} ${isAtLimit ? styles.atLimit : ""}`}
          >
            {currentLength} / {maxLength}
          </div>
        )}
      </div>
    );
  },
);

TextBox.displayName = "TextBox";

export default TextBox;
