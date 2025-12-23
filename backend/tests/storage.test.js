const storage = require('../storage');
const fs = require('fs');

describe('Storage Module Unit Tests', () => {
  it('should save a summary and read it back', async () => {
    const mockData = { id: '123', summary: 'test summary' };
    await storage.saveSummary(mockData);
    
    const allSummaries = await storage.readSummaries();
    expect(allSummaries).toContainEqual(expect.objectContaining(mockData));
  });
});