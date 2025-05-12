import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";

const sql = neon(process.env.DATABASE_URL!);

export async function POST(req: Request) {
  try {
    const { fk_image_id, clerk_user_id } = await req.json();
    if (!fk_image_id || !clerk_user_id) {
      return NextResponse.json({ error: "Missing fk_image_id or clerk_user_id" }, { status: 400 });
    }

    // Lookup the UUID in your users table
    const userResult = await sql`
      SELECT id FROM users WHERE clerk_user_id = ${clerk_user_id}
    `;
    const author_uuid = userResult[0]?.id;
    if (!author_uuid) {
      return NextResponse.json({ error: "No matching user found" }, { status: 404 });
    }

    // Insert post with the found UUID
    const result = await sql`
      INSERT INTO posts (fk_image_id, fk_author_id) VALUES (${fk_image_id}, ${author_uuid}) RETURNING id;
    `;
    const postId = result[0]?.id;
    if (!postId) {
      throw new Error("Failed to create post");
    }
    return NextResponse.json({ id: postId });
  } catch (error) {
    console.error("Post creation error:", error);
    return NextResponse.json({ error: "Failed to create post" }, { status: 500 });
  }
}