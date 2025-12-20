const storage = require('../src/storage');

async function run() {
  const entry = {
    id: 'test-' + Date.now(),
    createdAt: new Date().toISOString(),
    originalFileName: 'test.mp3',
    summary: { text: 'זהו סיכום בדיקה', actionItems: [] }
  };

  await storage.saveSummary(entry);
  const all = await storage.readSummaries();
  console.log('Saved. Total summaries:', all.length);
  console.log(all[all.length -1]);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});