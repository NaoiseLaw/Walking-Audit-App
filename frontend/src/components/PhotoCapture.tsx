'use client';

import { useState, useRef } from 'react';
import { usePhotoCapture } from '@/hooks/usePhotoCapture';

interface PhotoCaptureProps {
  onPhotoCaptured: (photo: {
    file: File;
    dataUrl: string;
    location?: { latitude: number; longitude: number };
  }) => void;
}

export default function PhotoCapture({ onPhotoCaptured }: PhotoCaptureProps) {
  const { capturePhoto, isCapturing, error } = usePhotoCapture();
  const [preview, setPreview] = useState<string | null>(null);

  const handleCapture = async () => {
    const photo = await capturePhoto({
      includeLocation: true,
    });

    if (photo) {
      setPreview(photo.dataUrl);
      onPhotoCaptured(photo);
    }
  };

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={handleCapture}
        disabled={isCapturing}
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
      >
        {isCapturing ? 'Capturing...' : 'Capture Photo'}
      </button>

      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="text-sm text-red-800">{error}</div>
        </div>
      )}

      {preview && (
        <div className="mt-4">
          <img src={preview} alt="Preview" className="max-w-full h-auto rounded-lg" />
        </div>
      )}
    </div>
  );
}

