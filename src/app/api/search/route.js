import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/api-auth';
const { query } = require('@/lib/db');

export async function GET(req) {
  const user = getAuthUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q') || '';

  if (!q.trim()) {
    return NextResponse.json({ customers: [], orders: [] });
  }

  const pattern = `%${q.trim()}%`;

  const customersRes = await query(
    `SELECT id, customer_id, customer_name, phone_number, address, created_at
     FROM customers
     WHERE customer_id ILIKE $1 OR customer_name ILIKE $1 OR phone_number ILIKE $1
     LIMIT 10`,
    [pattern]
  );

  const ordersRes = await query(
    `SELECT o.id, o.order_number, o.customer_id, o.order_date, o.description, c.customer_name
     FROM orders o
     JOIN customers c ON o.customer_id = c.customer_id
     WHERE o.order_number ILIKE $1 OR o.customer_id ILIKE $1 OR c.customer_name ILIKE $1 OR o.description ILIKE $1
     LIMIT 10`,
    [pattern]
  );

  return NextResponse.json({
    customers: customersRes.rows,
    orders: ordersRes.rows
  });
}
