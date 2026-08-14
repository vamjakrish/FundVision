import { jsPDF } from 'jspdf';

/* ────────────────────────────────────────────────────────────────────────
 * FundVision — Certificate of Donation (v5 — matched to reference design)
 * Renders onto a high-res 2970×2100 HTML5 canvas then exports via jsPDF.
 * ──────────────────────────────────────────────────────────────────────── */

function loadImageAsHTMLImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

/** Serrated starburst rosette for badges/seals. */
function drawRosette(ctx, cx, cy, outerR, innerR, points, fill, stroke, sw = 2) {
  ctx.save();
  ctx.beginPath();
  const step = Math.PI / points;
  for (let i = 0; i < 2 * points; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const a = i * step - Math.PI / 2;
    const x = cx + r * Math.cos(a);
    const y = cy + r * Math.sin(a);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.closePath();
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = sw; ctx.stroke(); }
  ctx.restore();
}

/** Small golden decorative leaf pair — used to flank the donor name. */
function drawLeafPair(ctx, x, y, angle, scale, flip) {
  ctx.save();
  ctx.translate(x, y);
  if (flip) ctx.scale(-1, 1);
  ctx.rotate(angle);
  ctx.scale(scale, scale);
  ctx.fillStyle = '#D4AF37';

  // Leaf 1 (curving up-left)
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(-8, -12, -18, -5);
  ctx.quadraticCurveTo(-8, 2, 0, 0);
  ctx.fill();

  // Leaf 2 (curving down-left)
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(-8, 12, -18, 5);
  ctx.quadraticCurveTo(-8, -2, 0, 0);
  ctx.fill();

  ctx.restore();
}

/** Draws a small cluster of golden leaves (3 pairs) flanking text. */
function drawLaurelCluster(ctx, x, y, isRight) {
  const dir = isRight ? 1 : -1;
  const s = 1.6;
  drawLeafPair(ctx, x, y - 25, dir * 0.3, s, isRight);
  drawLeafPair(ctx, x + dir * 8, y, dir * 0.0, s, isRight);
  drawLeafPair(ctx, x, y + 25, dir * -0.3, s, isRight);
}

/** Renders the full certificate on a 2970×2100 canvas. */
async function renderCertificateCanvas(donation) {
  const {
    donorName = 'Valued Donor',
    campaignTitle = 'a FundVision Campaign',
    amount = 0,
    transactionId = 'N/A',
    date = new Date(),
    organizationName = 'FundVision',
    receiptNumber = transactionId,
    is80GEligible = true,
  } = donation;

  const W = 2970, H = 2100, CX = W / 2;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  // ═══ BACKGROUND ═══════════════════════════════════════════════════════
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, W, H);

  // Subtle gold wave texture
  ctx.save();
  ctx.strokeStyle = 'rgba(218, 165, 32, 0.06)';
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 18; i++) {
    ctx.beginPath();
    ctx.moveTo(0, 300 + i * 50);
    ctx.bezierCurveTo(W * 0.25, 200 + i * 50, W * 0.75, 400 + i * 50, W, 300 + i * 50);
    ctx.stroke();
  }
  ctx.restore();

  // ═══ BORDERS ══════════════════════════════════════════════════════════
  // Outer dark navy
  ctx.lineWidth = 22;
  ctx.strokeStyle = '#0F3443';
  ctx.strokeRect(28, 28, W - 56, H - 56);

  // Gold line
  ctx.lineWidth = 5;
  ctx.strokeStyle = '#D4AF37';
  ctx.strokeRect(52, 52, W - 104, H - 104);

  // Thin inner gold line
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = '#E6CA65';
  ctx.strokeRect(62, 62, W - 124, H - 124);

  // ═══ CORNER RIBBON SWOOSHES (smaller, tighter than before) ════════════
  const S = 0.65; // Scale factor to shrink ribbons

  // ── TOP-LEFT ──
  ctx.save();
  ctx.fillStyle = '#0F3443';
  ctx.beginPath();
  ctx.moveTo(28, 28);
  ctx.lineTo(28 + 450 * S, 28);
  ctx.bezierCurveTo(28 + 300 * S, 28 + 150 * S, 28 + 150 * S, 28 + 300 * S, 28, 28 + 450 * S);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#D4AF37';
  ctx.beginPath();
  ctx.moveTo(28 + 450 * S, 28);
  ctx.lineTo(28 + 490 * S, 28);
  ctx.bezierCurveTo(28 + 340 * S, 28 + 180 * S, 28 + 180 * S, 28 + 340 * S, 28, 28 + 490 * S);
  ctx.lineTo(28, 28 + 450 * S);
  ctx.bezierCurveTo(28 + 150 * S, 28 + 300 * S, 28 + 300 * S, 28 + 150 * S, 28 + 450 * S, 28);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#10B981';
  ctx.beginPath();
  ctx.moveTo(28 + 490 * S, 28);
  ctx.lineTo(28 + 530 * S, 28);
  ctx.bezierCurveTo(28 + 370 * S, 28 + 210 * S, 28 + 210 * S, 28 + 370 * S, 28, 28 + 530 * S);
  ctx.lineTo(28, 28 + 490 * S);
  ctx.bezierCurveTo(28 + 180 * S, 28 + 340 * S, 28 + 340 * S, 28 + 180 * S, 28 + 490 * S, 28);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // ── BOTTOM-RIGHT ──
  ctx.save();
  ctx.fillStyle = '#0F3443';
  ctx.beginPath();
  ctx.moveTo(W - 28, H - 28);
  ctx.lineTo(W - 28 - 450 * S, H - 28);
  ctx.bezierCurveTo(W - 28 - 300 * S, H - 28 - 150 * S, W - 28 - 150 * S, H - 28 - 300 * S, W - 28, H - 28 - 450 * S);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#D4AF37';
  ctx.beginPath();
  ctx.moveTo(W - 28 - 450 * S, H - 28);
  ctx.lineTo(W - 28 - 490 * S, H - 28);
  ctx.bezierCurveTo(W - 28 - 340 * S, H - 28 - 180 * S, W - 28 - 180 * S, H - 28 - 340 * S, W - 28, H - 28 - 490 * S);
  ctx.lineTo(W - 28, H - 28 - 450 * S);
  ctx.bezierCurveTo(W - 28 - 150 * S, H - 28 - 300 * S, W - 28 - 300 * S, H - 28 - 150 * S, W - 28 - 450 * S, H - 28);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#10B981';
  ctx.beginPath();
  ctx.moveTo(W - 28 - 490 * S, H - 28);
  ctx.lineTo(W - 28 - 530 * S, H - 28);
  ctx.bezierCurveTo(W - 28 - 370 * S, H - 28 - 210 * S, W - 28 - 210 * S, H - 28 - 370 * S, W - 28, H - 28 - 530 * S);
  ctx.lineTo(W - 28, H - 28 - 490 * S);
  ctx.bezierCurveTo(W - 28 - 180 * S, H - 28 - 340 * S, W - 28 - 340 * S, H - 28 - 180 * S, W - 28 - 490 * S, H - 28);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // ── BOTTOM-LEFT (small accent) ──
  ctx.save();
  const BLS = 0.55;
  ctx.fillStyle = '#0F3443';
  ctx.beginPath();
  ctx.moveTo(28, H - 28);
  ctx.lineTo(28 + 350 * BLS, H - 28);
  ctx.bezierCurveTo(28 + 220 * BLS, H - 28 - 130 * BLS, 28 + 130 * BLS, H - 28 - 220 * BLS, 28, H - 28 - 350 * BLS);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#10B981';
  ctx.beginPath();
  ctx.moveTo(28 + 350 * BLS, H - 28);
  ctx.lineTo(28 + 390 * BLS, H - 28);
  ctx.bezierCurveTo(28 + 260 * BLS, H - 28 - 160 * BLS, 28 + 160 * BLS, H - 28 - 260 * BLS, 28, H - 28 - 390 * BLS);
  ctx.lineTo(28, H - 28 - 350 * BLS);
  ctx.bezierCurveTo(28 + 130 * BLS, H - 28 - 220 * BLS, 28 + 220 * BLS, H - 28 - 130 * BLS, 28 + 350 * BLS, H - 28);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // ── TOP-RIGHT (behind badge) ──
  ctx.save();
  const TRS = 0.6;
  ctx.fillStyle = '#0F3443';
  ctx.beginPath();
  ctx.moveTo(W - 28, 28);
  ctx.lineTo(W - 28 - 420 * TRS, 28);
  ctx.bezierCurveTo(W - 28 - 280 * TRS, 28 + 140 * TRS, W - 28 - 140 * TRS, 28 + 280 * TRS, W - 28, 28 + 420 * TRS);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#D4AF37';
  ctx.beginPath();
  ctx.moveTo(W - 28 - 420 * TRS, 28);
  ctx.lineTo(W - 28 - 460 * TRS, 28);
  ctx.bezierCurveTo(W - 28 - 300 * TRS, 28 + 160 * TRS, W - 28 - 160 * TRS, 28 + 300 * TRS, W - 28, 28 + 460 * TRS);
  ctx.lineTo(W - 28, 28 + 420 * TRS);
  ctx.bezierCurveTo(W - 28 - 140 * TRS, 28 + 280 * TRS, W - 28 - 280 * TRS, 28 + 140 * TRS, W - 28 - 420 * TRS, 28);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#10B981';
  ctx.beginPath();
  ctx.moveTo(W - 28 - 460 * TRS, 28);
  ctx.lineTo(W - 28 - 500 * TRS, 28);
  ctx.bezierCurveTo(W - 28 - 320 * TRS, 28 + 180 * TRS, W - 28 - 180 * TRS, 28 + 320 * TRS, W - 28, 28 + 500 * TRS);
  ctx.lineTo(W - 28, 28 + 460 * TRS);
  ctx.bezierCurveTo(W - 28 - 160 * TRS, 28 + 300 * TRS, W - 28 - 300 * TRS, 28 + 160 * TRS, W - 28 - 460 * TRS, 28);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Gold corner L-brackets
  [[72, 72, 1, 1], [W - 72, 72, -1, 1], [72, H - 72, 1, -1], [W - 72, H - 72, -1, -1]].forEach(([x, y, dx, dy]) => {
    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(x + 80 * dx, y);
    ctx.lineTo(x, y);
    ctx.lineTo(x, y + 80 * dy);
    ctx.stroke();
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(x + 60 * dx, y + 18 * dy);
    ctx.lineTo(x + 18 * dx, y + 18 * dy);
    ctx.lineTo(x + 18 * dx, y + 60 * dy);
    ctx.stroke();
  });

  // ═══ HEADER: Logo + Wordmark (top-left, clear of ribbon) ══════════════
  const headerX = 120;
  const headerY = 95;
  const logoImg = await loadImageAsHTMLImage('/brand/logo-icon.png');
  if (logoImg) {
    ctx.drawImage(logoImg, headerX, headerY, 120, 120);
  } else {
    ctx.save();
    ctx.fillStyle = '#2563EB';
    ctx.beginPath();
    ctx.arc(headerX + 60, headerY + 60, 60, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 65px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('FV', headerX + 60, headerY + 62);
    ctx.restore();
  }

  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.font = 'bold 88px Arial, sans-serif';
  ctx.fillStyle = '#2563EB';
  ctx.fillText('Fund', headerX + 140, headerY + 8);
  const fW = ctx.measureText('Fund').width;
  ctx.fillStyle = '#10B981';
  ctx.fillText('Vision', headerX + 140 + fW, headerY + 8);

  ctx.font = 'bold 32px Arial, sans-serif';
  ctx.fillStyle = '#64748B';
  ctx.fillText('B U I L D I N G   T O M O R R O W ,   T O G E T H E R', headerX + 140, headerY + 105);

  // ═══ TOP-RIGHT BADGE ══════════════════════════════════════════════════
  const bCX = W - 260, bCY = 210;
  drawRosette(ctx, bCX, bCY, 120, 105, 28, '#D4AF37', '#B8860B', 3);
  drawRosette(ctx, bCX, bCY, 102, 92, 28, '#B8860B', null);

  ctx.beginPath();
  ctx.arc(bCX, bCY, 88, 0, Math.PI * 2);
  ctx.fillStyle = '#0F3443';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#D4AF37';
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(bCX, bCY, 76, 0, Math.PI * 2);
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = '#FACE63';
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#D4AF37';
  ctx.font = 'bold 22px Arial';
  ctx.fillText('★ ★ ★', bCX, bCY - 38);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 68px Arial';
  ctx.fillText('FV', bCX, bCY + 6);

  ctx.fillStyle = '#D4AF37';
  ctx.font = 'bold 22px Arial';
  ctx.fillText('VERIFIED', bCX, bCY + 50);

  // Certificate number below badge
  ctx.fillStyle = '#475569';
  ctx.font = 'bold 28px Arial';
  ctx.fillText(`No. ${receiptNumber}`, bCX, bCY + 150);

  // ═══ TITLE ════════════════════════════════════════════════════════════
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#0F3443';
  ctx.font = 'bold 105px "Times New Roman", Times, serif';
  ctx.fillText('CERTIFICATE OF DONATION', CX, 470);

  // Gold divider with diamond
  ctx.strokeStyle = '#D4AF37';
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(CX - 420, 530);
  ctx.lineTo(CX - 30, 530);
  ctx.moveTo(CX + 30, 530);
  ctx.lineTo(CX + 420, 530);
  ctx.stroke();
  // Diamond
  ctx.fillStyle = '#D4AF37';
  ctx.beginPath();
  ctx.moveTo(CX, 530 - 12);
  ctx.lineTo(CX + 12, 530);
  ctx.lineTo(CX, 530 + 12);
  ctx.lineTo(CX - 12, 530);
  ctx.closePath();
  ctx.fill();

  // ═══ BODY TEXT ════════════════════════════════════════════════════════
  ctx.font = '300 44px Arial, sans-serif';
  ctx.fillStyle = '#475569';
  ctx.fillText('This certificate is proudly presented to', CX, 600);

  // ── Donor name with laurel leaves ──
  ctx.font = 'bold italic 120px "Times New Roman", Times, serif';
  ctx.fillStyle = '#1D4ED8';
  const dnW = ctx.measureText(donorName).width;
  ctx.fillText(donorName, CX, 730);

  // Small golden laurel clusters
  const leafOff = dnW / 2 + 60;
  drawLaurelCluster(ctx, CX - leafOff, 720, false);
  drawLaurelCluster(ctx, CX + leafOff, 720, true);

  ctx.font = '300 44px Arial, sans-serif';
  ctx.fillStyle = '#475569';
  ctx.fillText('in recognition of a generous contribution of', CX, 830);

  // ── Amount pill ──
  const amtStr = Number(amount).toLocaleString('en-IN');
  ctx.font = 'bold 110px Arial, sans-serif';
  const amtW = ctx.measureText(amtStr).width;
  const rupeeW = 70;
  const contentW = rupeeW + 25 + amtW;
  const pW = Math.max(contentW + 200, 650);
  const pH = 155;
  const pX = CX - pW / 2;
  const pY = 885;

  ctx.save();
  ctx.fillStyle = '#ECFDF5';
  ctx.strokeStyle = '#10B981';
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.roundRect(pX, pY, pW, pH, 78);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  const cStartX = CX - contentW / 2;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 100px Arial, sans-serif';
  ctx.fillStyle = '#047857';
  ctx.fillText('\u20B9', cStartX, pY + pH / 2);
  ctx.font = 'bold 110px Arial, sans-serif';
  ctx.fillText(amtStr, cStartX + rupeeW + 25, pY + pH / 2);

  // Towards campaign
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '300 42px Arial, sans-serif';
  ctx.fillStyle = '#475569';
  ctx.fillText('towards the campaign', CX, 1100);

  // Campaign title
  ctx.font = 'bold italic 64px "Times New Roman", Times, serif';
  ctx.fillStyle = '#D4AF37';
  const campStr = `"${campaignTitle}"`;
  const campW = ctx.measureText(campStr).width;
  if (campW > W - 300) {
    ctx.font = 'bold italic 48px "Times New Roman", Times, serif';
  }
  ctx.fillText(campStr, CX, 1170);

  // ═══ INFO CARDS ═══════════════════════════════════════════════════════
  const cardW = 730, cardH = 200, cardGap = 50, cardY = 1270;
  const cardsX = CX - (cardW * 3 + cardGap * 2) / 2;

  const fmtDate = new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
  const cards = [
    { label: 'DATE OF DONATION',  value: fmtDate,                 color: '#1E40AF' },
    { label: 'TRANSACTION ID',    value: String(transactionId),    color: '#059669' },
    { label: 'RECEIPT NUMBER',    value: String(receiptNumber),    color: '#D97706' },
  ];

  cards.forEach((c, i) => {
    const cX = cardsX + i * (cardW + cardGap);
    ctx.save();
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(cX, cardY, cardW, cardH, 22);
    ctx.fill();
    ctx.stroke();

    // Icon square
    const iS = 125, iX = cX + 36, iY = cardY + 38;
    ctx.fillStyle = c.color;
    ctx.beginPath();
    ctx.roundRect(iX, iY, iS, iS, 18);
    ctx.fill();

    // Simple white icon inside
    ctx.strokeStyle = '#FFFFFF';
    ctx.fillStyle = '#FFFFFF';
    ctx.lineWidth = 5;
    const icx = iX + iS / 2, icy = iY + iS / 2;
    if (i === 0) {
      // Calendar
      ctx.strokeRect(icx - 28, icy - 22, 56, 50);
      ctx.fillRect(icx - 28, icy - 22, 56, 14);
      ctx.fillRect(icx - 15, icy - 34, 8, 16);
      ctx.fillRect(icx + 7, icy - 34, 8, 16);
    } else if (i === 1) {
      // Document
      ctx.strokeRect(icx - 25, icy - 30, 50, 60);
      ctx.beginPath();
      ctx.moveTo(icx - 12, icy - 10); ctx.lineTo(icx + 12, icy - 10);
      ctx.moveTo(icx - 12, icy + 5);  ctx.lineTo(icx + 12, icy + 5);
      ctx.moveTo(icx - 12, icy + 20); ctx.lineTo(icx + 8, icy + 20);
      ctx.stroke();
    } else {
      // Receipt
      ctx.strokeRect(icx - 25, icy - 32, 50, 64);
      ctx.beginPath();
      ctx.moveTo(icx - 12, icy - 15); ctx.lineTo(icx + 12, icy - 15);
      ctx.moveTo(icx - 12, icy);      ctx.lineTo(icx + 12, icy);
      ctx.moveTo(icx - 12, icy + 15); ctx.lineTo(icx + 12, icy + 15);
      ctx.stroke();
    }

    // Label and value
    const tX = iX + iS + 30;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.font = 'bold 32px Arial, sans-serif';
    ctx.fillStyle = c.color;
    ctx.fillText(c.label, tX, cardY + 42);
    ctx.font = 'bold 40px Arial, sans-serif';
    ctx.fillStyle = '#0F3443';
    let vSize = 40;
    ctx.font = `bold ${vSize}px Arial, sans-serif`;
    while (ctx.measureText(c.value).width > cardW - iS - 90 && vSize > 28) {
      vSize -= 2;
      ctx.font = `bold ${vSize}px Arial, sans-serif`;
    }
    ctx.fillText(c.value, tX, cardY + 110);

    ctx.restore();
  });

  // ═══ ROW 2: SEAL · 80G BOX · SIGNATURE ════════════════════════════════
  const r2Y = 1520;

  // ── Verified Donation Seal (bottom-left) ──
  const sX = 330, sY = r2Y + 85;

  // Ribbons
  ctx.save();
  ctx.fillStyle = '#D4AF37';
  ctx.beginPath();
  ctx.moveTo(sX - 50, sY + 40);
  ctx.lineTo(sX - 75, sY + 150);
  ctx.lineTo(sX - 40, sY + 125);
  ctx.lineTo(sX - 10, sY + 150);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#0F3443';
  ctx.beginPath();
  ctx.moveTo(sX + 50, sY + 40);
  ctx.lineTo(sX + 75, sY + 150);
  ctx.lineTo(sX + 40, sY + 125);
  ctx.lineTo(sX + 10, sY + 150);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Medal
  drawRosette(ctx, sX, sY, 110, 98, 24, '#D4AF37', '#B8860B', 3);
  drawRosette(ctx, sX, sY, 95, 86, 24, '#B8860B', null);
  ctx.beginPath();
  ctx.arc(sX, sY, 80, 0, Math.PI * 2);
  ctx.fillStyle = '#0F3443';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#D4AF37';
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#D4AF37';
  ctx.font = 'bold 20px Arial';
  ctx.fillText('★ ★ ★', sX, sY - 35);
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 30px Arial';
  ctx.fillText('VERIFIED', sX, sY - 3);
  ctx.fillText('DONATION', sX, sY + 28);
  ctx.fillStyle = '#D4AF37';
  ctx.font = 'bold 20px Arial';
  ctx.fillText('★ ★ ★', sX, sY + 58);

  // ── 80G Tax Box (center) ──
  if (is80GEligible) {
    const tW = 960, tH = 160, tX = CX - tW / 2 + 50, tY = r2Y + 10;
    ctx.save();
    ctx.fillStyle = '#FFFBEB';
    ctx.strokeStyle = '#FCD34D';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(tX, tY, tW, tH, 18);
    ctx.fill();
    ctx.stroke();

    // Checkmark icon box
    const dbX = tX + 30, dbY = tY + 22, dbS = 115;
    ctx.fillStyle = '#F59E0B';
    ctx.beginPath();
    ctx.roundRect(dbX, dbY, dbS, dbS, 14);
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 6;
    ctx.strokeRect(dbX + 25, dbY + 18, 55, 70);
    ctx.beginPath();
    ctx.arc(dbX + 72, dbY + 75, 16, 0, Math.PI * 2);
    ctx.fillStyle = '#059669';
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(dbX + 63, dbY + 75);
    ctx.lineTo(dbX + 69, dbY + 82);
    ctx.lineTo(dbX + 82, dbY + 68);
    ctx.stroke();

    // Text
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.font = 'bold 38px Arial, sans-serif';
    ctx.fillStyle = '#92400E';
    ctx.fillText('80G TAX EXEMPTION ELIGIBLE', dbX + dbS + 30, tY + 30);
    ctx.font = '300 30px Arial, sans-serif';
    ctx.fillStyle = '#B45309';
    ctx.fillText('This donation qualifies for tax deduction under', dbX + dbS + 30, tY + 78);
    ctx.fillText('Section 80G of the Income Tax Act, 1961.', dbX + dbS + 30, tY + 115);
    ctx.restore();
  }

  // ── Signature (right) ──
  const sigCX = W - 430, sigTopY = r2Y + 15;
  ctx.save();
  ctx.strokeStyle = '#0F3443';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(sigCX - 80, sigTopY + 55);
  ctx.bezierCurveTo(sigCX - 50, sigTopY - 5, sigCX, sigTopY - 15, sigCX + 40, sigTopY + 30);
  ctx.bezierCurveTo(sigCX + 60, sigTopY + 60, sigCX + 90, sigTopY - 10, sigCX + 130, sigTopY + 20);
  ctx.bezierCurveTo(sigCX + 150, sigTopY + 35, sigCX + 200, sigTopY + 5, sigCX + 250, sigTopY + 15);
  ctx.stroke();

  // Underline
  ctx.strokeStyle = '#94A3B8';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(sigCX - 100, sigTopY + 80);
  ctx.lineTo(sigCX + 280, sigTopY + 80);
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.font = 'bold 36px Arial, sans-serif';
  ctx.fillStyle = '#0F3443';
  ctx.fillText('Authorized Signatory', sigCX + 90, sigTopY + 92);
  ctx.font = 'bold 32px Arial, sans-serif';
  ctx.fillStyle = '#10B981';
  const orgLabel = organizationName === 'FundVision' ? 'FundVision Foundation' : organizationName;
  ctx.fillText(orgLabel, sigCX + 90, sigTopY + 132);
  ctx.restore();

  // ═══ FOOTER ═══════════════════════════════════════════════════════════
  const footY = 1790;

  // Thin line with colored dots
  ctx.strokeStyle = '#CBD5E1';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(200, footY);
  ctx.lineTo(CX - 80, footY);
  ctx.moveTo(CX + 80, footY);
  ctx.lineTo(W - 200, footY);
  ctx.stroke();

  [[CX - 40, '#2563EB'], [CX, '#D4AF37'], [CX + 40, '#10B981']].forEach(([x, c]) => {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.arc(x, footY, 8, 0, Math.PI * 2);
    ctx.fill();
  });

  // Tracked ledger text
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 28px Arial, sans-serif';
  ctx.fillStyle = '#475569';
  ctx.fillText('V E R I F I E D   A N D   R E C O R D E D   O N   T H E   F U N D V I S I O N   T R A N S P A R E N C Y   L E D G E R', CX, footY + 45);

  // Dark navy pill with website
  const wpW = 480, wpH = 65, wpX = CX - wpW / 2, wpY = footY + 78;
  ctx.save();
  ctx.fillStyle = '#0F3443';
  ctx.beginPath();
  ctx.roundRect(wpX, wpY, wpW, wpH, 33);
  ctx.fill();

  // Globe icon
  const gX = wpX + 50, gY = wpY + wpH / 2;
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(gX, gY, 15, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(gX - 15, gY); ctx.lineTo(gX + 15, gY);
  ctx.moveTo(gX, gY - 15); ctx.lineTo(gX, gY + 15);
  ctx.stroke();

  ctx.textAlign = 'left';
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 30px Arial, sans-serif';
  ctx.fillText('www.fundvision.org', gX + 28, gY);
  ctx.restore();

  return canvas.toDataURL('image/png', 1.0);
}

// ═══════════════════════════════════════════════════════════════════════
//  MAIN EXPORT
// ═══════════════════════════════════════════════════════════════════════

export async function generateDonationCertificate(donation) {
  const dataUrl = await renderCertificateCanvas(donation);

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();

  doc.addImage(dataUrl, 'PNG', 0, 0, W, H);

  const safeName = String(donation.donorName || 'Donor').replace(/[^a-z0-9]+/gi, '_').substring(0, 30);
  const safeReceipt = String(donation.receiptNumber || donation.transactionId || 'Cert').replace(/[^a-z0-9_-]+/gi, '_').substring(0, 20);
  doc.save(`FundVision_Certificate_${safeName}_${safeReceipt}.pdf`);
}

export default generateDonationCertificate;