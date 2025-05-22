import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";

const sql = neon(process.env.DATABASE_URL!);

export async function POST(req: Request) {
    const { post_id, userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }
  
    try {
        if (post_id) {
          // Step 1: Update post's 'saves' field (if not already saved)
          await sql`
            UPDATE posts
            SET saves = saves || to_jsonb(${userId}::text)
            WHERE id = ${post_id} AND NOT (saves @> to_jsonb(ARRAY[${userId}::text]))
          `;
    
          // Step 2: Get existing saved_posts from the user
          const existing = await sql`
            SELECT saved_posts FROM users WHERE clerk_user_id = ${userId}
          `;
    
          const savedPostsObj = existing[0]?.saved_posts || {};
          const savedArray = savedPostsObj["Saved Posts"] || [];
    
          // Add post_id if not already present
          const updatedArray = Array.from(new Set([...savedArray, post_id]));
    
          // Rebuild the entire saved_posts object
          const updatedObject = {
            "Saved Posts": updatedArray
          };
    
          // Step 3: Save the updated object back to the database
          await sql`
            UPDATE users
            SET saved_posts = ${updatedObject}::jsonb
            WHERE clerk_user_id = ${userId}
          `;
    
          // Step 4: Return the saved_galleries object
          return NextResponse.json({
            saved_galleries: updatedObject
          }, {headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }});
        }
    
        // If no post_id provided, just return current saved_posts
        const result = await sql`
          SELECT saved_posts FROM users WHERE clerk_user_id = ${userId}
        `;
    
        return NextResponse.json({
          saved_galleries: result[0]?.saved_posts || { "Saved Posts": [] }
        }, {headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }});
    
      } catch (error) {
        console.error("Error saving to Saved Posts:", error);
        return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
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

    // Step 2: Fetch existing saved_posts object
    const result = await sql`
      SELECT saved_posts FROM users WHERE clerk_user_id = ${userId}
    `;

    const savedPostsObj = result[0]?.saved_posts || {};
    const savedArray = savedPostsObj["Saved Posts"] || [];

    // Step 3: Remove post_id from the array
    const updatedArray = savedArray.filter((id: string) => id !== post_id);

    // Step 4: Update the entire saved_posts object
    const updatedObject = {
      "Saved Posts": updatedArray
    };

    await sql`
      UPDATE users
      SET saved_posts = ${updatedObject}::jsonb
      WHERE clerk_user_id = ${userId}
    `;

    // Step 5: Return updated saved_galleries object
    return NextResponse.json({
      saved_galleries: updatedObject
    }, { headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }});

  } catch (error) {
    console.error("Error unsaving post:", error);
    return NextResponse.json({ error: "Failed to unsave post" }, { status: 500 });
  }
}