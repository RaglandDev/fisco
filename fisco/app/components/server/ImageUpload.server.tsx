'use client';

import Image from 'next/image';
import { useState } from 'react';
import { Button } from "@/components/ui/button";

export default function ImageUpload() {
  const [imageUrl, setImageUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');

  const uploadImage = async (file: File) => {
    try {
      setIsUploading(true);
      setError('');
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/images', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      setImageUrl(data.url);
      setError('');
    } catch (error: any) {
      console.error('Upload error:', error);
      setError(error.message || 'Failed to upload image');
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
    <div className="flex min-h-screen flex-col items-center justify-center bg-white">
      <input
        id="image-upload-input"
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        disabled={isUploading}
        className="hidden"
      />
      <label htmlFor="image-upload-input" className="mb-8">
        <Button variant="outline" disabled={isUploading} asChild>
          <span>{isUploading ? "Uploading..." : "New Post"}</span>
        </Button>
      </label>
      {imageUrl && (
        <div className="relative w-full max-w-xs aspect-[4/5] rounded-md overflow-hidden bg-gray-100">
          <Image
            src={imageUrl}
            alt="Uploaded image"
            fill
            style={{ objectFit: 'contain' }}
            className="rounded-md"
            sizes="(max-width: 768px) 100vw, 384px"
            priority
          />
        </div>
      )}
    </div>
  );
}
