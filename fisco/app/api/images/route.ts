import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";

const sql = neon(process.env.DATABASE_URL!);

export async function POST(req: Request) {
  try {
    const { key, url } = await req.json();

    if (!key || !url) {
      return NextResponse.json({ error: "Missing key or url" }, { status: 400 });
    }

    // Insert key and url into the database
    const result = await sql`
      INSERT INTO images (s3_key, s3_url)
      VALUES (${key}, ${url})
      RETURNING id;
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
