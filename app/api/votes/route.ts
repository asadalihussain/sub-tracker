import { sql } from '@vercel/postgres';
import { NextRequest, NextResponse } from 'next/server';

async function ensureVotesTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS votes (
      id         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      person_id  TEXT NOT NULL,
      yes_count  INTEGER NOT NULL DEFAULT 0,
      no_count   INTEGER NOT NULL DEFAULT 0,
      status     TEXT NOT NULL DEFAULT 'pending',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
}

export async function GET() {
  await ensureVotesTable();
  const { rows } = await sql`
    SELECT v.*, p.name as person_name, p.photo_url
    FROM votes v
    JOIN people p ON p.id = v.person_id
    WHERE v.status = 'pending'
    ORDER BY v.created_at DESC
  `;
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  await ensureVotesTable();
  const { personId } = await req.json() as { personId: string };

  const { rows: people } = await sql`SELECT * FROM people WHERE id = ${personId}`;
  if (!people.length) return NextResponse.json({ error: 'Person not found' }, { status: 404 });

  const { rows } = await sql`
    INSERT INTO votes (person_id) VALUES (${personId}) RETURNING *
  `;

  return NextResponse.json({ ...rows[0], person_name: people[0].name }, { status: 201 });
}
