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
      encode(images.data, 'base64') AS image_data,
      users.first_name,
      users.last_name,
      users.email
    FROM posts
    LEFT JOIN images ON posts.fk_image_id = images.id
    LEFT JOIN users ON posts.fk_author_id::text = users.clerk_user_id
    LIMIT ${limit} OFFSET ${offset}
  `;

  return NextResponse.json({
    posts,        // The list of posts based on the limit and offset
  }, {headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }});
}

export async function POST(req: Request) {
    const { post_id, userId } = await req.json(); // ✅ no destructuring from `params`
  
    if (!post_id || !userId) {
      return NextResponse.json({ error: "Missing post_id or userId" }, { status: 400 });
    }
  
    // Append userId to likes if it's not already present
    await sql`
      UPDATE posts
      SET likes = likes || to_jsonb(${userId}::text)
      WHERE id = ${post_id} AND NOT (likes @> to_jsonb(ARRAY[${userId}::text]))
    `;
  
    return NextResponse.json({ success: true });
  }

export async function DELETE(req: Request) {
    const { post_id, userId } = await req.json();
  
    if (!post_id || !userId) {
      return NextResponse.json({ error: "Missing post_id or userId" }, { status: 400 });
    }
  
    await sql`
        UPDATE posts
        SET likes = likes - ${userId}::text
        WHERE id = ${post_id}
        `;

  
    return NextResponse.json({ success: true });
  }
  