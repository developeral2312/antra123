const fs = require('fs');
const path = require('path');
const { generateCustomerPdf, generateOrderPdf } = require('./pdf');

const ROOT_STORAGE_DIR = path.join(process.cwd(), 'storage', 'CUSTOMER DATABASE');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * Save Customer & Order details, generate PDFs, and store videos locally
 */
async function processOrderSubmission({ customer, order, videoBuffer, videoMeta, baseUrl = '' }) {
  const customerId = customer.customer_id.trim();
  const orderNumber = order.order_number.trim();

  // 1. Local storage paths matching hierarchy
  const customerDir = path.join(ROOT_STORAGE_DIR, customerId);
  const ordersDir = path.join(customerDir, 'Orders');
  const orderDir = path.join(ordersDir, orderNumber);

  ensureDir(customerDir);
  ensureDir(ordersDir);
  ensureDir(orderDir);

  // 2. Generate PDFs
  const customerPdfBuffer = await generateCustomerPdf(customer, [order], baseUrl);
  const orderPdfBuffer = await generateOrderPdf(order, customer, videoMeta, baseUrl);

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

  return {
    customerPdfPath,
    orderPdfPath,
    orderVideoPath,
    videoFileName
  };
}

module.exports = {
  ROOT_STORAGE_DIR,
  processOrderSubmission
};
