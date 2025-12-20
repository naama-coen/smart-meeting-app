שמור על סיכומי פגישות בקובץ JSON

מה נוסף:
- `src/storage.js` — מודול פשוט לקריאה/כתיבה של הסיכומים ב־`data/summaries.json`.
- `POST /api/summarize` — מעבד קובץ אודיו עם Google Generative AI ושומר את הפלט ב־`data/summaries.json`.
- `GET /api/summaries` — מחזיר את כל הסיכומים שנשמרו.

חשוב לגבי Docker:
- ב־`docker-compose.yml` נוסף מיפוי: `./backend/data:/app/data` — זה שומר על הקבצים גם אם הקונטיינר ימחק/ייבנה מחדש.

שימוש מהיר:
- שליחת פוסט עם audio field:
  curl -F "audio=@meeting.mp3" http://localhost:3001/api/summarize

- לקבלת כל הסיכומים:
  curl http://localhost:3001/api/summaries
