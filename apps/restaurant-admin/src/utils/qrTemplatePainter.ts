/**
 * QR Download Template Painter
 * ─────────────────────────────────────────────────────────────────────────────
 * Renders a styled 4×6 inch standee card on an HTML5 Canvas and returns it
 * as a downloadable PNG / PDF source.
 *
 * Fixed card size: 4 × 6 inches (portrait standee)
 * At SCALE=3 the canvas is 1152 × 1728 px — ~300 dpi equivalent for print.
 *
 * Card layout (top → bottom):
 *   ┌────────────────────────────────┐  0
 *   │  Header bar (dark)  80px       │
 *   ├────────────────────────────────┤  80
 *   │  Restaurant name   48px        │  ~130
 *   │  Table badge       44px        │  ~148–192
 *   │  [gap 20px]                    │  192–212
 *   │  QR code box       248px       │  212–476
 *   │  [gap]                         │
 *   │  Arrow + SCAN TO ORDER         │  ~530
 *   │  Bottom accent bar  8px        │  568–576
 *   └────────────────────────────────┘  576
 */

interface QrTemplateOptions {
    qrSvgElementId: string;   // id of the <svg> tag already in the DOM
    restaurantName: string;
    tableNumber: number;
    qrUrl?: string;            // encoded in the QR SVG itself; kept for API compat
    qrSize?: number;           // ignored — card uses fixed internal size for consistency
}

// ─── Fixed standee dimensions (4 × 6 inches at 96 dpi CSS pixels) ─────────
const CARD_W = 384;   // 4 in × 96 dpi
const CARD_H = 576;   // 6 in × 96 dpi
const QR_SIZE = 240;  // fixed QR size that fits the card comfortably

// PDF physical size constants (millimetres)
export const CARD_MM_W = 101.6;   // 4 inches in mm
export const CARD_MM_H = 152.4;   // 6 inches in mm

/** Main entry-point – returns a canvas element ready for .toDataURL() */
export async function paintQrTemplate(opts: QrTemplateOptions): Promise<HTMLCanvasElement> {
    const { qrSvgElementId, restaurantName, tableNumber } = opts;

    // ── canvas ──────────────────────────────────────────────────────────────
    const SCALE = 3;   // 3× super-sampling → ~300 dpi equivalent
    const W = CARD_W;
    const H = CARD_H;
    const canvas = document.createElement('canvas');
    canvas.width  = W * SCALE;
    canvas.height = H * SCALE;
    const ctx = canvas.getContext('2d')!;
    ctx.scale(SCALE, SCALE);

    // ── load QR SVG ──────────────────────────────────────────────────────────
    const qrImage = await loadSvgAsImage(qrSvgElementId, QR_SIZE);

    // ── colours ──────────────────────────────────────────────────────────────
    const DARK   = '#61270e';
    const ACCENT = '#2D6A4F';
    const WHITE  = '#FFFFFF';
    const BORDER = '#E2E8F0';

    // ── background ───────────────────────────────────────────────────────────
    roundRect(ctx, 0, 0, W, H, 0, WHITE);

    // ── header bar (0 → 80) ──────────────────────────────────────────────────
    ctx.fillStyle = DARK;
    ctx.beginPath();
    ctx.rect(0, 0, W, 80);
    ctx.fill();

    ctx.fillStyle = WHITE;
    ctx.font = `700 20px "Segoe UI", Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('TABLEKARD', W / 2, 42);

    ctx.font = `400 11px "Segoe UI", Arial, sans-serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.65)';
    ctx.fillText('Scan · Order · Enjoy', W / 2, 62);

    // ── restaurant name (y ≈ 80 → 138) ───────────────────────────────────────
    ctx.fillStyle = DARK;
    ctx.font = `700 40px "Segoe UI", Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(clamp(restaurantName, 18), W / 2, 128);

    // ── table badge (y = 140 → 184, h = 44) ──────────────────────────────────
    const badgeW = 200, badgeH = 44, badgeX = (W - badgeW) / 2, badgeY = 158;
    roundRect(ctx, badgeX, badgeY, badgeW, badgeH, 22, ACCENT);
    ctx.fillStyle = WHITE;
    ctx.font = `700 24px "Segoe UI", Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(`TABLE  ${tableNumber}`, W / 2, badgeY + 31);

    // ── QR code box (y = 204 → 468, gap of 20 after badge) ───────────────────
    const qrPad  = 12;
    const qrBoxW = QR_SIZE + qrPad * 2;
    const qrBoxH = QR_SIZE + qrPad * 2;
    const qrBoxX = (W - qrBoxW) / 2;
    const qrBoxY = badgeY + badgeH + 20;   // 204 — safely below badge

    ctx.shadowColor = 'rgba(0,0,0,0.10)';
    ctx.shadowBlur  = 16;
    roundRect(ctx, qrBoxX, qrBoxY, qrBoxW, qrBoxH, 12, WHITE);
    ctx.shadowBlur  = 0;

    ctx.strokeStyle = BORDER;
    ctx.lineWidth   = 1;
    roundRectStroke(ctx, qrBoxX, qrBoxY, qrBoxW, qrBoxH, 12);

    ctx.drawImage(qrImage, qrBoxX + qrPad, qrBoxY + qrPad, QR_SIZE, QR_SIZE);

    // ── SCAN TO ORDER (below QR, centred) ────────────────────────────────────
    const textY = qrBoxY + qrBoxH + 60;   // ~532

    // arrow
    ctx.strokeStyle = DARK;
    ctx.lineWidth   = 3.5;
    ctx.lineCap     = 'round';
    ctx.lineJoin    = 'round';
    const arrowX = W / 2;
    const arrowTip = textY - 54;
    ctx.beginPath();
    ctx.moveTo(arrowX, arrowTip);
    ctx.lineTo(arrowX, arrowTip + 18);
    ctx.moveTo(arrowX - 7, arrowTip + 8);
    ctx.lineTo(arrowX, arrowTip);
    ctx.lineTo(arrowX + 7, arrowTip + 8);
    ctx.stroke();

    ctx.fillStyle = DARK;
    ctx.font      = `800 30px "Segoe UI", Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('SCAN TO ORDER', W / 2, textY);

    // ── bottom accent bar ─────────────────────────────────────────────────────
    ctx.fillStyle = ACCENT;
    ctx.fillRect(0, H - 8, W, 8);

    return canvas;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function loadSvgAsImage(svgId: string, size: number): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const svgEl = document.getElementById(svgId) as SVGElement | null;
        if (!svgEl) { reject(new Error(`SVG element #${svgId} not found`)); return; }
        const svgData = new XMLSerializer().serializeToString(svgEl);
        const img = new Image();
        img.width  = size;
        img.height = size;
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
    });
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number, fill: string) {
    ctx.fillStyle = fill;
    ctx.beginPath();
    if (r > 0) {
        ctx.roundRect(x, y, w, h, r);
    } else {
        ctx.rect(x, y, w, h);
    }
    ctx.fill();
}

function roundRectStroke(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    ctx.stroke();
}

function clamp(str: string, max: number): string {
    return str.length > max ? str.slice(0, max - 1) + '…' : str;
}
