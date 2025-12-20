const fs = require('fs').promises;
const path = require('path');

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'summaries.json');

async function ensureDataFile() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(DATA_FILE);
  } catch (err) {
    // File doesn't exist — create with empty array
    await fs.writeFile(DATA_FILE, JSON.stringify([]), 'utf8');
  }
}

async function readSummaries() {
  await ensureDataFile();
  const raw = await fs.readFile(DATA_FILE, 'utf8');
  return JSON.parse(raw || '[]');
}

async function saveSummary(entry) {
  const summaries = await readSummaries();
  summaries.push(entry);
  await fs.writeFile(DATA_FILE, JSON.stringify(summaries, null, 2), 'utf8');
  return entry;
}

module.exports = {
  readSummaries,
  saveSummary,
};
