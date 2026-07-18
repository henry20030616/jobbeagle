/** Large light-grey SAMPLE mark for sample preview chrome */
export function SampleMark({ className = '' }: { className?: string }) {
  return (
    <p
      className={`text-center text-6xl sm:text-7xl font-black uppercase tracking-[0.35em] text-slate-300 select-none ${className}`}
      aria-hidden
    >
      SAMPLE
    </p>
  );
}
