const fs = require('fs');
const path = require('path');
const { getDriveClient, findOrCreateFolder, uploadToDrive } = require('./drive');
const { generateCustomerPdf, generateOrderPdf } = require('./pdf');

const ROOT_STORAGE_DIR = path.join(process.cwd(), 'storage', 'CUSTOMER DATABASE');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * Save Customer & Order details, generate PDFs, and sync to Google Drive
 */
async function processOrderSubmission({ customer, order, videoBuffer, videoMeta }) {
  const customerId = customer.customer_id.trim();
  const orderNumber = order.order_number.trim();

  // 1. Local storage paths matching EXACT hierarchy
  const customerDir = path.join(ROOT_STORAGE_DIR, customerId);
  const ordersDir = path.join(customerDir, 'Orders');
  const orderDir = path.join(ordersDir, orderNumber);

  ensureDir(customerDir);
  ensureDir(ordersDir);
  ensureDir(orderDir);

  // 2. Generate PDFs
  const customerPdfBuffer = await generateCustomerPdf(customer, [order]);
  const orderPdfBuffer = await generateOrderPdf(order, customer, videoMeta);

  // Write local copies
  const customerPdfPath = path.join(customerDir, 'Customer Details.pdf');
  const customerJsonPath = path.join(customerDir, 'Customer Details.json');
  const orderPdfPath = path.join(orderDir, 'Order Details.pdf');
  const videoFileName = videoMeta.video_name || `Order Video_${orderNumber}.mp4`;
  const orderVideoPath = path.join(orderDir, videoFileName);

  fs.writeFileSync(customerPdfPath, customerPdfBuffer);
  fs.writeFileSync(customerJsonPath, JSON.stringify({
    customer,
    lastOrder: order,
    updatedAt: new Date().toISOString()
  }, null, 2));

  fs.writeFileSync(orderPdfPath, orderPdfBuffer);
  if (videoBuffer && videoBuffer.length > 0) {
    fs.writeFileSync(orderVideoPath, videoBuffer);
  }

  // 3. Google Drive Sync if connected
  let driveResults = {
    isDriveConnected: false,
    customerFolderId: null,
    orderFolderId: null,
    videoFileId: null,
    videoDriveUrl: null,
    customerPdfFileId: null,
    orderPdfFileId: null
  };

  const client = getDriveClient();
  if (client) {
    try {
      const drive = client.drive;

      // Ensure root folder
      const rootFolderId = await findOrCreateFolder(drive, 'CUSTOMER DATABASE');

      // Ensure customer folder
      const customerFolderId = await findOrCreateFolder(drive, customerId, rootFolderId);
      driveResults.customerFolderId = customerFolderId;

      // Upload Customer Details.pdf
      const custPdfRes = await uploadToDrive(drive, {
        name: 'Customer Details.pdf',
        mimeType: 'application/pdf',
        buffer: customerPdfBuffer,
        parentId: customerFolderId
      });
      driveResults.customerPdfFileId = custPdfRes.id;

      // Upload Customer Details.json
      await uploadToDrive(drive, {
        name: 'Customer Details.json',
        mimeType: 'application/json',
        buffer: Buffer.from(JSON.stringify(customer, null, 2)),
        parentId: customerFolderId
      });

      // Ensure Orders folder
      const ordersFolderId = await findOrCreateFolder(drive, 'Orders', customerFolderId);

      // Ensure specific Order folder
      const orderFolderId = await findOrCreateFolder(drive, orderNumber, ordersFolderId);
      driveResults.orderFolderId = orderFolderId;

      // Upload Order Details.pdf
      const orderPdfRes = await uploadToDrive(drive, {
        name: 'Order Details.pdf',
        mimeType: 'application/pdf',
        buffer: orderPdfBuffer,
        parentId: orderFolderId
      });
      driveResults.orderPdfFileId = orderPdfRes.id;

      // Upload Order Video
      if (videoBuffer && videoBuffer.length > 0) {
        const videoRes = await uploadToDrive(drive, {
          name: videoFileName,
          mimeType: videoMeta.mime_type || 'video/mp4',
          buffer: videoBuffer,
          parentId: orderFolderId
        });

        driveResults.videoFileId = videoRes.id;
        driveResults.videoDriveUrl = videoRes.webViewLink;
      }

      driveResults.isDriveConnected = true;
    } catch (gerr) {
      console.error('Google Drive Upload error (continuing with local verified storage):', gerr.message);
      driveResults.error = gerr.message;
    }
  }

  return {
    customerPdfPath,
    orderPdfPath,
    orderVideoPath,
    videoFileName,
    driveResults
  };
}

module.exports = {
  ROOT_STORAGE_DIR,
  processOrderSubmission
};
