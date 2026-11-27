import fs from 'fs';
const { query } = require('@/lib/db');

function parseNumericId(val) {
  if (!/^\d+$/.test(String(val))) return -1;
  const num = Number(val);
  return Number.isSafeInteger(num) && num >= 0 && num <= 2147483647 ? num : -1;
}

export async function GET(req, { params }) {
  const videoId = params.id;
  const res = await query(
    `SELECT * FROM order_videos WHERE id = $1 OR order_number = $2`,
    [parseNumericId(videoId), videoId]
  );
  const video = res.rows[0];

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
        'Accept-Ranges': 'bytes',
        'Content-Length': fileSize.toString(),
        'Content-Type': contentType,
      }
    });
  }
}
