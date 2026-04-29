import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useLoading } from '../contexts/LoadingContext';

const HOURS = Array.from({ length: 10 }, (_, i) => i + 9); // 9時〜18時

interface Props {
  date: string;
  onSelect: (time: string) => void;
  onBack: () => void;
}

export function TimePicker({ date, onSelect, onBack }: Props) {
  const [bookedTimes, setBookedTimes] = useState<string[]>([]);
  const { withLoading } = useLoading();

  useEffect(() => {
    withLoading(async () => {
      const { data } = await supabase
        .from('reservations')
        .select('time')
        .eq('date', date)
        .eq('status', 'confirmed');
      if (data) setBookedTimes(data.map(r => (r.time as string).slice(0, 5)));
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  const fmt = (h: number) => `${String(h).padStart(2, '0')}:00`;

  return (
    <div className="time-picker">
      <h2 className="section-title">時間を選択</h2>
      <p className="date-label">{date.replace(/-/g, '/')}</p>
      <div className="time-grid">
        {HOURS.map(h => {
          const time = fmt(h);
          const booked = bookedTimes.includes(time);
          return (
            <button
              key={h}
              className={`time-slot ${booked ? 'booked' : 'available'}`}
              disabled={booked}
              onClick={() => onSelect(time)}
            >
              <span>{h}:00〜{h + 1}:00</span>
              <span className="slot-status">{booked ? '×' : '○'}</span>
            </button>
          );
        })}
      </div>
      <button className="btn-back" onClick={onBack}>← 戻る</button>
    </div>
  );
}
