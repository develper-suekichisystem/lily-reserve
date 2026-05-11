import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import type { AvailableSlot } from '../../types';

const HOURS = Array.from({ length: 10 }, (_, i) => i + 9);

export function ScheduleAdmin() {
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('09:00');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    setLoading(true);
    const { data } = await supabase
      .from('available_slots')
      .select('*')
      .order('date')
      .order('time');
    if (data) setAvailableSlots(data as AvailableSlot[]);
    setLoading(false);
  }

  const today = new Date().toISOString().split('T')[0];

  async function addSlot() {
    if (!newDate) return;
    setSaving(true);
    await supabase.from('available_slots').insert({ date: newDate, time: newTime });
    await fetchData();
    setSaving(false);
  }

  async function removeSlot(id: string) {
    await supabase.from('available_slots').delete().eq('id', id);
    await fetchData();
  }

  if (loading) return <div className="loading">読み込み中...</div>;

  const upcomingSlots = availableSlots.filter(s => s.date >= today);

  return (
    <div className="schedule-admin">
      <section className="schedule-section">
        <h3 className="schedule-heading">予約受付日時の追加</h3>
        <p className="schedule-desc">予約を受け付ける日時を登録します。登録した日時のみ予約可能になります。</p>
        <div className="schedule-add-row">
          <input
            type="date"
            className="schedule-date-input"
            value={newDate}
            min={today}
            onChange={e => setNewDate(e.target.value)}
          />
          <select
            className="schedule-time-select"
            value={newTime}
            onChange={e => setNewTime(e.target.value)}
          >
            {HOURS.map(h => (
              <option key={h} value={`${String(h).padStart(2, '0')}:00`}>
                {h}:00〜{h + 1}:00
              </option>
            ))}
          </select>
          <button
            className="btn-add"
            onClick={addSlot}
            disabled={!newDate || saving}
          >
            追加
          </button>
        </div>

        {upcomingSlots.length > 0 ? (
          <ul className="schedule-list">
            {upcomingSlots.map(s => (
              <li key={s.id} className="schedule-item">
                <span>{s.date.replace(/-/g, '/')} {s.time.slice(0, 5)}</span>
                <button className="btn-remove" onClick={() => removeSlot(s.id)}>削除</button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="schedule-empty">予約受付中の日時はありません</p>
        )}
      </section>
    </div>
  );
}
