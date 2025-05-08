import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

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
    const result = await sql`
      SELECT id, comment_text, created_at, user_id
      FROM comments
      WHERE post_id = ${postId}
      ORDER BY created_at ASC;
    `;

    const serialized = result.map((row: any) => ({
      id: row.id,
      comment_text: row.comment_text,
      created_at: row.created_at?.toISOString?.() ?? "",
      user_id: row.user_id ?? null,
    }));

    return NextResponse.json(serialized);
  } catch (err) {
    return NextResponse.json({ error: "DB error", detail: String(err) }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const { commentId } = await req.json();

  if (!commentId) {
    return NextResponse.json({ error: "Missing commentId" }, { status: 400 });
  }

  try {
    await sql`
      DELETE FROM comments
      WHERE id = ${commentId}
    `;
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "Failed to delete comment", detail: String(err) }, { status: 500 });
  }
}