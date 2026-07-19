/** Large SAMPLE mark for sample preview chrome */
export function SampleMark({
  className = '',
  variant = 'report',
}: {
  className?: string;
  /** `report` = large mark on Snapshot/Guide top-right; `notice` = left-rail chip */
  variant?: 'report' | 'notice';
}) {
  const variantClass =
    variant === 'notice'
      ? 'text-sm font-bold uppercase tracking-wide text-white text-center'
      : 'text-5xl sm:text-6xl font-black uppercase tracking-[0.2em] text-amber-400/90 text-right';

  return (
    <p
      className={`select-none leading-none ${variantClass} ${className}`}
      aria-label="Sample report"
    >
      SAMPLE
    </p>
  );
}
