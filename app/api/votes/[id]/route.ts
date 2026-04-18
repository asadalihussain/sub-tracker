import { sql } from '@vercel/postgres';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { rows } = await sql`
    SELECT v.*, p.name as person_name, p.photo_url
    FROM votes v
    JOIN people p ON p.id = v.person_id
    WHERE v.id = ${params.id}
  `;
  if (!rows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(rows[0]);
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { vote } = await req.json() as { vote: 'yes' | 'no' };

  const { rows: current } = await sql`SELECT * FROM votes WHERE id = ${params.id}`;
  if (!current.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const v = current[0];
  if (v.status !== 'pending') {
    return NextResponse.json({ error: 'Vote already closed', vote: v }, { status: 409 });
  }

  const newYes = v.yes_count + (vote === 'yes' ? 1 : 0);
  const newNo  = v.no_count  + (vote === 'no'  ? 1 : 0);
  const net    = newYes - newNo;

  let status = 'pending';
  if (net >= 3)  status = 'approved';
  if (net <= -3) status = 'rejected';

  const { rows: updated } = await sql`
    UPDATE votes
    SET yes_count = ${newYes}, no_count = ${newNo}, status = ${status}
    WHERE id = ${params.id}
    RETURNING *
  `;

  // If approved, increment person's sub count
  if (status === 'approved') {
    await sql`UPDATE people SET count = count + 1 WHERE id = ${v.person_id}`;
  }

  const { rows: people } = await sql`SELECT name, photo_url FROM people WHERE id = ${v.person_id}`;
  return NextResponse.json({ ...updated[0], person_name: people[0]?.name, photo_url: people[0]?.photo_url });
}
