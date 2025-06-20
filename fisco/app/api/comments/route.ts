import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

interface CommentWithUser {
  id: string;
  comment_text: string;
  created_at: Date | null;
  user_id: string | null;
  first_name: string | null;
  last_name: string | null;
}

export async function POST(req: NextRequest) {
  const { postId, clerkUserId, commentText } = await req.json();

  if (!postId || !clerkUserId || !commentText) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  try {
    const userResult = await sql`
      SELECT id FROM users WHERE clerk_user_id = ${clerkUserId}
    `;

    if (userResult.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userId = userResult[0].id;

    const result = await sql`
      INSERT INTO comments (post_id, comment_text, user_id)
      VALUES (${postId}, ${commentText}, ${userId})
      RETURNING *;
    `;

    return NextResponse.json(result[0], {headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }});
  } catch (err) {
    return NextResponse.json({ error: "DB error", detail: String(err) }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const postId = searchParams.get("postId");

  if (!postId) {
    return NextResponse.json({ error: "Missing postId" }, { status: 400 });
  }

  try {
    const result = await sql`
      SELECT 
        c.id,
        c.comment_text,
        c.created_at,
        c.user_id,
        u.first_name,
        u.last_name
      FROM comments c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.post_id = ${postId}
      ORDER BY c.created_at ASC;
    `;

    const serialized = (result as CommentWithUser[]).map((row) => ({
      id: row.id,
      comment_text: row.comment_text,
      created_at: row.created_at?.toISOString?.() ?? "",
      user_id: row.user_id ?? "",
      first_name: row.first_name ?? "Anonymous",
      last_name: row.last_name ?? "",
    }));

    return NextResponse.json(serialized, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: "DB error", detail: String(err) },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const commentId = searchParams.get("id");
  const clerkUserId = searchParams.get("clerkUserId");

  if (!commentId || !clerkUserId) {
    return NextResponse.json({ error: "Missing comment ID or user ID" }, { status: 400 });
  }

  try {
    const userResult = await sql`
      SELECT id FROM users WHERE clerk_user_id = ${clerkUserId}
    `;

    if (userResult.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userId = userResult[0].id;

    const commentResult = await sql`
      SELECT user_id FROM comments WHERE id = ${commentId}
    `;

    if (commentResult.length === 0) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    if (commentResult[0].user_id !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await sql`
      DELETE FROM comments WHERE id = ${commentId}
    `;

    return NextResponse.json({ success: true }, {headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }});
  } catch (err) {
    return NextResponse.json({ error: "DB error", detail: String(err) }, { status: 500 });
  }
}