import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/api-auth';
const { getDb } = require('@/lib/db');
const { generateCustomerPdf } = require('@/lib/pdf');

export async function GET(req, { params }) {
  const user = getAuthUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const customerId = params.id;
  const db = getDb();

  const customer = db.prepare(`
    SELECT * FROM customers WHERE customer_id = ? OR id = ?
  `).get(customerId, isNaN(customerId) ? -1 : Number(customerId));

  if (!customer) {
    return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
  }

  const orders = db.prepare(`
    SELECT o.*, v.upload_status as video_status
    FROM orders o
    LEFT JOIN order_videos v ON o.id = v.order_id
    WHERE o.customer_id = ?
    ORDER BY o.id DESC
  `).all(customer.customer_id);

  try {
    const pdfBuffer = await generateCustomerPdf(customer, orders);

    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Customer_Details_${customer.customer_id}.pdf"`,
        'Content-Length': pdfBuffer.length.toString()
      }
    });
  } catch (err) {
    console.error('Error generating PDF:', err);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}
