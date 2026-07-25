import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { MenuAdmin } from './MenuAdmin';
import { ScheduleAdmin } from './ScheduleAdmin';
import { AdminLogin, isAdminAuthenticated } from './AdminLogin';
import type { Reservation, ServiceType } from '../../types';

type AdminTab = 'reservations' | 'menus' | 'schedule';
type ServiceFilter = 'all' | ServiceType;

const MONTH_NAMES = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];
const DAY_NAMES = ['日','月','火','水','木','金','土'];

// リンパ・カウンセラーはDBを共用しているため、予約一覧では両方を表示する
const SERVICE_LABELS: Record<ServiceType, string> = {
  rinpa: 'リンパ',
  counselor: 'カウンセリング',
};

const SERVICE_FILTERS: { value: ServiceFilter; label: string }[] = [
  { value: 'all',       label: 'すべて' },
  { value: 'rinpa',     label: 'リンパ' },
  { value: 'counselor', label: 'カウンセリング' },
];

// service_type 未設定の古いメニューはリンパ扱い
function serviceOf(r: Reservation): ServiceType {
  return r.menu?.service_type === 'counselor' ? 'counselor' : 'rinpa';
}

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function ReservationAdmin() {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth()); // 0-11
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [serviceFilter, setServiceFilter] = useState<ServiceFilter>('all');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchReservations();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewYear, viewMonth]);

  async function fetchReservations() {
    setLoading(true);
    const from = `${viewYear}-${pad(viewMonth + 1)}-01`;
    const lastDay = new Date(viewYear, viewMonth + 1, 0).getDate();
    const to = `${viewYear}-${pad(viewMonth + 1)}-${pad(lastDay)}`;
    const query = (select: string) =>
      supabase
        .from('reservations')
        .select(select)
        .gte('date', from)
        .lte('date', to)
        .eq('status', 'confirmed')
        .order('date')
        .order('time');

    // locations はカウンセラー側で追加されたテーブル。未適用のDBでも一覧が壊れないようフォールバックする
    let { data, error } = await query('*, user:users(*), menu:menus(*), location:locations(*)');
    if (error) {
      ({ data } = await query('*, user:users(*), menu:menus(*)'));
    }
    setReservations((data ?? []) as unknown as Reservation[]);
    setLoading(false);
  }

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  };

  const visible = serviceFilter === 'all'
    ? reservations
    : reservations.filter(r => serviceOf(r) === serviceFilter);

  // 日付ごとにグルーピング（取得時点で date, time 順にソート済み）
  const groups: { date: string; items: Reservation[] }[] = [];
  for (const r of visible) {
    const date = r.date as string;
    const last = groups[groups.length - 1];
    if (last && last.date === date) last.items.push(r);
    else groups.push({ date, items: [r] });
  }

  function formatGroupDate(date: string) {
    const [, m, d] = date.split('-').map(Number);
    const dow = DAY_NAMES[new Date(date + 'T00:00:00').getDay()];
    return `${m}月${d}日（${dow}）`;
  }

  async function cancelReservation(id: string) {
    if (!confirm('この予約をキャンセルしますか？')) return;
    await supabase.from('reservations').update({ status: 'cancelled' }).eq('id', id);
    fetchReservations();
  }

  return (
    <>
      <div className="admin-month-nav">
        <button className="nav-btn" onClick={prevMonth}>◀</button>
        <span className="admin-month">{viewYear}年 {MONTH_NAMES[viewMonth]}</span>
        <button className="nav-btn" onClick={nextMonth}>▶</button>
      </div>

      <div className="admin-filter">
        {SERVICE_FILTERS.map(f => (
          <button
            key={f.value}
            className={`admin-filter-btn${serviceFilter === f.value ? ' active' : ''}`}
            onClick={() => setServiceFilter(f.value)}
          >
            {f.label}
            <span className="admin-filter-count">
              {f.value === 'all'
                ? reservations.length
                : reservations.filter(r => serviceOf(r) === f.value).length}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading">読み込み中...</div>
      ) : visible.length === 0 ? (
        <p className="no-data">この月の予約はありません</p>
      ) : (
        groups.map(g => (
        <div key={g.date} className="admin-day-group">
          <div className="admin-day-header">
            {formatGroupDate(g.date)}
            <span className="admin-day-count">{g.items.length}件</span>
          </div>
        <div className="admin-list">
          {g.items.map(r => (
            <div key={r.id} className={`admin-card service-${serviceOf(r)}`}>
              <div className="admin-time">{(r.time as string).slice(0, 5)}</div>
              <div className="admin-info">
                <div className="admin-name">
                  {r.user?.name}
                  <span className={`admin-service-badge service-${serviceOf(r)}`}>
                    {SERVICE_LABELS[serviceOf(r)]}
                  </span>
                </div>
                <div className="admin-menu">{r.menu?.name}</div>
                <div className="admin-contact">
                  {r.user?.phone && <span>{r.user.phone}</span>}
                  {r.user?.email && <span>{r.user.email}</span>}
                </div>
                {r.location && (
                  <div className="admin-location">場所: {r.location.name}（{r.location.address}）</div>
                )}
                {r.location_note && (
                  <div className="admin-location">場所メモ: {r.location_note}</div>
                )}
                {r.referrer_name && (
                  <div className="admin-referrer">紹介者: {r.referrer_name}</div>
                )}
              </div>
              <button className="btn-cancel" onClick={() => cancelReservation(r.id)}>
                キャンセル
              </button>
            </div>
          ))}
        </div>
        </div>
        ))
      )}
    </>
  );
}

export function AdminPage() {
  const [authed, setAuthed] = useState(isAdminAuthenticated());
  const [tab, setTab] = useState<AdminTab>('reservations');

  if (!authed) return <AdminLogin onLogin={() => setAuthed(true)} />;

  return (
    <div className="admin-page">
      <header className="app-header">
        <h1 className="app-title">Lily予約画面</h1>
        <p className="app-subtitle">管理画面</p>
      </header>

      <div className="admin-tabs">
        <button
          className={`admin-tab${tab === 'reservations' ? ' active' : ''}`}
          onClick={() => setTab('reservations')}
        >
          予約一覧
        </button>
        <button
          className={`admin-tab${tab === 'menus' ? ' active' : ''}`}
          onClick={() => setTab('menus')}
        >
          メニュー管理
        </button>
        <button
          className={`admin-tab${tab === 'schedule' ? ' active' : ''}`}
          onClick={() => setTab('schedule')}
        >
          受付設定
        </button>
      </div>

      <div className="admin-content">
        {tab === 'reservations' && <ReservationAdmin />}
        {tab === 'menus' && <MenuAdmin />}
        {tab === 'schedule' && <ScheduleAdmin />}
      </div>
    </div>
  );
}
