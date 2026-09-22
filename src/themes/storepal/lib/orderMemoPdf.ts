import { jsPDF } from 'jspdf';
import type { TrackedOrder } from '@/lib/checkoutApi';
import { formatPrice } from './formatPrice';

/**
 * Loads an image URL into a data URL jsPDF can embed, along with its
 * natural pixel dimensions (needed to draw it at the right aspect
 * ratio). Returns null on any failure (network error, CORS block, a
 * non-image response) so the caller can fall back to a plain text
 * wordmark instead of failing the whole PDF download over a missing or
 * unreachable logo.
 */
async function loadImageAsDataUrl(url: string): Promise<{ dataUrl: string; width: number; height: number } | null> {
  try {
    const res = await fetch(url, { mode: 'cors' });
    if (!res.ok) return null;
    const blob = await res.blob();
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Could not read logo image'));
      reader.readAsDataURL(blob);
    });
    const dimensions = await new Promise<{ width: number; height: number }>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
      img.onerror = () => reject(new Error('Could not read logo dimensions'));
      img.src = dataUrl;
    });
    return { dataUrl, ...dimensions };
  } catch {
    return null;
  }
}

/**
 * Builds and downloads a one-page order memo (invoice) PDF for the
 * thank-you page's "Download Memo" button — matches the reference
 * site's own printable order-confirmation memo. Pure client-side
 * (jsPDF), so this needs no server endpoint: everything it prints
 * already lives in the TrackedOrder the thank-you page already fetched
 * via the invoice+phone lookup (see useTrackOrder).
 *
 * The store's own nav logo is drawn top-left when available (same
 * placement as the page's own header) so the memo is recognizably
 * branded rather than plain text; falls back to the store name as a
 * text wordmark when there's no logo or it can't be loaded.
 */
export async function downloadOrderMemoPdf(order: TrackedOrder, storeName: string, logoUrl?: string | null) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 40;
  let y = 48;

  const logo = logoUrl ? await loadImageAsDataUrl(logoUrl) : null;

  if (logo) {
    // Cap the drawn logo to a sensible header size while preserving its
    // real aspect ratio, so a very wide or very tall upload never
    // distorts or overruns the header row.
    const maxW = 130;
    const maxH = 34;
    const scale = Math.min(maxW / logo.width, maxH / logo.height, 1);
    const w = logo.width * scale;
    const h = logo.height * scale;
    const format = logo.dataUrl.startsWith('data:image/png') ? 'PNG' : 'JPEG';
    doc.addImage(logo.dataUrl, format, margin, y - h + 6, w, h);
  } else {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(26, 43, 60); // --color-ink
    doc.text(storeName, margin, y);
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(233, 30, 99); // --color-accent
  doc.text('MEMO', pageWidth - margin, y, { align: 'right' });

  y += 10;
  doc.setDrawColor(226, 232, 240); // --color-line
  doc.line(margin, y, pageWidth - margin, y);
  y += 24;

  // Order meta
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(107, 118, 132); // --color-muted
  doc.text('Order Number', margin, y);
  doc.text('Order Date', pageWidth / 2, y);
  y += 14;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(26, 43, 60);
  doc.text(`ORDER-${order.invoiceNumber}`, margin, y);
  doc.text(new Date(order.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }), pageWidth / 2, y);
  y += 28;

  // Shipping details
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(107, 118, 132);
  doc.text('Deliver To', margin, y);
  y += 14;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(26, 43, 60);
  doc.text(order.customerName, margin, y);
  y += 15;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const addressLine = [order.shippingAddress, order.shippingCity, order.shippingDistrict].filter(Boolean).join(', ');
  const addressWrapped = doc.splitTextToSize(addressLine, pageWidth - margin * 2);
  doc.text(addressWrapped, margin, y);
  y += addressWrapped.length * 13 + 20;

  // Items table header
  const col = { name: margin, qty: pageWidth - 210, price: pageWidth - 140, total: pageWidth - margin };
  doc.setFillColor(238, 242, 247); // --color-canvas
  doc.rect(margin, y - 12, pageWidth - margin * 2, 22, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(26, 43, 60);
  doc.text('ITEM', col.name + 6, y + 3);
  doc.text('QTY', col.qty, y + 3, { align: 'right' });
  doc.text('PRICE', col.price, y + 3, { align: 'right' });
  doc.text('TOTAL', col.total, y + 3, { align: 'right' });
  y += 26;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  for (const item of order.items) {
    const nameLines = doc.splitTextToSize(item.productName, col.qty - col.name - 60);
    doc.setTextColor(26, 43, 60);
    doc.text(nameLines, col.name + 6, y);
    doc.setTextColor(107, 118, 132);
    doc.text(String(item.quantity), col.qty, y, { align: 'right' });
    doc.text(formatPrice(item.unitPrice), col.price, y, { align: 'right' });
    doc.setTextColor(26, 43, 60);
    doc.text(formatPrice(item.lineTotal), col.total, y, { align: 'right' });
    y += Math.max(nameLines.length * 13, 16) + 8;
  }

  y += 6;
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, y, pageWidth - margin, y);
  y += 22;

  // Totals block, right-aligned
  const totalsRow = (label: string, value: string, bold = false) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(bold ? 12 : 10);
    doc.setTextColor(bold ? 26 : 107, bold ? 43 : 118, bold ? 60 : 132);
    doc.text(label, col.price - 80, y, { align: 'right' });
    doc.text(value, col.total, y, { align: 'right' });
    y += bold ? 18 : 15;
  };
  totalsRow('Subtotal', formatPrice(order.subtotal));
  totalsRow('Delivery Charge', formatPrice(order.deliveryCharge));
  if (Number(order.vatAmount) > 0) {
    totalsRow('VAT', formatPrice(order.vatAmount));
  }
  // Platform Charge — deliberately ALWAYS printed once the order exists,
  // ignoring order.platformChargeHidden (which only hides it pre-payment,
  // on checkout's own cart summary — see ThankYouView.tsx's own comment
  // for the same reasoning: the shopper already paid this as part of
  // order.total, so the memo should account for it, not leave the total
  // looking unexplained). Labeled "Payment Gateway Fee" specifically for
  // ONLINE_PAYMENT orders — see ThankYouView.tsx's own comment.
  if (Number(order.platformChargeAmount) > 0) {
    const feeLabel = order.paymentMethod === 'ONLINE_PAYMENT' ? 'Payment Gateway Fee' : 'Platform Charge';
    totalsRow(feeLabel, formatPrice(order.platformChargeAmount));
  }
  if (Number(order.discountAmount) > 0) {
    totalsRow('Discount', `-${formatPrice(order.discountAmount)}`);
  }
  y += 4;
  doc.setDrawColor(203, 213, 225); // --color-line-strong
  doc.line(col.price - 80, y - 12, pageWidth - margin, y - 12);
  totalsRow('Total', formatPrice(order.total), true);

  y += 20;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(107, 118, 132);
  // paymentMethod is "COD" / "ONLINE_PAYMENT" (the two built-ins) or
  // CUSTOM:<gatewayId> for a vendor-connected custom gateway — see
  // Order.paymentMethod's own schema comment. This memo has no access to
  // that gateway's own displayLabel, so a custom gateway falls back to a
  // generic "Online Payment" label rather than showing the raw id.
  const paymentMethodLabel =
    order.paymentMethod === 'COD'
      ? 'Cash on Delivery'
      : order.paymentMethod === 'ONLINE_PAYMENT'
        ? 'Online Payment (Regantify)'
        : 'Online Payment';
  doc.text(`Payment Method: ${paymentMethodLabel}`, margin, y);

  // Footer
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFontSize(9);
  doc.setTextColor(150, 158, 168);
  doc.text(`Thank you for shopping with ${storeName}.`, pageWidth / 2, pageHeight - 40, { align: 'center' });

  doc.save(`ORDER-${order.invoiceNumber}-memo.pdf`);
}
