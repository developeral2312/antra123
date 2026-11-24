import fs from 'fs';
const { getDb } = require('@/lib/db');

export async function GET(req, { params }) {
  const videoId = params.id;
  const db = getDb();

  const video = db.prepare(`
    SELECT * FROM order_videos WHERE id = ? OR order_number = ?
  `).get(videoId, videoId);

  if (!video || !video.local_path || !fs.existsSync(video.local_path)) {
    return new Response('Video file not found', { status: 404 });
  }

  const filePath = video.local_path;
  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const range = req.headers.get('range');

  const contentType = video.mime_type || (video.video_name?.endsWith('.webm') ? 'video/webm' : 'video/mp4');

  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunksize = (end - start) + 1;
    const file = fs.createReadStream(filePath, { start, end });

    // Convert Node ReadStream to Web ReadableStream
    const readable = new ReadableStream({
      start(controller) {
        file.on('data', chunk => controller.enqueue(chunk));
        file.on('end', () => controller.close());
        file.on('error', err => controller.error(err));
      }
    });

    return new Response(readable, {
      status: 206,
      headers: {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize.toString(),
        'Content-Type': contentType,
      }
    });
  } else {
    const file = fs.createReadStream(filePath);
    const readable = new ReadableStream({
      start(controller) {
        file.on('data', chunk => controller.enqueue(chunk));
        file.on('end', () => controller.close());
        file.on('error', err => controller.error(err));
      }
    });

    return new Response(readable, {
      status: 200,
      headers: {
        'Content-Length': fileSize.toString(),
        'Content-Type': contentType,
      }
    });
  }
}
