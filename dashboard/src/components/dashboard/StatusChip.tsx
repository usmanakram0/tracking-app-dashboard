'use client';

type StatusChipProps = {
  isOnline: boolean;
};

export function StatusChip({ isOnline }: StatusChipProps) {
  if (isOnline) {
    return (
      <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-300 ring-1 ring-emerald-500/30 sm:px-3 sm:text-xs">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
        Online
      </span>
    );
  }

  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-slate-800 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400 ring-1 ring-slate-700 sm:px-3 sm:text-xs">
      <span className="h-1.5 w-1.5 rounded-full bg-slate-500" />
      Offline
    </span>
  );
}
