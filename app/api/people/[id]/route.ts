import { sql } from '@vercel/postgres';
import { NextRequest, NextResponse } from 'next/server';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { delta } = (await req.json()) as { delta: number };
  const { id } = params;

  const { rows } = await sql`
    UPDATE people
    SET count = GREATEST(0, count + ${delta})
    WHERE id = ${id}
    RETURNING *
  `;

  if (!rows.length) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json(rows[0]);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  await sql`DELETE FROM people WHERE id = ${id}`;
  return NextResponse.json({ ok: true });
}
