'use client';

import { Shield } from 'lucide-react';

export function MobileHeader({ username }: { username: string }) {
  return (
    <header className="sticky top-0 z-40 flex items-center justify-between border-b border-slate-800/80 bg-slate-950/90 px-4 py-3 backdrop-blur-xl lg:hidden">
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 ring-1 ring-emerald-400/30">
          <Shield className="h-4 w-4 text-emerald-400" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-100">Parent Portal</p>
          <p className="text-[11px] text-slate-500">@{username}</p>
        </div>
      </div>
    </header>
  );
}
