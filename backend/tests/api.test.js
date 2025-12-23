const request = require('supertest');
const path = require('path');

// --- הגדרת הפונקציות המזויפות (Mocks) ---
const mockGenerateContent = jest.fn();
const mockUploadFile = jest.fn();

// --- הגדרת Mocks עבור ספריות ה-AI ---
jest.mock('@google/generative-ai', () => {
  return {
    GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
      getGenerativeModel: jest.fn().mockReturnValue({
        // שימוש במעטפת פונקציה כדי למנוע שגיאות אתחול
        generateContent: (args) => mockGenerateContent(args)
      })
    }))
  };
});

jest.mock('@google/generative-ai/server', () => {
  return {
    GoogleAIFileManager: jest.fn().mockImplementation(() => ({
      // שימוש במעטפת פונקציה כדי שנוכל לשלוט בהצלחה/כישלון של העלאה
      uploadFile: (filePath, config) => mockUploadFile(filePath, config)
    }))
  };
});

// טעינת ה-app רק אחרי הגדרת ה-Mocks כדי שיחולו עליו
const app = require('../src/index');

// --- בדיקת אינטגרציה מקורית (בהערה כפי שביקשת) ---
/*
describe('Audio Upload & AI Summary Integration Test', () => {
  it('should upload an audio file, return success, and provide structured summary', async () => {
    const filePath = path.join(__dirname, '../data/test-audio.mp3');

    const res = await request(app)
      .post('/api/summarize')
      .attach('audio', filePath);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);

    expect(res.body.data).toEqual(
      expect.objectContaining({
        title: expect.any(String),
        summary: expect.any(String),
        key_points: expect.any(Array),
        action_items: expect.any(Array),
        conclusion: expect.any(String),
        quiz: expect.any(Array),
        presentation: expect.any(Array),
      })
    );
  }, 30000);
});
*/

// --- בלוק הבדיקות הראשי ---

describe('API with Mocked AI', () => {

  beforeEach(() => {
    jest.clearAllMocks(); // איפוס המוקים לפני כל בדיקה
    
    // הגדרת ברירת מחדל מוצלחת להעלאת קבצים
    mockUploadFile.mockResolvedValue({
      file: { uri: "mock-uri", mimeType: "audio/mpeg" }
    });
  });

  // 1. בדיקת מסלול הצלחה (Happy Path)
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

  // 2. בדיקת שגיאת העלאה (סוגר את שורות 50-52 ב-Coverage)
  it('should return 502 if file upload to Google fails', async () => {
    mockUploadFile.mockRejectedValueOnce(new Error('Google Upload Error'));

    const res = await request(app)
      .post('/api/summarize')
      .attach('audio', Buffer.from('fake-audio'), 'test.mp3');

    expect(res.statusCode).toBe(502);
    expect(res.body.error).toBe('Failed to upload to AI service');
  });

  // 3. בדיקת JSON לא תקין (התיקון לשגיאת ה-502)
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

  // 4. בדיקת GET (סוגר את שורות 129-130 ב-Coverage)
  it('should return all summaries via GET', async () => {
    const res = await request(app).get('/api/summaries');
    
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.summaries)).toBe(true);
  });
});