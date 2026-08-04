import React, { useCallback, useEffect, useRef, useState } from "react";
import type { PillSize, PillVariant } from "../../Pill/Pill";
import Pill from "../../Pill/Pill";
import styles from "./MultiTextBox.module.scss";

// ── Reutiliza os mesmos tipos de máscara do TextBox ──────────────────────────
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

/**
 * Paleta padrão para mode="multicolor".
 * Sobrescreva via `colorPalette`.
 */
const DEFAULT_PALETTE = [
  "#42ab8a", // primary
  "#3b82f6", // blue
  "#f59e0b", // amber
  "#ec4899", // pink
  "#8b5cf6", // violet
  "#06b6d4", // cyan
  "#f97316", // orange
  "#10b981", // emerald
];

export type PillColorMode =
  | "multicolor" // rotaciona na paleta (padrão)
  | "gray" // cinza fixo
  | "fixed"; // cor única via `fixedColor`

export interface MultiTextBoxProps {
  /** Rótulo do campo */
  label?: string;
  /** Array de valores controlado externamente */
  values: string[];
  /** Chamado sempre que o array mudar */
  onChange: (values: string[]) => void;
  /** Placeholder exibido quando vazio */
  placeholder?: string;
  /** Mensagem de erro externa */
  error?: string;
  /** Texto de ajuda */
  helperText?: string;
  /** Marca o campo como obrigatório (visual + validação) */
  required?: boolean;
  /**
   * Quando `true`, exibe erro se `values` estiver vazio.
   * Dispara após o campo perder o foco ou se `error` for passado.
   */
  validated?: boolean;
  /** Desabilita todo o componente */
  disabled?: boolean;
  /**
   * Máscara aplicada a cada valor antes de criar o pill.
   * As mesmas do TextBox (cpf, cnpj, phone, cep, monetary…)
   */
  mask?: MaskType | ((value: string) => string);
  /** Modo de cor dos pills */
  colorMode?: PillColorMode;
  /** Paleta de cores para mode="multicolor" */
  colorPalette?: string[];
  /** Cor fixa para mode="fixed" ou "gray" */
  fixedColor?: string;
  /** Tamanho dos pills */
  pillSize?: PillSize;
  /** Variante visual dos pills */
  pillVariant?: PillVariant;
  /** Exibe contagem de items no canto inferior direito */
  showCount?: boolean;
  /** Máximo de items permitidos */
  maxItems?: number;
  /** Classe extra no container */
  className?: string;
  /** Altura da caixa em px. Quando o conteúdo ultrapassar, rola. @default 200 */
  boxHeight?: number;
  /** Teclas que confirmam a adição de um item (padrão: Enter e vírgula) */
  submitKeys?: string[];
  /** Callback do botão "+" exibido ao lado do label */
  onAddClick?: () => void;
  /** Tooltip do botão "+" @default "Adicionar" */
  addButtonTitle?: string;
  /** Callback ao clicar na área do input (ignora cliques em pills) */
  onInputClick?: () => void;
}

// ── Função de máscara (extraída do TextBox) ──────────────────────────────────
function applyPredefinedMask(value: string, maskType: MaskType): string {
  const numbers = value.replace(/\D/g, "");
  switch (maskType) {
    case "email": {
      let v = value
        .replace(/\s/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9@._-]/g, "");
      const atCount = (v.match(/@/g) || []).length;
      if (atCount > 1) v = v.slice(0, v.lastIndexOf("@"));
      return v;
    }
    case "monetary": {
      if (!numbers) return "";
      return (parseInt(numbers, 10) / 100).toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    }
    case "cpf": {
      if (numbers.length <= 3) return numbers;
      if (numbers.length <= 6) return numbers.replace(/(\d{3})(\d+)/, "$1.$2");
      if (numbers.length <= 9)
        return numbers.replace(/(\d{3})(\d{3})(\d+)/, "$1.$2.$3");
      return numbers
        .replace(/(\d{3})(\d{3})(\d{3})(\d+)/, "$1.$2.$3-$4")
        .slice(0, 14);
    }
    case "cnpj": {
      if (numbers.length <= 2) return numbers;
      if (numbers.length <= 5) return numbers.replace(/(\d{2})(\d+)/, "$1.$2");
      if (numbers.length <= 8)
        return numbers.replace(/(\d{2})(\d{3})(\d+)/, "$1.$2.$3");
      if (numbers.length <= 12)
        return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d+)/, "$1.$2.$3/$4");
      return numbers
        .replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d+)/, "$1.$2.$3/$4-$5")
        .slice(0, 18);
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
      }
      if (numbers.length <= 2) return numbers;
      if (numbers.length <= 5) return numbers.replace(/(\d{2})(\d+)/, "$1.$2");
      if (numbers.length <= 8)
        return numbers.replace(/(\d{2})(\d{3})(\d+)/, "$1.$2.$3");
      if (numbers.length <= 12)
        return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d+)/, "$1.$2.$3/$4");
      return numbers
        .replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d+)/, "$1.$2.$3/$4-$5")
        .slice(0, 18);
    }
    case "phone": {
      if (!numbers.length) return "";
      if (numbers.length <= 2) return `(${numbers}`;
      if (numbers.length <= 7)
        return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
    }
    case "cep":
      if (numbers.length <= 5) return numbers;
      return numbers.replace(/(\d{5})(\d+)/, "$1-$2").slice(0, 9);
    case "number":
      return numbers;
    case "decimal": {
      if (!numbers) return "";
      return (parseInt(numbers, 10) / 100).toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    }
    case "percent": {
      const digits = value.replace(/[^0-9]/g, "");
      if (!digits) return "";
      let n = parseInt(digits, 10);
      if (isNaN(n)) return "";
      if (n > 1000000) n = 1000000;
      return (n / 100).toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    }
    default:
      return value;
  }
}

function applyMask(
  value: string,
  mask?: MaskType | ((v: string) => string),
): string {
  if (!mask) return value;
  if (typeof mask === "string") return applyPredefinedMask(value, mask);
  return mask(value);
}

// ── Componente ────────────────────────────────────────────────────────────────
const MultiTextBox: React.FC<MultiTextBoxProps> = ({
  label,
  values,
  onChange,
  placeholder = "Digite e pressione Enter…",
  error,
  helperText,
  required = false,
  validated = false,
  disabled = false,
  mask,
  colorMode = "multicolor",
  colorPalette = DEFAULT_PALETTE,
  fixedColor = "#d3d4d6",
  pillSize = "sm",
  pillVariant = "solid",
  showCount = false,
  maxItems,
  className = "",
  boxHeight = 200,
  submitKeys = ["Enter", ","],
  onAddClick,
  addButtonTitle = "Adicionar",
  onInputClick,
}) => {
  const [inputValue, setInputValue] = useState("");
  const [showError, setShowError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Mostra erro imediatamente se `error` vier de fora
  useEffect(() => {
    if (error) setShowError(true);
  }, [error]);

  // ── Cor de um pill na posição `index` ────────────────────────────────────
  const getPillColor = useCallback(
    (index: number): string => {
      if (colorMode === "gray") return "#c8d3df";
      if (colorMode === "fixed") return fixedColor;
      // multicolor
      return colorPalette[index % colorPalette.length];
    },
    [colorMode, colorPalette, fixedColor],
  );

  // ── Adicionar item ───────────────────────────────────────────────────────
  const addItem = useCallback(
    (raw: string) => {
      const trimmed = raw.trim();
      if (!trimmed) return;
      if (maxItems && values.length >= maxItems) return;

      const masked = applyMask(trimmed, mask);
      if (values.includes(masked)) return; // evita duplicatas

      onChange([...values, masked]);
      setInputValue("");
    },
    [values, onChange, mask, maxItems],
  );

  // ── Remover por índice ───────────────────────────────────────────────────
  const removeItem = useCallback(
    (index: number) => {
      onChange(values.filter((_, i) => i !== index));
    },
    [values, onChange],
  );

  // ── Limpar tudo ───────────────────────────────────────────────────────────
  const clearAll = useCallback(() => {
    onChange([]);
    setInputValue("");
    inputRef.current?.focus();
  }, [onChange]);

  // ── Eventos do input ─────────────────────────────────────────────────────
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (submitKeys.includes(e.key)) {
      e.preventDefault();
      addItem(inputValue);
      return;
    }
    // Backspace sem texto remove o último pill
    if (e.key === "Backspace" && !inputValue && values.length > 0) {
      removeItem(values.length - 1);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value;
    // Se a máscara é de tipo delimitado, aplica em tempo real no input
    if (mask) v = applyMask(v, mask);
    setInputValue(v);
  };

  const handleBlur = () => {
    // Confirma o que tiver digitado ao sair do campo
    if (inputValue.trim()) addItem(inputValue);
    if (validated) setShowError(true);
  };

  // ── Validação ────────────────────────────────────────────────────────────
  const hasValidationError = validated && required && values.length === 0;
  const displayError = (error || hasValidationError) && showError;
  const errorMessage = error || (hasValidationError ? "Campo obrigatório" : "");

  const isAtMax = !!maxItems && values.length >= maxItems;

  return (
    <div className={`${styles.formField} ${className}`}>
      {label && (
        <div className={styles.labelRow}>
          <label className={styles.label}>
            {label}
            {required && <span className={styles.required}>*</span>}
          </label>
          {onAddClick && (
            <button
              type="button"
              className={styles.addBtn}
              onClick={onAddClick}
              title={addButtonTitle}
              aria-label={addButtonTitle}
              disabled={disabled}
            >
              +
            </button>
          )}
        </div>
      )}

      <div
        className={[
          styles.inputBox,
          displayError ? styles.hasError : "",
          disabled ? styles.disabled : "",
        ]
          .filter(Boolean)
          .join(" ")}
        style={{ height: boxHeight, overflowY: "auto" }}
        onClick={(e) => {
          const target = e.target as HTMLElement;
          const isPill = target.closest("[data-pill]");
          if (!isPill) {
            inputRef.current?.focus();
            onInputClick?.();
          }
        }}
      >
        {/* Pills existentes */}
        {values.map((val, idx) => (
          <span key={`${val}-${idx}`} data-pill="true">
            <Pill
              label={val}
              color={getPillColor(idx)}
              size={pillSize}
              variant={pillVariant}
              onRemove={disabled ? undefined : () => removeItem(idx)}
            />
          </span>
        ))}

        {/* Input fantasma */}
        {!isAtMax && (
          <input
            ref={inputRef}
            type="text"
            className={styles.ghostInput}
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => { }}
            onBlur={handleBlur}
            placeholder={values.length === 0 ? placeholder : ""}
            disabled={disabled}
            aria-label={label}
          />
        )}

        {/* Botão limpar tudo */}
        {values.length > 0 && !disabled && (
          <div className={styles.actionsArea}>
            <button
              type="button"
              className={styles.clearAllBtn}
              onClick={(e) => {
                e.stopPropagation();
                clearAll();
              }}
              title="Remover todos"
              aria-label="Remover todos os itens"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* Mensagens de feedback */}
      {helperText && !displayError && (
        <div className={styles.helperText}>{helperText}</div>
      )}
      {displayError && errorMessage && (
        <div className={styles.errorMessage}>{errorMessage}</div>
      )}
      {showCount && (
        <div className={styles.itemCount}>
          {values.length}
          {maxItems ? ` / ${maxItems}` : ""} item(s)
        </div>
      )}
    </div>
  );
};

export default MultiTextBox;
