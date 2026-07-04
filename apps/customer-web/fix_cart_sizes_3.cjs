const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, 'src', 'pages', 'home.css');
let css = fs.readFileSync(cssPath, 'utf8');

// 1. Force white-space nowrap with important on glow-label
css = css.replace(
  /\.glow-label\s*{([\s\S]*?)white-space:\s*nowrap;/g,
  '.glow-label {$1white-space: nowrap !important;\n    word-break: keep-all !important;\n    flex-shrink: 0;'
);

// 2. Reduce glow-cta size even further
css = css.replace(
  /\.glow-cta\s*{([\s\S]*?)padding:\s*3px 3px 3px 10px;([\s\S]*?)gap:\s*6px;([\s\S]*?)font-size:\s*11px;/g,
  '.glow-cta {$1padding: 2px 2px 2px 8px;$2gap: 4px;$3font-size: 10px;'
);

// 3. Reduce cta-icon size even further
css = css.replace(
  /\.cta-icon\s*{([\s\S]*?)width:\s*22px;([\s\S]*?)height:\s*22px;/g,
  '.cta-icon {$1width: 18px;$2height: 18px;'
);

fs.writeFileSync(cssPath, css);
console.log('Cart sizes ultra reduced!');
