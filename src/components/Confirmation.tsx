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
  const endHour = state.selectedTime
    ? parseInt(state.selectedTime.slice(0, 2)) + 1
    : null;

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
            {state.selectedTime}〜{endHour && `${String(endHour).padStart(2, '0')}:00`}
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
