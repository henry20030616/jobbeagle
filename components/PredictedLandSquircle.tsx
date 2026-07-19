'use client';

/** Fixed outer size — never grows/shrinks with the dollar string. */
const BOX_PX = 144; // 9rem

/**
 * Predicted-land badge: thick squircle frame + gauge fill.
 * Label sits above the box. Inner amount uses Fit Score–scale type.
 */
export default function PredictedLandSquircle({
  value,
  gauge,
  label = 'Your predicted land',
}: {
  value: string;
  /** 0–100 fill along the frame */
  gauge: number;
  label?: string;
}) {
  const pct = Math.max(0, Math.min(100, Math.round(gauge)));

  return (
    <div className="flex flex-col items-center justify-center shrink-0 self-center gap-1.5">
      <p className="text-xs font-bold uppercase tracking-wider text-emerald-300 text-center whitespace-nowrap">
        {label}
      </p>
      <div
        className="relative flex items-center justify-center shrink-0 grow-0 overflow-hidden"
        style={{
          width: BOX_PX,
          height: BOX_PX,
          minWidth: BOX_PX,
          minHeight: BOX_PX,
          maxWidth: BOX_PX,
          maxHeight: BOX_PX,
        }}
        aria-label={`${label} ${value}`}
      >
        {/* Squircle track — wider frame */}
        <div
          className="absolute inset-0 rounded-[34%] border-8 border-slate-500/55 box-border"
          aria-hidden
        />
        {/* Squircle progress (conic ring clipped to border band) */}
        <div
          className="absolute inset-0 rounded-[34%] pointer-events-none box-border"
          style={{
            padding: 8,
            background: `conic-gradient(from -90deg, #34d399 ${pct}%, transparent 0)`,
            WebkitMask:
              'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'xor',
            maskComposite: 'exclude',
          }}
          aria-hidden
        />
        <span
          className="relative z-10 font-black text-emerald-100 tabular-nums leading-none tracking-tight text-center px-2 max-w-[7.25rem] truncate"
          style={{ fontSize: '2.75rem' }}
          title={value}
        >
          {value}
        </span>
      </div>
    </div>
  );
}
