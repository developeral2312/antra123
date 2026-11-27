import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/api-auth';
const { query } = require('@/lib/db');

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

  try {
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
      `SELECT 
        o.*,
        v.id as video_id,
        v.video_name,
        v.video_url,
        v.upload_status,
        v.duration_seconds,
        v.file_size
      FROM orders o
      LEFT JOIN order_videos v ON o.id = v.order_id
      WHERE o.customer_id = $1
      ORDER BY o.id DESC`,
      [customer.customer_id]
    );

    return NextResponse.json({ customer, orders: ordersRes.rows });
  } catch (err) {
    console.error('Error fetching customer details:', err);
    return NextResponse.json({ error: 'Failed to load customer details' }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  const user = getAuthUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const customerId = params.id;
  try {
    const { customer_name, phone_number, address } = await req.json();

    const custRes = await query(
      `SELECT * FROM customers WHERE customer_id = $1 OR id = $2`,
      [customerId, parseNumericId(customerId)]
    );
    const customer = custRes.rows[0];

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    const now = new Date().toISOString();
    await query(
      `UPDATE customers 
       SET customer_name = $1, phone_number = $2, address = $3, updated_at = $4
       WHERE id = $5`,
      [
        customer_name || customer.customer_name,
        phone_number || customer.phone_number,
        address || customer.address,
        now,
        customer.id
      ]
    );

    await query(
      `INSERT INTO activity_logs (type, title, description, customer_id, created_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        'customer_updated',
        `Customer details updated: ${customer_name || customer.customer_name}`,
        `Updated profile for ID ${customer.customer_id}`,
        customer.customer_id,
        now
      ]
    );

    return NextResponse.json({ success: true, message: 'Customer updated successfully' });
  } catch (err) {
    console.error('Error updating customer:', err);
    return NextResponse.json({ error: 'Failed to update customer' }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
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

  await query('DELETE FROM customers WHERE id = $1', [customer.id]);

  await query(
    `INSERT INTO activity_logs (type, title, description, customer_id, created_at)
     VALUES ($1, $2, $3, $4, $5)`,
    [
      'customer_deleted',
      `Customer deleted: ${customer.customer_name}`,
      `Removed ID ${customer.customer_id}`,
      customer.customer_id,
      new Date().toISOString()
    ]
  );

  return NextResponse.json({ success: true, message: 'Customer deleted successfully' });
}
