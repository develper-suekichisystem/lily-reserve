import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import type { AvailableSlot } from '../../types';

const HOURS = Array.from({ length: 10 }, (_, i) => i + 9);
const MONTH_NAMES = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];
const DAY_NAMES = ['日','月','火','水','木','金','土'];

function formatDate(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

// ── インラインカレンダー ──────────────────────────────────────────
interface CalendarProps {
  selected: string;
  onSelect: (date: string) => void;
}

function InlineCalendar({ selected, onSelect }: CalendarProps) {
  const today = new Date();
  const todayStr = formatDate(today.getFullYear(), today.getMonth(), today.getDate());
  const [viewYear, setViewYear] = useState(
    selected ? parseInt(selected.slice(0, 4)) : today.getFullYear()
  );
  const [viewMonth, setViewMonth] = useState(
    selected ? parseInt(selected.slice(5, 7)) - 1 : today.getMonth()
  );

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const cells: (number | null)[] = [
    ...Array<null>(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  };

  return (
    <div className="inline-calendar">
      <div className="calendar-nav">
        <button className="nav-btn" onClick={prevMonth}>◀</button>
        <span className="calendar-month">{viewYear}年 {MONTH_NAMES[viewMonth]}</span>
        <button className="nav-btn" onClick={nextMonth}>▶</button>
      </div>
      <div className="calendar-grid">
        {DAY_NAMES.map((d, i) => (
          <div key={d} className={`calendar-dow${i === 0 ? ' sunday' : i === 6 ? ' saturday' : ''}`}>{d}</div>
        ))}
        {cells.map((day, i) => {
          if (!day) return <div key={`e-${i}`} />;
          const dateStr = formatDate(viewYear, viewMonth, day);
          const isPast = dateStr < todayStr;
          const isSelected = dateStr === selected;
          const dow = new Date(viewYear, viewMonth, day).getDay();
          return (
            <button
              key={day}
              className={`calendar-day${isPast ? ' disabled' : ''}${isSelected ? ' selected' : ''}${dow === 0 ? ' sunday' : ''}`}
              disabled={isPast}
              onClick={() => onSelect(dateStr)}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── メインコンポーネント ──────────────────────────────────────────
type Mode = 'list' | 'edit';

export function ScheduleAdmin() {
  const [mode, setMode] = useState<Mode>('list');
  const [allSlots, setAllSlots] = useState<AvailableSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // 編集モード用
  const today = new Date().toISOString().split('T')[0];
  const [editDate, setEditDate] = useState(today);
  // 選択中の時間帯（HH:00 形式）
  const [selectedTimes, setSelectedTimes] = useState<Set<string>>(new Set());

  useEffect(() => { fetchSlots(); }, []);

  async function fetchSlots() {
    setLoading(true);
    const { data } = await supabase
      .from('available_slots')
      .select('*')
      .gte('date', today)
      .order('date')
      .order('time');
    if (data) setAllSlots(data as AvailableSlot[]);
    setLoading(false);
  }

  // 日付選択時：既存の登録済み時間を selectedTimes に反映
  async function handleDateSelect(date: string) {
    setEditDate(date);
    const { data } = await supabase
      .from('available_slots')
      .select('time')
      .eq('date', date);
    const times = new Set((data ?? []).map(r => (r.time as string).slice(0, 5)));
    setSelectedTimes(times);
  }

  function toggleTime(time: string) {
    setSelectedTimes(prev => {
      const next = new Set(prev);
      if (next.has(time)) next.delete(time);
      else next.add(time);
      return next;
    });
  }

  async function saveSlots() {
    setSaving(true);
    // 既存を削除してから再挿入（upsert代わり）
    await supabase.from('available_slots').delete().eq('date', editDate);
    if (selectedTimes.size > 0) {
      const rows = [...selectedTimes].map(t => ({ date: editDate, time: `${t}:00` }));
      await supabase.from('available_slots').insert(rows);
    }
    await fetchSlots();
    setSaving(false);
    setMode('list');
  }

  async function removeSlot(id: string) {
    await supabase.from('available_slots').delete().eq('id', id);
    await fetchSlots();
  }

  // 月別グループ化
  const groupedByMonth: Record<string, AvailableSlot[]> = {};
  for (const slot of allSlots) {
    const key = slot.date.slice(0, 7); // YYYY-MM
    if (!groupedByMonth[key]) groupedByMonth[key] = [];
    groupedByMonth[key].push(slot);
  }

  if (loading) return <div className="loading">読み込み中...</div>;

  // ── 一覧モード ──
  if (mode === 'list') {
    return (
      <div className="schedule-admin">
        <div className="schedule-header-row">
          <button
            className="btn-primary"
            onClick={() => { setEditDate(today); setSelectedTimes(new Set()); setMode('edit'); }}
          >
            ＋ 予約受付時間を設定する
          </button>
        </div>

        {Object.keys(groupedByMonth).length === 0 ? (
          <p className="schedule-empty">予約受付中の日時はありません</p>
        ) : (
          Object.entries(groupedByMonth).map(([ym, slots]) => {
            const [y, m] = ym.split('-');
            return (
              <section key={ym} className="schedule-month-group">
                <h3 className="schedule-month-heading">{y}年 {MONTH_NAMES[parseInt(m) - 1]}</h3>
                {/* 日付別にまとめて表示 */}
                {Object.entries(
                  slots.reduce<Record<string, AvailableSlot[]>>((acc, s) => {
                    if (!acc[s.date]) acc[s.date] = [];
                    acc[s.date].push(s);
                    return acc;
                  }, {})
                ).map(([date, daySlots]) => (
                  <div key={date} className="schedule-day-row">
                    <span className="schedule-day-label">
                      {date.replace(/-/g, '/')}（{DAY_NAMES[new Date(date).getDay()]}）
                    </span>
                    <div className="schedule-time-chips">
                      {daySlots.map(s => (
                        <span key={s.id} className="schedule-chip">
                          {s.time.slice(0, 5)}
                          <button
                            className="chip-remove"
                            onClick={() => removeSlot(s.id)}
                            title="削除"
                          >×</button>
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </section>
            );
          })
        )}
      </div>
    );
  }

  // ── 設定モード ──
  const fmt = (h: number) => `${String(h).padStart(2, '0')}:00`;

  return (
    <div className="schedule-admin">
      <button className="btn-back" onClick={() => setMode('list')}>← 一覧に戻る</button>
      <h3 className="schedule-heading">予約受付時間の設定</h3>
      <p className="schedule-desc">カレンダーで日付を選び、受付する時間帯をタップして保存してください。</p>

      <InlineCalendar selected={editDate} onSelect={handleDateSelect} />

      {editDate && (
        <>
          <p className="edit-date-label">
            {editDate.replace(/-/g, '/')}（{DAY_NAMES[new Date(editDate).getDay()]}）の受付時間
          </p>
          <div className="time-toggle-grid">
            {HOURS.map(h => {
              const time = fmt(h);
              const on = selectedTimes.has(time);
              return (
                <button
                  key={h}
                  className={`time-toggle-btn${on ? ' on' : ''}`}
                  onClick={() => toggleTime(time)}
                >
                  {h}:00〜{h + 1}:00
                </button>
              );
            })}
          </div>
          <button
            className="btn-save"
            onClick={saveSlots}
            disabled={saving}
          >
            {saving ? '保存中...' : '保存する'}
          </button>
        </>
      )}
    </div>
  );
}
