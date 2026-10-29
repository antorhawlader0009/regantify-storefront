import type { TrackedOrder } from '@/lib/checkoutApi';
import { formatPrice } from './formatPrice';
import { orderLabel } from '@/lib/orderLabel';

/*
 * The shopper's cash memo (PDF), for "Download Memo" on the thank-you, tracking and account pages.
 *
 * Rebuilt 2026-10-29: the old memo was drawn with jsPDF's built-in Helvetica, which has no ৳ sign and cannot write
 * Bangla, so prices came out as "ó 2 , 4 0 0". Now the memo is an HTML page drawn by the browser itself (so ৳, Bangla
 * letters and the store's own fonts are exactly as on screen), turned into a sharp picture with html-to-image (MIT) and
 * put into a PDF with jsPDF. Both libraries are loaded only when the button is pressed. The text in the PDF is a picture,
 * not selectable; that is the price of correct Bangla (jsPDF and pdfmake can't join Bangla letters).
 *
 * Everything printed comes from the order answer the page already has (the tracking link's answer hides most of the
 * street address on purpose, so the memo does too). Numbers are always in English digits (the owner's rule).
 */

const PAGE_PX = 794; // A4 width at 96 dpi
const A4_PT = { w: 595.28, h: 841.89 };

type Lang = 'en' | 'bn';

const TEXT: Record<Lang, Record<string, string>> = {
  en: {
    title: 'Cash Memo',
    memoNo: 'Memo no.',
    date: 'Date',
    billTo: 'Bill to',
    order: 'Order',
    payment: 'Payment',
    status: 'Status',
    area: 'Delivery area',
    item: 'Item',
    qty: 'Qty',
    price: 'Unit price',
    amount: 'Amount',
    subtotal: 'Subtotal',
    delivery: 'Delivery charge',
    vat: 'VAT',
    platform: 'Platform charge',
    discount: 'Discount',
    total: 'Total',
    advance: 'Paid in advance',
    collect: 'Collect on delivery',
    paid: 'Paid',
    thanks: 'Thank you for shopping with {store}.',
    computer: 'This memo was made by computer. No signature is needed.',
    COD: 'Cash on Delivery',
    ONLINE: 'Online payment',
    DHAKA: 'Inside Dhaka',
    OUTSIDE_DHAKA: 'Outside Dhaka',
    AROUND_DHAKA: 'Around Dhaka',
    PICKUP: 'Pickup from the shop',
  },
  bn: {
    title: 'ক্যাশ মেমো',
    memoNo: 'মেমো নং',
    date: 'তারিখ',
    billTo: 'ক্রেতা',
    order: 'অর্ডার',
    payment: 'পেমেন্ট',
    status: 'অবস্থা',
    area: 'ডেলিভারি এলাকা',
    item: 'পণ্য',
    qty: 'পরিমাণ',
    price: 'একক দাম',
    amount: 'মোট',
    subtotal: 'সাবটোটাল',
    delivery: 'ডেলিভারি চার্জ',
    vat: 'ভ্যাট',
    platform: 'প্ল্যাটফর্ম চার্জ',
    discount: 'ছাড়',
    total: 'সর্বমোট',
    advance: 'আগে পরিশোধ',
    collect: 'ডেলিভারিতে দিতে হবে',
    paid: 'পরিশোধিত',
    thanks: '{store} থেকে কেনাকাটার জন্য ধন্যবাদ।',
    computer: 'এই মেমো কম্পিউটারে তৈরি, স্বাক্ষরের প্রয়োজন নেই।',
    COD: 'ক্যাশ অন ডেলিভারি',
    ONLINE: 'অনলাইন পেমেন্ট',
    DHAKA: 'ঢাকার ভেতরে',
    OUTSIDE_DHAKA: 'ঢাকার বাইরে',
    AROUND_DHAKA: 'ঢাকার আশেপাশে',
    PICKUP: 'দোকান থেকে নেওয়া',
  },
};

const STATUS: Record<Lang, Record<string, string>> = {
  en: {
    PENDING: 'Pending', ON_HOLD: 'On hold', PROCESSING: 'Processing', SHIPPING: 'Shipping', READY_FOR_PICKUP: 'Ready for pickup',
    COMPLETED: 'Delivered', CANCELLED: 'Cancelled', RETURN: 'Returned', REFUNDED: 'Refunded', PAYMENT_INITIATED: 'Awaiting payment',
    PAYMENT_FAILED: 'Payment failed',
  },
  bn: {
    PENDING: 'অপেক্ষমাণ', ON_HOLD: 'হোল্ডে', PROCESSING: 'প্রসেসিং', SHIPPING: 'পথে আছে', READY_FOR_PICKUP: 'নেওয়ার জন্য প্রস্তুত',
    COMPLETED: 'ডেলিভারি হয়েছে', CANCELLED: 'বাতিল', RETURN: 'ফেরত', REFUNDED: 'টাকা ফেরত', PAYMENT_INITIATED: 'পেমেন্টের অপেক্ষায়',
    PAYMENT_FAILED: 'পেমেন্ট হয়নি',
  },
};

const esc = (s: unknown) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

/** The store's logo as a data URL (so the picture step never needs to fetch it); null when it can't be loaded. */
async function logoDataUrl(url: string): Promise<string | null> {
  try {
    // no-store: the header's <img> already loaded this logo without CORS, and reusing that cached copy fails the CORS check.
    const res = await fetch(url, { mode: 'cors', cache: 'no-store' });
    if (!res.ok) return null;
    const blob = await res.blob();
    if (!blob.type.startsWith('image/')) return null;
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('logo'));
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

/** The page's own language and look: Bangla when the store (or the shopper's switch) shows Bangla. */
function pageStyle() {
  const root = getComputedStyle(document.documentElement);
  const accent = root.getPropertyValue('--color-accent').trim() || '#e8590c';
  const font = getComputedStyle(document.body).fontFamily || 'system-ui, sans-serif';
  const lang: Lang = document.documentElement.lang === 'bn' ? 'bn' : 'en';
  return { accent, font, lang };
}

function memoHtml(order: TrackedOrder, storeName: string, logo: string | null, lang: Lang, accent: string, font: string) {
  const t = TEXT[lang];
  const money = (v: string | number | null | undefined) => esc(formatPrice(Number(v ?? 0)));
  const date = new Date(order.createdAt).toLocaleDateString(lang === 'bn' ? 'bn-BD-u-nu-latn' : 'en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const payment = order.paymentMethod === 'COD' ? t.COD : t.ONLINE;
  const status = STATUS[lang][order.status] ?? order.status;
  const zone = order.deliveryZone ? (t[order.deliveryZone] ?? '') : '';
  const address = [order.shippingAddress, order.shippingCity, order.shippingDistrict].filter(Boolean).join(', ');
  const advancePaid = order.paymentMethod === 'COD' && order.advancePaidAt && Number(order.advanceAmount) > 0 ? Number(order.advanceAmount) : 0;
  const collect = order.paymentMethod === 'COD' ? Math.max(0, Number(order.total) - advancePaid) : 0;

  const rows = order.items
    .map((item, i) => {
      const options = Object.entries(item.selectedOptions ?? {}).map(([k, v]) => `${esc(k)}: ${esc(v)}`);
      const custom = (item.customValues ?? []).map((c) => `${esc(c.label)}: ${esc(c.value)}`);
      const sub = [...options, ...custom].join(' · ');
      return `<tr>
        <td class="n">${i + 1}</td>
        <td class="it"><div class="nm">${esc(item.productName)}</div>${sub ? `<div class="sub">${sub}</div>` : ''}</td>
        <td class="r">${item.quantity}</td>
        <td class="r">${money(item.unitPrice)}</td>
        <td class="r b">${money(item.lineTotal)}</td>
      </tr>`;
    })
    .join('');

  const line = (label: string, value: string, cls = '') => `<div class="tl ${cls}"><span>${label}</span><span>${value}</span></div>`;
  const totals = [
    line(t.subtotal, money(order.subtotal)),
    Number(order.deliveryCharge) > 0 || order.deliveryZone !== 'PICKUP' ? line(t.delivery, money(order.deliveryCharge)) : '',
    Number(order.vatAmount) > 0 ? line(t.vat, money(order.vatAmount)) : '',
    // The platform charge is part of what a non-online order paid; an online order's fee is never shown to shoppers.
    order.paymentMethod !== 'ONLINE_PAYMENT' && Number(order.platformChargeAmount) > 0 ? line(t.platform, money(order.platformChargeAmount)) : '',
    Number(order.discountAmount) > 0 ? line(order.discountLabel ? esc(order.discountLabel) : t.discount, `-${money(order.discountAmount)}`) : '',
    line(t.total, money(order.total), 'grand'),
    advancePaid > 0 ? line(t.advance, `-${money(advancePaid)}`) : '',
  ].join('');

  const due =
    order.paymentMethod === 'COD'
      ? `<div class="due"><span>${t.collect}</span><strong>${money(collect)}</strong></div>`
      : `<div class="due paid"><span>${payment}</span><strong>${t.paid}</strong></div>`;

  return `
<style>
  .memo { box-sizing: border-box; width: ${PAGE_PX}px; min-height: 1123px; padding: 52px 56px 40px; background: #fff; color: #1a2b3c;
    font-family: ${font}; font-size: 13px; line-height: 1.45; display: flex; flex-direction: column; }
  .memo * { box-sizing: border-box; }
  .hd { display: flex; justify-content: space-between; align-items: flex-start; gap: 24px; }
  .brand { display: flex; align-items: center; gap: 14px; min-width: 0; }
  .brand img { max-height: 56px; max-width: 150px; object-fit: contain; }
  .brand .sn { font-size: 22px; font-weight: 700; letter-spacing: -0.01em; overflow-wrap: anywhere; }
  .ttl { text-align: right; flex-shrink: 0; }
  .ttl h1 { margin: 0; font-size: 24px; font-weight: 800; color: ${accent}; }
  .ttl .meta { margin-top: 6px; font-size: 12px; color: #6b7684; }
  .ttl .meta b { color: #1a2b3c; font-weight: 600; }
  .rule { height: 3px; background: ${accent}; border-radius: 2px; margin: 22px 0 26px; }
  .info { display: grid; grid-template-columns: 1.3fr 1fr; gap: 28px; margin-bottom: 28px; }
  .lbl { font-size: 11.5px; color: #6b7684; margin-bottom: 6px; }
  .who { font-size: 15px; font-weight: 700; }
  .muted { color: #4a5868; }
  .kv { display: grid; grid-template-columns: auto 1fr; gap: 4px 14px; }
  .kv span:nth-child(odd) { color: #6b7684; }
  .kv span:nth-child(even) { font-weight: 600; }
  table { width: 100%; border-collapse: collapse; }
  th { text-align: left; font-size: 11.5px; font-weight: 600; color: #6b7684; padding: 0 10px 10px; border-bottom: 1.5px solid #1a2b3c; }
  td { padding: 12px 10px; border-bottom: 1px solid #e3e8ef; vertical-align: top; }
  th.r, td.r { text-align: right; white-space: nowrap; }
  td.n, th.n { width: 30px; color: #6b7684; padding-left: 0; }
  td.it .nm { font-weight: 600; }
  td.it .sub { margin-top: 2px; font-size: 11.5px; color: #6b7684; }
  td.b { font-weight: 600; }
  .sum { display: flex; justify-content: flex-end; margin-top: 18px; }
  .sum .box { width: 300px; }
  .tl { display: flex; justify-content: space-between; gap: 16px; padding: 5px 0; color: #4a5868; }
  .tl span:last-child { color: #1a2b3c; white-space: nowrap; }
  .tl.grand { margin-top: 6px; padding: 10px 12px; border-radius: 6px; background: color-mix(in srgb, ${accent} 10%, #fff);
    font-size: 16px; font-weight: 800; color: #1a2b3c; }
  .due { margin-top: 10px; display: flex; justify-content: space-between; align-items: center; padding: 12px 14px; border-radius: 6px;
    border: 1.5px dashed ${accent}; color: #1a2b3c; font-weight: 600; }
  .due strong { font-size: 18px; color: ${accent}; }
  .due.paid { border-style: solid; border-color: #c8e6d2; background: #f1faf4; }
  .due.paid strong { color: #1e7a45; font-size: 15px; }
  .ft { margin-top: auto; padding-top: 36px; text-align: center; }
  .ft .ty { font-size: 14px; font-weight: 600; }
  .ft .cg { margin-top: 4px; font-size: 11px; color: #8a95a3; }
</style>
<div class="memo" lang="${lang}">
  <div class="hd">
    <div class="brand">
      ${logo ? `<img src="${logo}" alt="" />` : ''}
      <div class="sn">${esc(storeName)}</div>
    </div>
    <div class="ttl">
      <h1>${t.title}</h1>
      <div class="meta">${t.memoNo} <b>${esc(orderLabel(order))}</b></div>
      <div class="meta">${t.date} <b>${esc(date)}</b></div>
    </div>
  </div>
  <div class="rule"></div>
  <div class="info">
    <div>
      <div class="lbl">${t.billTo}</div>
      <div class="who">${esc(order.customerName)}</div>
      ${order.customerPhone ? `<div class="muted">${esc(order.customerPhone)}</div>` : ''}
      ${address ? `<div class="muted">${esc(address)}</div>` : ''}
    </div>
    <div>
      <div class="lbl">${t.order}</div>
      <div class="kv">
        <span>${t.payment}</span><span>${esc(payment)}</span>
        <span>${t.status}</span><span>${esc(status)}</span>
        ${zone ? `<span>${t.area}</span><span>${esc(zone)}</span>` : ''}
      </div>
    </div>
  </div>
  <table>
    <thead><tr><th class="n">#</th><th>${t.item}</th><th class="r">${t.qty}</th><th class="r">${t.price}</th><th class="r">${t.amount}</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="sum"><div class="box">${totals}${due}</div></div>
  <div class="ft">
    <div class="ty">${esc(t.thanks.replace('{store}', storeName))}</div>
    <div class="cg">${t.computer}</div>
  </div>
</div>`;
}

/** Builds the memo and downloads it as `<order number>-memo.pdf`. */
export async function downloadOrderMemoPdf(order: TrackedOrder, storeName: string, logoUrl?: string | null) {
  const [{ toPng }, { jsPDF }, logo] = await Promise.all([
    import('html-to-image'),
    import('jspdf'),
    logoUrl ? logoDataUrl(logoUrl) : Promise.resolve(null),
  ]);
  const { accent, font, lang } = pageStyle();

  // Drawn off screen at A4 width, then turned into a picture at twice the pixels so text stays sharp when zoomed.
  const holder = document.createElement('div');
  holder.setAttribute('aria-hidden', 'true');
  holder.style.cssText = `position:fixed;left:-${PAGE_PX + 200}px;top:0;width:${PAGE_PX}px;pointer-events:none;`;
  holder.innerHTML = memoHtml(order, storeName, logo, lang, accent, font);
  document.body.appendChild(holder);
  try {
    await document.fonts?.ready;
    const node = holder.firstElementChild?.nextElementSibling as HTMLElement; // the .memo after the <style>
    const height = node.offsetHeight;
    const options = { pixelRatio: 2, backgroundColor: '#ffffff', width: PAGE_PX, height, cacheBust: true };
    let png: string;
    try {
      png = await toPng(node, options);
    } catch {
      // A font file the browser can't re-read (cross-origin) must not stop the download: draw with the fonts left out.
      png = await toPng(node, { ...options, skipFonts: true });
    }
    // One page, A4 wide; a long order makes the page taller instead of cutting a row in half.
    const pageH = Math.max(A4_PT.h, (height * A4_PT.w) / PAGE_PX);
    const doc = new jsPDF({ unit: 'pt', format: [A4_PT.w, pageH], compress: true });
    doc.addImage(png, 'PNG', 0, 0, A4_PT.w, (height * A4_PT.w) / PAGE_PX);
    doc.setProperties({ title: `${storeName} ${orderLabel(order)}`, creator: storeName });
    doc.save(`${orderLabel(order)}-memo.pdf`);
  } finally {
    holder.remove();
  }
}
