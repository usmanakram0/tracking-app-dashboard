import {
  Activity,
  Contact,
  Headphones,
  Images,
  MapPin,
  MessageCircle,
  MessageSquare,
  type LucideIcon,
} from 'lucide-react';

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export const DASHBOARD_NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Live Feed', icon: Activity },
  { href: '/dashboard/messages', label: 'Messages', icon: MessageCircle },
  { href: '/dashboard/contacts', label: 'Contacts', icon: Contact },
  { href: '/dashboard/sms', label: 'SMS', icon: MessageSquare },
  { href: '/dashboard/gallery', label: 'Gallery', icon: Images },
  { href: '/dashboard/audio', label: 'Audio', icon: Headphones },
  { href: '/dashboard/location', label: 'Location', icon: MapPin },
];
