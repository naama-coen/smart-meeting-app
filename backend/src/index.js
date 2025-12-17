const express = require('express');
const multer = require('multer');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { GoogleAIFileManager } = require("@google/generative-ai/server");
require('dotenv').config();

const app = express();
const upload = multer({ dest: 'uploads/' }); // שמירה זמנית של הקובץ
const fileManager = new GoogleAIFileManager(process.env.GEMINI_API_KEY);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post('/api/summarize', upload.single('audio'), async (req, res) => {
  try {
    const filePath = req.file.path;

    // 1. העלאת הקובץ ל-Google AI Cloud (חובה עבור קבצי מדיה)
    const uploadResult = await fileManager.uploadFile(filePath, {
      mimeType: req.file.mimetype,
      displayName: "Meeting Audio",
    });

    // 2. קריאה ל-Gemini 1.5 Flash לניתוח האודיו
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent([
      {
        fileData: {
          mimeType: uploadResult.file.mimeType,
          fileUri: uploadResult.file.uri
        }
      },
      { text: "ניתוח פגישה: סכם את הנקודות העיקריות, רשום משימות לביצוע (Action Items) והחזר הכל במבנה JSON מסודר." },
    ]);

    res.json({ success: true, data: result.response.text() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3001, () => console.log('Server running on port 3001'));