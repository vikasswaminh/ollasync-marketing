import fs from 'fs';
import path from 'path';

const dir = 'src/content/blog';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.mdx'));

for (const file of files) {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;
  
  // Split frontmatter and body
  const parts = content.split('---\n');
  if (parts.length >= 3) {
    let frontmatter = parts[1];
    let body = parts.slice(2).join('---\n');
    
    // Replace { and } with HTML entities in the body to prevent MDX parsing errors
    // But we need to be careful not to break existing valid MDX components if any.
    // Since these are generated blog posts, they shouldn't have MDX components.
    body = body.replace(/\{/g, '&#123;').replace(/\}/g, '&#125;');
    
    // Replace < followed by digit, $, or = with &lt;
    body = body.replace(/<([\d\$=])/g, '&lt;$1');
    
    content = '---\n' + frontmatter + '---\n' + body;
  }
  
  if (content !== original) {
    fs.writeFileSync(filePath, content);
    console.log('Fixed MDX issues in ' + file);
  }
}
