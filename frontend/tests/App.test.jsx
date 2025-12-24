import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import axios from 'axios';
import App from '../src/App';

vi.mock('axios');

describe('App Component - UI Unit Tests', () => {
  
  beforeEach(() => {
    vi.clearAllMocks();
    window.alert = vi.fn();
    axios.post = vi.fn().mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({ data: { data: {} } }), 100))
    );
  });

  it('renders main title and subtitle', () => {
    render(<App />);
    expect(screen.getByText(/SmartMeeting AI/i)).toBeInTheDocument();
  });

    


  it('updates file label when a file is selected', async () => {
    render(<App />);
    const file = new File(['audio'], 'meeting.mp3', { type: 'audio/mpeg' });
    const input = document.getElementById('file-upload');
    
    await act(async () => {
      fireEvent.change(input, { target: { files: [file] } });
    });
    
    expect(screen.getByText(/✅ meeting.mp3/i)).toBeInTheDocument();
  });

  it('displays loader while uploading', async () => {
    render(<App />);
    
    const file = new File(['audio'], 'test.mp3', { type: 'audio/mpeg' });
    const input = document.getElementById('file-upload');
    await act(async () => {
      fireEvent.change(input, { target: { files: [file] } });
    });

    const uploadButton = screen.getByText(/התחל ניתוח תוכן/i);
    await act(async () => {
      fireEvent.click(uploadButton);
    });

    const loader = document.querySelector('.spinner');
    expect(loader).not.toBeNull();
  });
});