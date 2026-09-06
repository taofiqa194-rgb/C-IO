/**
 * Image Optimization & Upload Utility for C'IO Marketplace
 * 
 * Enforces:
 * 1. JPG / JPEG format strictly
 * 2. Maximum 300 KB file size with high-efficiency client-side compression & resizing
 * 3. Immediate background upload with real progress reporting
 * 4. Fast, fail-safe fallback so listings never get stuck
 */

export interface OptimizedImageResult {
  file: File;
  blob: Blob;
  dataUrl: string;
  width: number;
  height: number;
  sizeKb: number;
  originalSizeKb: number;
}

const MAX_FILE_SIZE_BYTES = 300 * 1024; // 300 KB limit
const MAX_DIMENSION = 1280; // Max width/height for crystal clear mobile & desktop view

/**
 * Validates whether the given file is JPG/JPEG
 */
export function isJpegImage(file: File): boolean {
  const mime = (file.type || '').toLowerCase();
  const name = (file.name || '').toLowerCase();
  return (
    mime === 'image/jpeg' ||
    mime === 'image/jpg' ||
    mime === 'image/pjpeg' ||
    name.endsWith('.jpg') ||
    name.endsWith('.jpeg')
  );
}

/**
 * Optimizes an image: validates JPG/JPEG, resizes large dimensions,
 * and compresses to guarantee file size is strictly under 300 KB while
 * preserving high optical quality.
 */
export async function optimizeImageForUpload(file: File): Promise<OptimizedImageResult> {
  const originalSizeKb = Math.round(file.size / 1024);

  // 1. Strict format check: JPG / JPEG only
  if (!isJpegImage(file)) {
    throw new Error('Only JPG or JPEG images are accepted. Please select a photo in .jpg or .jpeg format.');
  }

  // 2. Load into an Image element
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read selected image file.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Unable to decode the selected image file.'));
      img.onload = async () => {
        try {
          let { width, height } = img;

          // Calculate aspect ratio preserving resize
          if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
            if (width > height) {
              height = Math.round((height * MAX_DIMENSION) / width);
              width = MAX_DIMENSION;
            } else {
              width = Math.round((width * MAX_DIMENSION) / height);
              height = MAX_DIMENSION;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            throw new Error('Canvas context could not be initialized.');
          }

          // Use high quality image rendering
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          // Iterate quality to guarantee size is strictly under 300 KB
          let quality = 0.85;
          let blob: Blob | null = null;

          // Try progressive compression
          for (let attempt = 0; attempt < 5; attempt++) {
            blob = await new Promise<Blob | null>((res) => {
              canvas.toBlob((b) => res(b), 'image/jpeg', quality);
            });

            if (blob && blob.size <= MAX_FILE_SIZE_BYTES) {
              break;
            }

            // Lower quality in steps: 0.85 -> 0.72 -> 0.60 -> 0.50 -> 0.40
            quality -= 0.12;
          }

          // Final fallback if still somehow over 300KB (rare edge case):
          if (!blob || blob.size > MAX_FILE_SIZE_BYTES) {
            // Resize canvas down further to 900px
            const scaleDown = 0.75;
            canvas.width = Math.round(width * scaleDown);
            canvas.height = Math.round(height * scaleDown);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            blob = await new Promise<Blob | null>((res) => {
              canvas.toBlob((b) => res(b), 'image/jpeg', 0.65);
            });
          }

          if (!blob) {
            throw new Error('Could not compress image to JPEG.');
          }

          const finalSizeKb = Math.round(blob.size / 1024);
          if (blob.size > MAX_FILE_SIZE_BYTES) {
            throw new Error(`Image could not be compressed under 300 KB (currently ${finalSizeKb} KB). Please select a smaller photo.`);
          }

          // Generate data URL for instant zero-latency preview
          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          const cleanName = file.name.replace(/\.[^/.]+$/, '') + '.jpg';
          const optimizedFile = new File([blob], cleanName, { type: 'image/jpeg' });

          resolve({
            file: optimizedFile,
            blob,
            dataUrl,
            width: canvas.width,
            height: canvas.height,
            sizeKb: finalSizeKb,
            originalSizeKb,
          });
        } catch (err: any) {
          reject(err instanceof Error ? err : new Error(String(err)));
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Fast background upload to server with real-time percentage progress.
 * If server is temporarily unreachable, cleanly falls back to the optimized data URL
 * without hanging or blocking the seller.
 */
export function uploadOptimizedImageWithProgress(
  optimized: OptimizedImageResult,
  onProgress: (percent: number) => void
): Promise<string> {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    const timeoutTimer = setTimeout(() => {
      xhr.abort();
      console.warn('Upload timed out after 12s, falling back to instant inline image data');
      onProgress(100);
      resolve(optimized.dataUrl);
    }, 12000);

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const percent = Math.min(99, Math.round((e.loaded / e.total) * 100));
        onProgress(percent);
      }
    });

    xhr.addEventListener('load', () => {
      clearTimeout(timeoutTimer);
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const res = JSON.parse(xhr.responseText);
          if (res.url) {
            onProgress(100);
            return resolve(res.url);
          }
        } catch (e) {
          // Fallback
        }
      }
      // If server returned non-200 or unexpected structure, fall back cleanly
      console.warn('Upload endpoint returned status', xhr.status, xhr.responseText);
      onProgress(100);
      resolve(optimized.dataUrl);
    });

    xhr.addEventListener('error', () => {
      clearTimeout(timeoutTimer);
      console.warn('Network error during upload, falling back cleanly to optimized data URL');
      onProgress(100);
      resolve(optimized.dataUrl);
    });

    xhr.open('POST', '/api/upload');
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(JSON.stringify({
      imageBase64: optimized.dataUrl,
      filename: optimized.file.name,
      sizeKb: optimized.sizeKb,
    }));
  });
}
