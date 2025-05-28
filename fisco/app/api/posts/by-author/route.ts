import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

export async function POST(req: Request) {
  try {
    const { authorId } = await req.json();

    if (!authorId) {
      return NextResponse.json({ error: "Missing authorId" }, { status: 400 });
    }

    // Step 1: Find the internal UUID for the user
    const userResult = await sql`
      SELECT id FROM users WHERE clerk_user_id = ${authorId}
    `;

    const internalAuthorId = userResult[0]?.id;

    if (!internalAuthorId) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Step 2: Fetch posts by internal UUID
    const result = await sql`
      SELECT 
        p.id, 
        i.s3_url AS image_url 
      FROM posts p
      JOIN images i ON p.fk_image_id = i.id
      WHERE p.fk_author_id = ${internalAuthorId}
    `;

    return NextResponse.json({ posts: result });
  } catch (err) {
    console.error("Error fetching posts by author:", err);
    return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 });
  }
}