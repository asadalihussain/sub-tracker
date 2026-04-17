import { sql } from '@vercel/postgres';
import { put } from '@vercel/blob';
import { NextRequest, NextResponse } from 'next/server';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const body = await req.json() as { delta?: number; photoDataUrl?: string };

  // Photo update
  if (body.photoDataUrl) {
    const matches = body.photoDataUrl.match(/^data:(.+);base64,(.+)$/);
    if (!matches) return NextResponse.json({ error: 'Invalid image' }, { status: 400 });

    const mimeType = matches[1];
    const ext = mimeType.split('/')[1] ?? 'jpg';
    const buffer = Buffer.from(matches[2], 'base64');
    const filename = `photos/${id}-${Date.now()}.${ext}`;
    const blob = await put(filename, buffer, { access: 'public', contentType: mimeType });

    const { rows } = await sql`
      UPDATE people SET photo_url = ${blob.url} WHERE id = ${id} RETURNING *
    `;
    if (!rows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(rows[0]);
  }

  // Count update
  const { rows } = await sql`
    UPDATE people
    SET count = GREATEST(0, count + ${body.delta ?? 0})
    WHERE id = ${id}
    RETURNING *
  `;

  if (!rows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });
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
