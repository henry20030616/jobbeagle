'use client';

/**
 * Predicted-land badge: solid squircle frame (not a progress ring).
 * Label sits above the amount; amount stays fully inside the frame.
 */
export default function PredictedLandSquircle({
  value,
  label = 'Your predicted land',
}: {
  value: string;
  /** @deprecated ignored — frame is a solid border, not value-driven */
  gauge?: number;
  label?: string;
  /** @deprecated label is always above */
  labelPosition?: 'above' | 'below';
}) {
  return (
    <div className="flex flex-col items-center justify-center shrink-0 self-center gap-1.5">
      <p className="text-xs font-bold uppercase tracking-wider text-emerald-300 text-center whitespace-nowrap">
        {label}
      </p>
      <div
        className="relative w-[8.5rem] h-[8.5rem] sm:w-40 sm:h-40 flex items-center justify-center rounded-[34%] border-[6px] sm:border-8 border-emerald-400/90 bg-slate-950/40 overflow-hidden px-2"
        aria-label={`${label} ${value}`}
      >
        <span className="relative z-10 max-w-full text-center text-3xl sm:text-4xl font-black text-emerald-100 tabular-nums leading-none tracking-tight break-all">
          {value}
        </span>
      </div>
    </div>
  );
}
