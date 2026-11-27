import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/api-auth';
const { query } = require('@/lib/db');

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

  let sql = `
    SELECT 
      c.id, 
      c.customer_id, 
      c.customer_name, 
      c.phone_number, 
      c.address, 
      c.created_at,
      c.updated_at,
      COUNT(o.id)::int as total_orders
    FROM customers c
    LEFT JOIN orders o ON c.customer_id = o.customer_id
    WHERE 1=1
  `;
  const params = [];

  if (search) {
    params.push(`%${search}%`);
    const p = `$${params.length}`;
    sql += ` AND (c.customer_id ILIKE ${p} OR c.customer_name ILIKE ${p} OR c.phone_number ILIKE ${p} OR c.address ILIKE ${p})`;
  }

  if (startDate) {
    params.push(startDate);
    sql += ` AND c.created_at >= $${params.length}`;
  }

  if (endDate) {
    params.push(endDate + 'T23:59:59.999Z');
    sql += ` AND c.created_at <= $${params.length}`;
  }

  sql += ` GROUP BY c.id`;

  if (sort === 'oldest') {
    sql += ` ORDER BY c.id ASC`;
  } else if (sort === 'name') {
    sql += ` ORDER BY c.customer_name ASC`;
  } else {
    sql += ` ORDER BY c.id DESC`;
  }

  const res = await query(sql, params);
  return NextResponse.json({ customers: res.rows });
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

    const trimmedId = customer_id.trim();
    const trimmedName = customer_name.trim();
    const trimmedPhone = phone_number.trim();
    const trimmedAddress = address.trim();

    const existing = await query('SELECT id FROM customers WHERE customer_id = $1', [trimmedId]);
    if (existing.rows.length > 0) {
      return NextResponse.json({ error: 'Customer ID already exists' }, { status: 409 });
    }

    const now = new Date().toISOString();
    const insertRes = await query(
      `INSERT INTO customers (customer_id, customer_name, phone_number, address, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [trimmedId, trimmedName, trimmedPhone, trimmedAddress, now, now]
    );

    await query(
      `INSERT INTO activity_logs (type, title, description, customer_id, created_at)
       VALUES ($1, $2, $3, $4, $5)`,
      ['customer_created', `New customer added: ${trimmedName}`, `Registered ID ${trimmedId}`, trimmedId, now]
    );

    return NextResponse.json({
      success: true,
      customer: {
        id: insertRes.rows[0].id,
        customer_id: trimmedId,
        customer_name: trimmedName,
        phone_number: trimmedPhone,
        address: trimmedAddress,
        created_at: now
      }
    });
  } catch (err) {
    console.error('Error creating customer:', err);
    return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 });
  }
}
