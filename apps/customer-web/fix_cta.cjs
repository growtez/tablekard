const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, 'src', 'pages', 'home.css');
let css = fs.readFileSync(cssPath, 'utf8');

css = css.replace(
  /\.glow-cta\s*{([\s\S]*?)transition:\s*all\s*0\.3s\s*ease;/g,
  '.glow-cta {$1transition: all 0.3s ease;\n  white-space: nowrap;'
);

fs.writeFileSync(cssPath, css);
console.log('glow-cta fixed!');
