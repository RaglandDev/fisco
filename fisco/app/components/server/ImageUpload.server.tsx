'use client';
import Image from 'next/image';
import { useState } from 'react';
import { Button } from "@/components/ui/button";

import { useRef } from "react";

export default function ImageUpload() {
  const [imageUrl, setImageUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

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

      setImageUrl(data.url);
    } catch (error: any) {
      console.error("Upload error:", error);
      setError(error.message || "Failed to upload image");
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

  const handleButtonClick = () => {
    inputRef.current?.click();
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        disabled={isUploading}
        style={{ display: "none" }}
      />
      <Button variant="default" onClick={handleButtonClick} disabled={isUploading}>
        {isUploading ? "Uploading..." : "New Post"}
      </Button>
      {error && <p>{error}</p>}
      {imageUrl && (
        <div>
          <img src={imageUrl} alt="Uploaded" style={{ maxWidth: "100%" }} />
        </div>
      )}
    </div>
  );
}