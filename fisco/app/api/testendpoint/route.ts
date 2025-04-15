import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";

const sql = neon(process.env.DATABASE_URL!);

export async function GET() {
  const result = await sql`SELECT * FROM "test-table"`;
  return NextResponse.json(result);
}
