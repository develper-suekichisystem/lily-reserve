import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { MenuAdmin } from './MenuAdmin';
import { AdminLogin, isAdminAuthenticated } from './AdminLogin';
import type { Reservation } from '../../types';

type AdminTab = 'reservations' | 'menus';

function ReservationAdmin() {
  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchReservations();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

  async function fetchReservations() {
    setLoading(true);
    const { data } = await supabase
      .from('reservations')
      .select(`*, user:users(*), menu:menus(*)`)
      .eq('date', selectedDate)
      .eq('status', 'confirmed')
      .order('time');
    if (data) setReservations(data as Reservation[]);
    setLoading(false);
  }

  async function cancelReservation(id: string) {
    if (!confirm('この予約をキャンセルしますか？')) return;
    await supabase.from('reservations').update({ status: 'cancelled' }).eq('id', id);
    fetchReservations();
  }

  return (
    <>
      <div className="admin-date-picker">
        <label>日付：</label>
        <input
          type="date"
          value={selectedDate}
          onChange={e => setSelectedDate(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="loading">読み込み中...</div>
      ) : reservations.length === 0 ? (
        <p className="no-data">この日の予約はありません</p>
      ) : (
        <div className="admin-list">
          {reservations.map(r => (
            <div key={r.id} className="admin-card">
              <div className="admin-time">{(r.time as string).slice(0, 5)}</div>
              <div className="admin-info">
                <div className="admin-name">{r.user?.name}</div>
                <div className="admin-menu">{r.menu?.name}</div>
                <div className="admin-contact">
                  <span>{r.user?.phone}</span>
                  <span>{r.user?.email}</span>
                </div>
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
      )}
    </>
  );
}

export function AdminPage() {
  const [authed, setAuthed] = useState(isAdminAuthenticated());
  const [tab, setTab] = useState<AdminTab>('reservations');

  if (!authed) return <AdminLogin onLogin={() => setAuthed(true)} />;

  function handleLogout() {
    sessionStorage.removeItem('rinpa_admin_auth');
    setAuthed(false);
  }

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
        <button className="admin-tab admin-tab-logout" onClick={handleLogout}>
          ログアウト
        </button>
      </div>

      <div className="admin-content">
        {tab === 'reservations' && <ReservationAdmin />}
        {tab === 'menus' && <MenuAdmin />}
      </div>
    </div>
  );
}
