const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, 'src', 'pages', 'home.css');
let css = fs.readFileSync(cssPath, 'utf8');

// 1. glow-label font-size: 10px -> 8px
css = css.replace(
  /\.glow-label\s*{([\s\S]*?)font-size:\s*10px;/g,
  '.glow-label {$1font-size: 8px;'
);

// 2. glow-total font-size: 18px -> 16px
css = css.replace(
  /\.glow-total\s*{([\s\S]*?)font-size:\s*18px;/g,
  '.glow-total {$1font-size: 16px;'
);

// 3. glow-cta padding, gap, font-size
css = css.replace(
  /\.glow-cta\s*{([\s\S]*?)padding:\s*6px 6px 6px 16px;([\s\S]*?)gap:\s*8px;([\s\S]*?)font-size:\s*14px;/g,
  '.glow-cta {$1padding: 4px 4px 4px 12px;$2gap: 6px;$3font-size: 12px;'
);

// 4. cta-icon width/height
css = css.replace(
  /\.cta-icon\s*{([\s\S]*?)width:\s*32px;([\s\S]*?)height:\s*32px;/g,
  '.cta-icon {$1width: 26px;$2height: 26px;'
);

fs.writeFileSync(cssPath, css);
console.log('Cart sizes reduced successfully!');
