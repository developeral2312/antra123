import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/api-auth';
const { getDb } = require('@/lib/db');

export async function GET(req, { params }) {
  const user = getAuthUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const orderId = params.id;
  const db = getDb();

  const order = db.prepare(`
    SELECT 
      o.*,
      c.customer_name,
      c.phone_number,
      c.address,
      v.id as video_id,
      v.video_name,
      v.google_drive_file_id,
      v.video_url,
      v.upload_status,
      v.duration_seconds,
      v.file_size
    FROM orders o
    LEFT JOIN customers c ON o.customer_id = c.customer_id
    LEFT JOIN order_videos v ON o.id = v.order_id
    WHERE o.order_number = ? OR o.id = ?
  `).get(orderId, isNaN(orderId) ? -1 : Number(orderId));

  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  return NextResponse.json({ order });
}
