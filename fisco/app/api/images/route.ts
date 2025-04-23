import { NextResponse } from "next/server";
import { createPost, storeImage } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const data = await request.formData();
    const file: File | null = data.get("file") as unknown as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size too large. Maximum size is 10MB" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: "Only image files are allowed" },
        { status: 400 }
      );
    }

    // Convert file to buffer for database storage
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Store image in database
    const imageResult = await storeImage(buffer);
    
    // Create a data URL for immediate display
    const base64 = buffer.toString('base64');
    const dataUrl = `data:${file.type};base64,${base64}`;

    // Generate a UUID for the new post
    const postId = crypto.randomUUID();
    
    // Store post metadata with minimal required fields
    const post = await createPost({
      id: postId,
      fk_image_id: imageResult.id
    });

    return NextResponse.json({
      url: dataUrl,
      post: post,
      imageId: imageResult.id
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Error uploading file" },
      { status: 500 }
    );
  }
}

