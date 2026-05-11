import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useLoading } from '../contexts/LoadingContext';

interface Props {
  date: string;
  onSelect: (time: string) => void;
  onBack: () => void;
}

export function TimePicker({ date, onSelect, onBack }: Props) {
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [reservedTimes, setReservedTimes] = useState<string[]>([]);
  const { withLoading } = useLoading();

  useEffect(() => {
    withLoading(async () => {
      const [{ data: slotData }, { data: reservData }] = await Promise.all([
        supabase
          .from('available_slots')
          .select('time')
          .eq('date', date),
        supabase
          .from('reservations')
          .select('time')
          .eq('date', date)
          .eq('status', 'confirmed'),
      ]);
      setAvailableTimes(slotData?.map(r => (r.time as string).slice(0, 5)) ?? []);
      setReservedTimes(reservData?.map(r => (r.time as string).slice(0, 5)) ?? []);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  return (
    <div className="time-picker">
      <h2 className="section-title">時間を選択</h2>
      <p className="date-label">{date.replace(/-/g, '/')}</p>
      {availableTimes.length === 0 ? (
        <p className="schedule-empty">この日の受付可能な時間帯はありません</p>
      ) : (
        <div className="time-grid">
          {availableTimes.map(time => {
            const h = parseInt(time.slice(0, 2));
            const booked = reservedTimes.includes(time);
            return (
              <button
                key={time}
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
      )}
      <button className="btn-back" onClick={onBack}>← 戻る</button>
    </div>
  );
}
