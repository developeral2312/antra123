import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/api-auth';
const { getDb } = require('@/lib/db');

export async function GET(req) {
  const user = getAuthUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') || '';

  const db = getDb();
  let query = `
    SELECT 
      v.id,
      v.order_id,
      v.order_number,
      v.video_name,
      v.google_drive_file_id,
      v.video_url,
      v.upload_status,
      v.file_size,
      v.duration_seconds,
      v.mime_type,
      v.created_at,
      o.customer_id,
      o.order_date,
      o.description,
      c.customer_name,
      c.phone_number
    FROM order_videos v
    JOIN orders o ON v.order_id = o.id
    JOIN customers c ON o.customer_id = c.customer_id
    WHERE 1=1
  `;
  const params = [];

  if (search) {
    query += ` AND (v.order_number LIKE ? OR o.customer_id LIKE ? OR c.customer_name LIKE ?)`;
    const pattern = `%${search}%`;
    params.push(pattern, pattern, pattern);
  }

  query += ` ORDER BY v.id DESC`;

  const videos = db.prepare(query).all(...params);
  return NextResponse.json({ videos });
}
