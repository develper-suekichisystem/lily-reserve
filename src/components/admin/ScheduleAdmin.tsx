import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import type { ClosedDate, BlockedSlot } from '../../types';

const DAY_NAMES = ['日', '月', '火', '水', '木', '金', '土'];
const HOURS = Array.from({ length: 10 }, (_, i) => i + 9);

export function ScheduleAdmin() {
  const [closedDates, setClosedDates] = useState<ClosedDate[]>([]);
  const [blockedSlots, setBlockedSlots] = useState<BlockedSlot[]>([]);
  const [newDate, setNewDate] = useState('');
  const [newBlockDate, setNewBlockDate] = useState('');
  const [newBlockTime, setNewBlockTime] = useState('09:00');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    setLoading(true);
    const [{ data: cd }, { data: bs }] = await Promise.all([
      supabase.from('closed_dates').select('*').order('type').order('day_of_week').order('date'),
      supabase.from('blocked_slots').select('*').order('date').order('time'),
    ]);
    if (cd) setClosedDates(cd as ClosedDate[]);
    if (bs) setBlockedSlots(bs as BlockedSlot[]);
    setLoading(false);
  }

  const today = new Date().toISOString().split('T')[0];

  const weeklyClosures = closedDates
    .filter(c => c.type === 'weekly')
    .map(c => c.day_of_week as number);

  const dateClosures = closedDates
    .filter(c => c.type === 'date' && (c.date ?? '') >= today);

  async function toggleWeekly(dow: number) {
    setSaving(true);
    if (weeklyClosures.includes(dow)) {
      const item = closedDates.find(c => c.type === 'weekly' && c.day_of_week === dow);
      if (item) await supabase.from('closed_dates').delete().eq('id', item.id);
    } else {
      await supabase.from('closed_dates').insert({ type: 'weekly', day_of_week: dow });
    }
    await fetchData();
    setSaving(false);
  }

  async function addClosedDate() {
    if (!newDate) return;
    setSaving(true);
    await supabase.from('closed_dates').insert({ type: 'date', date: newDate });
    setNewDate('');
    await fetchData();
    setSaving(false);
  }

  async function removeClosedDate(id: string) {
    await supabase.from('closed_dates').delete().eq('id', id);
    await fetchData();
  }

  async function addBlockedSlot() {
    if (!newBlockDate) return;
    setSaving(true);
    await supabase.from('blocked_slots').insert({ date: newBlockDate, time: newBlockTime });
    await fetchData();
    setSaving(false);
  }

  async function removeBlockedSlot(id: string) {
    await supabase.from('blocked_slots').delete().eq('id', id);
    await fetchData();
  }

  if (loading) return <div className="loading">読み込み中...</div>;

  return (
    <div className="schedule-admin">
      {/* 定休曜日 */}
      <section className="schedule-section">
        <h3 className="schedule-heading">定休曜日</h3>
        <p className="schedule-desc">毎週この曜日を休日にします</p>
        <div className="dow-grid">
          {DAY_NAMES.map((name, dow) => {
            const checked = weeklyClosures.includes(dow);
            return (
              <button
                key={dow}
                className={`dow-btn${checked ? ' closed' : ''}`}
                onClick={() => toggleWeekly(dow)}
                disabled={saving}
              >
                {name}
              </button>
            );
          })}
        </div>
      </section>

      {/* 特定の休日 */}
      <section className="schedule-section">
        <h3 className="schedule-heading">特定の休日</h3>
        <p className="schedule-desc">指定した日付を丸1日休日にします</p>
        <div className="schedule-add-row">
          <input
            type="date"
            className="schedule-date-input"
            value={newDate}
            onChange={e => setNewDate(e.target.value)}
          />
          <button
            className="btn-add"
            onClick={addClosedDate}
            disabled={!newDate || saving}
          >
            追加
          </button>
        </div>
        {dateClosures.length > 0 && (
          <ul className="schedule-list">
            {dateClosures.map(c => (
              <li key={c.id} className="schedule-item">
                <span>{c.date?.replace(/-/g, '/')}</span>
                <button className="btn-remove" onClick={() => removeClosedDate(c.id)}>削除</button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 対応不可日時 */}
      <section className="schedule-section">
        <h3 className="schedule-heading">対応不可日時</h3>
        <p className="schedule-desc">特定の日時のみ予約を受け付けないようにします</p>
        <div className="schedule-add-row">
          <input
            type="date"
            className="schedule-date-input"
            value={newBlockDate}
            onChange={e => setNewBlockDate(e.target.value)}
          />
          <select
            className="schedule-time-select"
            value={newBlockTime}
            onChange={e => setNewBlockTime(e.target.value)}
          >
            {HOURS.map(h => (
              <option key={h} value={`${String(h).padStart(2, '0')}:00`}>
                {h}:00〜{h + 1}:00
              </option>
            ))}
          </select>
          <button
            className="btn-add"
            onClick={addBlockedSlot}
            disabled={!newBlockDate || saving}
          >
            追加
          </button>
        </div>
        {blockedSlots.filter(s => s.date >= today).length > 0 && (
          <ul className="schedule-list">
            {blockedSlots.filter(s => s.date >= today).map(s => (
              <li key={s.id} className="schedule-item">
                <span>{s.date.replace(/-/g, '/')} {s.time.slice(0, 5)}</span>
                <button className="btn-remove" onClick={() => removeBlockedSlot(s.id)}>削除</button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
