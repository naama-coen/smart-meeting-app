const request = require('supertest');
const app = require('../src/index');
const path = require('path');

describe('API Integration - Edge Cases', () => {

  it('should return 400 if no file is uploaded', async () => {
    const res = await request(app).post('/api/summarize');
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe('No file uploaded');
  });

  it('should return 400 if file is too large (over 25MB)', async () => {
    // יצירת Buffer מזויף בגודל 26MB
    const bigFile = Buffer.alloc(26 * 1024 * 1024); 
    const res = await request(app)
      .post('/api/summarize')
      .attach('audio', bigFile, 'huge_file.mp3');

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toContain('File too large');
  },20000);
});