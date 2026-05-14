import type { ReservationState } from '../types';

interface Props {
  state: ReservationState;
  displayName: string;
  pictureUrl: string | null;
  isFirstVisit: boolean;
  onConfirm: () => void;
  onBack: () => void;
  submitting: boolean;
}

export function Confirmation({
  state, displayName, pictureUrl, isFirstVisit, onConfirm, onBack, submitting,
}: Props) {
  function endTimeDisplay(): string | null {
    if (!state.selectedTime || !state.selectedMenu) return null;
    const [h, m] = state.selectedTime.split(':').map(Number);
    const endMins = h * 60 + (m || 0) + state.selectedMenu.customer_duration_minutes;
    const eh = Math.floor(endMins / 60);
    const em = endMins % 60;
    return em === 0 ? `${String(eh).padStart(2, '0')}:00` : `${String(eh).padStart(2, '0')}:${String(em).padStart(2, '0')}`;
  }
  const endTime = endTimeDisplay();

  return (
    <div className="confirmation">
      <h2 className="section-title">予約内容の確認</h2>
      <div className="confirm-card">
        <div className="confirm-row">
          <span className="confirm-label">メニュー</span>
          <span className="confirm-value">{state.selectedMenu?.name}</span>
        </div>
        <div className="confirm-row">
          <span className="confirm-label">料金</span>
          <span className="confirm-value">¥{state.selectedMenu?.price.toLocaleString()}</span>
        </div>
        <div className="confirm-row">
          <span className="confirm-label">日時</span>
          <span className="confirm-value">
            {state.selectedDate?.replace(/-/g, '/')}&nbsp;
            {state.selectedTime}〜{endTime}
          </span>
        </div>
        <div className="confirm-row">
          <span className="confirm-label">予約者</span>
          <span className="confirm-value confirm-value-profile">
            {pictureUrl && (
              <img src={pictureUrl} alt={displayName} className="confirm-avatar" />
            )}
            {displayName}
          </span>
        </div>
        {isFirstVisit && state.referrerName && (
          <div className="confirm-row">
            <span className="confirm-label">紹介者</span>
            <span className="confirm-value">{state.referrerName}</span>
          </div>
        )}
      </div>
      <p className="confirm-note">上記内容でよろしければ予約を確定してください。</p>
      <div className="btn-group">
        <button className="btn-next" onClick={onConfirm} disabled={submitting}>
          {submitting ? '処理中...' : '予約を確定する'}
        </button>
        <button className="btn-back" onClick={onBack} disabled={submitting}>← 戻る</button>
      </div>
    </div>
  );
}
