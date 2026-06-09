-- Remove camera capture + add gallery sync
-- Applied to mrrqsbfdarzsyywdeqya

DELETE FROM device_commands WHERE command_type = 'CAMERA_SNAPSHOT';
DROP TABLE IF EXISTS media_captures CASCADE;

ALTER TABLE device_commands DROP CONSTRAINT IF EXISTS device_commands_command_type_check;
ALTER TABLE device_commands
  DROP COLUMN IF EXISTS camera_facing,
  DROP COLUMN IF EXISTS storage_path,
  DROP COLUMN IF EXISTS media_capture_id;

ALTER TABLE device_commands
  ADD CONSTRAINT device_commands_command_type_check
  CHECK (command_type = ANY (ARRAY['GPS_TRACK'::text, 'HEALTH_CHECK'::text]));

-- Gallery tables + bucket child-gallery (see full migration in Supabase)
