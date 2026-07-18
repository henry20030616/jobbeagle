/** Large light-grey SAMPLE mark for sample preview chrome */
export function SampleMark({ className = '' }: { className?: string }) {
  return (
    <p
      className={`text-center text-2xl sm:text-3xl font-black uppercase tracking-[0.35em] text-slate-500/70 select-none ${className}`}
      aria-hidden
    >
      SAMPLE
    </p>
  );
}
