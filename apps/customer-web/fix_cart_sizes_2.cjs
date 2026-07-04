const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, 'src', 'pages', 'home.css');
let css = fs.readFileSync(cssPath, 'utf8');

// Reduce glow-cta padding and font-size even more
css = css.replace(
  /\.glow-cta\s*{([\s\S]*?)padding:\s*4px 4px 4px 12px;([\s\S]*?)font-size:\s*12px;/g,
  '.glow-cta {$1padding: 3px 3px 3px 10px;$2font-size: 11px;'
);

// Reduce cta-icon width and height even more
css = css.replace(
  /\.cta-icon\s*{([\s\S]*?)width:\s*26px;([\s\S]*?)height:\s*26px;/g,
  '.cta-icon {$1width: 22px;$2height: 22px;'
);

fs.writeFileSync(cssPath, css);
console.log('glow-cta made even smaller!');
