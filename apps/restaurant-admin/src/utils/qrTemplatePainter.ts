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
    qrUrl: string;
    qrSize?: number;           // logical QR pixel size (default 200)
}

/** Main entry-point – returns a canvas element ready for .toDataURL() */
export async function paintQrTemplate(opts: QrTemplateOptions): Promise<HTMLCanvasElement> {
    const {
        qrSvgElementId,
        restaurantName,
        tableNumber,
        qrUrl,
        qrSize = 200,
    } = opts;

    // ── dimensions ──────────────────────────────────────────────────────────
    const SCALE = 2;                        // retina / hi-dpi
    const W = 420;
    const H = 640;
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
    const TEXT   = '#2D3748';
    const MUTED  = '#718096';
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
    ctx.font = `700 24px "Segoe UI", Arial, sans-serif`;
    ctx.textAlign = 'center';
    const rName = clamp(restaurantName, 32);  // keep it on one line
    ctx.fillText(rName, W / 2, 130);

    // ── table badge ───────────────────────────────────────────────────────────
    const badgeW = 140, badgeH = 34, badgeX = (W - badgeW) / 2, badgeY = 142;
    roundRect(ctx, badgeX, badgeY, badgeW, badgeH, 17, ACCENT);
    ctx.fillStyle = WHITE;
    ctx.font = `600 14px "Segoe UI", Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(`TABLE  ${tableNumber}`, W / 2, badgeY + 22);

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

    // ── divider ───────────────────────────────────────────────────────────────
    const divY = qrBoxY + qrBoxH + 24;
    ctx.strokeStyle = BORDER;
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(32, divY); ctx.lineTo(W - 32, divY);
    ctx.stroke();
    ctx.setLineDash([]);

    // ── instructions ──────────────────────────────────────────────────────────
    ctx.fillStyle = TEXT;
    ctx.font = `600 13px "Segoe UI", Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('How to Order', W / 2, divY + 22);

    const steps = [
        '1.  Point your camera at the QR code above.',
        '2.  The menu will open in your browser.',
        '3.  Add items to cart and place your order.',
        '4.  Sit back and enjoy!',
    ];
    ctx.font = `400 12px "Segoe UI", Arial, sans-serif`;
    ctx.fillStyle = MUTED;
    ctx.textAlign = 'left';
    steps.forEach((step, i) => {
        ctx.fillText(step, 40, divY + 46 + i * 22);
    });

    // ── URL caption ───────────────────────────────────────────────────────────
    ctx.fillStyle = MUTED;
    ctx.font = `400 10px "Courier New", monospace`;
    ctx.textAlign = 'center';
    const shortUrl = qrUrl.length > 52 ? qrUrl.slice(0, 50) + '…' : qrUrl;
    ctx.fillText(shortUrl, W / 2, H - 30);

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
