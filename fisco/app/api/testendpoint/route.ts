import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";

const sql = neon(process.env.DATABASE_URL!);

export async function GET(req: Request) {
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '2'); 
    const offset = parseInt(url.searchParams.get('offset') || '0'); 

    console.log(`Fetching posts with limit ${limit} and offset ${offset}`);


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

  const totalCount = await sql`
    SELECT COUNT(*) AS total FROM posts
  `;

  
  return NextResponse.json({
    posts,        // The list of posts based on the limit and offset
    totalCount: totalCount[0].total // The total number of posts in the database
  });
}