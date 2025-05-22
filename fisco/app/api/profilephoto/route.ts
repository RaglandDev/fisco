import { neon } from "@neondatabase/serverless";
import { NextRequest, NextResponse } from "next/server";

const sql = neon(process.env.DATABASE_URL!);

export async function POST(req: Request) {
  const contentType = req.headers.get("content-type") || "";
  if (!contentType.includes("multipart/form-data")) {
    return NextResponse.json({ error: "Unsupported content type" }, { status: 400 });
  }

  const formData = await req.formData();
  const file = formData.get("file");
  const userId = formData.get("user_id");

  if (!file || !(file instanceof Blob)) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  if (!userId || typeof userId !== "string") {
    return NextResponse.json({ error: "Missing user_id" }, { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  try {
    const result = await sql`
      INSERT INTO images (data) VALUES (${buffer}) RETURNING id;
    `;
    const imageId = result[0]?.id;
    if (!imageId) throw new Error("Failed to insert image");

    await sql`
      UPDATE users
      SET fk_image_id = ${imageId}
      WHERE clerk_user_id = ${userId};
    `;

    const imageResult = await sql`
      SELECT encode(data, 'base64') AS image_data
      FROM images
      WHERE id = ${imageId};
    `;

    return NextResponse.json({
      id: imageId,
      image_data: imageResult[0]?.image_data || null,
    }, {headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }});
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Failed to upload or update user" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("user_id");

  if (!userId) {
    return NextResponse.json({ error: "Missing user_id" }, { status: 400 });
  }

  try {
    const result = await sql`
      SELECT image_url
      FROM users
      WHERE clerk_user_id = ${userId};
    `;

    return NextResponse.json({ image_url: result[0]?.image_url || null }, {headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }});
  } catch (error) {
    console.error("Failed to fetch profile image:", error);
    return NextResponse.json({ error: "Failed to fetch profile image" }, { status: 500,  headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    } });
  }
}
