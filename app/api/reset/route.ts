import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export async function POST() {
  await sql`UPDATE people SET count = 0`;
  await sql`DELETE FROM votes`;
  return NextResponse.json({ ok: true });
}
