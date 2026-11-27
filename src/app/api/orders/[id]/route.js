import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/api-auth';
const { query } = require('@/lib/db');

function parseNumericId(val) {
  return /^\d+$/.test(String(val)) ? parseInt(val, 10) : -1;
}

export async function GET(req, { params }) {
  const user = getAuthUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const orderId = params.id;
  const res = await query(
    `SELECT 
      o.*,
      c.customer_name,
      c.phone_number,
      c.address,
      v.id as video_id,
      v.video_name,
      v.video_url,
      v.upload_status,
      v.duration_seconds,
      v.file_size
    FROM orders o
    LEFT JOIN customers c ON o.customer_id = c.customer_id
    LEFT JOIN order_videos v ON o.id = v.order_id
    WHERE o.order_number = $1 OR o.id = $2`,
    [orderId, parseNumericId(orderId)]
  );
  const order = res.rows[0];

  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  return NextResponse.json({ order });
}
