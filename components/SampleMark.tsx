/** Large SAMPLE mark for sample preview chrome */
export function SampleMark({
  className = '',
  variant = 'report',
}: {
  className?: string;
  /** `report` = large mark on Snapshot/Guide; `notice` = fits the narrow sample card */
  variant?: 'report' | 'notice';
}) {
  const variantClass =
    variant === 'notice'
      ? 'text-2xl font-black uppercase tracking-[0.08em] text-white/50'
      : 'text-5xl sm:text-6xl font-black uppercase tracking-[0.22em] text-slate-400';

  return (
    <p
      className={`text-center select-none leading-none ${variantClass} ${className}`}
      aria-hidden
    >
      SAMPLE
    </p>
  );
}
