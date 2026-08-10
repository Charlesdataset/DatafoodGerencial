import { faCalendarAlt, faClock } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useEffect, useRef, useState } from "react";
import styles from "./DateRangePicker.module.scss";

interface DateRangePickerProps {
  startDate: Date | null;
  endDate: Date | null;
  onChange: (start: Date | null, end: Date | null) => void;
  placeholderStart?: string;
  placeholderEnd?: string;
  className?: string;
  disabled?: boolean;
  time?: boolean;
  timeFormat?: "12" | "24";
  isForm?: boolean;
}

// ── Drum Picker (igual ao DatePicker) ────────────────────────────────────────
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
  const pointerRef = useRef({ startY: 0, isDragging: false, lastY: 0, vel: 0 });
  const baseValRef = useRef(value);
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
  const startHold = (fn: () => void) => { fn(); holdRef.current = setInterval(fn, 110); };
  const stopHold = () => { if (holdRef.current) { clearInterval(holdRef.current); holdRef.current = null; } };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    baseValRef.current = value;
    pointerRef.current = { startY: e.clientY, isDragging: true, lastY: e.clientY, vel: 0 };
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
    if (Math.abs(vel) > 6) { const extra = Math.round((-vel * 2.5) / DRUM_ITEM_H); if (extra !== 0) onChange(wrap(value + extra)); }
    setSnapping(true);
    setDragPx(0);
  };

  const rawSteps = -dragPx / DRUM_ITEM_H;
  const frac = rawSteps - Math.round(rawSteps);

  return (
    <div className={styles.drumOuter}>
      <span className={styles.drumLabel}>{label}</span>
      <button type="button" className={styles.drumArrow} onPointerDown={() => startHold(() => onChange(wrap(value + 1)))} onPointerUp={stopHold} onPointerLeave={stopHold}>▲</button>
      <div ref={cylinderRef} className={styles.drumCylinder} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp} style={{ touchAction: "none" }}>
        <div className={styles.drumHighlight} />
        <div className={styles.drumFadeTop} />
        <div className={styles.drumFadeBottom} />
        {[-3, -2, -1, 0, 1, 2, 3].map((relIdx) => {
          const displayOffset = relIdx - frac;
          const absD = Math.abs(displayOffset);
          const val = wrap(value + relIdx);
          return (
            <div key={relIdx} className={styles.drumItem} style={{
              transform: `translateY(calc(-50% + ${displayOffset * DRUM_ITEM_H}px)) perspective(500px) rotateX(${-displayOffset * 22}deg)`,
              opacity: Math.max(0, 1 - absD * 0.32),
              transition: snapping && !pointerRef.current.isDragging ? "transform 0.22s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.22s ease" : "none",
              fontWeight: absD < 0.5 ? 700 : 400,
            }}>
              {String(val).padStart(2, "0")}
            </div>
          );
        })}
      </div>
      <button type="button" className={styles.drumArrow} onPointerDown={() => startHold(() => onChange(wrap(value - 1)))} onPointerUp={stopHold} onPointerLeave={stopHold}>▼</button>
    </div>
  );
}
// ─────────────────────────────────────────────────────────────────────────────

export const DateRangePicker = ({
  startDate,
  endDate,
  onChange,
  placeholderStart = "Data inicial",
  placeholderEnd = "Data final",
  className = "",
  disabled = false,
  time = false,
  timeFormat = "24",
  isForm = true
}: DateRangePickerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(new Date());
  const [tempStart, setTempStart] = useState<Date | null>(startDate);
  const [tempEnd, setTempEnd] = useState<Date | null>(endDate);

  // time state — para início e fim
  const [startHours, setStartHours] = useState(startDate?.getHours() ?? 0);
  const [startMinutes, setStartMinutes] = useState(startDate?.getMinutes() ?? 0);
  const [endHours, setEndHours] = useState(endDate?.getHours() ?? 23);
  const [endMinutes, setEndMinutes] = useState(endDate?.getMinutes() ?? 59);

  const dropdownRef = useRef<HTMLDivElement>(null);

  const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const months = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Sync externo
  useEffect(() => {
    setTempStart(startDate);
    if (startDate) { setStartHours(startDate.getHours()); setStartMinutes(startDate.getMinutes()); }
  }, [startDate]);
  useEffect(() => {
    setTempEnd(endDate);
    if (endDate) { setEndHours(endDate.getHours()); setEndMinutes(endDate.getMinutes()); }
  }, [endDate]);

  const mergeTime = (date: Date, h: number, m: number): Date => {
    const d = new Date(date);
    d.setHours(h); d.setMinutes(m); d.setSeconds(0); d.setMilliseconds(0);
    return d;
  };

  const formatDate = (date: Date | null, h?: number, m?: number): string => {
    if (!date) return "";
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    if (time) {
      const hh = String(h ?? date.getHours()).padStart(2, "0");
      const mm = String(m ?? date.getMinutes()).padStart(2, "0");
      return `${day}/${month}/${year} ${hh}:${mm}`;
    }
    return `${day}/${month}/${year}`;
  };

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

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

  const isSameDay = (a: Date, b: Date) =>
    a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();

  const isInRange = (date: Date) => {
    if (!tempStart || !tempEnd) return false;
    return date >= tempStart && date <= tempEnd;
  };
  const isRangeStart = (date: Date) => !!tempStart && isSameDay(date, tempStart);
  const isRangeEnd = (date: Date) => !!tempEnd && isSameDay(date, tempEnd);

  const handleDateClick = (date: Date) => {
    if (!tempStart || (tempStart && tempEnd)) {
      setTempStart(date);
      setTempEnd(null);
    } else {
      if (date < tempStart) {
        setTempEnd(tempStart);
        setTempStart(date);
      } else {
        setTempEnd(date);
      }
    }
  };

  const applyRange = () => {
    const s = tempStart ? mergeTime(tempStart, startHours, startMinutes) : null;
    const e = tempEnd ? mergeTime(tempEnd, endHours, endMinutes) : null;
    onChange(s, e);
    setIsOpen(false);
  };

  const clearRange = () => {
    setTempStart(null);
    setTempEnd(null);
    onChange(null, null);
    setIsOpen(false);
  };

  const prevMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  const nextMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));

  const calendarDays = generateCalendar();
  const displayValue = startDate || endDate
    ? `${formatDate(startDate, startHours, startMinutes) || placeholderStart} - ${formatDate(endDate, endHours, endMinutes) || placeholderEnd}`
    : "";

  return (
    <div className={`${styles.dateRangePickerWrapper} ${className}`} ref={dropdownRef}>
      <div className={styles.dateRangeInputContainer}>
        <input
          type="text"
          className={`${styles.dateRangeInput} ${disabled ? styles.disabled : ""}`}
          value={displayValue}
          placeholder={`${placeholderStart} - ${placeholderEnd}`}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          readOnly
          style={{ height: isForm ? 40 : 35, fontSize: isForm ? 16 : 12 }}

          disabled={disabled}
        />
        {(startDate || endDate) && !disabled && (
          <button className={styles.clearBtn} onClick={clearRange} type="button">✕</button>
        )}
        <span className={styles.calendarIcon}>
          <FontAwesomeIcon icon={time ? faClock : faCalendarAlt} />
        </span>
      </div>

      {isOpen && !disabled && (
        <div className={`${styles.dateRangeDropdown} ${time ? styles.withTime : ""}`}>
          <div className={styles.calendarHeader}>
            <button onClick={prevMonth} className={styles.navBtn}>◀</button>
            <span className={styles.monthYear}>{months[viewDate.getMonth()]} {viewDate.getFullYear()}</span>
            <button onClick={nextMonth} className={styles.navBtn}>▶</button>
          </div>

          <div className={styles.calendarWeekDays}>
            {weekDays.map((day) => <div key={day} className={styles.weekDay}>{day}</div>)}
          </div>

          <div className={styles.calendarDays}>
            {calendarDays.map((date, index) => (
              <div key={index} className={styles.calendarDayCell}>
                {date && (
                  <button
                    className={`${styles.dayBtn}
                      ${isRangeStart(date) ? styles.rangeStart : ""}
                      ${isRangeEnd(date) ? styles.rangeEnd : ""}
                      ${isInRange(date) && !isRangeStart(date) && !isRangeEnd(date) ? styles.inRange : ""}`}
                    onClick={() => handleDateClick(date)}
                    type="button"
                  >
                    {date.getDate()}
                  </button>
                )}
              </div>
            ))}
          </div>

          {time && (
            <div className={styles.timeSection}>
              <div className={styles.timeGroup}>
                <span className={styles.timeGroupLabel}>
                  <FontAwesomeIcon icon={faClock} /> Início
                </span>
                <div className={styles.timeInputs}>
                  <DrumPicker value={startHours} max={timeFormat === "24" ? 24 : 12} label="Hora" onChange={setStartHours} />
                  <span className={styles.timeSeparator}>:</span>
                  <DrumPicker value={startMinutes} max={60} label="Min" onChange={setStartMinutes} />
                </div>
              </div>
              <div className={styles.timeDivider} />
              <div className={styles.timeGroup}>
                <span className={styles.timeGroupLabel}>
                  <FontAwesomeIcon icon={faClock} /> Fim
                </span>
                <div className={styles.timeInputs}>
                  <DrumPicker value={endHours} max={timeFormat === "24" ? 24 : 12} label="Hora" onChange={setEndHours} />
                  <span className={styles.timeSeparator}>:</span>
                  <DrumPicker value={endMinutes} max={60} label="Min" onChange={setEndMinutes} />
                </div>
              </div>
            </div>
          )}

          <div className={styles.calendarFooter}>
            <button onClick={clearRange} className={styles.clearRangeBtn} type="button">Limpar</button>
            <button onClick={applyRange} className={styles.applyBtn} type="button">Aplicar</button>
          </div>
        </div>
      )}
    </div>
  );
};
