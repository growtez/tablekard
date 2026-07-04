const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, 'src', 'pages', 'home.css');
let css = fs.readFileSync(cssPath, 'utf8');

css = css.replace(
  /\.glow-label\s*{([\s\S]*?)font-size:\s*11px;/g,
  '.glow-label {$1font-size: 10px;'
);

fs.writeFileSync(cssPath, css);
console.log('glow-label font-size fixed!');
