const fs = require('fs');

const plan = fs.readFileSync('MARKETING_AEO_PLAN.md', 'utf8');
const lines = plan.split('\n');

const newBatches = {};
let currentBatch = null;
let currentCategory = '';

for (const line of lines) {
  const batchMatch = line.match(/### Batch (\d+): (.*)/);
  if (batchMatch) {
    currentBatch = parseInt(batchMatch[1]);
    
    const batchTitle = batchMatch[2].toLowerCase();
    if (batchTitle.includes('cost') || batchTitle.includes('zoom')) currentCategory = 'Comparisons';
    else if (batchTitle.includes('multilingual') || batchTitle.includes('translation')) currentCategory = 'Translation';
    else if (batchTitle.includes('training') || batchTitle.includes('l&d')) currentCategory = 'Teaching';
    else if (batchTitle.includes('large-scale') || batchTitle.includes('town halls')) currentCategory = 'Enterprise Use Cases';
    else if (batchTitle.includes('ai features') || batchTitle.includes('future')) currentCategory = 'Future of Work';
    else if (batchTitle.includes('industry')) currentCategory = 'Industry Verticals';
    else if (batchTitle.includes('engagement')) currentCategory = 'Tactical How-To';
    else if (batchTitle.includes('accessibility')) currentCategory = 'Compliance';
    else if (batchTitle.includes('technical') || batchTitle.includes('security')) currentCategory = 'Security';
    else currentCategory = 'Comparisons';

    if (currentBatch >= 2) {
      newBatches[currentBatch] = [];
    }
    continue;
  }
  
  if (currentBatch >= 2 && line.match(/^\d+\.\s+(.*)/)) {
    const title = line.match(/^\d+\.\s+(.*)/)[1].trim();
    const keyword = title.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(' ').slice(0, 5).join(' ');
    newBatches[currentBatch].push({
      title,
      keyword,
      category: currentCategory
    });
  }
}

let fleetCode = fs.readFileSync('generate_aeo_fleet.js', 'utf8');

const batchesEndIndex = fleetCode.indexOf('  1: [');
let closingBraceIndex = fleetCode.indexOf('};', batchesEndIndex);
if (closingBraceIndex === -1) {
    closingBraceIndex = fleetCode.indexOf('}', fleetCode.indexOf(']', batchesEndIndex));
}

let newBatchesStr = '';
for (let i = 2; i <= 10; i++) {
  newBatchesStr += ',\n  ' + i + ': [\n';
  newBatchesStr += newBatches[i].map(t => '    { title: \'' + t.title.replace(/'/g, "\\'") + '\', keyword: \'' + t.keyword + '\', category: \'' + t.category + '\' }').join(',\n');
  newBatchesStr += '\n  ]';
}

const updatedCode = fleetCode.substring(0, closingBraceIndex) + newBatchesStr + '\n' + fleetCode.substring(closingBraceIndex);

fs.writeFileSync('generate_aeo_fleet.js', updatedCode);
console.log('Added Batches 2-10 to generate_aeo_fleet.js');
