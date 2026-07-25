import { useState } from 'react';
import { useLoading } from './contexts/LoadingContext';
import { useLiff } from './hooks/useLiff';
import { StepIndicator } from './components/StepIndicator';
import { MenuSelect } from './components/MenuSelect';
import { CalendarPicker } from './components/CalendarPicker';
import { TimePicker } from './components/TimePicker';
import { ReservationForm } from './components/ReservationForm';
import { Confirmation } from './components/Confirmation';
import { Complete } from './components/Complete';
import { AdminPage } from './components/admin/AdminPage';
import { LoadingSpinner } from './components/LoadingSpinner';
import { supabase } from './lib/supabase';
import type { Step, ReservationState, Menu } from './types';

function timeToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + (m || 0);
}

const INITIAL_STATE: ReservationState = {
  selectedMenu: null,
  selectedDate: null,
  selectedTime: null,
  referrerName: '',
};

function ReservationApp() {
  const { isReady, isLoggedIn, userId, displayName, pictureUrl, error } = useLiff();
  const [step, setStep] = useState<Step>('menu');
  const [state, setState] = useState<ReservationState>(INITIAL_STATE);
  const [isFirstVisit, setIsFirstVisit] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [completedId, setCompletedId] = useState('');

  if (!isReady || (!isLoggedIn && !error)) return <LoadingSpinner />;
  if (error)    return <div className="error-screen">エラー: {error}</div>;
  if (!userId)  return <LoadingSpinner />;

  const name = displayName ?? 'ゲスト';
  const { withLoading } = useLoading();

  function update(updates: Partial<ReservationState>) {
    setState(prev => ({ ...prev, ...updates }));
  }

  async function handleMenuSelect(menu: Menu) {
    update({ selectedMenu: menu });
    await withLoading(async () => {
      const { data } = await supabase
        .from('users')
        .select('is_first_visit')
        .eq('line_user_id', userId)
        .maybeSingle();
      setIsFirstVisit(data ? (data.is_first_visit as boolean) : true);
    });
    setStep('calendar');
  }

  function handleTimeSelect(time: string) {
    update({ selectedTime: time });
    // 初回以外は入力フォームをスキップして確認へ
    setStep(isFirstVisit ? 'form' : 'confirm');
  }

  async function handleConfirm() {
    if (!state.selectedMenu || !state.selectedDate || !state.selectedTime) return;
    const menu = state.selectedMenu;
    const date = state.selectedDate;
    const time = state.selectedTime;
    setSubmitting(true);

    await withLoading(async () => { try {
      // 当日以前の予約は受け付けない
      const now = new Date();
      const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      const minDate = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;
      if (date < minDate) throw new Error('当日のご予約はお受けできません。翌日以降の日付をお選びください。');

      // ユーザーをupsert（LINEの名前を保存）
      const { data: user, error: ue } = await supabase
        .from('users')
        .upsert(
          { line_user_id: userId, name },
          { onConflict: 'line_user_id' }
        )
        .select()
        .single();
      if (ue || !user) throw new Error('ユーザー登録に失敗しました');

      // 二重予約チェック（provider_duration_minutes で重複判定）
      const newStart = timeToMinutes(time);
      const newDuration = menu.provider_duration_minutes;
      const { data: existingReservations } = await supabase
        .from('reservations')
        .select('time, menu:menus(provider_duration_minutes)')
        .eq('date', date)
        .eq('status', 'confirmed');
      const hasConflict = (existingReservations ?? []).some((r: any) => {
        const rStart = timeToMinutes((r.time as string).slice(0, 5));
        const rDuration = r.menu?.provider_duration_minutes ?? 60;
        return newStart < rStart + rDuration && rStart < newStart + newDuration;
      });
      if (hasConflict) throw new Error('この時間はすでに予約されています。別の時間をお選びください。');

      // 予約作成
      const { data: reservation, error: re } = await supabase
        .from('reservations')
        .insert({
          user_id: user.id,
          menu_id: menu.id,
          date,
          time,
          referrer_name: state.referrerName || null,
        })
        .select()
        .single();
      if (re || !reservation) throw new Error('予約の作成に失敗しました');

      // 初回フラグ更新
      if (isFirstVisit) {
        await supabase
          .from('users')
          .update({ is_first_visit: false })
          .eq('line_user_id', userId);
      }

      // LINE通知（失敗しても予約は成功扱い）
      fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          userName: name,
          menuName: menu.name,
          date,
          time,
          reservationId: reservation.id,
          customerDurationMinutes: menu.customer_duration_minutes,
        }),
      }).catch(console.error);

      setCompletedId(reservation.id as string);
      setStep('complete');
    } catch (err) {
      alert(err instanceof Error ? err.message : '予約に失敗しました');
    } finally {
      setSubmitting(false);
    } });
  }

  // 確認画面から戻る先（初回 → form、それ以外 → time）
  const backFromConfirm = () => setStep(isFirstVisit ? 'form' : 'time');

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">Lily予約画面</h1>
        <p className="app-subtitle">リンパケアセラピスト施術</p>
      </header>

      {step !== 'complete' && <StepIndicator currentStep={step} />}

      <main className="app-main">
        {step === 'menu' && (
          <MenuSelect onSelect={handleMenuSelect} />
        )}
        {step === 'calendar' && (
          <CalendarPicker
            onSelect={date => { update({ selectedDate: date }); setStep('time'); }}
            onBack={() => setStep('menu')}
          />
        )}
        {step === 'time' && state.selectedDate && state.selectedMenu && (
          <TimePicker
            date={state.selectedDate}
            menu={state.selectedMenu}
            onSelect={handleTimeSelect}
            onBack={() => setStep('calendar')}
          />
        )}
        {step === 'form' && (
          <ReservationForm
            state={state}
            isFirstVisit={isFirstVisit}
            displayName={name}
            pictureUrl={pictureUrl}
            onChange={update}
            onNext={() => setStep('confirm')}
            onBack={() => setStep('time')}
          />
        )}
        {step === 'confirm' && (
          <Confirmation
            state={state}
            displayName={name}
            pictureUrl={pictureUrl}
            isFirstVisit={isFirstVisit}
            onConfirm={handleConfirm}
            onBack={backFromConfirm}
            submitting={submitting}
          />
        )}
        {step === 'complete' && (
          <Complete reservationId={completedId} />
        )}
      </main>
    </div>
  );
}

export default function App() {
  if (window.location.pathname === '/admin') return <AdminPage />;
  return <ReservationApp />;
}
