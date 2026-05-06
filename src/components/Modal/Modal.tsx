import React, { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import styles from "./Modal.module.scss";

// ─── Tipos ────────────────────────────────────────────────────────────────────
export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "fullscreen";
  centered?: boolean;
  backdrop?: boolean | "static";
  scrollable?: boolean;
  className?: string;
  ariaLabelledby?: string;
  ariaDescribedby?: string;
}

// ─── Gerencia stack de modais abertos (para z-index correto) ──────────────────
let modalStack = 0;

// ─── Modal principal ──────────────────────────────────────────────────────────
const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  children,
  size = "md",
  centered = true,
  backdrop = true,
  scrollable = false,
  className = "",
  ariaLabelledby,
  ariaDescribedby,
}) => {
  const [phase, setPhase] = useState<
    "hidden" | "entering" | "visible" | "leaving"
  >("hidden");
  const [zOffset, setZOffset] = useState(0);
  const dialogRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      const offset = modalStack;
      modalStack++;
      setZOffset(offset);
      setPhase("entering");
      const t = requestAnimationFrame(() => setPhase("visible"));
      document.body.style.overflow = "hidden";
      return () => {
        cancelAnimationFrame(t);
        modalStack = Math.max(0, modalStack - 1);
        document.body.style.overflow = "";
      };
    } else {
      if (phase === "visible" || phase === "entering") {
        setPhase("leaving");
        const t = setTimeout(() => setPhase("hidden"), 280);
        return () => clearTimeout(t);
      }
    }
  }, [isOpen]);

  // ESC fecha
  useEffect(() => {
    if (!isOpen || backdrop === "static") return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose, backdrop]);

  // Foco inicial no dialog
  useEffect(() => {
    if (phase === "visible" && dialogRef.current) {
      dialogRef.current.focus();
    }
  }, [phase]);

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (backdrop === true && e.target === overlayRef.current) onClose();
    },
    [backdrop, onClose],
  );

  if (phase === "hidden") return null;

  const sizeClass =
    size === "fullscreen"
      ? styles.sizeFullscreen
      : (styles[`size${size.toUpperCase()}`] ?? styles.sizeMD);

  return createPortal(
    <div
      ref={overlayRef}
      className={[
        styles.overlay,
        phase === "visible" ? styles.overlayVisible : "",
        phase === "leaving" ? styles.overlayLeaving : "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={{ zIndex: 1040 + zOffset * 10 }}
      onClick={handleOverlayClick}
      aria-hidden={!isOpen}
    >
      {/* Noise overlay */}
      <div className={styles.overlayNoise} />

      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={ariaLabelledby}
        aria-describedby={ariaDescribedby}
        className={[
          styles.dialog,
          sizeClass,
          centered ? styles.dialogCentered : "",
          scrollable ? styles.dialogScrollable : "",
          phase === "visible" ? styles.dialogVisible : "",
          phase === "leaving" ? styles.dialogLeaving : "",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        onClick={(e) => e.stopPropagation()}
        style={{ zIndex: 1050 + zOffset * 10 }}
      >
        {/* Borda decorativa superior */}
        <div className={styles.dialogAccent} />
        <div className={styles.dialogContent}>{children}</div>
      </div>
    </div>,
    document.body,
  );
};

// ─── Subcomponentes ───────────────────────────────────────────────────────────

interface ModalHeaderProps {
  children: React.ReactNode;
  onClose?: () => void;
  closeButton?: boolean;
  className?: string;
}

const ModalHeader: React.FC<ModalHeaderProps> = ({
  children,
  onClose,
  closeButton = true,
  className = "",
}) => (
  <div className={`${styles.header} ${className}`}>
    <div className={styles.headerContent}>{children}</div>
    {closeButton && onClose && (
      <button
        type="button"
        className={styles.closeBtn}
        onClick={onClose}
        aria-label="Fechar"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M1 1L13 13M13 1L1 13"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      </button>
    )}
  </div>
);

interface ModalTitleProps {
  children: React.ReactNode;
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  className?: string;
}

const ModalTitle: React.FC<ModalTitleProps> = ({
  children,
  as: Tag = "h5",
  className = "",
}) => <Tag className={`${styles.title} ${className}`}>{children}</Tag>;

interface ModalBodyProps {
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
}

const ModalBody: React.FC<ModalBodyProps> = ({
  children,
  className = "",
  noPadding = false,
}) => (
  <div
    className={`${styles.body} ${noPadding ? styles.bodyNoPadding : ""} ${className}`}
  >
    {children}
  </div>
);

interface ModalFooterProps {
  children: React.ReactNode;
  className?: string;
  align?: "left" | "center" | "right" | "between";
}

const ModalFooter: React.FC<ModalFooterProps> = ({
  children,
  className = "",
  align = "right",
}) => (
  <div className={`${styles.footer} ${styles[`footer_${align}`]} ${className}`}>
    {children}
  </div>
);

// ─── Export ───────────────────────────────────────────────────────────────────
export default Object.assign(Modal, {
  Header: ModalHeader,
  Body: ModalBody,
  Footer: ModalFooter,
  Title: ModalTitle,
});
