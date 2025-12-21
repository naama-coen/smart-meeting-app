import { useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) return alert("אנא בחרי קובץ קודם");
    setLoading(true);
    setSummary(null);

    const formData = new FormData();
    formData.append('audio', file);

    try {
      const response = await axios.post('http://localhost:3001/api/summarize', formData);
      const rawData = response.data.data;

      // מנגנון הגנה: בדיקה אם המידע הוא כבר אובייקט או טקסט שצריך פענוח
      let parsedData;
      if (typeof rawData === 'string') {
        try {
          const cleanData = rawData.replace(/```json|```/g, "").trim();
          parsedData = JSON.parse(cleanData);
        } catch (e) {
          // אם הפענוח נכשל, נבנה אובייקט בסיסי מהטקסט הגולמי
          parsedData = {
            title: "ניתוח תוכן",
            summary: rawData,
            action_items: []
          };
        }
      } else {
        parsedData = rawData;
      }

      setSummary(parsedData);
    } catch (error) {
      console.error("Error:", error);
      alert("שגיאה בניתוח הקובץ.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <header className="app-header">
        <h1>SmartMeeting AI</h1>
        <p className="ai-subtitle">ניתוח פגישות וסיכומים מבוסס בינה מלאכותית</p>
      </header>

      <main className="content-container">
        {!summary ? (
          <div className="upload-section card">
            <input type="file" accept="audio/*" onChange={handleFileChange} id="file-upload" hidden />
            <label htmlFor="file-upload" className="file-label-styled">
              {file ? `✅ ${file.name}` : "לחץ לבחירת קובץ שמע"}
            </label>

            <button onClick={handleUpload} disabled={loading || !file} className="main-btn">
              {loading ? (
                <div className="loader-container">
                  <span>המערכת מנתחת עכשיו...</span>
                </div>
              ) : 'נתח פגישה עכשיו'}
            </button>
          </div>
        ) : (
          <div className="result-section">
            <button className="secondary-btn" onClick={() => { setSummary(null); setFile(null); }}>
              ← ניתוח קובץ חדש
            </button>

            <div className="cards-grid">
              <div className="card highlight-card">
                <span className="card-tag">נושא הפגישה</span>
                <h2>{summary.title || "ניתוח תוכן"}</h2>
                <div className="decoration-line"></div>
              </div>

              <div className="card">
                <span className="card-tag">תמצית המפגש</span>
                <p className="summary-text">
                  {typeof summary.summary === 'object' ? summary.summary.hebrew : summary.summary}
                </p>
              </div>

              {summary.action_items?.length > 0 && (
                <div className="card full-width-card">
                  <span className="card-tag">Checklist משימות</span>
                  <ul className="action-list">
                    {summary.action_items.map((item, i) => (
                      <li key={i} className="action-item-checkbox">
                        <input type="checkbox" id={`task-${i}`} className="custom-checkbox" />
                        <label htmlFor={`task-${i}`}>
                          {typeof item === 'object' ? item.description : item}
                        </label>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;