'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Activity, Images, MapPin } from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Feed', icon: Activity },
  { href: '/dashboard/gallery', label: 'Gallery', icon: Images },
  { href: '/dashboard/location', label: 'Map', icon: MapPin },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-800/80 bg-slate-950/95 backdrop-blur-xl lg:hidden">
      <div className="mx-auto flex max-w-lg items-stretch justify-around px-2 pb-3">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-1 flex-col items-center gap-1 py-2.5 transition-colors duration-200 ${
                isActive ? 'text-emerald-400' : 'text-slate-500'
              }`}
            >
              <Icon
                className={`h-5 w-5 ${isActive ? 'drop-shadow-[0_0_6px_rgba(52,211,153,0.6)]' : ''}`}
              />
              <span className="text-[11px] font-medium">{item.label}</span>
              {isActive && (
                <span className="h-0.5 w-8 rounded-full bg-emerald-400" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
