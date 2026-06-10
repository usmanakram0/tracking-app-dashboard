'use client';

import { useState } from 'react';
import { Menu, Shield } from 'lucide-react';
import { MobileDrawer } from '@/components/layout/MobileDrawer';

type MobileNavProps = {
  username: string;
};

export function MobileNav({ username }: MobileNavProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <>
      <header className="portal-mobile-header sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-xl lg:hidden">
        <div className="flex w-full min-w-0 items-center gap-2.5 pr-28 sm:gap-3 sm:pr-32">
          <button
            type="button"
            onClick={() => setIsDrawerOpen(true)}
            aria-label="Open navigation menu"
            className="shrink-0 rounded-lg p-2 text-slate-300 transition-colors duration-200 hover:bg-slate-800 hover:text-emerald-300 active:scale-95"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex min-w-0 flex-1 items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/20 ring-1 ring-emerald-400/30">
              <Shield className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-100">Parent Portal</p>
              <p className="truncate text-[11px] text-slate-500">@{username}</p>
            </div>
          </div>
        </div>
      </header>

      <MobileDrawer
        username={username}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />
    </>
  );
}
