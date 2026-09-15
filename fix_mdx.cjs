const fs = require('fs');
const path = require('path');

const dir = 'src/content/blog';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.mdx'));

let fixedCount = 0;

for (const file of files) {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  let originalContent = content;
  
  // Fix unescaped < followed by a number (e.g., <200ms)
  content = content.replace(/<([0-9])/g, '&lt;$1');
  
  // Fix unescaped < followed by a space (e.g., < 200ms)
  content = content.replace(/< /g, '&lt; ');
  
  // Fix unescaped { and } that are not part of JSX or code blocks
  // This is harder, but let's just fix the < issue first as that's the current error
  
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content);
    fixedCount++;
    console.log(`Fixed ${file}`);
  }
}

console.log(`Fixed ${fixedCount} files.`);
