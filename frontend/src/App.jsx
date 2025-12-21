import { useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);
  const [activeTab, setActiveTab] = useState('summary'); // Tabs: summary, quiz, slides
  const [quizAnswers, setQuizAnswers] = useState({}); // מעקב אחרי תשובות המשתמש

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) return alert("אנא בחר קובץ קודם");

    setLoading(true);
    setSummary(null);
    setQuizAnswers({});
    setActiveTab('summary');

    const formData = new FormData();
    formData.append('audio', file);

    try {
      const response = await axios.post('http://localhost:3001/api/summarize', formData);
      // בזכות ה-MIME Type בשרת, הנתונים מגיעים כבר כאובייקט
      const result = response.data?.data || response.data?.saved?.summary;
      setSummary(result);
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("שגיאה בניתוח הקובץ");
    } finally {
      setLoading(false);
    }
  };

  const handleQuizChoice = (qIndex, choiceIndex) => {
    setQuizAnswers({ ...quizAnswers, [qIndex]: choiceIndex });
  };

  const renderContent = () => {
    if (!summary) return null;

    if (activeTab === 'summary') {
      return (
        <div className="tab-content" dir="rtl">
          <h2 style={{ color: '#1a73e8' }}>{summary.title || "סיכום פגישה"}</h2>
          {summary.date && <p><strong>תאריך:</strong> {summary.date}</p>}
          
          <div className="summary-box" style={{ padding: '15px', borderRadius: '8px' }}>
            <strong>תמצית:</strong>
            <p>{summary.summary}</p>
          </div>

          <h3>📌 נקודות עיקריות:</h3>
          <ul>
            {summary.key_points?.map((p, i) => <li key={i}>{p}</li>)}
          </ul>

          {summary.conclusion && (
            <div style={{ marginTop: '20px', padding: '15px',  borderRight: '5px solid #2196f3' }}>
              <strong>🎯 מסקנה:</strong>
              <p>{summary.conclusion}</p>
            </div>
          )}
        </div>
      );
    }

    if (activeTab === 'quiz') {
      return (
        <div className="tab-content" dir="rtl">
          <h3>🧠 בוא נראה מה זכרת:</h3>
          {summary.quiz?.map((q, qIdx) => (
            <div key={qIdx} className="quiz-card" style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '8px' }}>
              <p><strong>{qIdx + 1}. {q.question}</strong></p>
              {q.options.map((opt, oIdx) => {
                const isSelected = quizAnswers[qIdx] === oIdx;
                const isCorrect = q.correct_answer_index === oIdx;
                let bgColor = 'white';
                if (isSelected) bgColor = isCorrect ? '#c8e6c9' : '#ffcdd2';

                return (
                  <button
                    key={oIdx}
                    onClick={() => handleQuizChoice(qIdx, oIdx)}
                    style={{
                      display: 'block', width: '100%', textAlign: 'right', margin: '5px 0',
                      padding: '10px', borderRadius: '5px', border: '1px solid #ccc',
                      backgroundColor: bgColor, cursor: 'pointer'
                    }}
                  >
                    {opt}
                    {isSelected && (isCorrect ? ' ✅' : ' ❌')}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      );
    }

    if (activeTab === 'slides') {
      return (
        <div className="tab-content" dir="rtl">
          <h3>📊 מבנה מצגת מומלץ:</h3>
          <div style={{ display: 'grid', gap: '15px' }}>
            {summary.presentation?.map((slide, i) => (
              <div key={i} style={{ padding: '20px', backgroundColor: '#333', color: 'white', borderRadius: '10px', boxShadow: '0 4px 8px rgba(0,0,0,0.2)' }}>
                <h4 style={{ color: '#4fc3f7', borderBottom: '1px solid #555', paddingBottom: '10px' }}>שקף {i+1}: {slide.slide_title}</h4>
                <ul>
                  {slide.bullet_points.map((pt, j) => <li key={j}>{pt}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </div>
      );
    }
  };

  return (
    <div className="App" style={{ maxWidth: '900px', margin: '0 auto', padding: '20px', fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif' }}>
      <h1>SmartMeeting AI 2.0</h1>
      
      <div className="upload-section" style={{ textAlign: 'center', marginBottom: '30px', border: '2px dashed #ccc', padding: '20px', borderRadius: '15px' }}>
        <input type="file" accept="audio/*" onChange={handleFileChange} />
        <button 
          onClick={handleUpload} 
          disabled={loading || !file}
          style={{ padding: '10px 20px', backgroundColor: '#1a73e8', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
        >
          {loading ? 'מנתח נתונים...' : 'נתח קובץ שמע'}
        </button>
      </div>

      {summary && (
        <div className="tabs" style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '20px' }} dir="rtl">
          <button onClick={() => setActiveTab('summary')} style={tabStyle(activeTab === 'summary')}>📋 סיכום</button>
          <button onClick={() => setActiveTab('quiz')} style={tabStyle(activeTab === 'quiz')}>🧠 חידון</button>
          <button onClick={() => setActiveTab('slides')} style={tabStyle(activeTab === 'slides')}>📊 מצגת</button>
        </div>
      )}

      {renderContent()}
    </div>
  );
}

const tabStyle = (isActive) => ({
  padding: '10px 20px',
  cursor: 'pointer',
  backgroundColor: isActive ? '#1a73e8' : '#f1f1f1',
  color: isActive ? 'white' : 'black',
  border: 'none',
  borderRadius: '20px',
  transition: '0.3s'
});

export default App;