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

export async function DELETE(req: Request) {
  try {
    const { postId } = await req.json();
    if (!postId) {
      return NextResponse.json({ error: "Missing post id" }, { status: 400 });
    }
    // First, get the image id associated with this post
    const imageResult = await sql`SELECT fk_image_id FROM posts WHERE id = ${postId}`;
    const imageId = imageResult[0]?.fk_image_id;
    if (!imageId) {
      return NextResponse.json({ error: "No associated image found" }, { status: 404 });
    }
    // Delete the post
    await sql`DELETE FROM posts WHERE id = ${postId}`;
    // Delete the image
    await sql`DELETE FROM images WHERE id = ${imageId}`;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete post error:", error);
    return NextResponse.json({ error: "Failed to delete post" }, { status: 500 });
  }
}