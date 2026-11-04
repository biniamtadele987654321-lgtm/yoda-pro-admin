import { ChevronLeft, ChevronRight, Clock3, X } from "lucide-react";
import { useEffect, useState } from "react";

const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
const weekDays = ["S", "M", "T", "W", "T", "F", "S"];

function pad(value) {
  return String(value).padStart(2, "0");
}

function parseDateTime(value) {
  if (!value) return null;
  const parsed = new Date(value.replace(" ", "T"));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatValue(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function formatHeading(date) {
  const weekday = date.toLocaleDateString("en-US", { weekday: "long" });
  return `${weekday}, ${monthNames[date.getMonth()]} ${date.getDate()} ${date.getFullYear()}`;
}

function getCalendarDays(date) {
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
  const start = new Date(date.getFullYear(), date.getMonth(), 1 - firstDay.getDay());
  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    return day;
  });
}

function ClockDial({ values, selected, onSelect, type }) {
  const isHour = type === "hour";
  const outerValues = isHour ? [0, ...Array.from({ length: 11 }, (_, index) => index + 13)] : [];
  const innerValues = isHour ? Array.from({ length: 12 }, (_, index) => index === 0 ? 12 : index) : values;
  const selectedPosition = isHour
    ? (selected === 0 || selected > 12
      ? { ring: "outer", index: selected === 0 ? 0 : selected - 12 }
      : { ring: "inner", index: selected % 12 })
    : { ring: "inner", index: selected / 5 };
  const items = [
    ...outerValues.map((value, index) => ({ value, ring: "outer", index })),
    ...innerValues.map((value, index) => ({ value, ring: "inner", index })),
  ];
  const handAngle = (selectedPosition.index / 12) * 360 - 90;
  const handLength = selectedPosition.ring === "outer" ? 97 : 70;

  return (
    <div className={`datetime-clock datetime-clock-${type}`} role="group" aria-label={isHour ? "Choose hour" : "Choose minute"}>
      <div className="datetime-clock-face">
        <div className="datetime-clock-hand" style={{ height: `${handLength}px`, transform: `rotate(${handAngle + 90}deg)` }} />
        <span className="datetime-clock-center" />
        {items.map(({ value, ring, index }) => {
          const angle = (index / 12) * Math.PI * 2 - Math.PI / 2;
          const radius = ring === "outer" ? 101 : 72;
          const isSelected = selected === value;
          return (
            <button
              type="button"
              key={value}
              className={`datetime-clock-value${isSelected ? " datetime-clock-value-selected" : ""}`}
              style={{ left: `calc(50% + ${Math.cos(angle) * radius}px)`, top: `calc(50% + ${Math.sin(angle) * radius}px)` }}
              aria-pressed={isSelected}
              onClick={() => onSelect(value)}
            >
              {isHour ? value : pad(value)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function DateTimePickerModal({ id = "news-date", label = "News Date", value = "", onChange }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState("date");
  const [selectedDate, setSelectedDate] = useState(() => parseDateTime(value) || new Date());
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const date = parseDateTime(value) || new Date();
    return new Date(date.getFullYear(), date.getMonth(), 1);
  });
  const [selectedHour, setSelectedHour] = useState(() => (parseDateTime(value) || new Date()).getHours());
  const [selectedMinute, setSelectedMinute] = useState(() => Math.round((parseDateTime(value) || new Date()).getMinutes() / 5) * 5 % 60);
  const selectedDateTime = new Date(selectedDate);
  selectedDateTime.setHours(selectedHour, selectedMinute, 0, 0);
  const parsedValue = parseDateTime(value);
  const displayValue = parsedValue ? formatValue(parsedValue) : "";

  useEffect(() => {
    if (!open) return undefined;
    function handleKeyDown(event) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  function showPicker() {
    const current = parseDateTime(value) || new Date();
    setSelectedDate(current);
    setVisibleMonth(new Date(current.getFullYear(), current.getMonth(), 1));
    setSelectedHour(current.getHours());
    setSelectedMinute(Math.floor(current.getMinutes() / 5) * 5);
    setStep("date");
    setOpen(true);
  }

  function closePicker() {
    setOpen(false);
  }

  function chooseDate(day) {
    setSelectedDate((current) => new Date(day.getFullYear(), day.getMonth(), day.getDate(), current.getHours(), current.getMinutes(), 0, 0));
    setVisibleMonth(new Date(day.getFullYear(), day.getMonth(), 1));
  }

  function confirmStep() {
    if (step === "date") {
      setStep("hour");
      return;
    }
    if (step === "hour") {
      setStep("minute");
      return;
    }
    onChange(formatValue(selectedDateTime));
    closePicker();
  }

  const calendarDays = getCalendarDays(visibleMonth);
  const today = new Date();
  const hours = Array.from({ length: 24 }, (_, hour) => hour);
  const minutes = Array.from({ length: 12 }, (_, index) => index * 5);

  return (
    <div className="datetime-picker">
      <label htmlFor={id}>{label}<span className="required"> *</span></label>
      <div className="datetime-picker-input-wrap">
        <input
          className="text-input"
          id={id}
          type="text"
          readOnly
          value={displayValue}
          placeholder={label}
          aria-haspopup="dialog"
          onClick={showPicker}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              showPicker();
            }
          }}
        />
        <button type="button" aria-label={`Choose ${label}`} onClick={showPicker}><Clock3 size={16} /></button>
      </div>
      {open && <div className="datetime-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) closePicker(); }}>
        <section className="datetime-modal" role="dialog" aria-modal="true" aria-labelledby="datetime-modal-title">
          <header className="datetime-modal-header">
            <button type="button" className="datetime-modal-close" aria-label="Close date picker" onClick={closePicker}><X size={18} /></button>
            <div className="datetime-modal-date">{formatHeading(selectedDate)}</div>
            <h2 id="datetime-modal-title">{step === "date" ? "Select date" : step === "hour" ? "Select hour" : "Select minute"}</h2>
            {step !== "date" && <div className="datetime-modal-time">{pad(selectedHour)}:{pad(selectedMinute)}</div>}
          </header>

          {step === "date" && <div className="datetime-calendar">
            <div className="datetime-calendar-month">
              <button type="button" aria-label="Previous month" onClick={() => setVisibleMonth((month) => new Date(month.getFullYear(), month.getMonth() - 1, 1))}><ChevronLeft size={18} /></button>
              <strong>{visibleMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</strong>
              <button type="button" aria-label="Next month" onClick={() => setVisibleMonth((month) => new Date(month.getFullYear(), month.getMonth() + 1, 1))}><ChevronRight size={18} /></button>
            </div>
            <div className="datetime-calendar-grid">
              {weekDays.map((day, index) => <span className="datetime-calendar-weekday" key={`${day}-${index}`}>{day}</span>)}
              {calendarDays.map((day) => {
                const isSelected = day.toDateString() === selectedDate.toDateString();
                const isToday = day.toDateString() === today.toDateString();
                const isCurrentMonth = day.getMonth() === visibleMonth.getMonth();
                return (
                  <button
                    type="button"
                    key={day.toISOString()}
                    className={`datetime-calendar-day${isSelected ? " datetime-calendar-day-selected" : ""}${isToday ? " datetime-calendar-day-today" : ""}${!isCurrentMonth ? " datetime-calendar-day-muted" : ""}`}
                    aria-pressed={isSelected}
                    onClick={() => chooseDate(day)}
                  >
                    {day.getDate()}
                  </button>
                );
              })}
            </div>
          </div>}

          {step === "hour" && <div className="datetime-clock-step">
            <div className="datetime-clock-readout"><span className="datetime-clock-readout-active">{pad(selectedHour)}</span><span>:</span><span>{pad(selectedMinute)}</span></div>
            <ClockDial type="hour" values={hours} selected={selectedHour} onSelect={setSelectedHour} />
          </div>}

          {step === "minute" && <div className="datetime-clock-step">
            <div className="datetime-clock-readout"><span>{pad(selectedHour)}</span><span>:</span><span className="datetime-clock-readout-active">{pad(selectedMinute)}</span></div>
            <ClockDial type="minute" values={minutes} selected={selectedMinute} onSelect={setSelectedMinute} />
          </div>}

          <footer className="datetime-modal-actions">
            {step !== "date" ? <button type="button" className="datetime-back-button" onClick={() => setStep(step === "hour" ? "date" : "hour")}>BACK</button> : <span />}
            <div>
              <button type="button" className="datetime-cancel-button" onClick={closePicker}>CANCEL</button>
              <button type="button" className="datetime-confirm-button" onClick={confirmStep}>OK</button>
            </div>
          </footer>
        </section>
      </div>}
    </div>
  );
}
