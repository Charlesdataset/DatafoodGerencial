import React from "react";
import styles from "./ListGroup.module.scss";

// ─── Tipos ────────────────────────────────────────────────────────────────────
export interface ListGroupItemProps {
  children: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
  disabled?: boolean;
  className?: string;
  /** Ícone à esquerda */
  icon?: React.ReactNode;
  /** Elemento à direita (badge, chevron, etc) */
  suffix?: React.ReactNode;
  /** Sublabel abaixo do conteúdo principal */
  description?: string | React.ReactNode;
}

export interface ListGroupProps {
  children: React.ReactNode;
  className?: string;
  /** Remove bordas entre itens */
  flush?: boolean;
  /** Itens mais compactos */
  compact?: boolean;
  /** Alterna zebragem nas linhas */
  zebra?: boolean;
  /** Mensagem exibida quando não há itens */
  emptyMessage?: string;
}

// ─── ListGroup.Item ───────────────────────────────────────────────────────────
const ListGroupItem: React.FC<ListGroupItemProps> = ({
  children,
  onClick,
  active = false,
  disabled = false,
  className = "",
  icon,
  suffix,
  description,
}) => {
  const isClickable = !!onClick && !disabled;

  return (
    <li
      className={[
        styles.item,
        isClickable ? styles.itemAction : "",
        active ? styles.itemActive : "",
        disabled ? styles.itemDisabled : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      onClick={isClickable ? onClick : undefined}
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
      aria-disabled={disabled || undefined}
      onKeyDown={
        isClickable
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
    >
      {icon && <span className={styles.itemIcon}>{icon}</span>}

      <div className={styles.itemBody}>
        <span className={styles.itemLabel}>{children}</span>
        {description && (
          <span className={styles.itemDescription}>{description}</span>
        )}
      </div>

      {suffix && <span className={styles.itemSuffix}>{suffix}</span>}

      {/* Chevron automático quando clicável e sem suffix */}
      {isClickable && !suffix && (
        <span className={styles.itemChevron}>
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M5 3L9 7L5 11"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      )}
    </li>
  );
};

// ─── ListGroup ────────────────────────────────────────────────────────────────
const ListGroupBase: React.FC<ListGroupProps> = ({
  children,
  className = "",
  flush = false,
  compact = false,
  zebra = true,
  emptyMessage = "Nenhum item encontrado.",
}) => {
  const childCount = React.Children.count(children);

  return (
    <ul
      className={[
        styles.list,
        flush ? styles.flush : "",
        compact ? styles.compact : "",
        zebra ? styles.zebra : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      role="list"
    >
      {childCount === 0 ? (
        <li className={styles.empty}>{emptyMessage}</li>
      ) : (
        children
      )}
    </ul>
  );
};

// ─── Export composto ──────────────────────────────────────────────────────────
const ListGroup = Object.assign(ListGroupBase, {
  Item: ListGroupItem,
});

export default ListGroup;
