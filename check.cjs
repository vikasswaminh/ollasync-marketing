const fs = require('fs');
const css = fs.readFileSync('src/styles/global.css', 'utf8');
let inComment = false;
let inString = false;
let stringChar = '';
for (let i = 0; i < css.length; i++) {
  if (!inComment && !inString && css[i] === '/' && css[i+1] === '*') {
    inComment = true;
    i++;
  } else if (inComment && css[i] === '*' && css[i+1] === '/') {
    inComment = false;
    i++;
  } else if (!inComment && !inString && (css[i] === "'" || css[i] === '"')) {
    inString = true;
    stringChar = css[i];
  } else if (!inComment && inString && css[i] === stringChar && css[i-1] !== '\\') {
    inString = false;
  }
}
console.log('inComment:', inComment, 'inString:', inString);