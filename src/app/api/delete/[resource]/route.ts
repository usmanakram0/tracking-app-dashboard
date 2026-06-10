import { NextRequest, NextResponse } from 'next/server';
import { DELETE_RESOURCES, type DeleteResource } from '@/lib/api/types';
import { createClient } from '@/lib/supabase/server';
import { CHILD_AUDIO_BUCKET, CHILD_GALLERY_BUCKET } from '@/lib/storage';

const TABLE_MAP: Record<DeleteResource, string> = {
  notifications: 'notifications_log',
  contacts: 'phone_contacts',
  locations: 'location_logs',
  sms: 'sms_messages',
  gallery: 'gallery_media',
  audio: 'audio_media',
};

const MAX_DELETE_BATCH = 100;

function isValidResource(value: string): value is DeleteResource {
  return (DELETE_RESOURCES as readonly string[]).includes(value);
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ resource: string }> }
) {
  const { resource } = await context.params;

  if (!isValidResource(resource)) {
    return NextResponse.json({ error: 'Invalid resource' }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { ids?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const ids = body.ids;
  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: 'ids array is required' }, { status: 400 });
  }

  if (ids.length > MAX_DELETE_BATCH) {
    return NextResponse.json(
      { error: `Too many items (max ${MAX_DELETE_BATCH})` },
      { status: 400 }
    );
  }

  const hasInvalidId = ids.some(
    (id) => typeof id !== 'string' && typeof id !== 'number'
  );
  if (hasInvalidId) {
    return NextResponse.json({ error: 'All ids must be strings or numbers' }, { status: 400 });
  }

  const table = TABLE_MAP[resource];
  const parentId = user.id;

  try {
    if (resource === 'gallery' || resource === 'audio') {
      const bucket =
        resource === 'gallery' ? CHILD_GALLERY_BUCKET : CHILD_AUDIO_BUCKET;

      const { data: items, error: fetchError } = await supabase
        .from(table)
        .select('id, storage_path')
        .in('id', ids)
        .eq('parent_id', parentId);

      if (fetchError) throw fetchError;
      if (!items || items.length === 0) {
        return NextResponse.json({ deleted: 0 });
      }

      const storagePaths = items.map((item) => item.storage_path as string);
      const ownedIds = items.map((item) => item.id);

      const { error: storageError } = await supabase.storage
        .from(bucket)
        .remove(storagePaths);

      if (storageError) throw storageError;

      const { error: dbError } = await supabase
        .from(table)
        .delete()
        .in('id', ownedIds)
        .eq('parent_id', parentId);

      if (dbError) throw dbError;

      return NextResponse.json({ deleted: ownedIds.length });
    }

    const { error } = await supabase
      .from(table)
      .delete()
      .in('id', ids)
      .eq('parent_id', parentId);

    if (error) throw error;

    return NextResponse.json({ deleted: ids.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Delete failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
