import { neon } from '@neondatabase/serverless';

// Create a database instance
const sql = neon(process.env.DATABASE_URL!);

// Get extension for UUIDs
async function ensureUuidExtension() {
  try {
    await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;
  } catch (error) {
    console.error('Failed to ensure UUID extension, may already exist:', error);
    // Continue anyway, as the extension might already be available
  }
}

export async function storeImage(imageData: Buffer) {
  await ensureUuidExtension();
  const result = await sql`
    INSERT INTO images (data)
    VALUES (${imageData})
    RETURNING id
  `;
  return result[0];
}

export async function getImage(id: string) {
  const result = await sql`
    SELECT data
    FROM images
    WHERE id = ${id}
  `;
  return result[0]?.data;
}

export async function createPost({ id, fk_image_id }: {
  id: string,
  fk_image_id: string
}) {
  await ensureUuidExtension();
  // Only use the columns we know exist in the database
  const result = await sql`
    INSERT INTO posts (id, fk_image_id)
    VALUES (${id}, ${fk_image_id})
    RETURNING id, fk_image_id, created_at
  `;
  return result[0];
}

export async function getFeedPosts(limit = 10, offset = 0) {
  return await sql`
    SELECT 
      p.id,
      p.fk_image_id,
      p.created_at
    FROM posts p
    ORDER BY p.created_at DESC
    LIMIT ${limit}
    OFFSET ${offset}
  `;
}

export async function getPostById(postId: string) {
  const result = await sql`
    SELECT 
      p.id,
      p.fk_image_id,
      p.created_at
    FROM posts p
    WHERE p.id = ${postId}
  `;
  return result[0];
}
