import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";

const sql = neon(process.env.DATABASE_URL!);


export async function POST(req: Request) {
  try {
    const body = await req.json();

    // === Case 1: Fetch posts by array of IDs ===
    if (Array.isArray(body.ids)) {
      const ids = body.ids;
      if (ids.length === 0) return NextResponse.json({ posts: [] }, {headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }});

      const result = await sql`
        SELECT 
          p.id,
          i.s3_url
        FROM posts p
        JOIN images i ON p.fk_image_id = i.id
        WHERE p.id = ANY(${ids})
      `;

      const posts = result.map((row) => ({
        id: row.id,
        image_url: row.s3_url,
      }));

      return NextResponse.json({ posts }, {headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }});
    }

    // === Case 2: Create a new post ===
    const { fk_image_id, clerk_user_id, tags } = body;

    if (!fk_image_id || !clerk_user_id) {
      return NextResponse.json(
        { error: "Missing fk_image_id or clerk_user_id" },
        { status: 400 }
      );
    }

    const userResult = await sql`
      SELECT id FROM users WHERE clerk_user_id = ${clerk_user_id}
    `;
    const author_uuid = userResult[0]?.id;

    if (!author_uuid) {
      return NextResponse.json({ error: "No matching user found" }, { status: 404 });
    }

    const insertResult = await sql`
      INSERT INTO posts (fk_image_id, fk_author_id, tags)
      VALUES (${fk_image_id}, ${author_uuid}, ${tags})
      RETURNING id;
    `;

    const postId = insertResult[0]?.id;

    if (!postId) {
      throw new Error("Failed to create post");
    }

    return NextResponse.json({ id: postId }, {headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }});

  } catch (error) {
    console.error("Post creation/fetch error:", error);
    return NextResponse.json({ error: "Failed to create or fetch posts" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { postId } = await req.json();
    if (!postId) {
      return NextResponse.json({ error: "Missing post id" }, { status: 400 });
    }

    const imageResult = await sql`
      SELECT fk_image_id FROM posts WHERE id = ${postId}
    `;
    const imageId = imageResult[0]?.fk_image_id;
    if (!imageId) {
      return NextResponse.json({ error: "No associated image found" }, { status: 404 });
    }

    // Delete all comments associated with this post
    await sql`DELETE FROM comments WHERE post_id = ${postId}`;
    // Delete the post itself
    await sql`DELETE FROM posts WHERE id = ${postId}`;
    // Delete the associated image row (NOTE: this does not remove from S3 itself)
    await sql`DELETE FROM images WHERE id = ${imageId}`;

    return NextResponse.json({ success: true }, {headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }});
  } catch (error) {
    console.error("Delete post error:", error);
    return NextResponse.json({ error: "Failed to delete post" }, { status: 500 });
  }
}
