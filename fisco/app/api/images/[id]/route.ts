import { NextResponse } from "next/server";
import { getImage } from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const imageData = await getImage(params.id);
    
    if (!imageData) {
      return NextResponse.json(
        { error: "Image not found" },
        { status: 404 }
      );
    }

    // Return the image data as a binary response
    return new NextResponse(imageData, {
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000',
      },
    });
  } catch (error) {
    console.error("Error retrieving image:", error);
    return NextResponse.json(
      { error: "Error retrieving image" },
      { status: 500 }
    );
  }
}
