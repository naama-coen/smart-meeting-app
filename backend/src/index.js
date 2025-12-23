const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs'); // הוספת מודול מערכת הקבצים
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { GoogleAIFileManager } = require("@google/generative-ai/server");
require('dotenv').config();

const app = express();
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

// הגדרת multer עם הגבלת נפח של 25MB
const uploadConfig = multer({ 
  dest: 'uploads/',
  limits: { fileSize: 25 * 1024 * 1024 } 
}).single('audio');

const fileManager = new GoogleAIFileManager(process.env.GEMINI_API_KEY);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const storage = require('./storage');

app.post('/api/summarize', (req, res) => {
  // הפעלה של multer בצורה שמאפשרת תפיסת שגיאות ולידציה לפני ה-Route
  uploadConfig(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File too large. Max size is 25MB' });
      }
      return res.status(400).json({ error: err.message });
    } else if (err) {
      return res.status(500).json({ error: err.message });
    }

    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const filePath = req.file.path;

      // 1. העלאת הקובץ ל-Google AI Cloud
      let uploadResult;
      try {
        uploadResult = await fileManager.uploadFile(filePath, {
          mimeType: req.file.mimetype,
          displayName: "Meeting Audio",
        });
      } catch (uErr) {
        console.error('Error uploading to GoogleAI:', uErr);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        return res.status(502).json({ error: 'Failed to upload to AI service' });
      }

      // מחיקת הקובץ מהשרת המקומי מיד לאחר ההעלאה לגוגל
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

      // 2. הגדרת המודל
      const model = genAI.getGenerativeModel({
        model: "gemini-flash-latest",
        generationConfig: { responseMimeType: "application/json" }
      });

      const promptText = `Analyze the provided audio content. Your task is to generate a comprehensive response in HEBREW.
      You must provide:
      1. A summary of the conversation.
      2. A quiz based on the content (at least 3 multiple-choice questions).
      3. A presentation structure (at least 3 slides).

      STRUCTURE:
      {
        "title": "כותרת השיחה",
        "date": "תאריך (אם מוזכר)",
        "summary": "סיכום קצר",
        "key_points": ["נקודה 1", "נקודה 2"],
        "action_items": [
          {"description": "תיאור המשימה", "assigned_to": "אחראי", "status": "בטיפול"}
        ],
        "conclusion": "מסקנה סופית",
        "quiz": [
          {
            "question": "השאלה",
            "options": ["אופציה 0", "אופציה 1", "אופציה 2", "אופציה 3"],
            "correct_answer_index": 0
          }
        ],
        "presentation": [
          {
            "slide_title": "כותרת שקף",
            "bullet_points": ["נקודה א", "נקודה ב"]
          }
        ]
      }`;

      const result = await model.generateContent([
        {
          fileData: {
            mimeType: uploadResult.file.mimeType,
            fileUri: uploadResult.file.uri
          }
        },
        { text: promptText }
      ]);

      const textResponse = result.response.text();
      
      // ולידציית JSON עבור מקרי קצה ובדיקות יחידה
      let parsedData;
      try {
        parsedData = JSON.parse(textResponse);
      } catch (jsonErr) {
        console.error('AI Response was not valid JSON:', jsonErr);
        return res.status(502).json({ error: 'AI processing failed' });
      }

      // 3. שמירת הנתונים במערכת האחסון
      const entry = {
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        originalFileName: req.file.originalname,
        summary: parsedData 
      };

      await storage.saveSummary(entry);

      res.json({ success: true, data: parsedData, saved: entry });

    } catch (error) {
      console.error('General Error:', error);
      res.status(500).json({ error: error.message });
    }
  });
});

app.get('/api/summaries', async (req, res) => {
  try {
    const summaries = await storage.readSummaries();
    res.json({ success: true, summaries });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3001;

if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;