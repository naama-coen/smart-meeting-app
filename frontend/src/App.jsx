import { useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState('');

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) return alert("אנא בחרי קובץ קודם");

    setLoading(true);
    const formData = new FormData();
    formData.append('audio', file);

    try {
      // API Link: חיבור לשרת ה-Backend
      const response = await axios.post('http://localhost:5000/api/upload', formData);
      setSummary(response.data.summary);
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("שגיאה בהעלאת הקובץ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <h1>SmartMeeting AI</h1>
      
      {/* Upload Component */}
      <div className="upload-section">
        <input type="file" accept="audio/*" onChange={handleFileChange} />
        <button onClick={handleUpload} disabled={loading || !file}>
          {loading ? 'מנתח פגישה...' : 'נתח פגישה'}
        </button>
      </div>

      {/* תצוגת תוצאה בסיסית */}
      {summary && (
        <div className="result-section">
          <h2>סיכום פגישה:</h2>
          <p>{summary}</p>
        </div>
      )}
    </div>
  );
}

export default App;