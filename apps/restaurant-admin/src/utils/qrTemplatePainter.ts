/**
 * QR Download Template Painter
 * ─────────────────────────────────────────────────────────────────────────────
 * Renders a styled A5-like card entirely on an HTML5 Canvas and returns it
 * as a downloadable PNG. No external PDF/canvas libraries required.
 *
 * Card layout (top → bottom):
 *   ┌─────────────────────────────┐
 *   │  Header bar (dark)          │
 *   │  Restaurant name            │
 *   │  "Table {n}"                │
 *   │  QR code image              │
 *   │  Divider line               │
 *   │  Instruction section        │
 *   │  Footer (url)               │
 *   └─────────────────────────────┘
 */

interface QrTemplateOptions {
    qrSvgElementId: string;   // id of the <svg> tag already in the DOM
    restaurantName: string;
    tableNumber: number;
    qrUrl?: string;            // encoded in the QR SVG itself; kept for API compat
    qrSize?: number;           // logical QR pixel size (default 200)
}

/** Main entry-point – returns a canvas element ready for .toDataURL() */
export async function paintQrTemplate(opts: QrTemplateOptions): Promise<HTMLCanvasElement> {
    const {
        qrSvgElementId,
        restaurantName,
        tableNumber,
        qrSize = 200,
    } = opts;

    // ── dimensions ──────────────────────────────────────────────────────────
    const SCALE = 3;                        // higher resolution for better print
    const W = 420;
    // Height is dynamic so large qrSize values don't overflow the card
    const H = 192 + (qrSize + 24) + 100;    // qrBoxY + qrBoxH + scan-to-order section
    const canvas = document.createElement('canvas');
    canvas.width  = W * SCALE;
    canvas.height = H * SCALE;
    const ctx = canvas.getContext('2d')!;
    ctx.scale(SCALE, SCALE);

    // ── load the QR SVG as an image ──────────────────────────────────────────
    const qrImage = await loadSvgAsImage(qrSvgElementId, qrSize);

    // ── colours & fonts ──────────────────────────────────────────────────────
    const DARK   = '#61270eff';
    const ACCENT = '#2D6A4F';
    const WHITE  = '#FFFFFF';
    const BORDER = '#E2E8F0';

    // ── background ───────────────────────────────────────────────────────────
    roundRect(ctx, 0, 0, W, H, 16, WHITE);

    // ── header bar ───────────────────────────────────────────────────────────
    roundRectTop(ctx, 0, 0, W, 90, 16, DARK);

    // Logo placeholder — two stacked text lines in the header
    ctx.fillStyle = WHITE;
    ctx.font = `700 22px "Segoe UI", Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('TABLEKARD', W / 2, 44);

    ctx.font = `400 12px "Segoe UI", Arial, sans-serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.65)';
    ctx.fillText('Scan · Order · Enjoy', W / 2, 66);

    // ── restaurant name ───────────────────────────────────────────────────────
    ctx.fillStyle = DARK;
    ctx.font = `700 48px "Segoe UI", Arial, sans-serif`;
    ctx.textAlign = 'center';
    const rName = clamp(restaurantName, 20);  // Larger font, fewer chars
    ctx.fillText(rName, W / 2, 130);

    // ── table badge ───────────────────────────────────────────────────────────
    const badgeW = 220, badgeH = 50, badgeX = (W - badgeW) / 2, badgeY = 152;
    roundRect(ctx, badgeX, badgeY, badgeW, badgeH, 25, ACCENT);
    ctx.fillStyle = WHITE;
    ctx.font = `700 28px "Segoe UI", Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(`TABLE  ${tableNumber}`, W / 2, badgeY + 36);

    // ── QR code ───────────────────────────────────────────────────────────────
    const qrPad = 12;
    const qrBoxW = qrSize + qrPad * 2;
    const qrBoxH = qrSize + qrPad * 2;
    const qrBoxX = (W - qrBoxW) / 2;
    const qrBoxY = 192;

    // subtle shadow card behind QR
    ctx.shadowColor = 'rgba(0,0,0,0.10)';
    ctx.shadowBlur  = 16;
    roundRect(ctx, qrBoxX, qrBoxY, qrBoxW, qrBoxH, 12, WHITE);
    ctx.shadowBlur  = 0;

    // thin border
    ctx.strokeStyle = BORDER;
    ctx.lineWidth   = 1;
    roundRectStroke(ctx, qrBoxX, qrBoxY, qrBoxW, qrBoxH, 12);

    ctx.drawImage(qrImage, qrBoxX + qrPad, qrBoxY + qrPad, qrSize, qrSize);

    // ── Scan to Order Section ────────────────────────────────────────────────
    const scanToOrderY = qrBoxY + qrBoxH + 60;
    ctx.fillStyle = DARK;
    ctx.font = `800 36px "Segoe UI", Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('SCAN TO ORDER', W / 2, scanToOrderY);

    // ── Arrow pointing up ─────────────────────────────────────────────────────
    ctx.strokeStyle = DARK;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    const arrowX = W / 2;
    const arrowY = scanToOrderY - 45;
    const arrowLen = 20;

    ctx.beginPath();
    ctx.moveTo(arrowX, arrowY);
    ctx.lineTo(arrowX, arrowY + arrowLen);
    ctx.moveTo(arrowX - 8, arrowY + 8);
    ctx.lineTo(arrowX, arrowY);
    ctx.lineTo(arrowX + 8, arrowY + 8);
    ctx.stroke();

    // ── bottom border accent ──────────────────────────────────────────────────
    roundRectBottom(ctx, 0, H - 8, W, 8, 0, ACCENT);

    return canvas;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

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
    ctx.roundRect(x, y, w, h, r);
    ctx.fill();
}

function roundRectStroke(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    ctx.stroke();
}

function roundRectTop(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number, fill: string) {
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x, y + h);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.fill();
}

function roundRectBottom(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number, fill: string) {
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + w, y);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y);
    ctx.closePath();
    ctx.fill();
}

function clamp(str: string, max: number): string {
    return str.length > max ? str.slice(0, max - 1) + '…' : str;
}
