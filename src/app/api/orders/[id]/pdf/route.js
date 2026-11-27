import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/api-auth';
const { query } = require('@/lib/db');
const { generateOrderPdf, getRequestBaseUrl } = require('@/lib/pdf');

function parseNumericId(val) {
  if (!/^\d+$/.test(String(val))) return -1;
  const num = Number(val);
  return Number.isSafeInteger(num) && num >= 0 && num <= 2147483647 ? num : -1;
}

export async function GET(req, { params }) {
  const user = getAuthUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const orderId = params.id;
  const orderRes = await query(
    `SELECT 
      o.*,
      c.customer_name,
      c.phone_number,
      c.address
    FROM orders o
    LEFT JOIN customers c ON o.customer_id = c.customer_id
    WHERE o.order_number = $1 OR o.id = $2`,
    [orderId, parseNumericId(orderId)]
  );
  const order = orderRes.rows[0];

  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  const videoRes = await query('SELECT * FROM order_videos WHERE order_id = $1', [order.id]);
  const video = videoRes.rows[0] || null;

  try {
    const baseUrl = getRequestBaseUrl(req);
    const pdfBuffer = await generateOrderPdf(order, {
      customer_id: order.customer_id,
      customer_name: order.customer_name,
      phone_number: order.phone_number,
      address: order.address
    }, video, baseUrl);

    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Order_Details_${order.order_number}.pdf"`,
        'Content-Length': pdfBuffer.length.toString()
      }
    });
  } catch (err) {
    console.error('Error generating Order PDF:', err);
    return NextResponse.json({ error: 'Failed to generate Order PDF' }, { status: 500 });
  }
}
