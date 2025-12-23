import { useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);
  const [activeTab, setActiveTab] = useState('summary'); // summary | quiz | presentation
  const [quizAnswers, setQuizAnswers] = useState({}); // { [questionIndex]: selectedOptionIndex }

  const handleFileChange = (e) => {
    setFile(e.target.files?.[0] || null);
  };

  const handleUpload = async () => {
    if (!file) return alert("אנא בחרי קובץ קודם");

    setLoading(true);
    setSummary(null);
    setQuizAnswers({});
    setActiveTab('summary');

    const formData = new FormData();
    formData.append('audio', file);

    try {
      const response = await axios.post('http://localhost:3001/api/summarize', formData);
      // ברוב המקרים זה כבר אובייקט בגלל responseMimeType בשרת
      const result = response.data?.data || response.data?.saved?.summary;

      // מנגנון הגנה קטן אם בכל זאת הגיע מחרוזת JSON
      let parsed = result;
      if (typeof result === 'string') {
        const clean = result.replace(/```json|```/g, '').trim();
        parsed = JSON.parse(clean);
      }

      setSummary(parsed);
    } catch (error) {
      console.error("Error:", error);
      alert("שגיאה בניתוח הקובץ.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuizChoice = (qIndex, choiceIndex) => {
    setQuizAnswers((prev) => ({ ...prev, [qIndex]: choiceIndex }));
  };

  return (
    <div className="App">
      <header className="app-header">
        <h1>SmartMeeting AI</h1>
        <p className="ai-subtitle">ניתוח תוכן והפקת תובנות מבוסס בינה מלאכותית</p>
      </header>

      <main className="content-container">
        {summary && (
          <button
            className="back-to-upload-btn"
            onClick={() => {
              setSummary(null);
              setFile(null);
              setQuizAnswers({});
              setActiveTab('summary');
            }}
          >
            ← ניתוח קובץ חדש
          </button>
        )}

        {!summary ? (
          <div className="upload-section card">
            <input
              type="file"
              accept="audio/*"
              onChange={handleFileChange}
              id="file-upload"
              hidden
            />
            <label htmlFor="file-upload" className="file-label-styled">
              {file ? `✅ ${file.name}` : "בחירת קובץ לניתוח"}
            </label>

            <button onClick={handleUpload} disabled={loading || !file} className="main-btn">
              {loading ? (
                <div className="loader-container">
                  <div className="spinner"></div>
                </div>
              ) : 'התחל ניתוח תוכן'}
            </button>
          </div>
        ) : (
          <div className="result-section">
            {/* תפריט לשוניות (Tabs) בעיצוב מודרני */}
            <div className="tabs-container">
              <button
                className={`tab-btn ${activeTab === 'summary' ? 'active' : ''}`}
                onClick={() => setActiveTab('summary')}
              >
                📋 סיכום ותובנות
              </button>

              <button
                className={`tab-btn ${activeTab === 'quiz' ? 'active' : ''}`}
                onClick={() => setActiveTab('quiz')}
              >
                🧠 חידון ידע
              </button>

              <button
                className={`tab-btn ${activeTab === 'presentation' ? 'active' : ''}`}
                onClick={() => setActiveTab('presentation')}
              >
                📊 מבנה למצגת
              </button>
            </div>

            <div className="tab-content card main-display-card">
              {/* ===== לשונית סיכום ===== */}
              {activeTab === 'summary' && (
                <div className="summary-grid fade-in">
                  <div className="content-card hero-card">
                    <span className="badge">סקירת התוכן</span>
                    <h2 className="display-title">{summary.title || "סיכום פגישה"}</h2>

                    {summary.date && (
                      <p className="summary-text-main" style={{ marginTop: 0 }}>
                        <strong>תאריך:</strong> {summary.date}
                      </p>
                    )}

                    <p className="summary-text-main">
                      {typeof summary.summary === 'object'
                        ? (summary.summary?.hebrew || JSON.stringify(summary.summary))
                        : (summary.summary || "")}
                    </p>
                  </div>

                  <div className="secondary-cards-layout">
                    <div className="content-card info-card">
                      <h3>📌 דגשים מרכזיים</h3>
                      <ul className="styled-list">
                        {(summary.key_points || []).map((p, i) => (
                          <li key={i}>{p}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="content-card tasks-card">
                      <h3>✅ יעדים להמשך</h3>
                      <div className="action-items-container">
                        {(summary.action_items || []).map((item, i) => {
                          const text = typeof item === 'object' ? item.description : item;
                          return (
                            <div key={i} className="task-row">
                              <input type="checkbox" id={`t-${i}`} />
                              <label htmlFor={`t-${i}`}>{text}</label>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {summary.conclusion && (
                    <div className="content-card">
                      <h3>🎯 מסקנה</h3>
                      <p className="summary-text-main">{summary.conclusion}</p>
                    </div>
                  )}
                </div>
              )}

              {/* ===== לשונית חידון ===== */}
              {activeTab === 'quiz' && (
                <div className="quiz-container fade-in">
                  <span className="badge">בדיקת הבנה</span>
                  <h2 className="display-title">חידון ידע אינטראקטיבי</h2>

                  <div className="quiz-questions-grid">
                    {(summary.quiz || []).map((q, qIdx) => (
                      <div key={qIdx} className="quiz-question-card">
                        <div className="question-number">שאלה {qIdx + 1}</div>
                        <p className="question-text">{q.question}</p>

                        <div className="options-grid">
                          {(q.options || []).map((opt, oIdx) => {
                            const isSelected = quizAnswers[qIdx] === oIdx;
                            const isCorrect = q.correct_answer_index === oIdx;

                            // צבעים כמו באפליקציה השנייה (רק בלי לשנות className)
                            const bgColor = isSelected
                              ? (isCorrect ? '#c8e6c9' : '#ffcdd2')
                              : undefined;

                            return (
                              <button
                                key={oIdx}
                                className="option-btn"
                                onClick={() => handleQuizChoice(qIdx, oIdx)}
                                style={{ backgroundColor: bgColor }}
                              >
                                {opt}
                                {isSelected && (isCorrect ? ' ✅' : ' ❌')}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ===== לשונית מצגת ===== */}
              {activeTab === 'presentation' && (
                <div className="presentation-container fade-in">
                  <div className="section-header">
                    <span className="badge">תכנון ויזואלי</span>
                    <h2 className="display-title">מבנה מוצע למצגת</h2>
                    <p className="subtitle">כל כרטיס מייצג שקף במצגת הסופית</p>
                  </div>

                  <div className="slides-grid">
                    {(summary.presentation || []).map((slide, i) => {
                      // לפי ה-spec של הבקאנד שלך:
                      const title = slide.slide_title || `שקף ${i + 1}`;
                      const points = slide.bullet_points || [];

                      return (
                        <div key={i} className="slide-card">
                          <div className="slide-badge">שקף {i + 1}</div>
                          <div className="slide-content-wrapper">
                            <h3 className="slide-title">{title}</h3>

                            <div className="slide-body">
                              {Array.isArray(points) && points.length > 0 ? (
                                <ul className="slide-points">
                                  {points.map((pt, j) => (
                                    <li key={j}>{pt}</li>
                                  ))}
                                </ul>
                              ) : (
                                <p>אין נקודות לשקף זה</p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
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
