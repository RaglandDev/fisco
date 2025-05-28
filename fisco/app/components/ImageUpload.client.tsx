'use client';

import { useState, useRef, forwardRef, useImperativeHandle } from 'react';

interface ImageUploadProps {
  onUploadComplete?: (imageUrl: string) => void;
  onUploadError?: (error: string) => void;
}

export interface ImageUploadHandle {
  triggerFileSelect: () => void;
}

const ImageUpload = forwardRef<ImageUploadHandle, ImageUploadProps>((props, ref) => {
  const { onUploadComplete, onUploadError } = props;
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useImperativeHandle(ref, () => ({
    triggerFileSelect: () => {
      inputRef.current?.click();
    },
  }));

  const isHeic = (file: File) => {
    const lowerName = file.name.toLowerCase();
    return (
      file.type.includes('heic') ||
      file.type.includes('heif') ||
      lowerName.endsWith('.heic') ||
      lowerName.endsWith('.heif')
    );
  };

  const previewImage = async (file: File) => {
    try {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        onUploadComplete?.(result);
        setIsUploading(false);
      };
      reader.onerror = () => {
        const errMsg = 'Failed to read the image file.';
        setError(errMsg);
        onUploadError?.(errMsg);
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to preview image.';
      setError(errorMessage);
      onUploadError?.(errorMessage);
      setIsUploading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  const maxSizeMB = 10;
  if (file.size > maxSizeMB * 1024 * 1024) {
    const errorMsg = `File is too large. Maximum allowed size is ${maxSizeMB}MB.`;
    setError(errorMsg);
    onUploadError?.(errorMsg);
    return;
  }

  if (isHeic(file)) {
    const errMsg = "HEIC/HEIF images are not supported. Please upload a JPG or PNG.";
    setError(errMsg);
    onUploadError?.(errMsg);
    setIsUploading(false);
    return;
  }

  try {
    setIsUploading(true);
    setError('');
    await previewImage(file);
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : 'Unexpected error during upload.';
    console.error('File upload error:', err);
    setError(errMsg);
    onUploadError?.(errMsg);
    setIsUploading(false);
  }
};

  return (
    <div className="h-full">
      <input
        data-testid="File upload"
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        disabled={isUploading}
        style={{ display: 'none' }}
      />
      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
      {isUploading && <p className="text-white text-sm mt-2">Uploading...</p>}
    </div>
  );
});

ImageUpload.displayName = 'ImageUpload';

export default ImageUpload;