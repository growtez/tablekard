const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, 'src', 'pages', 'home.css');
let css = fs.readFileSync(cssPath, 'utf8');

css = css.replace(
  /\.glow-badge\s*{([\s\S]*?)gap:\s*8px;([\s\S]*?)box-shadow:([\s\S]*?);/g,
  '.glow-badge {$1gap: 8px;$2box-shadow:$3;\n  min-width: 68px;\n  justify-content: center;'
);

fs.writeFileSync(cssPath, css);
console.log('glow-badge fixed!');
