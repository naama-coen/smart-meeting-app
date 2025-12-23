const request = require('supertest');
const app = require('../app'); // שים לב: כדאי להפריד את ה-app מה-server.listen

describe('API Integration Tests', () => {
  it('GET /api/summaries should return 200 and a list', async () => {
    const res = await request(app).get('/api/summaries');
    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
  });
});