'use client';

import { Users } from 'lucide-react';
import type { Device } from '@/lib/types';
import { Card, CardBody } from '@/components/ui/Card';

type ChildSelectorProps = {
  devices: Device[];
  selectedDeviceId: string | null;
  onSelect: (deviceId: string | null) => void;
  isLoading: boolean;
};

export function ChildSelector({
  devices,
  selectedDeviceId,
  onSelect,
  isLoading,
}: ChildSelectorProps) {
  return (
    <Card>
      <CardBody className="py-3.5">
        <div className="mb-3 flex items-center gap-2">
          <Users className="h-4 w-4 text-slate-500" />
          <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
            Select Child
          </span>
        </div>

        {isLoading ? (
          <div className="flex gap-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-9 w-28 animate-pulse rounded-full bg-slate-800"
              />
            ))}
          </div>
        ) : (
          <div className="portal-flex-wrap flex flex-wrap gap-2">
            <button
              onClick={() => onSelect(null)}
              className={`portal-pill rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-200 sm:px-4 sm:py-2 sm:text-sm ${
                selectedDeviceId === null
                  ? 'portal-pill-active-blue bg-blue-500/20 text-blue-300 ring-1 ring-blue-400/40'
                  : 'portal-pill-inactive bg-slate-800/80 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              All Children
            </button>
            {devices.map((device) => {
              const label = device.child_name || device.device_name || 'Device';
              const isSelected = selectedDeviceId === device.device_id;
              return (
                <button
                  key={device.device_id}
                  onClick={() => onSelect(device.device_id)}
                  className={`portal-pill rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-200 sm:px-4 sm:py-2 sm:text-sm ${
                    isSelected
                      ? 'portal-pill-active-emerald bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-400/40'
                      : 'portal-pill-inactive bg-slate-800/80 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  {label}
                </button>
              );
            })}
            {devices.length === 0 && (
              <p className="text-sm text-slate-500">
                No devices linked yet. Complete setup on the child phone.
              </p>
            )}
          </div>
        )}
      </CardBody>
    </Card>
  );
}
