import {
  faCalendarAlt,
  faClock,
  faTimes,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import styles from "./DatePicker.module.scss";
// ⚠️ Veja também o ajuste necessário em DatePicker.module.scss:
// trocar `position: absolute;` por `position: fixed;` na regra
// `.datePickerDropdown` (fora do media query mobile) e remover as
// classes `.dropdownTop` / `.dropdownBottom`, que não são mais usadas
// (a posição agora vem 100% de `top`/`left` inline calculados em JS).

interface DatePickerProps {
  value: Date | null;
  onChange: (date: Date | null) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  time?: boolean;
  timeFormat?: "12" | "24";
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  validated?: boolean;
  showErrorOnBlur?: boolean;
  onBlur?: (value: Date | null) => void;
  isFormField?: boolean
}

// ── Drum Picker ─────────────────────────────────────────────────────────────
interface DrumPickerProps {
  value: number;
  max: number;
  label: string;
  onChange: (v: number) => void;
}

const DRUM_ITEM_H = 44;

function DrumPicker({ value, max, label, onChange }: DrumPickerProps) {
  const [dragPx, setDragPx] = useState(0);
  const [snapping, setSnapping] = useState(false);
  const cylinderRef = useRef<HTMLDivElement>(null);
  const holdRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pointerRef = useRef({
    startY: 0,
    isDragging: false,
    lastY: 0,
    vel: 0,
  });
  const baseValRef = useRef(value);

  // Stable ref – avoids stale closure in the non-reactive wheel effect
  const stateRef = useRef({ value, max, onChange });
  stateRef.current = { value, max, onChange };

  useEffect(() => {
    const el = cylinderRef.current;
    if (!el) return;
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const { value: v, max: m, onChange: cb } = stateRef.current;
      cb((((v + (e.deltaY > 0 ? 1 : -1)) % m) + m) % m);
    };
    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const wrap = (n: number) => ((n % max) + max) % max;

  const startHold = (fn: () => void) => {
    fn();
    holdRef.current = setInterval(fn, 110);
  };

  const stopHold = () => {
    if (holdRef.current) {
      clearInterval(holdRef.current);
      holdRef.current = null;
    }
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    baseValRef.current = value;
    pointerRef.current = {
      startY: e.clientY,
      isDragging: true,
      lastY: e.clientY,
      vel: 0,
    };
    setSnapping(false);
    setDragPx(0);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!pointerRef.current.isDragging) return;
    pointerRef.current.vel = e.clientY - pointerRef.current.lastY;
    pointerRef.current.lastY = e.clientY;
    const px = e.clientY - pointerRef.current.startY;
    setDragPx(px);
    onChange(wrap(baseValRef.current + Math.round(-px / DRUM_ITEM_H)));
  };

  const onPointerUp = () => {
    if (!pointerRef.current.isDragging) return;
    pointerRef.current.isDragging = false;
    const vel = pointerRef.current.vel;
    if (Math.abs(vel) > 6) {
      const extra = Math.round((-vel * 2.5) / DRUM_ITEM_H);
      if (extra !== 0) onChange(wrap(value + extra));
    }
    setSnapping(true);
    setDragPx(0);
  };

  // Fractional offset for smooth visual during drag (-0.5 to 0.5)
  const rawSteps = -dragPx / DRUM_ITEM_H;
  const frac = rawSteps - Math.round(rawSteps);

  return (
    <div className={styles.drumOuter}>
      <span className={styles.drumLabel}>{label}</span>
      <button
        type="button"
        className={styles.drumArrow}
        onPointerDown={() => startHold(() => onChange(wrap(value + 1)))}
        onPointerUp={stopHold}
        onPointerLeave={stopHold}
        aria-label={`Aumentar ${label}`}
      >
        ▲
      </button>
      <div
        ref={cylinderRef}
        className={styles.drumCylinder}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        style={{ touchAction: "none" }}
      >
        <div className={styles.drumHighlight} />
        <div className={styles.drumFadeTop} />
        <div className={styles.drumFadeBottom} />
        {[-3, -2, -1, 0, 1, 2, 3].map((relIdx) => {
          const displayOffset = relIdx - frac;
          const absD = Math.abs(displayOffset);
          const val = wrap(value + relIdx);
          return (
            <div
              key={relIdx}
              className={styles.drumItem}
              style={{
                transform: `translateY(calc(-50% + ${displayOffset * DRUM_ITEM_H
                  }px)) perspective(500px) rotateX(${-displayOffset * 22}deg)`,
                opacity: Math.max(0, 1 - absD * 0.32),
                transition:
                  snapping && !pointerRef.current.isDragging
                    ? "transform 0.22s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.22s ease"
                    : "none",
                fontWeight: absD < 0.5 ? 700 : 400,
              }}
            >
              {String(val).padStart(2, "0")}
            </div>
          );
        })}
      </div>
      <button
        type="button"
        className={styles.drumArrow}
        onPointerDown={() => startHold(() => onChange(wrap(value - 1)))}
        onPointerUp={stopHold}
        onPointerLeave={stopHold}
        aria-label={`Diminuir ${label}`}
      >
        ▼
      </button>
    </div>
  );
}
// ─────────────────────────────────────────────────────────────────────────────

export const DatePicker = ({
  value,
  onChange,
  placeholder = "Selecionar data",
  className = "",
  disabled = false,
  time = false,
  timeFormat = "24",
  label,
  error,
  helperText,
  required = false,
  validated = false,
  showErrorOnBlur = true,
  onBlur,
  isFormField = true,
}: DatePickerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(value || new Date());
  const [tempSelectedDate, setTempSelectedDate] = useState<Date | null>(value);
  const [tempHours, setTempHours] = useState(value ? value.getHours() : 0);
  const [tempMinutes, setTempMinutes] = useState(
    value ? value.getMinutes() : 0,
  );
  const [showError, setShowError] = useState(!showErrorOnBlur);

  // Posição calculada em coordenadas de viewport (usada com position: fixed
  // no portal, então não sofre com overflow/clip do popup pai)
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({
    position: "fixed",
    top: 0,
    left: 0,
    visibility: "hidden", // evita "flash" no canto (0,0) antes do primeiro cálculo
  });

  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" && window.innerWidth <= 768,
  );

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    setTempSelectedDate(value);
    if (value) {
      setTempHours(value.getHours());
      setTempMinutes(value.getMinutes());
    }
  }, [value]);

  useEffect(() => {
    if (error) {
      setShowError(true);
    }
  }, [error]);

  // Fecha ao clicar fora (ignorando cliques no input).
  // Como o dropdown agora vive num portal (fora da árvore DOM do input),
  // usamos os refs — que continuam válidos mesmo através do portal —
  // para checar se o clique foi dentro do dropdown ou do input.
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(target) &&
        inputRef.current &&
        !inputRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Trava scroll do body em mobile
  useEffect(() => {
    if (isOpen && isMobile) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen, isMobile]);

  // ── Posicionamento via Portal ────────────────────────────────────────────
  // Em vez de posicionar relativo ao ancestral posicionado mais próximo
  // (o que quebra dentro de popups/modais com overflow:hidden|auto),
  // calculamos a posição em coordenadas de viewport e renderizamos o
  // dropdown direto no <body> via createPortal + position: fixed.
  // Isso garante que ele nunca seja cortado nem gere scroll dentro do popup.
  useLayoutEffect(() => {
    if (!isOpen || isMobile || !inputRef.current) return;

    const updatePosition = () => {
      if (!inputRef.current) return;
      const inputRect = inputRef.current.getBoundingClientRect();
      const dropdownEl = dropdownRef.current;
      // "natural" height/width do conteúdo (sem cap ainda)
      const naturalHeight = dropdownEl?.scrollHeight || (time ? 420 : 360);
      const actualWidth = dropdownEl?.offsetWidth || (time ? 490 : 280);
      const MARGIN = 8;
      const GAP = 8;
      const MIN_HEIGHT = 200; // nunca deixa o dropdown menor que isso

      const spaceBelow = window.innerHeight - inputRect.bottom - GAP - MARGIN;
      const spaceAbove = inputRect.top - GAP - MARGIN;

      // Escolhe o lado com espaço suficiente; se nenhum dos dois comportar
      // o conteúdo inteiro, escolhe o lado com MAIS espaço disponível
      // (o conteúdo então rola internamente em vez de ser cortado).
      const openBelow =
        spaceBelow >= naturalHeight
          ? true
          : spaceAbove >= naturalHeight
            ? false
            : spaceBelow >= spaceAbove;

      const availableSpace = openBelow ? spaceBelow : spaceAbove;
      // Se não coube, limita a altura ao espaço disponível (com scroll interno)
      const maxHeight = Math.max(
        Math.min(naturalHeight, availableSpace),
        Math.min(MIN_HEIGHT, availableSpace > 0 ? availableSpace : MIN_HEIGHT),
      );

      // Horizontal: corrige overflow nas bordas
      let left = inputRect.left;
      const rightEdge = left + actualWidth;
      if (rightEdge > window.innerWidth - MARGIN) {
        left = window.innerWidth - MARGIN - actualWidth;
      }
      if (left < MARGIN) left = MARGIN;

      const base: React.CSSProperties = {
        position: "fixed",
        left,
        maxHeight,
        overflowY: "auto",
        visibility: "visible",
      };

      if (openBelow) {
        base.top = inputRect.bottom + GAP;
      } else {
        base.bottom = window.innerHeight - inputRect.top + GAP;
      }

      setDropdownStyle(base);
    };

    // rAF garante que o dropdown já foi montado/medido antes do 1º cálculo
    const raf = requestAnimationFrame(updatePosition);

    // capture:true para pegar scroll de QUALQUER ancestral com overflow
    // (ex.: o próprio popup), não só o window
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [isOpen, isMobile, time]);

  // Reseta o estado de posição (visibility hidden) sempre que fechar,
  // pra evitar flash na posição antiga da próxima vez que abrir
  useEffect(() => {
    if (!isOpen) {
      setDropdownStyle((prev) => ({ ...prev, visibility: "hidden" }));
    }
  }, [isOpen]);

  const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const months = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];

  const formatDate = (date: Date | null): string => {
    if (!date) return "";
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    if (time) {
      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");
      return `${day}/${month}/${year} ${hours}:${minutes}`;
    }
    return `${day}/${month}/${year}`;
  };

  const getDaysInMonth = (year: number, month: number) =>
    new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) =>
    new Date(year, month, 1).getDay();

  const generateCalendar = () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const days: (Date | null)[] = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));
    return days;
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isSelected = (date: Date) => {
    if (!tempSelectedDate) return false;
    return (
      date.getDate() === tempSelectedDate.getDate() &&
      date.getMonth() === tempSelectedDate.getMonth() &&
      date.getFullYear() === tempSelectedDate.getFullYear()
    );
  };

  const mergeDateTime = (date: Date, hours: number, minutes: number): Date => {
    const newDate = new Date(date);
    newDate.setHours(hours);
    newDate.setMinutes(minutes);
    newDate.setSeconds(0);
    newDate.setMilliseconds(0);
    return newDate;
  };

  const handleDateClick = (date: Date) => {
    const newDate = mergeDateTime(date, tempHours, tempMinutes);
    setTempSelectedDate(newDate);
    if (!time || !isMobile) {
      onChange(newDate);
      setIsOpen(false);
      onBlur?.(newDate); // ✅ Notifica o formulário pai com o novo valor
    }
  };

  const handleTimeChange = (type: "hours" | "minutes", val: number) => {
    if (type === "hours") {
      setTempHours(val);
      if (tempSelectedDate) {
        const updated = mergeDateTime(tempSelectedDate, val, tempMinutes);
        setTempSelectedDate(updated);
        if (!isMobile) onChange(updated);
      }
    } else {
      setTempMinutes(val);
      if (tempSelectedDate) {
        const updated = mergeDateTime(tempSelectedDate, tempHours, val);
        setTempSelectedDate(updated);
        if (!isMobile) onChange(updated);
      }
    }
  };

  const handleConfirm = () => {
    if (tempSelectedDate) {
      const finalDate = mergeDateTime(tempSelectedDate, tempHours, tempMinutes);
      setTempSelectedDate(finalDate);
      onChange(finalDate);
    } else if (time) {
      const today = new Date();
      const finalDate = mergeDateTime(today, tempHours, tempMinutes);
      setTempSelectedDate(finalDate);
      onChange(finalDate);
    }
    setIsOpen(false);
    onBlur?.(tempSelectedDate || null); // ✅ Notifica o formulário pai
  };

  const handleCancel = () => {
    setTempSelectedDate(value);
    if (value) {
      setTempHours(value.getHours());
      setTempMinutes(value.getMinutes());
    } else {
      setTempHours(0);
      setTempMinutes(0);
    }
    setIsOpen(false);
    onBlur?.(value); // ✅ Notifica o formulário pai com valor original
  };

  const goToToday = () => {
    const today = new Date();
    setViewDate(today);
    setTempSelectedDate(today);
    setTempHours(today.getHours());
    setTempMinutes(today.getMinutes());
    if (!time) {
      onChange(today);
      setIsOpen(false);
      onBlur?.(today); // ✅ Notifica o formulário pai
    }
  };

  const clearDate = () => {
    setTempSelectedDate(null);
    onChange(null);
    setIsOpen(false);
    onBlur?.(null); // ✅ Notifica o formulário pai
  };

  const prevMonth = () =>
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  const nextMonth = () =>
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));

  const calendarDays = generateCalendar();

  // Validação (igual TextBox)
  const handleBlur = () => {
    if (showErrorOnBlur) setShowError(true);
    onBlur?.(tempSelectedDate); // 🔥 manda o valor real
  };

  const handleFocus = () => setShowError(false);

  const shouldShowError = error || (validated && !value);
  const displayError = shouldShowError && (showError || !showErrorOnBlur);
  const errorMessage =
    error || (validated && !value ? "Campo obrigatório" : "");

  const inputClasses = `
    ${styles.datePickerInput}
    ${disabled ? styles.disabled : ""}
    ${displayError ? styles.inputError : ""}
  `;

  const dropdownContent = (
    <>
      {isMobile && (
        <div className={styles.overlay} onClick={handleCancel} />
      )}
      <div
        ref={dropdownRef}
        className={`${styles.datePickerDropdown} ${time ? styles.withTimePicker : ""}`}
        style={isMobile ? undefined : dropdownStyle}
      >
        {isMobile && (
          <button
            className={styles.closeBtnMobile}
            onClick={handleCancel}
            aria-label="Fechar"
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        )}

        <div className={styles.datePickerContent}>
          <div className={styles.calendarSection}>
            <div className={styles.calendarHeader}>
              <button
                onClick={prevMonth}
                className={styles.navBtn}
                type="button"
              >
                ◀
              </button>
              <span className={styles.monthYear}>
                {months[viewDate.getMonth()]} {viewDate.getFullYear()}
              </span>
              <button
                onClick={nextMonth}
                className={styles.navBtn}
                type="button"
              >
                ▶
              </button>
            </div>
            <div className={styles.calendarWeekDays}>
              {weekDays.map((day) => (
                <div key={day} className={styles.weekDay}>
                  {day}
                </div>
              ))}
            </div>
            <div className={styles.calendarDays}>
              {calendarDays.map((date, idx) => (
                <div key={idx} className={styles.calendarDayCell}>
                  {date && (
                    <button
                      className={`${styles.dayBtn} ${isToday(date) ? styles.today : ""} ${isSelected(date) ? styles.selected : ""}`}
                      onClick={() => handleDateClick(date)}
                      type="button"
                    >
                      {date.getDate()}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {time && (
            <div className={styles.timePickerSection}>
              <div className={styles.timePickerHeader}>
                <FontAwesomeIcon icon={faClock} />
                <span>Horário</span>
              </div>
              <div className={styles.timeInputs}>
                <DrumPicker
                  value={tempHours}
                  max={timeFormat === "24" ? 24 : 12}
                  label="Hora"
                  onChange={(v) => handleTimeChange("hours", v)}
                />
                <span className={styles.timeSeparator}>:</span>
                <DrumPicker
                  value={tempMinutes}
                  max={60}
                  label="Min"
                  onChange={(v) => handleTimeChange("minutes", v)}
                />
              </div>
              <div className={styles.timePickerActions}>
                <button
                  onClick={goToToday}
                  className={styles.todayBtn}
                  type="button"
                >
                  Hoje
                </button>
                <div className={styles.actionButtons}>
                  <button
                    onClick={handleCancel}
                    className={styles.cancelBtn}
                    type="button"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleConfirm}
                    className={styles.confirmBtn}
                    type="button"
                  >
                    Confirmar
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {time && isMobile && (
          <div className={styles.calendarFooter}>
            <button
              onClick={goToToday}
              className={styles.todayBtn}
              type="button"
            >
              Hoje
            </button>
            <button
              onClick={handleCancel}
              className={styles.cancelBtn}
              type="button"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirm}
              className={styles.confirmBtn}
              type="button"
            >
              Confirmar
            </button>
          </div>
        )}
        {!time && (
          <div className={styles.calendarFooter}>
            <button
              onClick={goToToday}
              className={styles.todayBtn}
              type="button"
            >
              Hoje
            </button>
          </div>
        )}
      </div>
    </>
  );

  return (
    <div
      className={`${isFormField ? styles.formField : ''} ${disabled ? styles.disabled : ""} ${className}`}
    >
      {label && (
        <label className={styles.label}>
          {label}
          {required && <span className={styles.required}>*</span>}
        </label>
      )}

      <div className={styles.inputWrapper}>
        <input
          ref={inputRef}
          type="text"
          className={inputClasses}
          value={formatDate(tempSelectedDate)}
          placeholder={placeholder}
          onClick={(e) => {
            e.stopPropagation();
            if (!disabled) setIsOpen(!isOpen);
          }}
          onFocus={handleFocus}
          onBlur={handleBlur}
          readOnly
          disabled={disabled}
        />
        {tempSelectedDate && !disabled && (
          <button
            className={styles.clearBtn}
            onClick={clearDate}
            type="button"
            aria-label="Limpar data"
          >
            ✕
          </button>
        )}
        <span className={styles.calendarIcon}>
          <FontAwesomeIcon icon={time ? faClock : faCalendarAlt} />
        </span>
      </div>

      {helperText && !displayError && (
        <div className={styles.helperText}>{helperText}</div>
      )}
      {displayError && errorMessage && (
        <div className={styles.errorMessage}>{errorMessage}</div>
      )}

      {isOpen &&
        !disabled &&
        typeof document !== "undefined" &&
        createPortal(dropdownContent, document.body)}
    </div>
  );
};