import { supabase } from '@/integrations/supabase/client';

interface TransformOptions {
  width?: number;
  height?: number;
  resize?: 'contain' | 'cover' | 'fill';
  quality?: number;
}

/**
 * Generate a signed URL for a storage file with optional image transformation
 * @param bucket - Storage bucket name
 * @param filePath - Path to the file in the bucket
 * @param expiresIn - Expiry time in seconds (default: 3600 = 1 hour)
 * @param transform - Optional transformation options for images
 */
export const getSignedUrl = async (
  bucket: string,
  filePath: string,
  expiresIn: number = 3600,
  transform?: TransformOptions
): Promise<string | null> => {
  try {
    // Extract the storage path from URL if needed
    let storagePath = filePath;
    if (filePath.startsWith('http')) {
      const match = filePath.match(new RegExp(`${bucket}/(.+)$`));
      if (match) {
        storagePath = match[1];
      }
    }

    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(storagePath, expiresIn, {
        transform: transform ? {
          width: transform.width,
          height: transform.height,
          resize: transform.resize || 'contain',
          quality: transform.quality || 80,
        } : undefined,
      });

    if (error) {
      console.error('Error generating signed URL:', error);
      return null;
    }

    return data.signedUrl;
  } catch (error) {
    console.error('Error generating signed URL:', error);
    return null;
  }
};

/**
 * Generate a thumbnail URL for an image (400px max dimension)
 */
export const getThumbnailUrl = async (
  bucket: string,
  filePath: string,
  expiresIn: number = 3600
): Promise<string | null> => {
  return getSignedUrl(bucket, filePath, expiresIn, {
    width: 400,
    height: 400,
    resize: 'contain',
    quality: 75,
  });
};

/**
 * Generate a full-size URL for an image (optimized but not resized)
 */
export const getFullSizeUrl = async (
  bucket: string,
  filePath: string,
  expiresIn: number = 3600
): Promise<string | null> => {
  return getSignedUrl(bucket, filePath, expiresIn);
};
