import logoImgSrc from './image.png';

/**
 * QR Download Template Painter
 * ─────────────────────────────────────────────────────────────────────────────
 * Renders a styled 6x3 inch landscape table card on an HTML5 Canvas and returns it
 * as a downloadable PNG / PDF source.
 *
 * Fixed card size: 6 × 3 inches
 * At SCALE=3 the canvas is 1728 × 864 px
 */

interface QrTemplateOptions {
    qrSvgElementId: string;
    restaurantName: string;
    tableNumber: number;
    qrUrl?: string;
    qrSize?: number;
}

// ─── Fixed standee dimensions (6 × 3 inches at 96 dpi CSS pixels) ─────────
const CARD_W = 576;   // 6 in × 96 dpi
const CARD_H = 288;   // 3 in × 96 dpi
const QR_SIZE = 200;  // QR size for the right side

// PDF physical size constants (millimetres)
export const CARD_MM_W = 152.4;   // 6 inches in mm
export const CARD_MM_H = 76.2;    // 3 inches in mm

export async function paintQrTemplate(opts: QrTemplateOptions): Promise<HTMLCanvasElement> {
    const { qrSvgElementId, tableNumber } = opts;

    // ── canvas ──────────────────────────────────────────────────────────────
    const SCALE = 3;   
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
    const BLACK       = '#1A202C';
    const WHITE       = '#FFFFFF';
    const THEME_COLOR = '#8B3A1E'; // Project theme (burgundy/brown)

    // ── background ───────────────────────────────────────────────────────────
    roundRect(ctx, 0, 0, W, H, 12, WHITE);
    ctx.strokeStyle = '#CBD5E0';
    ctx.lineWidth = 2;
    roundRectStroke(ctx, 0, 0, W, H, 12);

    // ── Left side ────────────────────────────────────────────────────────────

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // "Table No."
    ctx.font = `700 28px "Segoe UI", Arial, sans-serif`;
    ctx.fillStyle = THEME_COLOR;
    ctx.fillText('Table No.', 150, 50);

    // Huge Table Number
    ctx.font = `900 120px "Comic Sans MS", "Marker Felt", "Arial Black", sans-serif`;
    ctx.fillStyle = THEME_COLOR;
    ctx.fillText(`${tableNumber}`, 150, 145);

    // TableKard Logo under Table Number
    try {
        const logoImg = await loadImage(logoImgSrc);
        const logoTargetWidth = 130;
        const logoRatio = logoImg.height / logoImg.width;
        const logoTargetHeight = logoTargetWidth * logoRatio;
        ctx.drawImage(logoImg, 150 - logoTargetWidth / 2, 225, logoTargetWidth, logoTargetHeight);
    } catch (e) {
        console.error("Failed to load tablekard logo", e);
    }

    // ── Middle divider ───────────────────────────────────────────────────────
    ctx.strokeStyle = BLACK;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(300, 30);
    ctx.lineTo(300, H - 30);
    ctx.stroke();

    // ── Right side ───────────────────────────────────────────────────────────
    
    const qrPad = 10;
    const qrBoxW = QR_SIZE + qrPad * 2;
    const qrBoxX = 330;
    const qrBoxY = 20;

    // QR Box Border
    ctx.strokeStyle = BLACK;
    ctx.lineWidth = 1.5;
    roundRectStroke(ctx, qrBoxX, qrBoxY, qrBoxW, qrBoxW, 0);

    // Draw QR
    ctx.drawImage(qrImage, qrBoxX + qrPad, qrBoxY + qrPad, QR_SIZE, QR_SIZE);

    // Scan to order text
    ctx.fillStyle = THEME_COLOR;
    ctx.font = `600 15px "Segoe UI", Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    
    ctx.fillText('Scan QR code to', qrBoxX + qrBoxW / 2, qrBoxY + qrBoxW + 10);
    ctx.fillText('place order', qrBoxX + qrBoxW / 2, qrBoxY + qrBoxW + 30);

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

function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
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
