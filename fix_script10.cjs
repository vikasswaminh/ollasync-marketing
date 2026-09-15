const fs = require('fs');

let content = fs.readFileSync('generate_aeo_fleet.js', 'utf8');

let lines = content.split('\n');
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes("fs.writeFileSync(path.join('src', 'content', 'blog', \\\\.mdx\\), finalContent);")) {
        lines[i] = "  fs.writeFileSync(path.join('src', 'content', 'blog', `${slug}.mdx`), finalContent);";
    }
    if (lines[i].includes("console.log(\\Successfully built: src/content/blog/\\.mdx\\);")) {
        lines[i] = "  console.log(`Successfully built: src/content/blog/${slug}.mdx`);";
    }
}

fs.writeFileSync('generate_aeo_fleet.js', lines.join('\n'));
console.log('Fixed generate_aeo_fleet.js');
