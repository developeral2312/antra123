import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/api-auth';
const { query } = require('@/lib/db');

export async function GET() {
  const user = getAuthUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Metrics
  const totalCustomersRes = await query('SELECT COUNT(*)::int AS count FROM customers');
  const totalOrdersRes = await query('SELECT COUNT(*)::int AS count FROM orders');
  const totalVideosRes = await query('SELECT COUNT(*)::int AS count FROM order_videos');

  const todayStr = new Date().toISOString().split('T')[0];
  const todayOrdersRes = await query(
    `SELECT COUNT(*)::int AS count FROM orders WHERE order_date = $1 OR created_at LIKE $2`,
    [todayStr, `${todayStr}%`]
  );

  // Recent Activity (limit 6)
  const recentActivityRes = await query(`
    SELECT id, type, title, description, customer_id, order_number, created_at 
    FROM activity_logs 
    ORDER BY id DESC LIMIT 6
  `);

  // Recent Customers (limit 5)
  const recentCustomersRes = await query(`
    SELECT id, customer_id, customer_name, phone_number, address, created_at 
    FROM customers 
    ORDER BY id DESC LIMIT 5
  `);

  // Recent Orders with customer name & video (limit 5)
  const recentOrdersRes = await query(`
    SELECT 
      o.id, 
      o.order_number, 
      o.customer_id, 
      o.order_date, 
      o.description, 
      o.created_at,
      c.customer_name,
      v.id as video_id,
      v.video_name,
      v.upload_status,
      v.duration_seconds
    FROM orders o
    LEFT JOIN customers c ON o.customer_id = c.customer_id
    LEFT JOIN order_videos v ON o.id = v.order_id
    ORDER BY o.id DESC LIMIT 5
  `);

  return NextResponse.json({
    metrics: {
      totalCustomers: totalCustomersRes.rows[0].count,
      totalOrders: totalOrdersRes.rows[0].count,
      totalVideos: totalVideosRes.rows[0].count,
      todayOrders: todayOrdersRes.rows[0].count,
      customersTrend: '+12%',
      ordersTrend: '+18%',
      videosTrend: '+18%',
      todayTrend: '+8%'
    },
    recentActivity: recentActivityRes.rows,
    recentCustomers: recentCustomersRes.rows,
    recentOrders: recentOrdersRes.rows,
    database: {
      connected: true,
      engine: 'PostgreSQL'
    }
  });
}
