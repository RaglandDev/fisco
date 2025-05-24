import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";

const sql = neon(process.env.DATABASE_URL!);

export async function GET(req: Request) {
  const url = new URL(req.url);
  const limit = parseInt(url.searchParams.get('limit') || '2');
  const offset = parseInt(url.searchParams.get('offset') || '0');

  const posts = await sql`
    SELECT 
      posts.*,
      images.s3_url AS image_url,
      users.first_name,
      users.last_name,
      users.email,
      users.clerk_user_id,
      (
        SELECT COUNT(*)::INT 
        FROM comments 
        WHERE comments.post_id = posts.id
      ) AS comment_count
    FROM posts
    LEFT JOIN images ON posts.fk_image_id = images.id
    LEFT JOIN users ON posts.fk_author_id::text = users.id::text
    ORDER BY posts.created_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `;

  return NextResponse.json(
    { posts },
    {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    }
  );
}

export async function POST(req: Request) {
  const { post_id, userId } = await req.json();

  if (!post_id || !userId) {
    return NextResponse.json({ error: "Missing post_id or userId" }, { status: 400 });
  }

  try {
    await sql`
      UPDATE posts
      SET likes = likes || to_jsonb(${userId}::text)
      WHERE id = ${post_id} AND NOT (likes @> to_jsonb(ARRAY[${userId}::text]))
    `;

    await sql`
      UPDATE users
      SET liked_posts = liked_posts || to_jsonb(ARRAY[${post_id}])
      WHERE clerk_user_id = ${userId}
        AND NOT (liked_posts @> to_jsonb(ARRAY[${post_id}]))
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error liking post:", error);
    return NextResponse.json({ error: "Failed to like post" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const { post_id, userId } = await req.json();

  if (!post_id || !userId) {
    return NextResponse.json({ error: "Missing post_id or userId" }, { status: 400 });
  }

  try {
    await sql`
      UPDATE posts
      SET likes = likes - ${userId}::text
      WHERE id = ${post_id}::uuid
    `;

    await sql`
      UPDATE users
      SET liked_posts = liked_posts - ${post_id}
      WHERE clerk_user_id = ${userId}::text
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting like:", error);
    return NextResponse.json({ error: "Failed to delete like" }, { status: 500 });
  }
}
