import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/api-auth';
const { getDb } = require('@/lib/db');
const { getGoogleDriveConfig } = require('@/lib/drive');

export async function GET() {
  const user = getAuthUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = getDb();

  // Metrics
  const totalCustomers = db.prepare('SELECT count(*) as count FROM customers').get().count;
  const totalOrders = db.prepare('SELECT count(*) as count FROM orders').get().count;
  const totalVideos = db.prepare('SELECT count(*) as count FROM order_videos').get().count;

  const todayStr = new Date().toISOString().split('T')[0];
  const todayOrders = db.prepare(`
    SELECT count(*) as count FROM orders 
    WHERE order_date = ? OR created_at LIKE ?
  `).get(todayStr, `${todayStr}%`).count;

  // Recent Activity (limit 6)
  const recentActivity = db.prepare(`
    SELECT id, type, title, description, customer_id, order_number, created_at 
    FROM activity_logs 
    ORDER BY id DESC LIMIT 6
  `).all();

  // Recent Customers (limit 5)
  const recentCustomers = db.prepare(`
    SELECT id, customer_id, customer_name, phone_number, address, created_at 
    FROM customers 
    ORDER BY id DESC LIMIT 5
  `).all();

  // Recent Orders with customer name & video (limit 5)
  const recentOrders = db.prepare(`
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
  `).all();

  // Google Drive config status
  const gdriveConfig = getGoogleDriveConfig();

  return NextResponse.json({
    metrics: {
      totalCustomers,
      totalOrders,
      totalVideos,
      todayOrders,
      customersTrend: '+12%',
      ordersTrend: '+18%',
      videosTrend: '+18%',
      todayTrend: '+8%'
    },
    recentActivity,
    recentCustomers,
    recentOrders,
    googleDrive: {
      connected: gdriveConfig.enabled,
      authMode: gdriveConfig.auth_mode,
      rootFolder: gdriveConfig.root_folder_name
    }
  });
}
