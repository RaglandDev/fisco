"use server"

import { auth, currentUser } from "@clerk/nextjs/server";
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export async function syncUser() {
  try {
    // Get the authenticated Clerk user
    const { userId } = await auth();
    const user = await currentUser();
    if (!userId || !user) {
      return;
    }

    // Get user (db)
    const existingUser = await sql`
      SELECT * FROM users WHERE clerk_user_id = ${userId}
    `;

    if (existingUser.length > 0) {
      // If the user exists, update their details
      await sql`
        UPDATE users
        SET email = ${user.emailAddresses[0].emailAddress},
            first_name = ${user.firstName},
            last_name = ${user.lastName},
            image_url = ${user.imageUrl}
        WHERE clerk_user_id = ${userId}
      `;
    } else {
      // If the user doesn't exist, insert them into the database
      await sql`
        INSERT INTO users (clerk_user_id, email, first_name, last_name, image_url)
        VALUES (${userId}, ${user.emailAddresses[0].emailAddress}, ${user.firstName}, ${user.lastName}, ${user.imageUrl})
      `;
    }
    
    console.log('User synced to db successfully');
  } catch (error) {
    console.error('Error syncing user:', error);
  }
}
