import { format, formatDistanceToNow, parseISO } from 'date-fns';

export function formatTimestamp(value: string | null | undefined): string {
  if (!value) return 'Unknown';
  try {
    return format(parseISO(value), 'MMM d, h:mm:ss a');
  } catch {
    return value;
  }
}

export function formatDurationMs(ms: number | null | undefined): string {
  if (!ms || ms <= 0) return '--:--';
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

export function formatRelative(value: string | null | undefined): string {
  if (!value) return 'Never';
  try {
    return formatDistanceToNow(parseISO(value), { addSuffix: true });
  } catch {
    return value;
  }
}

export function isDeviceOnline(lastSeen: string | null | undefined): boolean {
  if (!lastSeen) return false;
  try {
    const diff = Date.now() - parseISO(lastSeen).getTime();
    return diff <= 15 * 60 * 1000;
  } catch {
    return false;
  }
}

export function getNotificationFullText(notification: {
  big_text?: string | null;
  message?: string | null;
  sub_text?: string | null;
  summary_text?: string | null;
  info_text?: string | null;
}): string {
  const parts = [
    notification.big_text,
    notification.message,
    notification.sub_text,
    notification.summary_text,
    notification.info_text,
  ].filter((part): part is string => Boolean(part && part.trim()));

  if (parts.length === 0) return '';

  return parts.reduce((longest, part) =>
    part.length > longest.length ? part : longest
  );
}

export function getNotificationContactName(notification: {
  title?: string | null;
  conversation_title?: string | null;
}): string {
  return notification.conversation_title || notification.title || 'Unknown contact';
}

export function getAppIconColor(appPackage: string): string {
  if (appPackage.includes('whatsapp')) return 'bg-emerald-500';
  if (appPackage.includes('instagram')) return 'bg-pink-500';
  if (appPackage.includes('tiktok')) return 'bg-slate-100';
  if (appPackage.includes('snapchat')) return 'bg-yellow-400';
  if (appPackage.includes('facebook')) return 'bg-blue-600';
  if (appPackage.includes('messaging') || appPackage.includes('sms')) return 'bg-blue-400';
  return 'bg-slate-500';
}

export const APP_FILTERS = [
  { id: 'all', label: 'All Apps' },
  { id: 'com.whatsapp', label: 'WhatsApp' },
  { id: 'com.instagram.android', label: 'Instagram' },
  { id: 'com.zhiliaoapp.musically', label: 'TikTok' },
  { id: 'com.snapchat.android', label: 'Snapchat' },
  { id: 'com.google.android.apps.messaging', label: 'Messages' },
  { id: 'com.android.server.telecom', label: 'Calls' },
] as const;
