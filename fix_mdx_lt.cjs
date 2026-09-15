const fs = require('fs');
const path = require('path');

const dir = 'src/content/blog';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.mdx'));

let fixedCount = 0;

for (const file of files) {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  let originalContent = content;
  
  // Replace < followed by anything that isn't a valid HTML tag name or /
  // Valid HTML tags we might use: br, strong, em, a, img, etc.
  // Actually, it's safer to just replace < with &lt; if it's followed by a number, space, $, or =
  content = content.replace(/<([0-9\$\s=])/g, '&lt;$1');
  
  // Also fix < followed by a letter if it's clearly not a tag (e.g., <$12, < 200ms)
  // Let's just replace all < that are not followed by a letter or /
  content = content.replace(/<([^a-zA-Z\/])/g, '&lt;$1');
  
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content);
    fixedCount++;
  }
}

console.log(`Fixed ${fixedCount} files.`);
