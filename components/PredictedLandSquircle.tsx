'use client';

/**
 * Predicted-land badge: solid squircle frame (not a progress ring).
 * Label sits above the amount; amount stays fully inside the frame.
 */
export default function PredictedLandSquircle({
  value,
  label = 'Your predicted land',
  size = 'md',
}: {
  value: string;
  /** @deprecated ignored — frame is a solid border, not value-driven */
  gauge?: number;
  label?: string;
  /** Compact for Guide Page 4; default matches Snapshot Page 1 */
  size?: 'md' | 'sm';
  /** @deprecated label is always above */
  labelPosition?: 'above' | 'below';
}) {
  // Match the score circle size on the left (w-40 h-40) for visual balance
  const frame =
    size === 'sm'
      ? 'w-28 h-28 sm:w-32 sm:h-32 rounded-[34%] border-[4px]'
      : 'w-36 h-36 sm:w-40 sm:h-40 rounded-[34%] border-[5px] sm:border-6';
  
  // Dynamic font sizing based on value length
  const baseSize = size === 'sm' ? 'text-base sm:text-lg' : 'text-lg sm:text-2xl';
  const scaleFactor = 
    value.length > 15 ? 0.62 :
    value.length > 12 ? 0.72 :
    value.length > 10 ? 0.82 : 1.0;
  
  return (
    <div className="flex flex-col items-center justify-center shrink-0 self-center gap-1.5">
      <p className="text-xs font-bold uppercase tracking-wider text-emerald-300 text-center whitespace-nowrap">
        {label}
      </p>
      <div
        className={`relative flex items-center justify-center border-emerald-400/90 bg-slate-950/40 px-2 sm:px-3 ${frame}`}
        aria-label={`${label} ${value}`}
      >
        <span
          className={`relative z-10 text-center font-black text-emerald-100 tabular-nums leading-tight tracking-tight ${baseSize}`}
          style={{ 
            fontSize: scaleFactor !== 1.0 ? `${scaleFactor}em` : undefined,
            wordBreak: 'keep-all',
            whiteSpace: 'nowrap',
            maxWidth: '95%'
          }}
        >
          {value}
        </span>
      </div>
    </div>
  );
}
