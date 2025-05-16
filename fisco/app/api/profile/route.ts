import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";

const sql = neon(process.env.DATABASE_URL!);

// Gets all user posts and saved posts
export async function GET(req: Request) {
    try {
      const { clerk_user_id } = await req.json();
      if (!clerk_user_id) {
        return NextResponse.json({ error: "Missing clerk_user_id" }, { status: 400 });
      }
  
      // Lookup the UUID in your users table
      const userResult = await sql`
        SELECT id FROM users WHERE clerk_user_id = ${clerk_user_id}
      `;
      const author_uuid = userResult[0]?.id;
      if (!author_uuid) {
        return NextResponse.json({ error: "No matching user found" }, { status: 404 });
      }
      const user_posts = await sql`
        SELECT 
            posts.*,
            encode(images.data, 'base64') AS image_data,
            users.first_name,
            users.last_name,
            users.email,
            (
            SELECT COUNT(*)::INT 
            FROM comments 
            WHERE comments.post_id = posts.id
            ) AS comment_count
        FROM posts WHERE posts.id = ${author_uuid}

        UNION ALL
        SELECT
            posts.*,
            encode(images.data, 'base64') AS image_data,
            users.first_name,
            users.last_name,
            users.email,
            (
            SELECT COUNT(*)::INT 
            FROM comments 
            WHERE comments.post_id = posts.id
            ) AS comment_count
            'saved_post' AS type
        FROM posts
        JOIN saved_posts ON saved_posts.post_id = posts.id
        WHERE saved_posts.id = ${author_uuid};
        `;
        return NextResponse.json({ user_posts });
    }
    catch (error) {
      console.error("Error fetching user posts:", error);
      return NextResponse.json({ error: "Failed to fetch user posts" }, { status: 500 });
    }   
}

export async function POST(req: Request) {
  // Get post id and user id from json payload
  const { post_id, userId } = await req.json();

  // Check to ensure they exist
  if (!post_id || !userId) {
    return NextResponse.json({ error: "Missing post_id or userId" }, { status: 400 });
  }

  // Append userId to saved_users if it's not already present
  // Append post_id to saved_posts if it's not already present
  try {
    await sql`
          UPDATE posts
          SET saves = saves || to_jsonb(${userId}::text)
          WHERE id = ${post_id} AND NOT (saves @> to_jsonb(ARRAY[${userId}::text]))
        `;

    await sql`
          UPDATE users
          SET saved_posts = saved_posts || to_jsonb(ARRAY[${post_id}])
          WHERE clerk_user_id = ${userId}
            AND NOT (saved_posts @> to_jsonb(ARRAY[${post_id}]))
        `;

    return NextResponse.json({ success: true });
  } catch (error) {
    // Handle any errors that occur during the database operations
    console.error("Error saving post:", error);
    return NextResponse.json({ error: "Failed to save post" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  // Get post id and user id from json payload
  const { post_id, userId } = await req.json();

  // Check to ensure they exist
  if (!post_id || !userId) {
    return NextResponse.json({ error: "Missing post_id or userId" }, { status: 400 });
  }
  // Remove userId from likes if it's present
  // Remove post_id from liked_posts if it's present
  try {
    await sql`
          UPDATE posts
          SET saves = saves - ${userId}::text
          WHERE id = ${post_id}::uuid
        `;

    await sql`
          UPDATE users
          SET saved_posts = saved_posts - ${post_id}
          WHERE clerk_user_id = ${userId}::text
        `;

    return NextResponse.json({ success: true });
  } catch (error) {
    // Handle any errors that occur during the database operations
    console.error("Error unsaving post:", error);
    return NextResponse.json({ error: "Failed to unsave post" }, { status: 500 });
  }
}