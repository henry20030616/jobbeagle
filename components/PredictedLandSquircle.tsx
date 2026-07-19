'use client';

/**
 * Predicted-land badge: thick squircle frame + gauge fill.
 * Inner amount uses the same text-5xl / font-black scale as Fit Score “78”.
 */
export default function PredictedLandSquircle({
  value,
  gauge,
  label = 'Your predicted land',
  labelPosition = 'below',
}: {
  value: string;
  /** 0–100 fill along the frame */
  gauge: number;
  label?: string;
  labelPosition?: 'above' | 'below';
}) {
  const pct = Math.max(0, Math.min(100, Math.round(gauge)));
  const labelEl = (
    <p className="text-xs font-bold uppercase tracking-wider text-emerald-300 text-center whitespace-nowrap">
      {label}
    </p>
  );

  return (
    <div className="flex flex-col items-center justify-center shrink-0 self-center gap-1.5">
      {labelPosition === 'above' ? labelEl : null}
      <div
        className="relative w-[7.5rem] h-[7.5rem] sm:w-36 sm:h-36 flex items-center justify-center"
        aria-label={`${label} ${value}`}
      >
        {/* Squircle track — wider frame */}
        <div
          className="absolute inset-0 rounded-[34%] border-8 border-slate-500/55"
          aria-hidden
        />
        {/* Squircle progress (conic ring clipped to border band) */}
        <div
          className="absolute inset-0 rounded-[34%] pointer-events-none"
          style={{
            padding: '8px',
            background: `conic-gradient(from -90deg, #34d399 ${pct}%, transparent 0)`,
            WebkitMask:
              'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'xor',
            maskComposite: 'exclude',
          }}
          aria-hidden
        />
        <span className="relative z-10 text-5xl font-black text-emerald-100 tabular-nums leading-none tracking-tight text-center px-1">
          {value}
        </span>
      </div>
      {labelPosition === 'below' ? labelEl : null}
    </div>
  );
}
