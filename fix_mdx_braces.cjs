const fs = require('fs');
const path = require('path');

const dir = 'src/content/blog';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.mdx'));

let fixedCount = 0;

for (const file of files) {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  let originalContent = content;
  
  // Split frontmatter and body
  const parts = content.split('---');
  if (parts.length >= 3) {
    const frontmatter = parts[1];
    let body = parts.slice(2).join('---');
    
    // Replace { and } with HTML entities in the body
    body = body.replace(/\{/g, '&#123;');
    body = body.replace(/\}/g, '&#125;');
    
    content = `---${frontmatter}---${body}`;
  }
  
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content);
    fixedCount++;
  }
}

console.log(`Fixed ${fixedCount} files.`);
