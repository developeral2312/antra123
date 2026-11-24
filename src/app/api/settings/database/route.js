import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/api-auth';
const { getDb } = require('@/lib/db');
const fs = require('fs');
const path = require('path');

export async function GET() {
  const user = getAuthUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = getDb();
  const dbPath = path.join(process.cwd(), 'data', 'antra.sqlite');
  let fileSizeMb = 0;
  if (fs.existsSync(dbPath)) {
    fileSizeMb = (fs.statSync(dbPath).size / (1024 * 1024)).toFixed(2);
  }

  const customersCount = db.prepare('SELECT count(*) as count FROM customers').get().count;
  const ordersCount = db.prepare('SELECT count(*) as count FROM orders').get().count;
  const videosCount = db.prepare('SELECT count(*) as count FROM order_videos').get().count;
  const logsCount = db.prepare('SELECT count(*) as count FROM activity_logs').get().count;

  return NextResponse.json({
    database: {
      type: 'SQLite Relational Database (WAL Mode)',
      path: 'data/antra.sqlite',
      sizeMb: fileSizeMb,
      status: 'healthy',
      counts: {
        customers: customersCount,
        orders: ordersCount,
        videos: videosCount,
        logs: logsCount
      }
    }
  });
}

// Optional endpoint to seed sample data for quick admin demonstration
export async function POST(req) {
  const user = getAuthUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { action } = await req.json();
  const db = getDb();

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

      // Check customer
      let cust = db.prepare('SELECT id FROM customers WHERE customer_id = ?').get(s.id);
      if (!cust) {
        db.prepare(`
          INSERT INTO customers (customer_id, customer_name, phone_number, address, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(s.id, s.name, s.phone, s.addr, time, time);
      }

      // Check order
      let ord = db.prepare('SELECT id FROM orders WHERE order_number = ?').get(s.ord);
      if (!ord) {
        const ordRes = db.prepare(`
          INSERT INTO orders (order_number, customer_id, order_date, description, remarks, created_at)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(s.ord, s.id, time.split('T')[0], s.desc, s.remarks, time);

        // Add video placeholder
        db.prepare(`
          INSERT INTO order_videos (order_id, order_number, video_name, upload_status, file_size, duration_seconds, mime_type, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(ordRes.lastInsertRowid, s.ord, `Order Video_${s.ord}.mp4`, 'uploaded', 4820000, 24, 'video/mp4', time);
      }
    }

    return NextResponse.json({ success: true, message: 'Sample customers and orders created successfully' });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
