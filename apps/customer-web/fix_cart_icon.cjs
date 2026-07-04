const fs = require('fs');
const path = require('path');

const jsxPath = path.join(__dirname, 'src', 'pages', 'home.jsx');
let jsx = fs.readFileSync(jsxPath, 'utf8');

jsx = jsx.replace(
  /<ArrowRight size=\{18\} strokeWidth=\{3\} \/>/g,
  '<ArrowRight size={14} strokeWidth={3} />'
);

fs.writeFileSync(jsxPath, jsx);
console.log('Arrow icon resized!');
