import { sql } from '@vercel/postgres';
import { put } from '@vercel/blob';
import { NextRequest, NextResponse } from 'next/server';

async function ensureTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS people (
      id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      name        TEXT NOT NULL,
      photo_url   TEXT,
      count       INTEGER NOT NULL DEFAULT 0,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
}

export async function GET() {
  await ensureTable();
  const { rows } = await sql`SELECT * FROM people ORDER BY created_at ASC`;
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  await ensureTable();
  const body = await req.json();
  const { name, photoDataUrl } = body as { name: string; photoDataUrl?: string };

  if (!name?.trim()) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  }

  let photoUrl: string | null = null;

  if (photoDataUrl) {
    const matches = photoDataUrl.match(/^data:(.+);base64,(.+)$/);
    if (matches) {
      const mimeType = matches[1];
      const ext = mimeType.split('/')[1] ?? 'jpg';
      const buffer = Buffer.from(matches[2], 'base64');
      const filename = `photos/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const blob = await put(filename, buffer, { access: 'public', contentType: mimeType });
      photoUrl = blob.url;
    }
  }

  const { rows } = await sql`
    INSERT INTO people (name, photo_url)
    VALUES (${name.trim()}, ${photoUrl})
    RETURNING *
  `;

  return NextResponse.json(rows[0], { status: 201 });
}
