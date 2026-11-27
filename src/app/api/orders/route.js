import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/api-auth';
const { query } = require('@/lib/db');
const { processOrderSubmission } = require('@/lib/storage');
const { getRequestBaseUrl } = require('@/lib/pdf');

export async function GET(req) {
  const user = getAuthUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') || '';
  const status = searchParams.get('status') || '';
  const sort = searchParams.get('sort') || 'newest';

  let sql = `
    SELECT 
      o.id,
      o.order_number,
      o.customer_id,
      o.order_date,
      o.description,
      o.remarks,
      o.created_at,
      c.customer_name,
      c.phone_number,
      v.id as video_id,
      v.video_name,
      v.video_url,
      v.upload_status,
      v.duration_seconds,
      v.file_size
    FROM orders o
    LEFT JOIN customers c ON o.customer_id = c.customer_id
    LEFT JOIN order_videos v ON o.id = v.order_id
    WHERE 1=1
  `;
  const params = [];

  if (search) {
    params.push(`%${search}%`);
    const p = `$${params.length}`;
    sql += ` AND (o.order_number ILIKE ${p} OR o.customer_id ILIKE ${p} OR c.customer_name ILIKE ${p} OR o.description ILIKE ${p})`;
  }

  if (status) {
    params.push(status);
    sql += ` AND v.upload_status = $${params.length}`;
  }

  if (sort === 'oldest') {
    sql += ` ORDER BY o.id ASC`;
  } else {
    sql += ` ORDER BY o.id DESC`;
  }

  const res = await query(sql, params);
  return NextResponse.json({ orders: res.rows });
}

export async function POST(req) {
  const user = getAuthUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await req.formData();

    // 1. Validate Form Fields
    const customer_name = (formData.get('customer_name') || '').trim();
    let customer_id = (formData.get('customer_id') || '').trim();
    const phone_number = (formData.get('phone_number') || '').trim();
    const address = (formData.get('address') || '').trim();

    let order_number = (formData.get('order_number') || '').trim();
    const order_date = (formData.get('order_date') || new Date().toISOString().split('T')[0]).trim();
    const description = (formData.get('description') || '').trim();
    const remarks = (formData.get('remarks') || '').trim();

    const videoFile = formData.get('video');
    const duration_seconds = parseFloat(formData.get('duration_seconds') || '0');

    if (!customer_name || !phone_number || !address) {
      return NextResponse.json({ error: 'Customer Name, Phone, and Address are required.' }, { status: 400 });
    }

    // Auto-generate Customer ID if empty
    if (!customer_id) {
      const countRes = await query('SELECT COUNT(*)::int AS count FROM customers');
      customer_id = `CUST${String(countRes.rows[0].count + 1).padStart(3, '0')}`;
    }

    // Auto-generate Order Number if empty
    if (!order_number) {
      const ordCountRes = await query('SELECT COUNT(*)::int AS count FROM orders');
      order_number = `ORD-${String(ordCountRes.rows[0].count + 1).padStart(3, '0')}`;
    }

    // Check duplicate order number
    const existingOrder = await query('SELECT id FROM orders WHERE order_number = $1', [order_number]);
    if (existingOrder.rows.length > 0) {
      return NextResponse.json({ error: `Order Number ${order_number} already exists.` }, { status: 409 });
    }

    // 2. Find or Create Customer
    const custRes = await query('SELECT * FROM customers WHERE customer_id = $1', [customer_id]);
    let customer = custRes.rows[0];
    const now = new Date().toISOString();

    if (!customer) {
      const insertCust = await query(
        `INSERT INTO customers (customer_id, customer_name, phone_number, address, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id`,
        [customer_id, customer_name, phone_number, address, now, now]
      );
      customer = { id: insertCust.rows[0].id, customer_id, customer_name, phone_number, address, created_at: now };

      await query(
        `INSERT INTO activity_logs (type, title, description, customer_id, created_at)
         VALUES ($1, $2, $3, $4, $5)`,
        ['customer_created', `New customer added: ${customer_name}`, `Registered ID ${customer_id}`, customer_id, now]
      );
    } else {
      await query(
        `UPDATE customers SET customer_name = $1, phone_number = $2, address = $3, updated_at = $4
         WHERE id = $5`,
        [customer_name, phone_number, address, now, customer.id]
      );
      customer = { ...customer, customer_name, phone_number, address };
    }

    // 3. Process Video buffer
    let videoBuffer = null;
    let videoMeta = {
      video_name: `Order Video_${order_number}.mp4`,
      mime_type: 'video/mp4',
      duration_seconds: duration_seconds,
      file_size: 0
    };

    if (videoFile && typeof videoFile.arrayBuffer === 'function') {
      const bytes = await videoFile.arrayBuffer();
      videoBuffer = Buffer.from(bytes);
      videoMeta.file_size = videoBuffer.length;
      videoMeta.mime_type = videoFile.type || 'video/mp4';
      if (videoFile.name) {
        videoMeta.video_name = videoFile.name.endsWith('.mp4') || videoFile.name.endsWith('.webm')
          ? videoFile.name
          : `${videoFile.name}.mp4`;
      }
    }

    // 4. File System Hierarchy & PDF Generation
    const storageRes = await processOrderSubmission({
      customer,
      order: {
        order_number,
        order_date,
        description,
        remarks,
        created_at: now
      },
      videoBuffer,
      videoMeta,
      baseUrl: getRequestBaseUrl(req)
    });

    // 5. Save Order to PostgreSQL Database
    const orderInsert = await query(
      `INSERT INTO orders (order_number, customer_id, order_date, description, remarks, created_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [order_number, customer_id, order_date, description, remarks, now]
    );
    const orderId = orderInsert.rows[0].id;

    // 6. Save Video Record to PostgreSQL Database
    let videoId = null;
    if (videoBuffer && videoBuffer.length > 0) {
      const videoInsert = await query(
        `INSERT INTO order_videos (order_id, order_number, video_name, video_url, local_path, upload_status, file_size, duration_seconds, mime_type, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING id`,
        [
          orderId,
          order_number,
          storageRes.videoFileName,
          `/api/videos/stream/${order_number}`,
          storageRes.orderVideoPath,
          'uploaded',
          videoMeta.file_size,
          videoMeta.duration_seconds,
          videoMeta.mime_type,
          now
        ]
      );
      videoId = videoInsert.rows[0].id;
    }

    // 7. Log Activity
    await query(
      `INSERT INTO activity_logs (type, title, description, customer_id, order_number, created_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        'order_created',
        `Order recorded for ${customer.customer_id} (Order #${order_number})`,
        description ? description.substring(0, 60) : 'Order details registered',
        customer.customer_id,
        order_number,
        now
      ]
    );

    if (videoId) {
      await query(
        `INSERT INTO activity_logs (type, title, description, customer_id, order_number, created_at)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          'video_uploaded',
          `Video recorded successfully for ${customer.customer_id}`,
          `Order #${order_number} video (${Math.round(videoMeta.duration_seconds)}s) archived.`,
          customer.customer_id,
          order_number,
          now
        ]
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Order recorded and saved successfully',
      customer_id: customer.customer_id,
      order_number,
      order_id: orderId,
      video_id: videoId
    });
  } catch (err) {
    console.error('Order creation error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error while processing order' }, { status: 500 });
  }
}
