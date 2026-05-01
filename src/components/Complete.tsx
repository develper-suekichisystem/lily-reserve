interface Props {
  reservationId: string;
}

export function Complete({ reservationId }: Props) {
  return (
    <div className="complete">
      <div className="complete-icon">✓</div>
      <h2 className="complete-title">予約が完了しました</h2>
      <p className="complete-message">
        ご予約ありがとうございます。<br />
        LINEにご予約の確認メッセージをお送りしました。
      </p>
      <p className="complete-id">予約番号: {reservationId.slice(0, 8).toUpperCase()}</p>
      <p className="complete-note">
        キャンセルの場合はLINEよりご連絡ください。
      </p>
    </div>
  );
}
