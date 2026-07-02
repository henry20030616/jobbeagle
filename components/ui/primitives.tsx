import React from 'react';

export function SectionLabel({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={`text-[11px] font-medium uppercase tracking-[0.12em] text-jb-ink-muted ${className}`}>
      {children}
    </p>
  );
}

export function Panel({
  children,
  className = '',
  hover = true,
}: {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}) {
  return (
    <div
      className={`rounded-jb-lg border border-jb-border bg-jb-elevated/80 p-6 md:p-8 shadow-jb ${
        hover ? 'jb-interactive hover:shadow-jb-hover hover:border-jb-accent/20 hover:bg-gradient-to-b hover:from-jb-accent-soft hover:to-transparent' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
}

export function Button({
  children,
  type = 'button',
  variant = 'primary',
  disabled,
  className = '',
  onClick,
}: {
  children: React.ReactNode;
  type?: 'button' | 'submit';
  variant?: 'primary' | 'ghost';
  disabled?: boolean;
  className?: string;
  onClick?: () => void;
}) {
  const base = 'jb-interactive inline-flex items-center justify-center gap-2 rounded-jb px-6 py-3.5 text-sm font-semibold disabled:opacity-40 disabled:pointer-events-none disabled:transform-none';
  const styles =
    variant === 'primary'
      ? 'bg-jb-accent text-white shadow-jb hover:shadow-jb-hover hover:ring-1 hover:ring-jb-accent/30'
      : 'border border-jb-border bg-transparent text-jb-ink hover:text-jb-accent hover:border-jb-accent/30';
  return (
    <button type={type} disabled={disabled} onClick={onClick} className={`${base} ${styles} ${className}`}>
      {children}
    </button>
  );
}

export function Divider() {
  return <div className="h-px w-full bg-jb-border" />;
}
