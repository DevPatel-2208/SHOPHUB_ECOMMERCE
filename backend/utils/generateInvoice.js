import PDFDocument from 'pdfkit';

/**
 * Safely get a value or return a fallback
 */
const safe = (val, fallback = '') => (val != null ? val : fallback);

/**
 * Safely format a number with Indian locale, defaulting to 0
 */
const fmt = (val) => `₹${(Number(val) || 0).toLocaleString('en-IN')}`;

/**
 * Safely format a date string
 */
const fmtDate = (val, opts = { year: 'numeric', month: 'long', day: 'numeric' }) => {
  if (!val) return 'N/A';
  try {
    return new Date(val).toLocaleDateString('en-IN', opts);
  } catch {
    return 'N/A';
  }
};

/**
 * Generate a professional, Amazon-style invoice PDF
 * @param {Object} order - Full populated order document
 * @returns {Promise<Buffer>}
 */
export const generateInvoicePDF = (order) => {
  return new Promise((resolve, reject) => {
    try {
      // ── Guard: validate essential fields ──────────────────────────────
      if (!order || !order._id) {
        return reject(new Error('Invalid order data: missing order ID'));
      }

      const doc = new PDFDocument({
        margin: 40,
        size: 'A4',
        info: {
          Title: `Invoice #${safe(order._id, '').toString().slice(-6).toUpperCase()}`,
          Author: 'E-Commerce Store',
          Subject: 'Order Invoice',
        },
      });

      const chunks = [];
      let pageNumber = 0;
      const totalInvoiceNum = `INV-${safe(order._id, '').toString().slice(-8).toUpperCase()}`;

      // ── Auto-number pages as they are added ───────────────────────────
      doc.on('pageAdded', () => {
        pageNumber++;
        // We'll add the footer on the 'end' event instead to avoid overlap with content
      });

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err) => reject(err));

      // ─── Color Scheme ──────────────────────────────────────────────────
      const colors = {
        primary: '#1a1a2e',
        secondary: '#4F46E5',
        accent: '#6366F1',
        text: '#333333',
        textLight: '#666666',
        textMuted: '#999999',
        border: '#E5E7EB',
        bgLight: '#F9FAFB',
        white: '#FFFFFF',
        green: '#10B981',
        red: '#EF4444',
        yellow: '#F59E0B',
      };

      // ─── Helper: draw a table row with background ─────────────────────
      const drawTableRow = (y, columns, widths, options = {}) => {
        const { isHeader, isAlternate, bgColor } = options;
        let x = 40;

        if (isHeader) {
          doc.rect(40, y - 6, 525, 28).fill(colors.secondary);
        } else if (isAlternate) {
          doc.rect(40, y - 6, 525, 28).fill(colors.bgLight);
        } else if (bgColor) {
          doc.rect(40, y - 6, 525, 28).fill(bgColor);
        }

        columns.forEach((col, i) => {
          const w = widths[i] || 100;
          doc
            .fontSize(isHeader ? 8 : 9)
            .fillColor(isHeader ? colors.white : colors.text)
            .font(isHeader ? 'Helvetica-Bold' : 'Helvetica')
            .text(String(col), x + 4, y, {
              width: w - 8,
              align: i === 0 ? 'left' : i === widths.length - 1 ? 'right' : 'center',
              lineBreak: false,
            });
          x += w;
        });
      };

      // ═══════════════════════════════════════════════════════════════════
      //  PAGE 1: HEADER
      // ═══════════════════════════════════════════════════════════════════
      doc.rect(0, 0, 595.28, 6).fill(colors.secondary);

      // Store Logo/Name & Invoice Title
      doc.fontSize(22).fillColor(colors.primary).font('Helvetica-Bold');
      doc.text('STORE', 40, 30);
      doc.fontSize(8).fillColor(colors.secondary).font('Helvetica');
      doc.text('YOUR TRUSTED ONLINE STORE', 40, 56);

      doc.fontSize(20).fillColor(colors.primary).font('Helvetica-Bold');
      doc.text('TAX INVOICE', 40, 30, { align: 'right' });

      doc.moveTo(40, 75).lineTo(555, 75).strokeColor(colors.border).lineWidth(1).stroke();

      // ═══════════════════════════════════════════════════════════════════
      //  STORE & INVOICE INFO SIDE BY SIDE
      // ═══════════════════════════════════════════════════════════════════
      doc.fontSize(9).fillColor(colors.text).font('Helvetica');

      // Left – Store Details
      doc.font('Helvetica-Bold').fontSize(10).fillColor(colors.primary);
      doc.text('Sold By:', 40, 88);
      doc.font('Helvetica').fontSize(9).fillColor(colors.text);
      doc.text('E-Commerce Store Pvt. Ltd.', 40, 103);
      doc.text('123, Business Avenue,', 40, 116);
      doc.text('MG Road, Bangalore - 560001', 40, 129);
      doc.text('Karnataka, India', 40, 142);

      doc.font('Helvetica').fillColor(colors.textLight);
      doc.text('GSTIN: 29ABCDE1234F1Z5', 40, 162);
      doc.text('PAN: ABCDE1234F', 40, 175);
      doc.text('Email: support@estore.com', 40, 188);
      doc.text('Phone: +91 9876543210', 40, 201);

      // Right – Invoice Details
      const rightX = 300;
      doc.font('Helvetica-Bold').fontSize(10).fillColor(colors.primary);
      doc.text('Invoice Details:', rightX, 88);
      doc.font('Helvetica').fontSize(9).fillColor(colors.text);

      const paymentMethodLabel =
        order.paymentMethod === 'cashfree' ? 'Online Payment (Cashfree)' :
        order.paymentMethod === 'cod' ? 'Cash on Delivery' :
        order.paymentMethod === 'razorpay' ? 'Online Payment (Razorpay)' :
        order.paymentMethod === 'wallet' ? 'Wallet' :
        safe(order.paymentMethod, 'N/A');

      const paymentStatusLabel = order.isPaid
        ? 'Paid'
        : order.paymentMethod === 'cod'
          ? 'Pending (COD)'
          : 'Unpaid';

      const invoiceDetails = [
        { label: 'Invoice No:', value: totalInvoiceNum },
        { label: 'Order ID:', value: `#${safe(order._id, '').toString().slice(-6).toUpperCase()}` },
        { label: 'Order Date:', value: fmtDate(order.createdAt, { year: 'numeric', month: 'long', day: 'numeric' }) },
        { label: 'Payment Method:', value: paymentMethodLabel },
        { label: 'Payment Status:', value: paymentStatusLabel },
      ];

      invoiceDetails.forEach((item, i) => {
        const yPos = 103 + i * 18;
        doc.fillColor(colors.textLight).font('Helvetica').text(item.label, rightX, yPos);
        doc.fillColor(colors.text).font('Helvetica-Bold').text(item.value, rightX + 100, yPos);
      });

      // ═══════════════════════════════════════════════════════════════════
      //  CUSTOMER DETAILS
      // ═══════════════════════════════════════════════════════════════════
      doc.rect(40, 220, 525, 1).fill(colors.border);
      doc.font('Helvetica-Bold').fontSize(10).fillColor(colors.primary);
      doc.text('Bill To:', 40, 235);

      const shipAddr = order.shippingAddress || {};
      doc.font('Helvetica').fontSize(9).fillColor(colors.text);
      doc.text(safe(shipAddr.fullName, 'N/A'), 40, 252);
      if (shipAddr.addressLine1) doc.text(safe(shipAddr.addressLine1), 40, 265);
      if (shipAddr.addressLine2) doc.text(safe(shipAddr.addressLine2), 40, 278);

      // Compute the next Y position based on available address lines
      let addrLines = 1;
      if (shipAddr.addressLine1) addrLines++;
      if (shipAddr.addressLine2) addrLines++;
      const addrBaseY = 252 + (addrLines - 1) * 13 + 13;

      doc.text(
        `${safe(shipAddr.city, '')}${shipAddr.city && shipAddr.state ? ', ' : ''}${safe(shipAddr.state, '')}${shipAddr.postalCode ? ' - ' : ''}${safe(shipAddr.postalCode, '')}`,
        40,
        addrBaseY,
      );
      doc.text(`Phone: ${safe(shipAddr.phone, 'N/A')}`, 40, addrBaseY + 13);
      if (order.user?.email) doc.text(`Email: ${order.user.email}`, 40, addrBaseY + 26);

      // ═══════════════════════════════════════════════════════════════════
      //  ORDER ITEMS TABLE
      // ═══════════════════════════════════════════════════════════════════
      const tableStartY = order.user?.email ? addrBaseY + 50 : addrBaseY + 37;
      doc.rect(40, tableStartY, 525, 1).fill(colors.border);
      doc.font('Helvetica-Bold').fontSize(11).fillColor(colors.primary);
      doc.text('Order Items', 40, tableStartY + 13);

      const tableHeaders = ['Product', 'SKU', 'Qty', 'Price', 'Discount', 'GST', 'Total'];
      const tableWidths = [195, 70, 35, 70, 55, 50, 50];
      const tableY = tableStartY + 33;

      drawTableRow(tableY, tableHeaders, tableWidths, { isHeader: true });

      let rowY = tableY + 28;
      let rowIndex = 0;
      const orderItems = Array.isArray(order.orderItems) ? order.orderItems : [];

      orderItems.forEach((item) => {
        const qty = Number(item.quantity) || 1;
        const price = Number(item.price) || 0;
        const itemTotal = price * qty;
        const itemsPrice = Number(order.itemsPrice) || 0;
        const discountPrice = Number(order.discountPrice) || 0;
        const discountPerItem =
          discountPrice > 0 && itemsPrice > 0
            ? Math.round((discountPrice / itemsPrice) * itemTotal)
            : 0;
        const gstPerItem = Math.round(itemTotal * 0.09); // 9% CGST
        const gstPerItem2 = Math.round(itemTotal * 0.09); // 9% SGST
        const finalTotal = itemTotal - discountPerItem + gstPerItem + gstPerItem2;

        // Check if we need a new page
        if (rowY > 720) {
          doc.addPage();
          rowY = 50;
          drawTableRow(
            rowY,
            ['Product (cont.)', 'SKU', 'Qty', 'Price', 'Discount', 'GST', 'Total'],
            tableWidths,
            { isHeader: true },
          );
          rowY += 28;
        }

        const itemName = safe(item.name, 'Product');
        drawTableRow(
          rowY,
          [
            itemName.length > 40 ? itemName.substring(0, 40) + '...' : itemName,
            safe(item.sku, 'N/A'),
            String(qty),
            fmt(price),
            discountPerItem > 0 ? `-${fmt(discountPerItem)}` : '-',
            fmt(gstPerItem + gstPerItem2),
            fmt(finalTotal),
          ],
          tableWidths,
          { isAlternate: rowIndex % 2 === 1 },
        );

        // Show variant if exists
        const variant = item.variant || {};
        if (variant.color || variant.size) {
          const variantStr = [variant.color && `Color: ${variant.color}`, variant.size && `Size: ${variant.size}`]
            .filter(Boolean)
            .join(', ');
          doc.fontSize(7).fillColor(colors.textMuted).font('Helvetica');
          doc.text(variantStr, 44, rowY + 18, { width: 180 });
        }

        rowY += 28;
        rowIndex++;
      });

      // ═══════════════════════════════════════════════════════════════════
      //  SUMMARY SECTION
      // ═══════════════════════════════════════════════════════════════════
      const summaryY = Math.max(rowY + 20, 520);
      doc.rect(40, summaryY - 5, 525, 1).fill(colors.border);

      const summaryX = 320;
      const summaryItems = [
        { label: 'Subtotal', value: fmt(order.itemsPrice), highlight: false },
      ];

      if ((Number(order.discountPrice) || 0) > 0) {
        summaryItems.push({
          label: 'Discount',
          value: `-${fmt(order.discountPrice)}`,
          highlight: false,
          color: colors.green,
        });
      }

      if (order.couponCode) {
        summaryItems.push({
          label: `Coupon (${order.couponCode})`,
          value: '',
          highlight: false,
          color: colors.green,
        });
      }

      if (order.offerName) {
        summaryItems.push({
          label: `Offer (${order.offerName})`,
          value: '',
          highlight: false,
          color: colors.green,
        });
      }

      const shippingPrice = Number(order.shippingPrice) || 0;
      summaryItems.push(
        {
          label: 'Shipping',
          value: shippingPrice === 0 ? 'FREE' : fmt(order.shippingPrice),
          highlight: false,
          color: shippingPrice === 0 ? colors.green : colors.text,
        },
        { label: 'GST (18%)', value: fmt(order.taxPrice), highlight: false },
        { label: 'Grand Total', value: fmt(order.totalPrice), highlight: true },
      );

      let sY = summaryY + 10;
      const lineH = 22;

      summaryItems.forEach((item) => {
        const isHighlight = item.highlight;
        const color = item.color || colors.text;

        if (isHighlight) {
          doc.rect(summaryX, sY - 4, 215, 30).fill(colors.secondary);
          doc.font('Helvetica-Bold').fontSize(11).fillColor(colors.white);
        } else {
          doc.font('Helvetica').fontSize(9).fillColor(color);
        }

        doc.text(item.label, summaryX + 10, sY + (isHighlight ? 6 : 2), { width: 120 });
        doc
          .font(isHighlight ? 'Helvetica-Bold' : 'Helvetica-Bold')
          .fontSize(isHighlight ? 12 : 9)
          .fillColor(isHighlight ? colors.white : color);
        doc.text(item.value, summaryX + 130, sY + (isHighlight ? 6 : 2), { width: 75, align: 'right' });

        sY += lineH;
      });

      // ═══════════════════════════════════════════════════════════════════
      //  OFFERS & COUPONS SECTION
      // ═══════════════════════════════════════════════════════════════════
      const offerY = sY + 15;
      if (order.couponCode || order.offerName) {
        doc.rect(40, offerY - 5, 525, 1).fill(colors.border);
        doc.font('Helvetica-Bold').fontSize(10).fillColor(colors.primary);
        doc.text('Offers & Coupons Applied', 40, offerY + 8);

        let oY = offerY + 28;
        if (order.couponCode) {
          doc.font('Helvetica').fontSize(9).fillColor(colors.text);
          doc.text('Coupon Code: ', 40, oY);
          doc.font('Helvetica-Bold').fillColor(colors.green);
          doc.text(order.couponCode, 120, oY);
          oY += 18;
        }
        if (order.offerName) {
          doc.font('Helvetica').fontSize(9).fillColor(colors.text);
          doc.text('Offer: ', 40, oY);
          doc.font('Helvetica-Bold').fillColor(colors.green);
          doc.text(order.offerName, 80, oY);
          oY += 18;
        }
        if (Number(order.cashbackAmount) > 0) {
          doc.font('Helvetica').fontSize(9).fillColor(colors.text);
          doc.text('Cashback: ', 40, oY);
          doc.font('Helvetica-Bold').fillColor(colors.green);
          doc.text(fmt(order.cashbackAmount), 90, oY);
        }
      }

      // ═══════════════════════════════════════════════════════════════════
      //  FOOTER
      // ═══════════════════════════════════════════════════════════════════
      const hasOfferSection = order.couponCode || order.offerName;
      const footerY = Math.max(hasOfferSection ? offerY + 110 : sY + 80, 700);
      doc.rect(0, footerY, 595.28, 60 + (order.paymentMethod === 'cod' ? 30 : 0)).fill(colors.bgLight);
      doc.rect(0, footerY, 595.28, 1).fill(colors.border);

      doc.font('Helvetica-Bold').fontSize(10).fillColor(colors.primary);
      doc.text('Thank you for your purchase!', 40, footerY + 15);

      doc.font('Helvetica').fontSize(8).fillColor(colors.textLight);
      doc.text('For any queries, please contact our support team:', 40, footerY + 35);
      doc.text('Email: support@estore.com | Phone: +91 9876543210', 40, footerY + 48);

      doc.fontSize(7).fillColor(colors.textMuted);
      doc.text('Terms & Conditions:', 40, footerY + 68);
      doc.text(
        '1. Items must be returned within 7 days of delivery. 2. Refunds will be processed within 5-7 business days.',
        40,
        footerY + 80,
      );
      doc.text(
        '3. This is a computer-generated invoice and does not require a physical signature.',
        40,
        footerY + 92,
      );

      // Payment info at bottom
      if (order.paymentMethod === 'cod') {
        doc.fontSize(7).fillColor(colors.yellow);
        doc.text(
          'Payment Method: Cash on Delivery — Please pay the delivery partner when your order arrives.',
          40,
          footerY + 110,
        );
      } else if (order.isPaid) {
        doc.fontSize(7).fillColor(colors.green);
        const paidText = order.paidAt
          ? `Paid on: ${fmtDate(order.paidAt, {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}`
          : 'Payment completed';
        // 🛡️ SAFE ACCESS: paymentResult may be undefined for older orders
        const paymentResult = order.paymentResult || {};
        const gateway = safe(paymentResult.gateway, 'Online');
        doc.text(`Payment Status: Paid via ${gateway} | ${paidText}`, 40, footerY + 110);
      }

      // Footer separator
      doc.rect(0, doc.y + 10, 595.28, 1).fill(colors.border);

      // ═══════════════════════════════════════════════════════════════════
      //  PAGE NUMBERS (using a cleaner approach without bufferedPageRange)
      // ═══════════════════════════════════════════════════════════════════
      // We number pages by counting from the pageAdded event
      const finalPageCount = pageNumber;
      // PDFKit keeps track of pages internally. We can safely iterate from
      // page 1 to finalPageCount, but only if finalPageCount > 1 to avoid
      // the "out of bounds" bug when pages have been flushed.
      // For the single-page case, just add page number to the last (current) page.
      if (finalPageCount >= 1) {
        doc.fontSize(7).fillColor(colors.textMuted);
        doc.text(
          `Page ${finalPageCount} of ${finalPageCount} | Invoice: ${totalInvoiceNum}`,
          40,
          795,
          { align: 'center', width: 515 },
        );
      }

      doc.end();
    } catch (error) {
      console.error('PDF Generation Error:', error);
      reject(error);
    }
  });
};
