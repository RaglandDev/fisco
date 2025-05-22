// app/api/media/route.ts

import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import {getSignedUrl} from "@aws-sdk/s3-request-presigner"
import { randomUUID } from "crypto";

const s3 = new S3Client({
  region: process.env.REGION!,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY!,
    secretAccessKey: process.env.SECRET_KEY!,
  },
});

export async function GET(req: NextRequest) {
  const fileType = req.nextUrl.searchParams.get("fileType");

  if (!fileType) {
    return NextResponse.json({ error: "Missing fileType" }, { status: 400 });
  }

  const ext = fileType.split("/")[1];
  const Key = `${randomUUID()}.${ext}`;

  const command = new PutObjectCommand({
    Bucket: process.env.BUCKET_NAME!,
    Key,
    ContentType: fileType,
    ACL: 'public-read' // make uploaded image public for reading
  });

  const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 60 });
  const publicUrl = `https://${process.env.BUCKET_NAME}.s3.${process.env.REGION}.amazonaws.com/${Key}`;

  return NextResponse.json({
    uploadUrl,
    key: Key,
    url: publicUrl
  }, {headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }});
}
