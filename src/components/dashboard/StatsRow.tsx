'use client';

import { Bell, MapPin, Smartphone, Wifi } from 'lucide-react';
import type { Device } from '@/lib/types';
import { isDeviceOnline } from '@/lib/utils';
import { Card, CardBody } from '@/components/ui/Card';

type StatsRowProps = {
  devices: Device[];
  notificationCount: number;
};

export function StatsRow({ devices, notificationCount }: StatsRowProps) {
  const onlineCount = devices.filter((d) => isDeviceOnline(d.last_seen)).length;

  const stats = [
    {
      label: 'Children',
      value: devices.length,
      icon: Smartphone,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
    },
    {
      label: 'Online',
      value: onlineCount,
      icon: Wifi,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
    },
    {
      label: 'Notifications',
      value: notificationCount,
      icon: Bell,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
    },
    {
      label: 'Tracking',
      value: devices.filter((d) => d.location_permission_granted).length,
      icon: MapPin,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10',
    },
  ];

  return (
    <div className="portal-stats-grid grid grid-cols-2 gap-3 sm:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.label}>
            <CardBody className="portal-stat-inner flex items-center gap-3 py-3.5">
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${stat.bg}`}>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </div>
              <div className="min-w-0">
                <p className="text-lg font-bold leading-none text-slate-100">{stat.value}</p>
                <p className="mt-1 truncate text-[11px] text-slate-500">{stat.label}</p>
              </div>
            </CardBody>
          </Card>
        );
      })}
    </div>
  );
}
