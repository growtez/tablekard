const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, 'src', 'pages', 'home.css');
let css = fs.readFileSync(cssPath, 'utf8');

css = css.replace(
  /\.cart-modern-glow\s*{([\s\S]*?)left:\s*32px;([\s\S]*?)right:\s*32px;/g,
  '.cart-modern-glow {$1left: 16px;$2right: 16px;'
);

css = css.replace(
  /\.glow-label\s*{([\s\S]*?)opacity:\s*0\.8;/g,
  '.glow-label {$1opacity: 0.8;\n  white-space: nowrap;'
);

const emptyStateCss = `
/* ===== EMPTY STATE - RECENT ORDERS ===== */
.no-recent-orders {
  display: flex;
  align-items: center;
  background: #FFFFFF;
  border: 1.5px dashed #D4A59A;
  border-radius: 20px;
  padding: 20px 16px;
  gap: 16px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.02);
}

.no-recent-icon {
  width: 50px;
  height: 50px;
  background: #FFF7F3;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #8B3A1E;
  flex-shrink: 0;
}

.no-recent-text {
  flex: 1;
}

.no-recent-text h4 {
  font-size: 15px;
  font-weight: 700;
  color: #1A1A1A;
  margin-bottom: 4px;
}

.no-recent-text p {
  font-size: 13px;
  color: #888888;
  line-height: 1.4;
  margin: 0;
}
`;

css += emptyStateCss;

fs.writeFileSync(cssPath, css);
console.log('CSS fixed successfully!');
