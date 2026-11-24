import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/api-auth';
const { getDb } = require('@/lib/db');
const { generateOrderPdf } = require('@/lib/pdf');

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
      c.address
    FROM orders o
    LEFT JOIN customers c ON o.customer_id = c.customer_id
    WHERE o.order_number = ? OR o.id = ?
  `).get(orderId, isNaN(orderId) ? -1 : Number(orderId));

  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  const video = db.prepare('SELECT * FROM order_videos WHERE order_id = ?').get(order.id);

  try {
    const pdfBuffer = await generateOrderPdf(order, {
      customer_id: order.customer_id,
      customer_name: order.customer_name,
      phone_number: order.phone_number,
      address: order.address
    }, video);

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
