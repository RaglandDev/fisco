import { neon } from "@neondatabase/serverless";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

const sql = neon(process.env.DATABASE_URL!);
const s3 = new S3Client({
  region: process.env.REGION!,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY!,
    secretAccessKey: process.env.SECRET_KEY!,
  },
});

export async function POST(req: Request) {
  const contentType = req.headers.get("content-type") || "";
  if (!contentType.includes("multipart/form-data")) {
    return NextResponse.json({ error: "Unsupported content type" }, { status: 400 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as Blob | null;
  const userId = formData.get("user_id")?.toString();

  if (!file || !(file instanceof Blob) || !userId) {
    return NextResponse.json({ error: "Invalid file or user_id" }, { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const fileExtension = "png";
  const s3Key = `profile/${userId}-${crypto.randomUUID()}.${fileExtension}`;
  const s3Url = `https://${process.env.BUCKET_NAME}.s3.${process.env.REGION}.amazonaws.com/${s3Key}`;

  try {
    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.BUCKET_NAME!,
        Key: s3Key,
        Body: buffer,
        ContentType: "image/png",
        ACL: "public-read",
      })
    );

    const result = await sql`
      INSERT INTO images (s3_key, s3_url) VALUES (${s3Key}, ${s3Url}) RETURNING id;
    `;
    const imageId = result[0]?.id;

    await sql`
      UPDATE users SET fk_image_id = ${imageId} WHERE clerk_user_id = ${userId};
    `;

    return NextResponse.json({ id: imageId, image_url: s3Url });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Failed to upload to S3 or save to DB" }, { status: 500 });
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
      SELECT images.s3_url
      FROM users
      JOIN images ON users.fk_image_id = images.id
      WHERE users.clerk_user_id = ${userId};
    `;

    return NextResponse.json({ image_url: result[0]?.s3_url || null });
  } catch (error) {
    console.error("Fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch profile image" }, { status: 500 });
  }
}