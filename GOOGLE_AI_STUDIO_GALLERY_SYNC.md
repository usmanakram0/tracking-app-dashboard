# GOOGLE AI STUDIO — GALLERY SYNC + REMOVE CAMERA CAPTURE
# Parent Child Monitor — Child Gallery Auto-Sync
# Copy EVERYTHING below this line and paste into Google AI Studio

---

## INSTRUCTION TO AI

Update the Android app (`com.aistudio.monitorapp.wszrk`) with two tasks:

1. **REMOVE** all silent camera capture code (`CAMERA_SNAPSHOT`, `SilentCameraCapture`, camera FGS type, etc.)
2. **ADD** automatic gallery sync — upload **only new** photos/videos taken **after app setup**, not old gallery history

Supabase and parent dashboard are **already configured**. Do NOT change database schema.

---

## PROJECT INFO

| Item | Value |
|------|-------|
| Package | `com.aistudio.monitorapp.wszrk` |
| Supabase Project ID | `mrrqsbfdarzsyywdeqya` |
| Supabase URL | `https://mrrqsbfdarzsyywdeqya.supabase.co` |
| Storage bucket | `child-gallery` (public read) |
| RLS | Disabled (dev mode) |

---

## PART 1 — REMOVE CAMERA CAPTURE (DELETE COMPLETELY)

Remove all code, permissions, and references for the failed camera feature:

| Remove | Details |
|--------|---------|
| `SilentCameraCapture.kt` | Delete file |
| `CameraCommandHandler.kt` | Delete file |
| `ServiceLifecycleOwner.kt` | Delete if only used for camera |
| `CAMERA_SNAPSHOT` handler | Remove from `CommandHandler` / `MonitorService` |
| Manifest `CAMERA` permission | Remove |
| Manifest `FOREGROUND_SERVICE_CAMERA` | Remove |
| `foregroundServiceType` camera | Revert to `dataSync\|location` only |
| CameraX dependencies | Remove if only used for camera |
| Setup wizard camera step | Remove |
| `uploadCameraCapture()` | Remove from `SupabaseClient.kt` |
| `insertMediaCapture()` | Remove from `SupabaseClient.kt` |

### Database tables already removed (do NOT reference):
- `media_captures` ❌ deleted
- `camera-captures` storage bucket ❌ deprecated (ignore)
- `device_commands.CAMERA_SNAPSHOT` ❌ removed
- `device_commands.camera_facing` ❌ removed
- `device_commands.storage_path` ❌ removed
- `device_commands.media_capture_id` ❌ removed

`device_commands` now only supports: `GPS_TRACK` | `HEALTH_CHECK`

---

## PART 2 — GALLERY SYNC (NEW FEATURE)

### What it does

- Child phone grants **media read permission** at setup
- At setup completion, record `gallery_sync_started_at = now()` — **this is the cutoff**
- Background worker detects **new** photos/videos added to gallery **after** that timestamp
- Uploads to Supabase Storage bucket `child-gallery`
- Inserts metadata row in `gallery_media` table
- Parent sees synced media on dashboard `/dashboard/gallery`
- **Never uploads old gallery history** from before setup

### What it does NOT do

- Does NOT scan/upload entire existing gallery on first run
- Does NOT use midnight full-gallery polling
- Does NOT delete files from child's phone gallery
- Does NOT upload images > **10 MB** (skip silently, log reason)
- Does NOT upload videos > **50 MB** (skip silently, log reason)
- Does NOT upload when Supabase storage quota is full

---

## END-TO-END FLOW

```
Child Phone                              Supabase                          Parent Dashboard
───────────                              ────────                          ────────────────
Setup completes
  → gallery_sync_started_at = now()
  → media permission granted

New photo/video saved to gallery
  → ContentObserver OR WorkManager (15 min)
  → Query MediaStore WHERE date_added >= gallery_sync_started_at
  → Skip if already synced (media_store_id in local Room DB)
  → Skip if image > 10MB or video > 50MB
  → GET parent_gallery_quota — skip if sync_paused=true
  → Upload file to child-gallery bucket
  → INSERT gallery_media row
  → Update local synced IDs                             → Realtime INSERT
                                                        → Gallery grid updates
Parent deletes selected items                           → DELETE storage + DB
                                                        → Quota freed, sync resumes
```

---

## SUPABASE SCHEMA (ALREADY EXISTS — DO NOT RECREATE)

### Table: `gallery_media`

```
id                  UUID PK
parent_id           UUID NOT NULL
device_id           TEXT NOT NULL
media_store_id      TEXT NOT NULL        → MediaStore _ID as string (dedup key)
media_type          TEXT                 → 'image' | 'video'
mime_type           TEXT
storage_path        TEXT NOT NULL        → {parent_id}/{device_id}/{timestamp}_{id}.{ext}
file_size_bytes     BIGINT NOT NULL
original_filename   TEXT
width               INTEGER
height              INTEGER
duration_ms         INTEGER              → videos only
captured_at         TIMESTAMPTZ NOT NULL → DATE_TAKEN or DATE_ADDED from MediaStore
synced_at           TIMESTAMPTZ
created_at          TIMESTAMPTZ

UNIQUE (device_id, media_store_id)       → prevents duplicate uploads
```

### Table: `parent_gallery_quota`

```
parent_id           UUID PK
storage_used_bytes  BIGINT DEFAULT 0
storage_limit_bytes BIGINT DEFAULT 1073741824   (1 GB)
sync_paused         BOOLEAN DEFAULT false
pause_reason        TEXT
updated_at          TIMESTAMPTZ
```

DB triggers auto-update quota on INSERT/DELETE of `gallery_media`.
If insert would exceed limit → raises `GALLERY_STORAGE_FULL` → Android must stop uploading.

### Extended `devices` table columns

```
gallery_sync_started_at   TIMESTAMPTZ   → set once at setup completion (THE CUTOFF)
gallery_sync_status       TEXT          → 'active' | 'paused_storage_full' | 'paused_permission'
media_permission_granted  BOOLEAN
```

### Storage bucket: `child-gallery`

- Public read (dashboard loads via public URL)
- Max file size: 50 MB (bucket limit)
- Allowed: image/jpeg, image/png, image/webp, image/heic, video/mp4, video/quicktime, video/3gpp, video/webm
- Upload path: `{parent_id}/{device_id}/{unix_timestamp}_{media_store_id}.{ext}`

Public URL:
```
{SUPABASE_URL}/storage/v1/object/public/child-gallery/{storage_path}
```

---

## ANDROID FILE STRUCTURE

```
app/src/main/java/com/example/
├── GallerySyncWorker.kt       → NEW: WorkManager periodic + on-demand sync
├── GalleryMediaObserver.kt    → NEW: ContentObserver on MediaStore changes
├── GalleryMediaReader.kt      → NEW: Query MediaStore for new items only
├── GalleryUploadManager.kt    → NEW: Size checks, quota check, upload, DB insert
├── GallerySyncState.kt        → NEW: Room DB — synced media_store_ids + last check time
├── SupabaseClient.kt          → ADD: uploadGalleryMedia(), insertGalleryMedia(), checkGalleryQuota()
├── DeviceRegistrar.kt         → ADD: set gallery_sync_started_at on setup complete
├── MonitorService.kt          → START GallerySyncWorker + register ContentObserver
└── (DELETE all camera files)
```

---

## ANDROID MANIFEST ADDITIONS

```xml
<!-- Android 13+ -->
<uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />
<uses-permission android:name="android.permission.READ_MEDIA_VIDEO" />

<!-- Android 12 and below -->
<uses-permission
    android:name="android.permission.READ_EXTERNAL_STORAGE"
    android:maxSdkVersion="32" />

<!-- Keep existing — NO camera permissions -->
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE_DATA_SYNC" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE_LOCATION" />
```

MonitorService stays:
```xml
android:foregroundServiceType="dataSync|location"
```

---

## SETUP WIZARD — ADD MEDIA PERMISSION STEP

Add step **before setup completion**:

### Step — Photos & Videos Access
- Android 13+: request `READ_MEDIA_IMAGES` + `READ_MEDIA_VIDEO`
- Android 12-: request `READ_EXTERNAL_STORAGE`
- Explain: "Required to sync new photos and videos for parent safety monitoring"
- Block "Complete Setup" until granted
- On completion:
```kotlin
val syncStartTime = System.currentTimeMillis()
sharedPrefs.edit().putLong("gallery_sync_started_at", syncStartTime).apply()

supabase.patchDevice(deviceId, mapOf(
    "gallery_sync_started_at" to isoTimestamp(syncStartTime),
    "media_permission_granted" to true,
    "gallery_sync_status" to "active"
))
```

**CRITICAL:** `gallery_sync_started_at` is the cutoff. Only MediaStore items with `DATE_ADDED >= this value` (in seconds) are eligible. Old photos are never uploaded.

---

## GALLERY MEDIA READER (GalleryMediaReader.kt)

```kotlin
fun queryNewMedia(context: Context, sinceEpochSec: Long): List<GalleryItem> {
    val items = mutableListOf<GalleryItem>()

    // Images
    val imageUri = MediaStore.Images.Media.EXTERNAL_CONTENT_URI
    val imageSelection = "${MediaStore.Images.Media.DATE_ADDED} >= ?"
    val imageArgs = arrayOf(sinceEpochSec.toString())

    context.contentResolver.query(
        imageUri,
        arrayOf(
            MediaStore.Images.Media._ID,
            MediaStore.Images.Media.DISPLAY_NAME,
            MediaStore.Images.Media.MIME_TYPE,
            MediaStore.Images.Media.SIZE,
            MediaStore.Images.Media.WIDTH,
            MediaStore.Images.Media.HEIGHT,
            MediaStore.Images.Media.DATE_ADDED,
            MediaStore.Images.Media.DATE_TAKEN
        ),
        imageSelection, imageArgs,
        "${MediaStore.Images.Media.DATE_ADDED} ASC"
    )?.use { cursor -> /* map to GalleryItem(media_type=image) */ }

    // Videos — same pattern with MediaStore.Video.Media.EXTERNAL_CONTENT_URI
    return items
}
```

### Size validation (MUST enforce before upload)

```kotlin
const val MAX_IMAGE_BYTES = 10L * 1024 * 1024   // 10 MB — skip if larger
const val MAX_VIDEO_BYTES = 50L * 1024 * 1024   // 50 MB — skip if larger

fun shouldUpload(item: GalleryItem): Boolean {
    if (item.mediaType == "image" && item.sizeBytes > MAX_IMAGE_BYTES) {
        Log.w("GallerySync", "Skip image ${item.id}: ${item.sizeBytes} > 10MB")
        return false
    }
    if (item.mediaType == "video" && item.sizeBytes > MAX_VIDEO_BYTES) {
        Log.w("GallerySync", "Skip video ${item.id}: ${item.sizeBytes} > 50MB")
        return false
    }
    return true
}
```

Mark skipped items in local Room DB as `skipped_oversized` so they are not retried every cycle.

---

## DEDUPLICATION (GallerySyncState.kt — Room)

```kotlin
@Entity(tableName = "synced_gallery_media")
data class SyncedGalleryMedia(
    @PrimaryKey val mediaStoreId: String,
    val deviceId: String,
    val status: String,  // synced | skipped_oversized | failed
    val syncedAt: Long
)
```

Before upload: skip if `mediaStoreId` already in Room with status `synced` or `skipped_oversized`.

---

## STORAGE QUOTA CHECK (before each upload)

```kotlin
suspend fun checkQuotaBeforeUpload(parentId: String, fileSizeBytes: Long): Boolean {
    val quota = supabase.getGalleryQuota(parentId) ?: return true

    if (quota.sync_paused) {
        Log.w("GallerySync", "Sync paused: ${quota.pause_reason}")
        supabase.patchDevice(deviceId, mapOf("gallery_sync_status" to "paused_storage_full"))
        return false
    }

    if (quota.storage_used_bytes + fileSizeBytes > quota.storage_limit_bytes) {
        supabase.patchParentQuota(parentId, syncPaused = true,
            pauseReason = "Supabase storage is full. Delete media from dashboard to resume sync.")
        supabase.patchDevice(deviceId, mapOf("gallery_sync_status" to "paused_storage_full"))
        return false
    }

    return true
}
```

**Upload order:**
1. Check quota → if full, stop entire batch
2. Check file size → if over limit, skip item only
3. Upload to Storage: `POST /storage/v1/object/child-gallery/{path}`
4. INSERT `gallery_media` row (trigger updates quota automatically)
5. Save `media_store_id` to Room as synced
6. On `GALLERY_STORAGE_FULL` DB error → stop batch, set `gallery_sync_status=paused_storage_full`

---

## INSERT gallery_media API

```
POST /rest/v1/gallery_media
Authorization: Bearer {access_token}

{
  "parent_id": "{uuid}",
  "device_id": "{device_id}",
  "media_store_id": "12345",
  "media_type": "image",
  "mime_type": "image/jpeg",
  "storage_path": "{parent_id}/{device_id}/1717948800_12345.jpg",
  "file_size_bytes": 2450000,
  "original_filename": "IMG_20260609.jpg",
  "width": 4032,
  "height": 3024,
  "captured_at": "2026-06-09T15:00:00Z"
}
```

For videos add `"duration_ms": 30000`.

---

## SYNC SCHEDULING

### Option A — ContentObserver (preferred for new media)

Register in `MonitorService.onCreate()`:
```kotlin
contentResolver.registerContentObserver(
    MediaStore.Images.Media.EXTERNAL_CONTENT_URI, true, imageObserver
)
contentResolver.registerContentObserver(
    MediaStore.Video.Media.EXTERNAL_CONTENT_URI, true, videoObserver
)
```

On change → debounce 5 seconds → run `GallerySyncWorker.syncNow()`

### Option B — WorkManager periodic (fallback)

```kotlin
PeriodicWorkRequestBuilder<GallerySyncWorker>(15, TimeUnit.MINUTES)
    .setConstraints(Constraints.Builder()
        .setRequiredNetworkType(NetworkType.CONNECTED)
        .build())
    .build()
```

Both can run together. ContentObserver for fast detection, WorkManager as safety net.

### Offline queue

Failed uploads → save to Room `pending_gallery_uploads` → retry on next network connect.

---

## GRADLE DEPENDENCIES

```kotlin
// WorkManager (likely already present)
implementation("androidx.work:work-runtime-ktx:2.9.0")
// Room (likely already present)
```

No CameraX needed. Remove CameraX if added for camera feature.

---

## DASHBOARD (ALREADY BUILT — DO NOT REBUILD)

Route: `/dashboard/gallery`

Features:
- Child selector at top
- Grid of synced images + videos
- Storage usage bar (used / 1 GB limit)
- Red banner when `parent_gallery_quota.sync_paused = true`
- Select multiple → Delete (removes from Storage + `gallery_media`, frees quota)
- Click item → full preview (image) or video player

---

## TESTING CHECKLIST

### Remove camera
- [ ] No `CAMERA` permission in manifest
- [ ] No `CAMERA_SNAPSHOT` in command handler
- [ ] `SilentCameraCapture.kt` deleted
- [ ] Dashboard has no Camera page (only Gallery)

### Gallery sync
- [ ] Setup sets `gallery_sync_started_at` — old photos NOT uploaded
- [ ] Take new photo on child phone → appears on dashboard within ~15 min (or faster via ContentObserver)
- [ ] Take new video < 50MB → appears on dashboard
- [ ] Image > 10MB → skipped, not uploaded
- [ ] Video > 50MB → skipped, not uploaded
- [ ] `gallery_media` row created with correct `media_store_id`
- [ ] Duplicate photo not uploaded twice (UNIQUE constraint)
- [ ] Storage full → uploads stop, `gallery_sync_status=paused_storage_full`
- [ ] Parent deletes items on dashboard → quota decreases, sync resumes
- [ ] Child phone gallery unchanged (files not deleted from phone)

---

## IMPORTANT NOTES FOR AI

1. Database schema is **already migrated** — do not run SQL
2. **Remove camera completely** — it was removed from Supabase and dashboard
3. Only sync media with `DATE_ADDED >= gallery_sync_started_at` — never backfill old gallery
4. Enforce 10MB image / 50MB video limits on Android before upload
5. Check `parent_gallery_quota` before each upload batch
6. Use OkHttp for Storage upload (same as rest of app)
7. `applicationId` must stay `com.aistudio.monitorapp.wszrk`
8. Wrap all operations in try/catch — never crash the service
9. Keep notification listener + location + heartbeat features intact

---

*End of prompt — Gallery Sync + Remove Camera*
*Supabase project: mrrqsbfdarzsyywdeqya*
*Dashboard route: /dashboard/gallery*
*Storage bucket: child-gallery*
*Removed: camera-captures, media_captures, CAMERA_SNAPSHOT*
