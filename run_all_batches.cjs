const { execSync } = require('child_process');

async function runAllBatches() {
  for (let i = 2; i <= 10; i++) {
    console.log(`\n--- Running Batch ${i} ---`);
    try {
      execSync(`node generate_aeo_fleet.js --batch ${i}`, { stdio: 'inherit' });
    } catch (error) {
      console.error(`Error running Batch ${i}:`, error.message);
      // Continue with the next batch even if one fails
    }
  }
  console.log('\nAll batches completed!');
}

runAllBatches();
