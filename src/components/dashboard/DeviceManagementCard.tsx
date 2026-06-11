'use client';

import { useState } from 'react';
import { Battery, MapPin, RefreshCw, Smartphone } from 'lucide-react';
import type { Device } from '@/lib/types';
import { isDeviceOnline, formatRelative, getDeviceSyncStatusMessage } from '@/lib/utils';
import { StatusChip } from './StatusChip';
import { BatteryBar } from './BatteryBar';
import { useDeviceCommands } from '@/lib/hooks/useDeviceCommands';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';

type DeviceManagementCardProps = {
  device: Device | null;
  parentId: string | undefined;
  onGpsSuccess?: (lat: number, lng: number) => void;
};

export function DeviceManagementCard({
  device,
  parentId,
  onGpsSuccess,
}: DeviceManagementCardProps) {
  const { gpsTrack, healthCheck } = useDeviceCommands(parentId);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');

  if (!device) {
    return (
      <Card>
        <CardBody className="flex min-h-[200px] flex-col items-center justify-center py-12 text-center">
          <Smartphone className="mb-3 h-8 w-8 text-slate-600" />
          <p className="text-sm font-medium text-slate-400">No device selected</p>
          <p className="mt-1 text-xs text-slate-600">
            Link a child phone or select a child above.
          </p>
        </CardBody>
      </Card>
    );
  }

  const online = isDeviceOnline(device.last_seen);
  const battery = device.battery_level ?? 0;
  const childLabel = device.child_name || device.device_name || 'Device';
  const syncStatusMessage = getDeviceSyncStatusMessage(device.sync_status);

  const showMessage = (text: string, type: 'success' | 'error' | 'info') => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => setMessage(null), 8000);
  };

  const handleGpsTrack = async () => {
    setMessage(null);
    try {
      const result = await gpsTrack.mutateAsync(device.device_id);
      if (result.response_latitude && result.response_longitude) {
        showMessage(
          `GPS: ${result.response_latitude.toFixed(5)}, ${result.response_longitude.toFixed(5)}`,
          'success'
        );
        onGpsSuccess?.(result.response_latitude, result.response_longitude);
      } else {
        showMessage('GPS command completed but no coordinates returned.', 'info');
      }
    } catch (err) {
      const text = err instanceof Error ? err.message : 'GPS request failed';
      showMessage(text, text.includes('asleep') ? 'info' : 'error');
    }
  };

  const handleHealthCheck = async () => {
    setMessage(null);
    try {
      const result = await healthCheck.mutateAsync(device.device_id);
      const bat = result.response_battery ?? battery;
      showMessage(`Health check OK — Battery: ${bat}%`, 'success');
    } catch (err) {
      const text = err instanceof Error ? err.message : 'Health check failed';
      showMessage(text, text.includes('asleep') ? 'info' : 'error');
    }
  };

  const isLoading = gpsTrack.isPending || healthCheck.isPending;

  return (
    <Card className="h-full">
      <CardHeader
        title="Device Management"
        subtitle={childLabel}
        icon={<Smartphone className="h-4 w-4 text-blue-400" />}
        action={<StatusChip isOnline={online} />}
      />

      <CardBody className="portal-stack-5 space-y-5">
        <div className="portal-info-box rounded-xl bg-slate-800/40 px-4 py-3 ring-1 ring-slate-700/50">
          <p className="text-xs text-slate-500">Last seen</p>
          <p className="mt-0.5 text-sm font-medium text-slate-200">
            {formatRelative(device.last_seen)}
          </p>
        </div>

        <BatteryBar level={battery} />

        {syncStatusMessage && (
          <div className="rounded-xl bg-amber-500/10 px-3.5 py-3 text-xs leading-relaxed text-amber-200 ring-1 ring-amber-500/20 sm:text-sm">
            {syncStatusMessage}
          </div>
        )}

        {!online && !syncStatusMessage && (
          <div className="rounded-xl bg-slate-800/50 px-3.5 py-3 text-xs leading-relaxed text-slate-400 ring-1 ring-slate-700/50 sm:text-sm">
            Device is offline. Check the child phone: keep Family Monitor visible, battery set to
            Unrestricted, and removed from Sleeping apps (Samsung).
          </div>
        )}

        <div className="portal-gap-grid grid gap-2.5">
          <button
            onClick={handleGpsTrack}
            disabled={isLoading}
            className="portal-btn portal-btn-emerald flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500/15 px-4 py-3 text-sm font-semibold text-emerald-300 ring-1 ring-emerald-500/25 transition-all duration-200 hover:bg-emerald-500/25 disabled:opacity-50"
          >
            <MapPin className="h-4 w-4 shrink-0" />
            <span>{gpsTrack.isPending ? 'Requesting GPS...' : 'Request Live GPS'}</span>
          </button>
          <button
            onClick={handleHealthCheck}
            disabled={isLoading}
            className="portal-btn portal-btn-blue flex w-full items-center justify-center gap-2 rounded-xl bg-blue-500/15 px-4 py-3 text-sm font-semibold text-blue-300 ring-1 ring-blue-500/25 transition-all duration-200 hover:bg-blue-500/25 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 shrink-0 ${healthCheck.isPending ? 'animate-spin' : ''}`} />
            <span>{healthCheck.isPending ? 'Checking...' : 'Request Health Check'}</span>
          </button>
        </div>

        {message && (
          <div
            className={`rounded-xl px-3.5 py-3 text-xs leading-relaxed sm:text-sm ${
              messageType === 'success'
                ? 'bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-500/20'
                : messageType === 'error'
                  ? 'bg-red-500/10 text-red-300 ring-1 ring-red-500/20'
                  : 'bg-amber-500/10 text-amber-200 ring-1 ring-amber-500/20'
            }`}
          >
            {message}
          </div>
        )}

        <p className="flex items-start gap-2 text-[11px] leading-relaxed text-slate-600">
          <Battery className="mt-0.5 h-3 w-3 shrink-0" />
          Commands sync via Supabase. Offline devices cache for next wake.
        </p>
      </CardBody>
    </Card>
  );
}
