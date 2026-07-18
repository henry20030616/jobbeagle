/** Large light-grey SAMPLE mark for sample preview chrome */
export function SampleMark({ className = '' }: { className?: string }) {
  return (
    <p
      className={`text-center text-4xl sm:text-5xl font-black uppercase tracking-[0.35em] text-slate-500/70 select-none ${className}`}
      aria-hidden
    >
      SAMPLE
    </p>
  );
}
