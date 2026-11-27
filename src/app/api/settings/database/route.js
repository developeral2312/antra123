import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/api-auth';
const { query } = require('@/lib/db');

export async function GET() {
  const user = getAuthUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const dbInfoRes = await query(`
      SELECT 
        current_database() AS db_name,
        pg_database_size(current_database())::bigint AS size_bytes,
        version() AS pg_version
    `);
    const dbInfo = dbInfoRes.rows[0];
    const sizeMb = (Number(dbInfo.size_bytes) / (1024 * 1024)).toFixed(2);

    const customersCount = (await query('SELECT COUNT(*)::int AS count FROM customers')).rows[0].count;
    const ordersCount = (await query('SELECT COUNT(*)::int AS count FROM orders')).rows[0].count;
    const videosCount = (await query('SELECT COUNT(*)::int AS count FROM order_videos')).rows[0].count;
    const logsCount = (await query('SELECT COUNT(*)::int AS count FROM activity_logs')).rows[0].count;

    return NextResponse.json({
      database: {
        type: 'PostgreSQL Relational Database',
        name: dbInfo.db_name,
        version: dbInfo.pg_version?.split(',')[0] || 'PostgreSQL',
        sizeMb,
        status: 'healthy',
        counts: {
          customers: customersCount,
          orders: ordersCount,
          videos: videosCount,
          logs: logsCount
        }
      }
    });
  } catch (err) {
    console.error('PostgreSQL diagnostics error:', err);
    return NextResponse.json({ error: 'Failed to connect to PostgreSQL: ' + err.message }, { status: 500 });
  }
}

// Optional endpoint to seed sample data for quick admin demonstration
export async function POST(req) {
  const user = getAuthUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { action } = await req.json();

  if (action === 'seed_demo') {
    const samples = [
      { id: 'CUST124', name: 'Rahul Sharma', phone: '9876543210', addr: 'B-14 Sector 62, Noida, UP', ord: 'ORD-025', desc: 'Custom tailored formal suit and accessories', remarks: 'Trial fitted on camera' },
      { id: 'CUST123', name: 'Priya Singh', phone: '9876501234', addr: '42 MG Road, Bengaluru, KA', ord: 'ORD-024', desc: 'Handcrafted jewellery box with velvet lining', remarks: 'Inspected under studio light' },
      { id: 'CUST122', name: 'Amit Kumar', phone: '9876512345', addr: '7A Park Street, Kolkata, WB', ord: 'ORD-023', desc: 'Premium leather briefcase & passport cover', remarks: 'Serial numbers verified' },
      { id: 'CUST121', name: 'Sneha Patel', phone: '9876523456', addr: '88 CG Road, Ahmedabad, GJ', ord: 'ORD-022', desc: 'Silk saree with embroidered pallu and border', remarks: 'Weave count certified' }
    ];

    const now = new Date();
    for (let i = 0; i < samples.length; i++) {
      const s = samples[i];
      const time = new Date(now.getTime() - i * 3600000).toISOString();

      const cust = await query('SELECT id FROM customers WHERE customer_id = $1', [s.id]);
      if (cust.rows.length === 0) {
        await query(
          `INSERT INTO customers (customer_id, customer_name, phone_number, address, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [s.id, s.name, s.phone, s.addr, time, time]
        );
      }

      const ord = await query('SELECT id FROM orders WHERE order_number = $1', [s.ord]);
      if (ord.rows.length === 0) {
        const ordRes = await query(
          `INSERT INTO orders (order_number, customer_id, order_date, description, remarks, created_at)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING id`,
          [s.ord, s.id, time.split('T')[0], s.desc, s.remarks, time]
        );

        await query(
          `INSERT INTO order_videos (order_id, order_number, video_name, upload_status, file_size, duration_seconds, mime_type, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [ordRes.rows[0].id, s.ord, `Order Video_${s.ord}.mp4`, 'uploaded', 4820000, 24, 'video/mp4', time]
        );
      }
    }

    return NextResponse.json({ success: true, message: 'Sample customers and orders created successfully' });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
