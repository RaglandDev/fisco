'use client';

import { useState, useRef, forwardRef, useImperativeHandle } from 'react';

interface ImageUploadProps {
  onUploadComplete?: (imageUrl: string) => void;
  onUploadError?: (error: string) => void;
}

// Define the handle type for the ref
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

  const uploadImage = async (file: File) => {
    try {
      setIsUploading(true);
      setError("");
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/images", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Upload failed");
      }

      // Call the callback with the image URL
      if (onUploadComplete) {
        onUploadComplete(data.url);
      }
    } catch (error: any) {
      console.error("Upload error:", error);
      const errorMessage = error.message || "Failed to upload image";
      setError(errorMessage);
      
      // Call the error callback
      if (onUploadError) {
        onUploadError(errorMessage);
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadImage(file);
    }
  };

  return (
    <div className="h-full">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
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