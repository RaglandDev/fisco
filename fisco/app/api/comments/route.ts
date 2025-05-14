import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

interface CommentRow {
  id: string;
  comment_text: string;
  created_at: Date | null;
  user_id: string | null;
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

    return NextResponse.json(result[0]);
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
    const result = (await sql`
      SELECT id, comment_text, created_at, user_id
      FROM comments
      WHERE post_id = ${postId}
      ORDER BY created_at ASC;
    `) as CommentRow[];

    const serialized = result.map((row) => ({
      id: row.id,
      comment_text: row.comment_text,
      created_at: row.created_at?.toISOString?.() ?? "",
      user_id: row.user_id,
    }));

    return NextResponse.json(serialized);
  } catch (err) {
    return NextResponse.json({ error: "DB error", detail: String(err) }, { status: 500 });
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

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "DB error", detail: String(err) }, { status: 500 });
  }
}