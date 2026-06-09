'use client';

type BatteryBarProps = {
  level: number;
};

export function BatteryBar({ level }: BatteryBarProps) {
  const safeLevel = Math.min(100, Math.max(0, level));
  const color =
    safeLevel > 50
      ? 'bg-emerald-400'
      : safeLevel > 20
        ? 'bg-yellow-400'
        : 'bg-red-400';

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-400">Battery</span>
        <span className="font-semibold text-slate-200">{safeLevel}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-800">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${safeLevel}%` }}
        />
      </div>
    </div>
  );
}
