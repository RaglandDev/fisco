import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";

const sql = neon(process.env.DATABASE_URL!);

export async function PUT(req: Request) {
  // Parse the request body for userId and new bio
  const { userId, bio } = await req.json();

  if (!userId) {
    return NextResponse.json(
      { error: 'User ID is required' },
      { status: 400 }
    );
  }

  if (!bio) {
    return NextResponse.json(
      { error: 'Bio is required' },
      { status: 400 }
    );
  }

  try {
    // Update the user's bio in the database
    const updatedUser = await sql`
      UPDATE users
      SET bio = ${bio}
      WHERE clerk_user_id = ${userId}
      RETURNING first_name, last_name, email, bio
    `;

    if (updatedUser.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Return the updated user data
    return NextResponse.json({
      user: {
        first_name: updatedUser[0].first_name,
        last_name: updatedUser[0].last_name,
        email: updatedUser[0].email,
        bio: updatedUser[0].bio
      }
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    });
  } catch (error) {
    console.error('Error updating user bio:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
