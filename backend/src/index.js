const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { GoogleAIFileManager } = require("@google/generative-ai/server");
require('dotenv').config();

const app = express();
// Allow requests from the frontend dev origin
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

const upload = multer({ dest: 'uploads/' }); // שמירה זמנית של הקובץ
const fileManager = new GoogleAIFileManager(process.env.GEMINI_API_KEY);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const storage = require('./storage'); // module to persist summaries in data/summaries.json

app.post('/api/summarize', upload.single('audio'), async (req, res) => {
  try {
    // Validate upload
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded (field name must be "audio")' });
    }

    const filePath = req.file.path;

    // 1. העלאת הקובץ ל-Google AI Cloud (חובה עבור קבצי מדיה)
    let uploadResult;
    try {
      uploadResult = await fileManager.uploadFile(filePath, {
        mimeType: req.file.mimetype,
        displayName: "Meeting Audio",
      });
    } catch (uErr) {
      console.error('Error uploading file to GoogleAI:', uErr);
      return res.status(502).json({ error: 'Failed to upload file to AI service', details: uErr.message });
    }

    // 2. קריאה ל-Gemini 2.5 Flash לניתוח האודיו
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    let result;
    try {
      console.log("Generating content with file URI:", uploadResult.file.uri);
      result = await model.generateContent([
        {
          fileData: {
            mimeType: uploadResult.file.mimeType,
            fileUri: uploadResult.file.uri
          }
        },
        { text: 
       
 `Analyze the provided audio content. Your task is to summarize the main discussion points, list actionable items, and provide a final conclusion.

IMPORTANT: 
1. The response must be STRICTLY in JSON format.
2. All content (values) inside the JSON must be written in HEBREW.
3. Do not include any introductory or concluding text. Return only the JSON object.

Structure:
{
  "title": "כותרת מתאימה בעברית",
  "date": "תאריך אם מוזכר (או מחרוזת ריקה)",
  "summary": "סיכום קצר של השיחה בעברית",
  "key_points": [
    "נקודה חשובה 1 בעברית",
    "נקודה חשובה 2 בעברית"
  ],
  "action_items": [
    {
      "description": "תיאור המשימה בעברית",
      "assigned_to": "שם האחראי בעברית (אם ידוע)",
      "status": "בטיפול"
    }
  ],
  "conclusion": "שורה תחתונה או מסקנה סופית מהשיחה בעברית"
}`
        }
      ]);
    } catch (gErr) {
      console.error('Error generating content from AI:', gErr);
      return res.status(502).json({ error: 'AI generation failed', details: gErr.message });
    }

    const text = result.response.text();

    // ניסיון לפרסר את הטקסט ל־JSON — אם לא תקין נשמור את הטקסט הגולמי
    let parsed = null;
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      parsed = null;
    }

    const entry = {
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      originalFileName: req.file.originalname,
      summary: parsed ?? text
    };

    await storage.saveSummary(entry);

    res.json({ success: true, data: text, saved: entry });
  } catch (error) {
    console.error('Unexpected error in /api/summarize:', error);
    res.status(500).json({ error: error.message });
  }
});

// endpoint לשליפת כל הסיכומים שנשמרו
app.get('/api/summaries', async (req, res) => {
  try {
    const summaries = await storage.readSummaries();
    res.json({ success: true, summaries });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));