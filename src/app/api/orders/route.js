import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/api-auth';
const { getDb } = require('@/lib/db');
const { processOrderSubmission } = require('@/lib/storage');

export async function GET(req) {
  const user = getAuthUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') || '';
  const status = searchParams.get('status') || '';
  const sort = searchParams.get('sort') || 'newest';

  const db = getDb();
  let query = `
    SELECT 
      o.id,
      o.order_number,
      o.customer_id,
      o.order_date,
      o.description,
      o.remarks,
      o.google_drive_folder_id,
      o.created_at,
      c.customer_name,
      c.phone_number,
      v.id as video_id,
      v.video_name,
      v.google_drive_file_id,
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
    query += ` AND (o.order_number LIKE ? OR o.customer_id LIKE ? OR c.customer_name LIKE ? OR o.description LIKE ?)`;
    const pattern = `%${search}%`;
    params.push(pattern, pattern, pattern, pattern);
  }

  if (status) {
    query += ` AND v.upload_status = ?`;
    params.push(status);
  }

  if (sort === 'oldest') {
    query += ` ORDER BY o.id ASC`;
  } else {
    query += ` ORDER BY o.id DESC`;
  }

  const orders = db.prepare(query).all(...params);
  return NextResponse.json({ orders });
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

    const db = getDb();

    // Auto-generate Customer ID if empty
    if (!customer_id) {
      const countRow = db.prepare('SELECT count(*) as count FROM customers').get();
      customer_id = `CUST${String(countRow.count + 1).padStart(3, '0')}`;
    }

    // Auto-generate Order Number if empty
    if (!order_number) {
      const ordCount = db.prepare('SELECT count(*) as count FROM orders').get();
      order_number = `ORD-${String(ordCount.count + 1).padStart(3, '0')}`;
    }

    // Check duplicate order number
    const existingOrder = db.prepare('SELECT id FROM orders WHERE order_number = ?').get(order_number);
    if (existingOrder) {
      return NextResponse.json({ error: `Order Number ${order_number} already exists.` }, { status: 409 });
    }

    // 2. Find or Create Customer
    let customer = db.prepare('SELECT * FROM customers WHERE customer_id = ?').get(customer_id);
    const now = new Date().toISOString();

    if (!customer) {
      const info = db.prepare(`
        INSERT INTO customers (customer_id, customer_name, phone_number, address, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(customer_id, customer_name, phone_number, address, now, now);
      customer = { id: info.lastInsertRowid, customer_id, customer_name, phone_number, address, created_at: now };

      db.prepare(`
        INSERT INTO activity_logs (type, title, description, customer_id, created_at)
        VALUES (?, ?, ?, ?, ?)
      `).run('customer_created', `New customer added: ${customer_name}`, `Registered ID ${customer_id}`, customer_id, now);
    } else {
      // Update customer info if name/phone/address changed
      db.prepare(`
        UPDATE customers SET customer_name = ?, phone_number = ?, address = ?, updated_at = ?
        WHERE id = ?
      `).run(customer_name, phone_number, address, now, customer.id);
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

    // 4. File System Hierarchy, PDF Generation & Google Drive Sync
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
      videoMeta
    });

    // 5. Save Order to Database
    const orderInsert = db.prepare(`
      INSERT INTO orders (order_number, customer_id, order_date, description, remarks, google_drive_folder_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      order_number,
      customer_id,
      order_date,
      description,
      remarks,
      storageRes.driveResults.orderFolderId || null,
      now
    );

    const orderId = orderInsert.lastInsertRowid;

    // Update customer's drive folder ID if acquired
    if (storageRes.driveResults.customerFolderId && !customer.google_drive_folder_id) {
      db.prepare('UPDATE customers SET google_drive_folder_id = ? WHERE id = ?')
        .run(storageRes.driveResults.customerFolderId, customer.id);
    }

    // 6. Save Video Record to Database
    let videoId = null;
    if (videoBuffer && videoBuffer.length > 0) {
      const uploadStatus = storageRes.driveResults.isDriveConnected ? 'uploaded' : 'saved_locally';

      const videoInsert = db.prepare(`
        INSERT INTO order_videos (order_id, order_number, video_name, google_drive_file_id, video_url, local_path, upload_status, file_size, duration_seconds, mime_type, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        orderId,
        order_number,
        storageRes.videoFileName,
        storageRes.driveResults.videoFileId || null,
        storageRes.driveResults.videoDriveUrl || null,
        storageRes.orderVideoPath,
        uploadStatus,
        videoMeta.file_size,
        videoMeta.duration_seconds,
        videoMeta.mime_type,
        now
      );
      videoId = videoInsert.lastInsertRowid;
    }

    // 7. Log Activity
    db.prepare(`
      INSERT INTO activity_logs (type, title, description, customer_id, order_number, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      'order_created',
      `Order recorded for ${customer.customer_id} (Order #${order_number})`,
      description ? description.substring(0, 60) : 'Order details registered',
      customer.customer_id,
      order_number,
      now
    );

    if (videoId) {
      db.prepare(`
        INSERT INTO activity_logs (type, title, description, customer_id, order_number, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        'video_uploaded',
        `Video recorded successfully for ${customer.customer_id}`,
        `Order #${order_number} video (${Math.round(videoMeta.duration_seconds)}s) archived.`,
        customer.customer_id,
        order_number,
        now
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Order recorded and saved successfully',
      customer_id: customer.customer_id,
      order_number,
      order_id: orderId,
      video_id: videoId,
      drive_synced: storageRes.driveResults.isDriveConnected
    });

  } catch (err) {
    console.error('Order creation error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error while processing order' }, { status: 500 });
  }
}
