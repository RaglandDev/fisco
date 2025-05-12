"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useUser } from "@clerk/nextjs";


export default function PreviewPage() {
  const { user } = useUser();
  const router = useRouter();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string | null>(null);

  useEffect(() => {
    try {
      const dataUrl = sessionStorage.getItem("previewImageData");
      let mime = sessionStorage.getItem("previewImageType");
      if (dataUrl) {
        setImageUrl(dataUrl);
        if (!mime && dataUrl.startsWith("data:")) {
          const match = dataUrl.match(/^data:(.*?);base64,/);
          mime = match ? match[1] : null;
        }
        setMimeType(mime || null);
      } else {
        setError("No image data found for preview. Please select an image again.");
      }
    } catch (e) {
      setError("Could not retrieve image data. Please try again.");
    }
  }, []);

  // Helper to convert data URL to File
  async function dataURLtoFile(dataurl: string, filename: string, mimeType: string): Promise<File> {
    const res = await fetch(dataurl);
    const blob = await res.blob();
    return new File([blob], filename, { type: mimeType });
  }

  const handleSubmit = async () => {
    if (!imageUrl || !mimeType) {
      setError("Image data missing. Cannot submit.");
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      // 1. Convert Data URL to File
      const imageFile = await dataURLtoFile(imageUrl, "upload.png", mimeType);
      // 2. Upload Image to /api/images
      const formData = new FormData();
      formData.append("file", imageFile);
      const imageUploadResponse = await fetch("/api/images", {
        method: "POST",
        body: formData,
      });
      if (!imageUploadResponse.ok) {
        const errorText = await imageUploadResponse.text();
        throw new Error(`Image upload failed: ${errorText || imageUploadResponse.statusText}`);
      }
      const imageResult = await imageUploadResponse.json();
      const imageId = imageResult.id;
      if (!imageId) throw new Error("Image ID not received after upload.");
      // 3. Create Post with imageId
      const postResponse = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fk_image_id: imageId, clerk_user_id: user?.id }),
      });
      if (!postResponse.ok) {
        const errorText = await postResponse.text();
        throw new Error(`Failed to create post: ${errorText || postResponse.statusText}`);
      }
      router.push("/");
    } catch (err: any) {
      setError(err.message || "Unknown error");
    } finally {
      setIsSubmitting(false);
    }
  };


  if (!imageUrl) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black text-red-500 p-4">
        <p>No image data found for preview. Please go back and select an image.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-4">
      {error && (
        <p className="text-red-500 mb-4">Error: {error}</p>
      )}
      {imageUrl ? (
        <div className="relative w-full max-w-lg aspect-[4/3] mb-6 rounded-lg overflow-hidden border border-gray-700">
          <Image 
            src={imageUrl} 
            alt="Preview" 
            layout="fill"
            objectFit="contain"
            unoptimized
          />
        </div>
      ) : !error ? (
        <div className="flex flex-col items-center justify-center h-64 w-full">
          <Loader2 className="h-8 w-8 animate-spin mb-2" />
          <p>Loading image...</p>
        </div>
      ) : null} 
      
      <Button
        onClick={handleSubmit}
        disabled={isSubmitting || !imageUrl || !!error}
        className="px-8 py-3 text-lg"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Submitting...
          </>
        ) : (
          "Post"
        )}
      </Button>
    </div>
  );
}
