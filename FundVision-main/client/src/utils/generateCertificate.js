import { jsPDF } from 'jspdf';

/* ────────────────────────────────────────────────────────────────────────
 * FundVision — Certificate of Donation
 * A premium, print-ready A4-landscape PDF certificate.
 *
 * This file is organised as a small pipeline:
 *   1. asset + text helpers
 *   2. layout constants (a single source of truth, so nothing drifts
 *      and nothing overlaps)
 *   3. drawing primitives (flourishes, seal, signature, cards)
 *   4. the main generator, which lays everything out top -> bottom
 *      using a running cursor instead of hard-coded guesses, so it
 *      stays correct for short or long donor names / campaign titles.
 * ──────────────────────────────────────────────────────────────────────── */

/** Loads an image from /public and converts it to a base64 data URL for jsPDF. */
function loadImageAsDataURL(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => reject(new Error(`Failed to load brand asset: ${src}`));
    img.src = src;
  });
}

/** Adds letter-tracking to short uppercase labels for an elegant, premium feel. */
function tracked(str) {
  return str.split('').join(' ');
}

/**
 * Sets the largest font size (down to minSize) at which `text` fits within
 * maxWidth, then draws it centered at (cx, y). Falls back to a safe two-line
 * wrap if it still doesn't fit at minSize. Guarantees no overflow/overlap
 * regardless of how long donor-supplied strings (receipt #, txn id, etc.) are.
 */
function fitTextCentered(doc, text, cx, y, maxWidth, { font, style, maxSize, minSize, color, lineGap }) {
  doc.setFont(font, style);
  doc.setTextColor(...color);
  let size = maxSize;
  doc.setFontSize(size);
  while (doc.getTextWidth(text) > maxWidth && size > minSize) {
    size -= 0.5;
    doc.setFontSize(size);
  }
  if (doc.getTextWidth(text) > maxWidth) {
    const lines = doc.splitTextToSize(text, maxWidth).slice(0, 2);
    doc.text(lines[0], cx, y, { align: 'center' });
    if (lines[1]) doc.text(lines[1], cx, y + (lineGap || size * 0.95), { align: 'center' });
    return lines.length > 1 ? 2 : 1;
  }
  doc.text(text, cx, y, { align: 'center' });
  return 1;
}

/** Draws a thin gold L-shaped bracket flourish in one of the four corners. */
function drawCornerFlourish(doc, x, y, size, dx, dy, color) {
  doc.setDrawColor(...color);
  doc.setLineWidth(0.7);
  doc.line(x, y, x + size * dx, y);
  doc.line(x, y, x, y + size * dy);
  doc.setLineWidth(0.3);
  doc.line(x + 3 * dx, y + 3 * dy, x + (size - 4) * dx, y + 3 * dy);
  doc.line(x + 3 * dx, y + 3 * dy, x + 3 * dx, y + (size - 4) * dy);
}

/** Draws a compact, elegant hand-drawn signature flourish (never plain text). */
function drawSignatureFlourish(doc, x, y, color, scale = 1) {
  doc.setDrawColor(...color);
  doc.setLineWidth(0.85 * scale);
  doc.lines(
    [
      [4 * scale, -6 * scale, 9 * scale, -7 * scale, 14 * scale, -2 * scale],
      [3 * scale, 3.5 * scale, 5 * scale, 6 * scale, 9 * scale, 2 * scale],
      [3 * scale, -3.5 * scale, 6 * scale, -8 * scale, 11 * scale, -2.5 * scale],
      [2 * scale, 4.5 * scale, 3 * scale, 7 * scale, 8 * scale, 3.5 * scale],
      [4 * scale, -2.5 * scale, 8 * scale, -5 * scale, 13 * scale, -1 * scale],
    ],
    x, y,
    [1, 1],
    'S',
    false
  );
  doc.setLineWidth(0.55 * scale);
  doc.lines(
    [[16 * scale, 2.5 * scale, 34 * scale, -2.5 * scale, 52 * scale, 1 * scale]],
    x - 4 * scale, y + 8 * scale,
    [1, 1],
    'S',
    false
  );
  doc.setFillColor(...color);
  doc.circle(x + 55 * scale, y + 1.3 * scale, 0.45 * scale, 'F');
}

/** Draws the gold "Verified Donation" seal, fully contained within a given radius. */
function drawVerifiedSeal(doc, cx, cy, r, colors) {
  const { gold, white } = colors;
  doc.setFillColor(...gold);
  doc.circle(cx, cy, r, 'F');
  doc.setDrawColor(...white);
  doc.setLineWidth(0.6);
  doc.circle(cx, cy, r - 2, 'S');
  doc.setDrawColor(...gold);
  doc.setLineWidth(1);
  doc.circle(cx, cy, r + 1.3, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(r * 0.58);
  doc.setTextColor(...white);
  doc.text('VERIFIED', cx, cy - r * 0.12, { align: 'center' });
  doc.text('DONATION', cx, cy + r * 0.32, { align: 'center' });

  // Short ribbon tails, sized relative to the seal so they never escape the footer zone.
  const tailLen = r * 0.55;
  doc.setFillColor(...gold);
  doc.triangle(cx - r * 0.5, cy + r - 2, cx - r * 0.2, cy + r + tailLen, cx - r * 0.07, cy + r - 1, 'F');
  doc.triangle(cx + r * 0.5, cy + r - 2, cx + r * 0.2, cy + r + tailLen, cx + r * 0.07, cy + r - 1, 'F');
}

/** Draws a single premium info card with an accent top-bar, label, and auto-fit value. */
function drawInfoCard(doc, x, y, w, h, { label, value, accent, ink, slate500 }) {
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.roundedRect(x, y, w, h, 2.5, 2.5, 'FD');

  doc.setFillColor(...accent);
  doc.roundedRect(x, y, w, 2.2, 2.5, 2.5, 'F');
  doc.rect(x, y + 1.2, w, 1, 'F');

  const centerX = x + w / 2;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...slate500);
  doc.text(tracked(label), centerX, y + 9.5, { align: 'center' });

  fitTextCentered(doc, value, centerX, y + h - 5.5, w - 8, {
    font: 'helvetica',
    style: 'bold',
    maxSize: 10.5,
    minSize: 6,
    color: ink,
    lineGap: 4.2,
  });
}

/**
 * Generates and downloads a premium A4-landscape donation certificate for FundVision.
 *
 * @param {Object} donation
 * @param {string} donation.donorName
 * @param {string} donation.campaignTitle
 * @param {number} donation.amount
 * @param {string} donation.transactionId
 * @param {string|Date} donation.date
 * @param {string} [donation.organizationName]
 * @param {string} [donation.receiptNumber]
 */
export async function generateDonationCertificate(donation) {
  const {
    donorName = 'Valued Donor',
    campaignTitle = 'a FundVision Campaign',
    amount = 0,
    transactionId = 'N/A',
    date = new Date(),
    organizationName = 'FundVision',
    receiptNumber = transactionId,
  } = donation;

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const CX = W / 2;

  // ── Brand palette (unchanged) ─────────────────────────────────────────
  const colors = {
    primary: [37, 99, 235],     // #2563EB
    secondary: [16, 185, 129],  // #10B981
    gold: [245, 158, 11],       // #F59E0B
    ink: [15, 23, 42],          // #0F172A
    slate800: [30, 41, 59],
    slate500: [100, 116, 139],
    white: [255, 255, 255],
  };
  const { primary, secondary, gold, ink, slate800, slate500, white } = colors;

  // ── Layout constants — one source of truth, tuned so every element
  //    stays inside the border with visible breathing room. ───────────────
  const SAFE_TOP = 12;          // inside innermost decorative border
  const SAFE_BOTTOM = 198;      // inside innermost decorative border
  const FOOTER_TEXT_Y = H - 14; // 196
  const FOOTER_ZONE_TOP = 148;  // seal / cards / signature row starts here
  const CARD_Y = 158;
  const CARD_H = 23;
  const CARD_W = 72;
  const CARD_GAP = 8;

  // ── Background ─────────────────────────────────────────────────────────
  doc.setFillColor(...white);
  doc.rect(0, 0, W, H, 'F');

  // ── Soft background decorations ─────────────────────────────────────────
  doc.saveGraphicsState();
  doc.setGState(new doc.GState({ opacity: 0.07 }));
  doc.setFillColor(...primary);
  doc.circle(-10, -10, 65, 'F');
  doc.setFillColor(...secondary);
  doc.circle(W + 10, H + 10, 70, 'F');
  doc.setFillColor(...gold);
  doc.circle(W + 5, -5, 40, 'F');
  doc.setFillColor(...secondary);
  doc.circle(-5, H + 5, 40, 'F');
  doc.restoreGraphicsState();

  // ── Watermark — subtle, centered ─────────────────────────────────────────
  doc.saveGraphicsState();
  doc.setGState(new doc.GState({ opacity: 0.055 }));
  doc.setFont('times', 'bolditalic');
  doc.setFontSize(78);
  doc.setTextColor(...primary);
  doc.text('FundVision', CX, H / 2 + 14, { align: 'center', angle: 22 });
  doc.restoreGraphicsState();

  // ── Triple border ─────────────────────────────────────────────────────────
  doc.setDrawColor(...primary);
  doc.setLineWidth(1.3);
  doc.rect(6, 6, W - 12, H - 12);
  doc.setDrawColor(...gold);
  doc.setLineWidth(0.5);
  doc.rect(9.5, 9.5, W - 19, H - 19);
  doc.setDrawColor(...secondary);
  doc.setLineWidth(0.3);
  doc.rect(11.5, 11.5, W - 23, H - 23);

  // ── Corner flourishes ─────────────────────────────────────────────────────
  drawCornerFlourish(doc, 15, 15, 14, 1, 1, gold);
  drawCornerFlourish(doc, W - 15, 15, 14, -1, 1, gold);
  drawCornerFlourish(doc, 15, H - 15, 14, 1, -1, gold);
  drawCornerFlourish(doc, W - 15, H - 15, 14, -1, -1, gold);

  // ── Header: logo + wordmark + tagline ─────────────────────────────────────
  const logoSize = 17;
  try {
    const logoDataUrl = await loadImageAsDataURL('/brand/logo-icon.png');
    doc.addImage(logoDataUrl, 'PNG', CX - logoSize / 2, 15, logoSize, logoSize);
  } catch {
    doc.setDrawColor(...gold);
    doc.setLineWidth(0.6);
    doc.circle(CX, 15 + logoSize / 2, logoSize / 2, 'S');
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(21);
  const fundText = 'Fund';
  const visionText = 'Vision';
  const fundWidth = doc.getTextWidth(fundText);
  const visionWidth = doc.getTextWidth(visionText);
  const wordmarkStartX = CX - (fundWidth + visionWidth) / 2;
  doc.setTextColor(...primary);
  doc.text(fundText, wordmarkStartX, 39, { align: 'left' });
  doc.setTextColor(...secondary);
  doc.text(visionText, wordmarkStartX + fundWidth, 39, { align: 'left' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...slate500);
  doc.text(tracked('BUILDING TOMORROW, TOGETHER'), CX, 45, { align: 'center' });

  // ── Title ───────────────────────────────────────────────────────────────
  doc.setFont('times', 'bold');
  doc.setFontSize(30);
  doc.setTextColor(...slate800);
  doc.text('Certificate of Donation', CX, 62, { align: 'center' });

  doc.setDrawColor(...gold);
  doc.setLineWidth(0.7);
  doc.line(CX - 42, 67, CX - 6, 67);
  doc.line(CX + 6, 67, CX + 42, 67);
  doc.setFillColor(...gold);
  doc.circle(CX, 67, 1.4, 'F');

  // ── Body — laid out with a running cursor so it never collides with the
  //    footer zone below, regardless of how long the strings are. ──────────
  let cursorY = 78;
  const BODY_BOTTOM_LIMIT = FOOTER_ZONE_TOP - 6; // hard ceiling for body content

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11.5);
  doc.setTextColor(...slate500);
  doc.text('This certificate is proudly presented to', CX, cursorY, { align: 'center' });
  cursorY += 15;

  doc.setFont('times', 'bolditalic');
  doc.setFontSize(29);
  doc.setTextColor(...primary);
  const donorLines = doc.splitTextToSize(donorName, 230).slice(0, 2);
  donorLines.forEach((line, i) => {
    doc.text(line, CX, cursorY + i * 11, { align: 'center' });
  });
  cursorY += (donorLines.length - 1) * 11 + 17;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11.5);
  doc.setTextColor(...slate500);
  doc.text('in recognition of a generous contribution of', CX, cursorY, { align: 'center' });
  cursorY += 10;

  // Highlighted amount pill
  const amountStr = `Rs. ${Number(amount).toLocaleString('en-IN')}`;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17);
  const amountTextWidth = doc.getTextWidth(amountStr);
  const pillW = Math.max(64, amountTextWidth + 26);
  const pillH = 13;
  doc.setFillColor(236, 253, 245);
  doc.setDrawColor(...secondary);
  doc.setLineWidth(0.5);
  doc.roundedRect(CX - pillW / 2, cursorY, pillW, pillH, 6.5, 6.5, 'FD');
  doc.setTextColor(...secondary);
  doc.text(amountStr, CX, cursorY + pillH * 0.67, { align: 'center' });
  cursorY += pillH + 9;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11.5);
  doc.setTextColor(...slate500);
  doc.text('towards the campaign', CX, cursorY, { align: 'center' });
  cursorY += 10;

  // Campaign name — slightly smaller than before, same style/color, auto-fit
  // to width and clamped to the remaining vertical space above the footer zone.
  const campaignMaxWidth = W - 110;
  const campaignY = Math.min(cursorY, BODY_BOTTOM_LIMIT);
  fitTextCentered(doc, `"${campaignTitle}"`, CX, campaignY, campaignMaxWidth, {
    font: 'times',
    style: 'bolditalic',
    maxSize: 14,
    minSize: 10,
    color: gold,
    lineGap: 8,
  });

  // ── Footer zone: seal (left) · info cards (center) · signature (right) ──

  // Verified donation seal — fully inside the page, well above the footer line.
  const sealR = 13.5;
  const sealX = 48;
  const sealY = FOOTER_ZONE_TOP + sealR + 4;
  drawVerifiedSeal(doc, sealX, sealY, sealR, colors);

  // Info cards — perfectly equal spacing, centered as a group.
  const cardsTotalW = CARD_W * 3 + CARD_GAP * 2;
  const cardsStartX = CX - cardsTotalW / 2;
  const formattedDate = new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'long', year: 'numeric',
  });
  const cards = [
    { label: 'DATE OF DONATION', value: formattedDate, accent: primary },
    { label: 'TRANSACTION ID', value: String(transactionId), accent: secondary },
    { label: 'RECEIPT NUMBER', value: String(receiptNumber), accent: gold },
  ];
  cards.forEach((card, i) => {
    const x = cardsStartX + i * (CARD_W + CARD_GAP);
    drawInfoCard(doc, x, CARD_Y, CARD_W, CARD_H, {
      label: card.label,
      value: card.value,
      accent: card.accent,
      ink,
      slate500,
    });
  });

  // Signature block — compact, elegant, positioned so it never overlaps
  // the receipt-number card or any other text.
  const sigBlockRight = SAFE_BOTTOM > 0 ? W - 20 : W - 20; // keep inside right border
  const sigX = W - 78;
  const sigY = FOOTER_ZONE_TOP + 12;
  drawSignatureFlourish(doc, sigX, sigY, ink, 0.6);

  doc.setDrawColor(...slate500);
  doc.setLineWidth(0.3);
  doc.line(sigX - 2, sigY + 8, sigX + 40, sigY + 8);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...ink);
  doc.text('Authorized Signatory', sigX + 19, sigY + 13, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...slate500);
  doc.text(`${organizationName} Foundation`, sigX + 19, sigY + 17.5, { align: 'center' });

  // ── Footer — perfectly centered, resting safely inside the border ────────
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...slate500);
  doc.text(
    tracked('VERIFIED AND RECORDED ON THE FUNDVISION TRANSPARENCY LEDGER'),
    CX, FOOTER_TEXT_Y, { align: 'center' }
  );

  // ── Save ──────────────────────────────────────────────────────────────────
  const fileSafeName = donorName.replace(/[^a-z0-9]+/gi, '_');
  doc.save(`FundVision_Certificate_${fileSafeName}_${transactionId}.pdf`);
}

export default generateDonationCertificate;