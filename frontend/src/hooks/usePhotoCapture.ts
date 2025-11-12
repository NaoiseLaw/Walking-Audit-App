import { useState, useCallback, useRef } from 'react';

interface PhotoCaptureOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  includeLocation?: boolean;
}

interface CapturedPhoto {
  file: File;
  dataUrl: string;
  location?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  };
  exifData?: Record<string, any>;
}

export function usePhotoCapture() {
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Capture photo from camera or file input
   */
  const capturePhoto = useCallback(
    async (options: PhotoCaptureOptions = {}): Promise<CapturedPhoto | null> => {
      const {
        maxWidth = 2048,
        maxHeight = 2048,
        quality = 0.85,
        includeLocation = true,
      } = options;

      setIsCapturing(true);
      setError(null);

      try {
        // Get location if requested
        let location: { latitude: number; longitude: number; accuracy?: number } | undefined;
        if (includeLocation && navigator.geolocation) {
          location = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
              (position) => {
                resolve({
                  latitude: position.coords.latitude,
                  longitude: position.coords.longitude,
                  accuracy: position.coords.accuracy,
                });
              },
              reject,
              { enableHighAccuracy: true, timeout: 10000 }
            );
          });
        }

        // Capture photo from file input
        return new Promise((resolve, reject) => {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = 'image/*';
          input.capture = 'environment'; // Use back camera on mobile

          input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) {
              reject(new Error('No file selected'));
              return;
            }

            try {
              // Read file as data URL
              const dataUrl = await readFileAsDataURL(file);

              // Compress image
              const compressed = await compressImage(dataUrl, maxWidth, maxHeight, quality);

              // Extract EXIF data (simplified - in production, use exif-js)
              const exifData = await extractEXIF(file);

              resolve({
                file: compressed.file,
                dataUrl: compressed.dataUrl,
                location,
                exifData,
              });
            } catch (err) {
              reject(err);
            }
          };

          input.click();
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to capture photo');
        return null;
      } finally {
        setIsCapturing(false);
      }
    },
    []
  );

  /**
   * Open camera
   */
  const openCamera = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, []);

  return {
    isCapturing,
    error,
    capturePhoto,
    openCamera,
    fileInputRef,
  };
}

/**
 * Read file as data URL
 */
function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Compress image
 */
function compressImage(
  dataUrl: string,
  maxWidth: number,
  maxHeight: number,
  quality: number
): Promise<{ file: File; dataUrl: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      // Calculate new dimensions
      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to compress image'));
            return;
          }

          const file = new File([blob], 'photo.jpg', { type: 'image/jpeg' });
          const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);

          resolve({ file, dataUrl: compressedDataUrl });
        },
        'image/jpeg',
        quality
      );
    };
    img.onerror = reject;
    img.src = dataUrl;
  });
}

/**
 * Extract EXIF data (simplified)
 */
async function extractEXIF(file: File): Promise<Record<string, any>> {
  // In production, use a library like exif-js or piexifjs
  // This is a placeholder
  return {};
}

