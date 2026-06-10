const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

export function getPublicStorageUrl(bucket: string, storagePath: string): string {
  const cleanPath = storagePath.replace(/^\//, '');
  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${cleanPath}`;
}

export const CHILD_GALLERY_BUCKET = 'child-gallery';
export const CHILD_AUDIO_BUCKET = 'child-audio';

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}
