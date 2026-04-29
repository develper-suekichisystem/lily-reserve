interface Props {
  variant?: 'full' | 'overlay';
}

const SPARKLES = [
  { top: '12%', left: '12%', delay: '0s',   size: '14px' },
  { top: '8%',  left: '68%', delay: '0.5s', size: '10px' },
  { top: '28%', left: '88%', delay: '0.9s', size: '16px' },
  { top: '55%', left: '6%',  delay: '0.3s', size: '12px' },
  { top: '72%', left: '82%', delay: '0.7s', size: '10px' },
  { top: '42%', left: '4%',  delay: '1.2s', size: '8px'  },
  { top: '18%', left: '50%', delay: '1.5s', size: '12px' },
];

function PrincessSvg({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 100 190" className="princess-svg" xmlns="http://www.w3.org/2000/svg">
      {/* 王冠 */}
      <polygon points="33,30 41,14 50,23 59,14 67,30" fill={color} />
      <circle cx="41" cy="14" r="3" fill={color} />
      <circle cx="50" cy="10" r="3" fill={color} />
      <circle cx="59" cy="14" r="3" fill={color} />
      {/* 頭 */}
      <ellipse cx="50" cy="43" rx="13" ry="14" fill={color} />
      {/* ボディ */}
      <path d="M44,56 Q50,54 56,56 L61,78 Q50,84 39,78 Z" fill={color} />
      {/* ドレス */}
      <path d="M39,78 Q20,120 10,170 Q50,180 90,170 Q80,120 61,78 Q50,84 39,78 Z" fill={color} />
      {/* 左腕（上へ） */}
      <path d="M42,63 Q26,50 16,36" stroke={color} strokeWidth="7" fill="none" strokeLinecap="round" />
      <circle cx="16" cy="36" r="4" fill={color} />
      {/* 右腕（横へ） */}
      <path d="M58,63 Q76,60 88,53" stroke={color} strokeWidth="7" fill="none" strokeLinecap="round" />
      <circle cx="88" cy="53" r="4" fill={color} />
    </svg>
  );
}

export function LoadingSpinner({ variant = 'full' }: Props) {
  const isFull = variant === 'full';

  return (
    <div className={isFull ? 'spinner-overlay' : 'spinner-overlay-api'}>
      {/* スパークル（full のみ） */}
      {isFull && SPARKLES.map((s, i) => (
        <div
          key={i}
          className="sparkle"
          style={{ top: s.top, left: s.left, animationDelay: s.delay, fontSize: s.size }}
        >
          ✦
        </div>
      ))}

      <div className="spinner-content">
        <div className={isFull ? 'princess-wrap' : 'princess-wrap-sm'}>
          <PrincessSvg color={isFull ? 'white' : '#9ca3af'} />
        </div>
        <p className={isFull ? 'spinner-lily' : 'spinner-lily-sm'}>Lily.</p>
        <p className="spinner-text">{isFull ? '読み込み中...' : '通信中...'}</p>
      </div>
    </div>
  );
}
