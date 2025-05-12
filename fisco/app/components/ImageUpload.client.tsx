'use client';

import { useState, useRef, forwardRef, useImperativeHandle } from 'react';

interface ImageUploadProps {
  onUploadComplete?: (imageUrl: string) => void;
  onUploadError?: (error: string) => void;
}

// Define the handle type
export interface ImageUploadHandle {
  triggerFileSelect: () => void;
}

const ImageUpload = forwardRef<ImageUploadHandle, ImageUploadProps>((props, ref) => {
  const { onUploadComplete, onUploadError } = props;
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Expose the triggerFileSelect method to parent components
  useImperativeHandle(ref, () => ({
    triggerFileSelect: () => {
      inputRef.current?.click();
    },
  }));

  const previewImage = async (file: File) => {
    try {
      setIsUploading(true);
      setError("");
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        if (onUploadComplete) {
          onUploadComplete(result); // result is a data URL
        }
        setIsUploading(false);
      };
      reader.onerror = () => {
        setError("Failed to read the image file.");
        setIsUploading(false);
        if (onUploadError) {
          onUploadError("Failed to read the image file.");
        }
      };
      reader.readAsDataURL(file);
    } catch (error: unknown) {
      console.error("Preview error:", error);
      let errorMessage = "Failed to prepare image preview.";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      setError(errorMessage);
      if (onUploadError) {
        onUploadError(errorMessage);
      }
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const maxSizeMB = 10;
      if (file.size > maxSizeMB * 1024 * 1024) {
        const errorMsg = `File is too large. Maximum allowed size is ${maxSizeMB}MB.`;
        setError(errorMsg);
        if (onUploadError) {
          onUploadError(errorMsg);
        }
        return;
      }
      previewImage(file);
    }
  };

  return (
    <div className="h-full">
      <input
        data-testid="File upload"
        ref={inputRef}
        type="file"
        accept="image/*"  // Accepts any image file
        onChange={handleFileChange}
        disabled={isUploading}
        style={{ display: "none" }}
      />
      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
      {isUploading && <p className="text-white text-sm mt-2">Uploading...</p>}
    </div>
  );
});

ImageUpload.displayName = 'ImageUpload';

export default ImageUpload;