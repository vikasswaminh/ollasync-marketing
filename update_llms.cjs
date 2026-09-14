const fs = require('fs');
const files = fs.readdirSync('src/content/blog').filter(f => f.endsWith('.mdx'));
const llms = fs.readFileSync('public/llms.txt', 'utf8');
const newLinks = files.map(f => {
  const slug = f.replace('.mdx', '');
  const title = slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  return { slug, link: '- [' + title + '](https://www.ollasync.com/blog/' + slug + '/)' };
}).filter(item => !llms.includes('/blog/' + item.slug + '/')).map(item => item.link);

if (newLinks.length > 0) {
  fs.appendFileSync('public/llms.txt', '\n' + newLinks.join('\n'));
  console.log('Added ' + newLinks.length + ' links to llms.txt');
} else {
  console.log('No new links to add');
}
