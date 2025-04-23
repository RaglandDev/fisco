import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";

const sql = neon(process.env.DATABASE_URL!);

export async function GET() {
    const result = await sql`
    SELECT 
      posts.*,
      encode(images.data, 'base64') AS image_data,
      users.first_name,
      users.last_name,
      users.email
    FROM posts
    LEFT JOIN images ON posts.fk_image_id = images.id
    LEFT JOIN users ON posts.fk_author_id::text = users.clerk_user_id
  `;
  return NextResponse.json(result);
}