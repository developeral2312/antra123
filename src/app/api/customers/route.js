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
  const sort = searchParams.get('sort') || 'newest';
  const startDate = searchParams.get('startDate') || '';
  const endDate = searchParams.get('endDate') || '';

  const db = getDb();
  let query = `
    SELECT 
      c.id, 
      c.customer_id, 
      c.customer_name, 
      c.phone_number, 
      c.address, 
      c.google_drive_folder_id,
      c.created_at,
      c.updated_at,
      COUNT(o.id) as total_orders
    FROM customers c
    LEFT JOIN orders o ON c.customer_id = o.customer_id
    WHERE 1=1
  `;
  const params = [];

  if (search) {
    query += ` AND (c.customer_id LIKE ? OR c.customer_name LIKE ? OR c.phone_number LIKE ? OR c.address LIKE ?)`;
    const searchPattern = `%${search}%`;
    params.push(searchPattern, searchPattern, searchPattern, searchPattern);
  }

  if (startDate) {
    query += ` AND c.created_at >= ?`;
    params.push(startDate);
  }

  if (endDate) {
    query += ` AND c.created_at <= ?`;
    params.push(endDate + 'T23:59:59.999Z');
  }

  query += ` GROUP BY c.id`;

  if (sort === 'oldest') {
    query += ` ORDER BY c.id ASC`;
  } else if (sort === 'name') {
    query += ` ORDER BY c.customer_name ASC`;
  } else {
    query += ` ORDER BY c.id DESC`;
  }

  const customers = db.prepare(query).all(...params);

  return NextResponse.json({ customers });
}

export async function POST(req) {
  const user = getAuthUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { customer_id, customer_name, phone_number, address } = await req.json();

    if (!customer_id || !customer_name || !phone_number || !address) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    const db = getDb();
    const existing = db.prepare('SELECT id FROM customers WHERE customer_id = ?').get(customer_id.trim());
    if (existing) {
      return NextResponse.json({ error: 'Customer ID already exists' }, { status: 409 });
    }

    const now = new Date().toISOString();
    const info = db.prepare(`
      INSERT INTO customers (customer_id, customer_name, phone_number, address, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(customer_id.trim(), customer_name.trim(), phone_number.trim(), address.trim(), now, now);

    db.prepare(`
      INSERT INTO activity_logs (type, title, description, customer_id, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run('customer_created', `New customer added: ${customer_name}`, `Registered ID ${customer_id}`, customer_id, now);

    return NextResponse.json({
      success: true,
      customer: {
        id: info.lastInsertRowid,
        customer_id,
        customer_name,
        phone_number,
        address,
        created_at: now
      }
    });
  } catch (err) {
    console.error('Error creating customer:', err);
    return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 });
  }
}
