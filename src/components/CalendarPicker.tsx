import { useState } from 'react';

interface Props {
  onSelect: (date: string) => void;
  onBack: () => void;
}

function formatDate(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

const MONTH_NAMES = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];
const DAY_NAMES = ['日','月','火','水','木','金','土'];

export function CalendarPicker({ onSelect, onBack }: Props) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const todayStr = formatDate(today.getFullYear(), today.getMonth(), today.getDate());
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  };

  const cells: (number | null)[] = [
    ...Array<null>(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div className="calendar-picker">
      <h2 className="section-title">日付を選択</h2>
      <div className="calendar-nav">
        <button className="nav-btn" onClick={prevMonth}>◀</button>
        <span className="calendar-month">{viewYear}年 {MONTH_NAMES[viewMonth]}</span>
        <button className="nav-btn" onClick={nextMonth}>▶</button>
      </div>
      <div className="calendar-grid">
        {DAY_NAMES.map((d, i) => (
          <div key={d} className={`calendar-dow ${i === 0 ? 'sunday' : ''}`}>{d}</div>
        ))}
        {cells.map((day, i) => {
          if (!day) return <div key={`e-${i}`} />;
          const dateStr = formatDate(viewYear, viewMonth, day);
          const isPast = dateStr < todayStr;
          const isSun = new Date(viewYear, viewMonth, day).getDay() === 0;
          const disabled = isPast || isSun;
          return (
            <button
              key={day}
              className={`calendar-day${disabled ? ' disabled' : ''}${isSun ? ' sunday' : ''}`}
              disabled={disabled}
              onClick={() => onSelect(dateStr)}
            >
              {day}
            </button>
          );
        })}
      </div>
      <button className="btn-back" onClick={onBack}>← 戻る</button>
    </div>
  );
}
