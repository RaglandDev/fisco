import { neon } from "@neondatabase/serverless"; 
import { NextResponse } from "next/server";

const sql = neon(process.env.DATABASE_URL!);

export async function GET(req: Request) {
  const url = new URL(req.url);
  const userId = url.searchParams.get('userId'); // Get userId from query params

  if (!userId) {
    return NextResponse.json(
      { error: 'User ID is required' },
      { status: 400 }
    );
  }

  try {
    // Fetch user data and their posts
    const user_and_posts = await sql`
      SELECT
        users.first_name,
        users.last_name,
        users.email,
        users.image_url,
        posts.id AS post_id,
        posts.created_at,
        posts.likes,
        posts.comments,
        encode(images.data, 'base64') AS image_data  -- Base64 image data for posts
      FROM users
      LEFT JOIN posts ON posts.fk_author_id = users.id
      LEFT JOIN images ON posts.fk_image_id = images.id  -- Join images for posts
      WHERE users.clerk_user_id = ${userId}
    `;

    // Check if user and posts exist
    if (!user_and_posts.length) {
      return NextResponse.json(
        { error: 'User or posts not found' },
        { status: 404 }
      );
    }

    // Extract user data from the first row
    const user = user_and_posts[0];

    // Extract posts data (all other rows will contain post data)
    const posts = user_and_posts.map(post => ({
      post_id: post.post_id,
      created_at: post.created_at,
      likes: post.likes,
      comments: post.comments,
      image_data: post.image_data,  // Base64 encoded image data
    }));

    // Return the user data and their posts
    return NextResponse.json({
      user: {
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        image_url: user.image_url
      },
      posts: posts.length > 0 ? posts : []  // Ensure that posts are returned, even if empty
    });
  } catch (error) {
    console.error('Error fetching user data or posts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}