import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/api-auth';
const { getDb } = require('@/lib/db');

export async function GET(req, { params }) {
  const user = getAuthUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const customerId = params.id;
  const db = getDb();

  // Find customer by id or customer_id
  const customer = db.prepare(`
    SELECT * FROM customers 
    WHERE customer_id = ? OR id = ?
  `).get(customerId, isNaN(customerId) ? -1 : Number(customerId));

  if (!customer) {
    return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
  }

  // Get orders for this customer
  const orders = db.prepare(`
    SELECT 
      o.*,
      v.id as video_id,
      v.video_name,
      v.google_drive_file_id,
      v.video_url,
      v.upload_status,
      v.duration_seconds,
      v.file_size
    FROM orders o
    LEFT JOIN order_videos v ON o.id = v.order_id
    WHERE o.customer_id = ?
    ORDER BY o.id DESC
  `).all(customer.customer_id);

  return NextResponse.json({ customer, orders });
}

export async function PUT(req, { params }) {
  const user = getAuthUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const customerId = params.id;
  try {
    const { customer_name, phone_number, address } = await req.json();

    const db = getDb();
    const customer = db.prepare(`
      SELECT * FROM customers WHERE customer_id = ? OR id = ?
    `).get(customerId, isNaN(customerId) ? -1 : Number(customerId));

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    const now = new Date().toISOString();
    db.prepare(`
      UPDATE customers 
      SET customer_name = ?, phone_number = ?, address = ?, updated_at = ?
      WHERE id = ?
    `).run(
      customer_name || customer.customer_name,
      phone_number || customer.phone_number,
      address || customer.address,
      now,
      customer.id
    );

    db.prepare(`
      INSERT INTO activity_logs (type, title, description, customer_id, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run('customer_updated', `Customer details updated: ${customer_name || customer.customer_name}`, `Updated profile for ID ${customer.customer_id}`, customer.customer_id, now);

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
  const db = getDb();

  const customer = db.prepare(`
    SELECT * FROM customers WHERE customer_id = ? OR id = ?
  `).get(customerId, isNaN(customerId) ? -1 : Number(customerId));

  if (!customer) {
    return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
  }

  db.prepare('DELETE FROM customers WHERE id = ?').run(customer.id);

  db.prepare(`
    INSERT INTO activity_logs (type, title, description, customer_id, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).run('customer_deleted', `Customer deleted: ${customer.customer_name}`, `Removed ID ${customer.customer_id}`, customer.customer_id, new Date().toISOString());

  return NextResponse.json({ success: true, message: 'Customer deleted successfully' });
}
