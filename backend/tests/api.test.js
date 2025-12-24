const request = require('supertest');
const path = require('path');

const mockGenerateContent = jest.fn();
const mockUploadFile = jest.fn();

jest.mock('@google/generative-ai', () => {
  return {
    GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
      getGenerativeModel: jest.fn().mockReturnValue({
        generateContent: (args) => mockGenerateContent(args)
      })
    }))
  };
});

jest.mock('@google/generative-ai/server', () => {
  return {
    GoogleAIFileManager: jest.fn().mockImplementation(() => ({
      uploadFile: (filePath, config) => mockUploadFile(filePath, config)
    }))
  };
});

const app = require('../src/index');



// --- בלוק הבדיקות הראשי ---

describe('API with Mocked AI', () => {

  beforeEach(() => {
    jest.clearAllMocks(); 
    
    mockUploadFile.mockResolvedValue({
      file: { uri: "mock-uri", mimeType: "audio/mpeg" }
    });
  });

  it('should process audio without calling real Gemini API', async () => {
    mockGenerateContent.mockResolvedValue({
      response: {
        text: () => JSON.stringify({
          title: "פגישת דמה",
          summary: "זהו סיכום מזויף לצורכי בדיקה",
          key_points: ["נקודה 1"],
          action_items: [],
          quiz: [],
          presentation: []
        })
      }
    });

    const res = await request(app)
      .post('/api/summarize')
      .attach('audio', Buffer.from('fake-audio-content'), 'test.mp3');

    expect(res.statusCode).toBe(200);
    expect(res.body.data.title).toBe("פגישת דמה"); 
  });

  it('should return 502 if file upload to Google fails', async () => {
    mockUploadFile.mockRejectedValueOnce(new Error('Google Upload Error'));

    const res = await request(app)
      .post('/api/summarize')
      .attach('audio', Buffer.from('fake-audio'), 'test.mp3');

    expect(res.statusCode).toBe(502);
    expect(res.body.error).toBe('Failed to upload to AI service');
  });

  it('should return 502 if AI returns invalid JSON', async () => {
    mockGenerateContent.mockResolvedValueOnce({
      response: { text: () => "Invalid JSON Text" }
    });

    const res = await request(app)
      .post('/api/summarize')
      .attach('audio', Buffer.from('fake-audio'), 'test.mp3');

    expect(res.statusCode).toBe(502);
    expect(res.body.error).toBe('AI processing failed');
  });

  it('should return all summaries via GET', async () => {
    const res = await request(app).get('/api/summaries');
    
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.summaries)).toBe(true);
  });
});