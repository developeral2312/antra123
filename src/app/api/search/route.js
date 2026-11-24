import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/api-auth';
const { getDb } = require('@/lib/db');

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

  const db = getDb();
  const pattern = `%${q.trim()}%`;

  const customers = db.prepare(`
    SELECT id, customer_id, customer_name, phone_number, address, created_at
    FROM customers
    WHERE customer_id LIKE ? OR customer_name LIKE ? OR phone_number LIKE ?
    LIMIT 10
  `).all(pattern, pattern, pattern);

  const orders = db.prepare(`
    SELECT o.id, o.order_number, o.customer_id, o.order_date, o.description, c.customer_name
    FROM orders o
    JOIN customers c ON o.customer_id = c.customer_id
    WHERE o.order_number LIKE ? OR o.customer_id LIKE ? OR c.customer_name LIKE ? OR o.description LIKE ?
    LIMIT 10
  `).all(pattern, pattern, pattern, pattern);

  return NextResponse.json({ customers, orders });
}
