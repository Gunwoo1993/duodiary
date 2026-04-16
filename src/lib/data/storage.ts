import { supabase } from '../supabaseClient';

/**
 * Upload photo/video to Supabase Storage (diary_media bucket)
 * Returns the public URL for the uploaded file
 */
export async function uploadDiaryMedia(
  coupleId: string,
  file: File
): Promise<string> {
  if (!coupleId) throw new Error('Couple ID required');
  if (!file) throw new Error('File required');

  // Validate file
  const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/quicktime', 'video/webm'];
  if (!validTypes.includes(file.type)) {
    throw new Error(`Unsupported file type: ${file.type}`);
  }

  // Max 50MB per file
  const maxSize = 50 * 1024 * 1024;
  if (file.size > maxSize) {
    throw new Error('File too large (max 50MB)');
  }

  // Generate unique filename: {coupleId}/{timestamp}_{uuid}_{originalName}
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2, 8);
  const ext = file.name.split('.').pop() || 'bin';
  const fileName = `${coupleId}/${timestamp}_${randomId}.${ext}`;

  // Upload to storage
  const { data, error } = await supabase.storage
    .from('diary_media')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type
    });

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  // Return public URL
  const { data: publicUrlData } = supabase.storage
    .from('diary_media')
    .getPublicUrl(data.path);

  return publicUrlData.publicUrl;
}

/**
 * Batch upload multiple files
 */
export async function uploadDiaryMediaBatch(
  coupleId: string,
  files: File[]
): Promise<string[]> {
  if (!files.length) return [];

  try {
    const urls = await Promise.all(files.map(file => uploadDiaryMedia(coupleId, file)));
    return urls;
  } catch (err: any) {
    throw new Error(`Batch upload failed: ${err?.message ?? err}`);
  }
}

/**
 * Delete a file from storage by public URL
 */
export async function deleteDiaryMedia(publicUrl: string): Promise<void> {
  if (!publicUrl) return;

  // Extract path from URL: https://.../{bucket}/{path} -> {path}
  const urlObj = new URL(publicUrl);
  const pathParts = urlObj.pathname.split('/');
  // Format: /storage/v1/object/public/{bucket}/{path}
  const pathIndex = pathParts.findIndex(p => p === 'diary_media');
  if (pathIndex === -1) return; // Not a diary_media file

  const filePath = pathParts.slice(pathIndex + 1).join('/');
  if (!filePath) return;

  const { error } = await supabase.storage
    .from('diary_media')
    .remove([filePath]);

  if (error && !error.message.includes('not found')) {
    throw new Error(`Delete failed: ${error.message}`);
  }
}
