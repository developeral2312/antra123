const PDFDocument = require('pdfkit');

/**
 * Generate Customer Details PDF
 * @param {Object} customer - Customer data
 * @param {Array} orders - List of orders for this customer
 * @returns {Promise<Buffer>}
 */
function generateCustomerPdf(customer, orders = []) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const buffers = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      // Colors
      const primaryColor = '#1d4ed8'; // Blue-700
      const secondaryColor = '#0b132b'; // Dark Navy
      const grayText = '#4b5563';
      const lightBg = '#f1f5f9';

      // --- Header ---
      doc.rect(40, 40, doc.page.width - 80, 75).fill(lightBg);

      doc.fillColor(primaryColor).fontSize(22).font('Helvetica-Bold')
         .text('ANTRA', 55, 52);
      
      doc.fillColor(grayText).fontSize(10).font('Helvetica')
         .text('Customer Order Management & Video Verification System', 55, 78);

      doc.fillColor(secondaryColor).fontSize(12).font('Helvetica-Bold')
         .text('OFFICIAL CUSTOMER DOSSIER', doc.page.width - 250, 60, { width: 195, align: 'right' });
      
      doc.fillColor(grayText).fontSize(9).font('Helvetica')
         .text(`Generated: ${new Date().toLocaleString()}`, doc.page.width - 250, 78, { width: 195, align: 'right' });

      doc.moveDown(3);

      // --- Customer Information Card ---
      const startY = 135;
      doc.fillColor(secondaryColor).fontSize(14).font('Helvetica-Bold')
         .text('Customer Information', 40, startY);

      doc.rect(40, startY + 22, doc.page.width - 80, 115).stroke('#cbd5e1');

      const col1 = 55;
      const col2 = 180;
      const col3 = 330;
      const col4 = 440;

      let rowY = startY + 35;
      doc.fontSize(10).font('Helvetica-Bold').fillColor(grayText).text('Customer ID:', col1, rowY);
      doc.font('Helvetica-Bold').fillColor(primaryColor).text(customer.customer_id || 'N/A', col2, rowY);

      doc.font('Helvetica-Bold').fillColor(grayText).text('Phone Number:', col3, rowY);
      doc.font('Helvetica').fillColor(secondaryColor).text(customer.phone_number || 'N/A', col4, rowY);

      rowY += 24;
      doc.font('Helvetica-Bold').fillColor(grayText).text('Customer Name:', col1, rowY);
      doc.font('Helvetica-Bold').fillColor(secondaryColor).text(customer.customer_name || 'N/A', col2, rowY);

      doc.font('Helvetica-Bold').fillColor(grayText).text('Registered Date:', col3, rowY);
      doc.font('Helvetica').fillColor(secondaryColor).text(customer.created_at ? new Date(customer.created_at).toLocaleDateString() : 'N/A', col4, rowY);

      rowY += 24;
      doc.font('Helvetica-Bold').fillColor(grayText).text('Full Address:', col1, rowY);
      doc.font('Helvetica').fillColor(secondaryColor).text(customer.address || 'N/A', col2, rowY, { width: 330 });

      // --- Order History Summary ---
      const orderStartY = startY + 160;
      doc.fillColor(secondaryColor).fontSize(14).font('Helvetica-Bold')
         .text(`Order History (${orders.length} Total Orders)`, 40, orderStartY);

      let tableY = orderStartY + 25;
      // Table Header
      doc.rect(40, tableY, doc.page.width - 80, 24).fill('#e2e8f0');
      doc.fillColor(secondaryColor).fontSize(9).font('Helvetica-Bold');
      doc.text('Order #', 50, tableY + 7);
      doc.text('Order Date', 140, tableY + 7);
      doc.text('Description', 230, tableY + 7, { width: 170 });
      doc.text('Video Status', 420, tableY + 7);
      doc.text('Created', 490, tableY + 7);

      tableY += 24;

      if (orders.length === 0) {
        doc.rect(40, tableY, doc.page.width - 80, 30).stroke('#e2e8f0');
        doc.fillColor(grayText).fontSize(10).font('Helvetica')
           .text('No orders registered yet for this customer.', 55, tableY + 10);
        tableY += 30;
      } else {
        orders.forEach((ord, idx) => {
          const rowBg = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
          doc.rect(40, tableY, doc.page.width - 80, 26).fill(rowBg);
          doc.rect(40, tableY, doc.page.width - 80, 26).stroke('#e2e8f0');

          doc.fillColor(primaryColor).fontSize(9).font('Helvetica-Bold')
             .text(ord.order_number, 50, tableY + 8);

          doc.fillColor(secondaryColor).font('Helvetica')
             .text(ord.order_date || 'N/A', 140, tableY + 8);

          doc.text((ord.description || 'N/A').substring(0, 32), 230, tableY + 8, { width: 170 });

          const status = ord.video_status || 'Uploaded';
          doc.fillColor(status.toLowerCase() === 'uploaded' ? '#16a34a' : '#ea580c').font('Helvetica-Bold')
             .text(status, 420, tableY + 8);

          doc.fillColor(grayText).font('Helvetica')
             .text(ord.created_at ? new Date(ord.created_at).toLocaleDateString() : 'N/A', 490, tableY + 8);

          tableY += 26;
        });
      }

      // --- Footer / Verification ---
      const footerY = doc.page.height - 80;
      doc.rect(40, footerY - 10, doc.page.width - 80, 1).fill('#cbd5e1');
      doc.fillColor(grayText).fontSize(8).font('Helvetica')
         .text('CONFIDENTIAL - Antra Order Management & Video Verification System', 40, footerY)
         .text('Permanent Cloud Archive on Google Drive • Customer Record Document', 40, footerY + 14);

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Generate Order Details PDF
 * @param {Object} order - Order data
 * @param {Object} customer - Customer data
 * @param {Object} video - Video record if any
 * @returns {Promise<Buffer>}
 */
function generateOrderPdf(order, customer, video = null) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const buffers = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      const primaryColor = '#1d4ed8';
      const secondaryColor = '#0b132b';
      const grayText = '#4b5563';
      const lightBg = '#f1f5f9';

      // --- Header ---
      doc.rect(40, 40, doc.page.width - 80, 75).fill(lightBg);

      doc.fillColor(primaryColor).fontSize(22).font('Helvetica-Bold')
         .text('ANTRA', 55, 52);
      
      doc.fillColor(grayText).fontSize(10).font('Helvetica')
         .text('Customer Order Management & Video Verification', 55, 78);

      doc.fillColor(secondaryColor).fontSize(13).font('Helvetica-Bold')
         .text('ORDER CONFIRMATION', doc.page.width - 250, 58, { width: 195, align: 'right' });
      
      doc.fillColor(primaryColor).fontSize(11).font('Helvetica-Bold')
         .text(`Order #${order.order_number}`, doc.page.width - 250, 74, { width: 195, align: 'right' });

      doc.fillColor(grayText).fontSize(8).font('Helvetica')
         .text(`Date: ${order.order_date || new Date().toISOString().split('T')[0]}`, doc.page.width - 250, 89, { width: 195, align: 'right' });

      // --- Customer Info Card ---
      const startY = 135;
      doc.fillColor(secondaryColor).fontSize(13).font('Helvetica-Bold')
         .text('Customer Details', 40, startY);

      doc.rect(40, startY + 20, doc.page.width - 80, 80).stroke('#cbd5e1');

      let rowY = startY + 32;
      doc.fontSize(10).font('Helvetica-Bold').fillColor(grayText).text('Customer Name:', 55, rowY);
      doc.font('Helvetica-Bold').fillColor(secondaryColor).text(customer.customer_name || 'N/A', 170, rowY);

      doc.font('Helvetica-Bold').fillColor(grayText).text('Customer ID:', 340, rowY);
      doc.font('Helvetica-Bold').fillColor(primaryColor).text(customer.customer_id || 'N/A', 430, rowY);

      rowY += 22;
      doc.font('Helvetica-Bold').fillColor(grayText).text('Phone Number:', 55, rowY);
      doc.font('Helvetica').fillColor(secondaryColor).text(customer.phone_number || 'N/A', 170, rowY);

      doc.font('Helvetica-Bold').fillColor(grayText).text('Address:', 340, rowY);
      doc.font('Helvetica').fillColor(secondaryColor).text(customer.address || 'N/A', 430, rowY, { width: 110 });

      // --- Order Description Card ---
      const orderCardY = startY + 120;
      doc.fillColor(secondaryColor).fontSize(13).font('Helvetica-Bold')
         .text('Order Specifications', 40, orderCardY);

      doc.rect(40, orderCardY + 20, doc.page.width - 80, 110).stroke('#cbd5e1');

      rowY = orderCardY + 32;
      doc.fontSize(10).font('Helvetica-Bold').fillColor(grayText).text('Order Number:', 55, rowY);
      doc.font('Helvetica-Bold').fillColor(primaryColor).text(order.order_number, 170, rowY);

      doc.font('Helvetica-Bold').fillColor(grayText).text('Order Date:', 340, rowY);
      doc.font('Helvetica').fillColor(secondaryColor).text(order.order_date || 'N/A', 430, rowY);

      rowY += 24;
      doc.font('Helvetica-Bold').fillColor(grayText).text('Description:', 55, rowY);
      doc.font('Helvetica').fillColor(secondaryColor).text(order.description || 'No description provided.', 170, rowY, { width: 370 });

      rowY += 28;
      doc.font('Helvetica-Bold').fillColor(grayText).text('Remarks:', 55, rowY);
      doc.font('Helvetica').fillColor(secondaryColor).text(order.remarks || 'None', 170, rowY, { width: 370 });

      // --- Video Recording Card ---
      const videoCardY = orderCardY + 150;
      doc.fillColor(secondaryColor).fontSize(13).font('Helvetica-Bold')
         .text('Verification Video Recording', 40, videoCardY);

      doc.rect(40, videoCardY + 20, doc.page.width - 80, 85).fill('#f8fafc');
      doc.rect(40, videoCardY + 20, doc.page.width - 80, 85).stroke('#cbd5e1');

      rowY = videoCardY + 34;
      doc.fontSize(10).font('Helvetica-Bold').fillColor(grayText).text('Video File:', 55, rowY);
      doc.font('Helvetica-Bold').fillColor(secondaryColor).text(video ? (video.video_name || 'Order Video.mp4') : 'Order Video.mp4', 170, rowY);

      doc.font('Helvetica-Bold').fillColor(grayText).text('Upload Status:', 340, rowY);
      doc.font('Helvetica-Bold').fillColor('#16a34a').text(video ? (video.upload_status || 'Uploaded') : 'Uploaded', 430, rowY);

      rowY += 24;
      doc.font('Helvetica-Bold').fillColor(grayText).text('Drive File ID:', 55, rowY);
      doc.font('Helvetica').fillColor(secondaryColor).text(video?.google_drive_file_id || 'GDrive-Sync-Active', 170, rowY);

      doc.font('Helvetica-Bold').fillColor(grayText).text('Duration:', 340, rowY);
      const dur = video?.duration_seconds ? `${Math.round(video.duration_seconds)} sec` : 'Verified Recording';
      doc.font('Helvetica').fillColor(secondaryColor).text(dur, 430, rowY);

      // --- Security Stamp / Signatures ---
      const stampY = videoCardY + 125;
      doc.rect(40, stampY, 230, 70).stroke('#cbd5e1');
      doc.fillColor(grayText).fontSize(9).font('Helvetica-Bold').text('Customer Verification Signature', 55, stampY + 10);
      doc.text('Date: ________________________', 55, stampY + 50);

      doc.rect(doc.page.width - 270, stampY, 230, 70).stroke('#cbd5e1');
      doc.fillColor(grayText).fontSize(9).font('Helvetica-Bold').text('Authorized Antra Administrator', doc.page.width - 255, stampY + 10);
      doc.fillColor(primaryColor).fontSize(8).font('Helvetica-Bold').text('Digitally Verified & Recorded', doc.page.width - 255, stampY + 35);
      doc.fillColor(grayText).text(`Stamp: ANTRA-${order.order_number}`, doc.page.width - 255, stampY + 50);

      // --- Footer ---
      const footerY = doc.page.height - 60;
      doc.rect(40, footerY - 10, doc.page.width - 80, 1).fill('#cbd5e1');
      doc.fillColor(grayText).fontSize(8).font('Helvetica')
         .text('Antra Customer Order Management System • Secure Google Drive Storage', 40, footerY)
         .text(`Order Reference: ${order.order_number} • Customer: ${customer.customer_id}`, 40, footerY + 12);

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = {
  generateCustomerPdf,
  generateOrderPdf
};
