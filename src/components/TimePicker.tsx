import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useLoading } from '../contexts/LoadingContext';
import type { Menu } from '../types';

interface ReservationWithMenu {
  time: string;
  menu: { provider_duration_minutes: number } | null;
}

interface Props {
  date: string;
  menu: Menu;
  onSelect: (time: string) => void;
  onBack: () => void;
}

function timeToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + (m || 0);
}

function endTimeDisplay(startHHMM: string, durationMinutes: number): string {
  const endMins = timeToMinutes(startHHMM) + durationMinutes;
  const eh = Math.floor(endMins / 60);
  const em = endMins % 60;
  return em === 0 ? `${eh}:00` : `${eh}:${String(em).padStart(2, '0')}`;
}

export function TimePicker({ date, menu, onSelect, onBack }: Props) {
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [reservations, setReservations] = useState<ReservationWithMenu[]>([]);
  const { withLoading } = useLoading();

  useEffect(() => {
    withLoading(async () => {
      const [{ data: slotData }, { data: reservData }] = await Promise.all([
        supabase
          .from('available_slots')
          .select('time')
          .eq('date', date)
          .order('time'),
        supabase
          .from('reservations')
          .select('time, menu:menus(provider_duration_minutes)')
          .eq('date', date)
          .eq('status', 'confirmed'),
      ]);
      setAvailableTimes(slotData?.map(r => (r.time as string).slice(0, 5)) ?? []);
      setReservations((reservData ?? []) as ReservationWithMenu[]);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  const newProviderDuration = menu.provider_duration_minutes;
  const newCustomerDuration = menu.customer_duration_minutes;
  // provider_duration_minutes が何時間枠分必要か
  const slotsNeeded = Math.ceil(newProviderDuration / 60);
  const availableSet = new Set(availableTimes);

  function isSlotBookable(slotTime: string): boolean {
    const h = parseInt(slotTime.slice(0, 2));

    // 必要な連続時間枠がすべて available_slots に存在するか確認
    const allSlotsAvailable = Array.from({ length: slotsNeeded }, (_, i) =>
      `${String(h + i).padStart(2, '0')}:00`
    ).every(t => availableSet.has(t));
    if (!allSlotsAvailable) return false;

    // 既存予約との重複チェック（provider_duration_minutes ベースの分単位判定）
    const slotMins = timeToMinutes(slotTime);
    const hasConflict = reservations.some(r => {
      const rMins = timeToMinutes((r.time as string).slice(0, 5));
      const rDuration = r.menu?.provider_duration_minutes ?? 60;
      return slotMins < rMins + rDuration && rMins < slotMins + newProviderDuration;
    });
    return !hasConflict;
  }

  return (
    <div className="time-picker">
      <h2 className="section-title">時間を選択</h2>
      <p className="date-label">{date.replace(/-/g, '/')}</p>
      {availableTimes.length === 0 ? (
        <p className="schedule-empty">この日の受付可能な時間帯はありません</p>
      ) : (
        <div className="time-grid">
          {availableTimes.map(time => {
            const bookable = isSlotBookable(time);
            return (
              <button
                key={time}
                className={`time-slot ${bookable ? 'available' : 'booked'}`}
                disabled={!bookable}
                onClick={() => onSelect(time)}
              >
                <span>{time}〜{endTimeDisplay(time, newCustomerDuration)}</span>
                <span className="slot-status">{bookable ? '○' : '×'}</span>
              </button>
            );
          })}
        </div>
      )}
      <button className="btn-back" onClick={onBack}>← 戻る</button>
    </div>
  );
}
