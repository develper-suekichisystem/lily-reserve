import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

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
  const [closedDow, setClosedDow] = useState<number[]>([]);
  const [closedDateSet, setClosedDateSet] = useState<Set<string>>(new Set());

  const todayStr = formatDate(today.getFullYear(), today.getMonth(), today.getDate());

  useEffect(() => {
    supabase
      .from('closed_dates')
      .select('type, day_of_week, date')
      .then(({ data }) => {
        if (!data) return;
        setClosedDow(
          data.filter(r => r.type === 'weekly').map(r => r.day_of_week as number)
        );
        setClosedDateSet(
          new Set(data.filter(r => r.type === 'date').map(r => r.date as string))
        );
      });
  }, []);

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
          <div
            key={d}
            className={`calendar-dow${i === 0 ? ' sunday' : i === 6 ? ' saturday' : ''}`}
          >
            {d}
          </div>
        ))}
        {cells.map((day, i) => {
          if (!day) return <div key={`e-${i}`} />;
          const dateStr = formatDate(viewYear, viewMonth, day);
          const isPast = dateStr < todayStr;
          const dow = new Date(viewYear, viewMonth, day).getDay();
          const isSun = dow === 0;
          const isClosed = closedDow.includes(dow) || closedDateSet.has(dateStr);
          const disabled = isPast || isClosed;
          return (
            <button
              key={day}
              className={`calendar-day${isPast ? ' disabled' : isClosed ? ' disabled closed' : ''}${isSun ? ' sunday' : ''}`}
              disabled={disabled}
              title={isClosed && !isPast ? '定休日' : undefined}
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
