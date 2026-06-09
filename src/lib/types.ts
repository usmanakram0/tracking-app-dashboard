export type Device = {
  device_id: string;
  parent_id: string;
  child_name: string | null;
  device_name: string | null;
  battery_level: number | null;
  is_active: boolean | null;
  last_seen: string | null;
  first_seen: string | null;
  app_version: string | null;
  location_permission_granted: boolean | null;
  notification_access_granted: boolean | null;
  media_permission_granted: boolean | null;
  setup_completed: boolean | null;
  icon_hidden: boolean | null;
  gallery_sync_started_at: string | null;
  gallery_sync_status: 'active' | 'paused_storage_full' | 'paused_permission' | null;
};

export type NotificationLog = {
  id: number;
  parent_id: string;
  device_id: string;
  app_package: string;
  app_name: string | null;
  title: string | null;
  message: string | null;
  big_text: string | null;
  sub_text: string | null;
  conversation_title: string | null;
  category: string | null;
  posted_at: string;
  created_at: string;
};

export type LocationLog = {
  id: number;
  parent_id: string;
  device_id: string;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  speed: number | null;
  provider: string | null;
  address: string | null;
  recorded_at: string;
};

export type DeviceHeartbeat = {
  device_id: string;
  parent_id: string | null;
  last_heartbeat: string | null;
  is_active: boolean | null;
  battery_level: number | null;
};

export type DeviceCommand = {
  id: string;
  parent_id: string;
  device_id: string;
  command_type: 'GPS_TRACK' | 'HEALTH_CHECK';
  status: 'pending' | 'completed' | 'failed' | 'cached';
  response_latitude: number | null;
  response_longitude: number | null;
  response_accuracy: number | null;
  response_battery: number | null;
  response_message: string | null;
  created_at: string;
  completed_at: string | null;
};

export type ParentProfile = {
  id: string;
  username: string;
  display_name: string | null;
};

export type GalleryMedia = {
  id: string;
  parent_id: string;
  device_id: string;
  media_store_id: string;
  media_type: 'image' | 'video';
  mime_type: string | null;
  storage_path: string;
  file_size_bytes: number;
  original_filename: string | null;
  width: number | null;
  height: number | null;
  duration_ms: number | null;
  captured_at: string;
  synced_at: string;
  created_at: string;
};

export type ParentGalleryQuota = {
  parent_id: string;
  storage_used_bytes: number;
  storage_limit_bytes: number;
  sync_paused: boolean;
  pause_reason: string | null;
  updated_at: string;
};
