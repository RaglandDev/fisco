import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";

const sql = neon(process.env.DATABASE_URL!);

export async function POST(req: Request) {
  // Only allow multipart form data
  const contentType = req.headers.get("content-type") || "";
  if (!contentType.includes("multipart/form-data")) {
    return NextResponse.json({ error: "Unsupported content type" }, { status: 400 });
  }

  // Parse the form data
  const formData = await req.formData();
  const file = formData.get("file");
  if (!file || !(file instanceof Blob)) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  // Read the file as ArrayBuffer
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  try {
    // Insert image into database
    const result = await sql`
      INSERT INTO images (data) VALUES (${buffer}) RETURNING id;
    `;
    const imageId = result[0]?.id;
    if (!imageId) {
      throw new Error("Failed to insert image");
    }
    return NextResponse.json({ id: imageId });
  } catch (error) {
    console.error("Image upload error:", error);
    return NextResponse.json({ error: "Failed to upload image" }, { status: 500 });
  }
}
