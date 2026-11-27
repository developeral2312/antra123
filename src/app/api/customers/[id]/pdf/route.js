import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/api-auth';
const { query } = require('@/lib/db');
const { generateCustomerPdf, getRequestBaseUrl } = require('@/lib/pdf');

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

  const customerId = params.id;
  const custRes = await query(
    `SELECT * FROM customers WHERE customer_id = $1 OR id = $2`,
    [customerId, parseNumericId(customerId)]
  );
  const customer = custRes.rows[0];

  if (!customer) {
    return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
  }

  const ordersRes = await query(
    `SELECT o.*, v.id as video_id, v.upload_status as video_status
     FROM orders o
     LEFT JOIN order_videos v ON o.id = v.order_id
     WHERE o.customer_id = $1
     ORDER BY o.id DESC`,
    [customer.customer_id]
  );

  try {
    const baseUrl = getRequestBaseUrl(req);
    const pdfBuffer = await generateCustomerPdf(customer, ordersRes.rows, baseUrl);

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
