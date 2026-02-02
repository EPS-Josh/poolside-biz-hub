import imageCompression from 'browser-image-compression';

export interface CompressionOptions {
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  useWebWorker?: boolean;
}

const defaultOptions: CompressionOptions = {
  maxSizeMB: 1, // Compress to max 1MB
  maxWidthOrHeight: 1920, // Max dimension 1920px
  useWebWorker: true,
};

export const compressImage = async (
  file: File,
  options: CompressionOptions = {}
): Promise<File> => {
  // Skip compression for non-image files or already small files
  if (!file.type.startsWith('image/')) {
    return file;
  }

  // Skip if file is already under 500KB
  if (file.size < 500 * 1024) {
    console.log(`Skipping compression for ${file.name} (already ${Math.round(file.size / 1024)}KB)`);
    return file;
  }

  const compressionOptions = {
    ...defaultOptions,
    ...options,
  };

  try {
    console.log(`Compressing ${file.name}: ${Math.round(file.size / 1024)}KB`);
    
    const compressedFile = await imageCompression(file, compressionOptions);
    
    console.log(
      `Compressed ${file.name}: ${Math.round(file.size / 1024)}KB → ${Math.round(compressedFile.size / 1024)}KB (${Math.round((1 - compressedFile.size / file.size) * 100)}% reduction)`
    );

    return compressedFile;
  } catch (error) {
    console.error('Error compressing image:', error);
    // Return original file if compression fails
    return file;
  }
};

export const compressImages = async (
  files: File[],
  options: CompressionOptions = {}
): Promise<File[]> => {
  return Promise.all(files.map(file => compressImage(file, options)));
};
