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
  const frame =
    size === 'sm'
      ? 'w-28 h-28 sm:w-32 sm:h-32 rounded-[34%] border-[5px]'
      : 'w-36 h-36 sm:w-48 sm:h-48 rounded-[34%] border-[6px] sm:border-8';
  const amount =
    size === 'sm'
      ? 'text-xl sm:text-2xl'
      : 'text-2xl sm:text-4xl';
  
  return (
    <div className="flex flex-col items-center justify-center shrink-0 self-center gap-1.5">
      <p className="text-xs font-bold uppercase tracking-wider text-emerald-300 text-center whitespace-nowrap">
        {label}
      </p>
      <div
        className={`relative flex items-center justify-center border-emerald-400/90 bg-slate-950/40 overflow-hidden px-2 sm:px-3 ${frame}`}
        aria-label={`${label} ${value}`}
      >
        <span
          className={`relative z-10 text-center font-black text-emerald-100 tabular-nums leading-[1.1] tracking-tighter whitespace-nowrap ${amount}`}
          style={{ 
            fontSize: value.length > 12 ? '0.85em' : undefined,
            wordBreak: 'keep-all'
          }}
        >
          {value}
        </span>
      </div>
    </div>
  );
}
