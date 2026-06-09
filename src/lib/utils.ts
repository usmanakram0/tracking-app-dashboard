import { format, formatDistanceToNow, parseISO } from 'date-fns';

export function formatTimestamp(value: string | null | undefined): string {
  if (!value) return 'Unknown';
  try {
    return format(parseISO(value), 'MMM d, h:mm:ss a');
  } catch {
    return value;
  }
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

export function getNotificationExcerpt(notification: {
  big_text?: string | null;
  message?: string | null;
  sub_text?: string | null;
}): string {
  const text = notification.big_text || notification.message || notification.sub_text || '';
  if (text.length <= 120) return text;
  return `${text.slice(0, 120)}...`;
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
