type CardProps = {
  children: React.ReactNode;
  className?: string;
};

export function Card({ children, className = '' }: CardProps) {
  return (
    <div
      className={`portal-card rounded-2xl border border-slate-800/80 bg-slate-900/50 shadow-lg shadow-black/20 backdrop-blur-sm ${className}`}
    >
      {children}
    </div>
  );
}

type CardHeaderProps = {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
};

export function CardHeader({ title, subtitle, icon, action }: CardHeaderProps) {
  return (
    <div className="portal-card-header flex items-center justify-between gap-4 border-b border-slate-800/80 px-5 py-4 sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        {icon && (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 ring-1 ring-emerald-500/25">
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <h2 className="truncate text-base font-semibold text-slate-100">{title}</h2>
          {subtitle && (
            <p className="truncate text-xs text-slate-500">{subtitle}</p>
          )}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function CardBody({ children, className = '' }: CardProps) {
  return (
    <div className={`portal-card-body px-5 py-4 sm:px-6 ${className}`}>
      {children}
    </div>
  );
}
