# Parent Portal Dashboard

Dark-themed parent monitoring dashboard synced with the Android child app via Supabase.

## Stack

- Next.js 16 (App Router)
- React 19 + Tailwind CSS 4
- Supabase Auth + Realtime
- TanStack Query
- Leaflet / OpenStreetMap

## Setup

```bash
cd dashboard
cp .env.example .env.local
# Add your Supabase URL and anon key
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Features

- Parent login / register (same Supabase Auth as child app)
- Live notification feed with Realtime updates
- Filter by app (WhatsApp, TikTok, Instagram, etc.)
- Multi-child device selector
- Device management: GPS track request, health check
- Location history map + trail list

## Supabase Tables Used

- `parent_profiles`
- `devices`
- `notifications_log`
- `location_logs`
- `device_heartbeat`
- `device_commands` (dashboard → Android commands)

## Android App Integration

The Android app must poll or subscribe to `device_commands` where `status = 'pending'`:

- `GPS_TRACK` → capture location, update command with lat/lng, set `status = 'completed'`
- `HEALTH_CHECK` → send heartbeat, update `response_battery`, set `status = 'completed'`

If device is offline, Android should process cached `pending`/`cached` commands on next wake.
