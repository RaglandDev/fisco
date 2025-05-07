import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

export async function POST(req: NextRequest) {
  const { postId, clerkUserId, commentText } = await req.json();
  if (!postId || !clerkUserId || !commentText) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }
  try {
    const result = await sql`
      INSERT INTO comments (post_id, comment_text, clerk_user_id)
      VALUES (${postId}, ${commentText}, ${clerkUserId})
      RETURNING *`;
    return NextResponse.json(result[0]);
  } catch (err) {
    console.error("DB error in /api/comments POST:", err);
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
      SELECT c.*, u.first_name, u.last_name, u.email
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.post_id = ${postId}
      ORDER BY c.created_at ASC`;
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: "DB error", detail: String(err) }, { status: 500 });
  }
}