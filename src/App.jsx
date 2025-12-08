import { useState, useEffect } from 'react';
import { ChatInterface } from './components/ChatInterface';
import { PreviewFrame } from './components/PreviewFrame';
import { Bot, Code2, Sparkles, Key } from 'lucide-react';
import './App.css';

function App() {
  const [apiKey, setApiKey] = useState(localStorage.getItem('gemini_api_key') || '');
  const [htmlContent, setHtmlContent] = useState('');
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hello! I\'m your AI website builder. I can help you create a stunning website. To get started, tell me what kind of website you want to build?' }
  ]);
  const [isTyping, setIsTyping] = useState(false);

  const saveApiKey = (key) => {
    localStorage.setItem('gemini_api_key', key);
    setApiKey(key);
  };

  if (!apiKey) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: '1rem'
      }}>
        <div style={{ background: 'var(--bg-secondary)', padding: '2rem', borderRadius: '1rem', border: '1px solid var(--border)', maxWidth: '400px', width: '100%' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: 0 }}>
            <Key size={24} color="var(--accent)" />
            Enter Gemini API Key
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            To use this completely client-side agent, you need to provide your Google Gemini API key. It will be stored securely in your browser's local storage.
          </p>
          <form onSubmit={(e) => {
            e.preventDefault();
            const val = e.target.elements.key.value;
            if (val) saveApiKey(val);
          }}>
            <input
              name="key"
              type="password"
              placeholder="AIzaSy..."
              style={{
                width: '100%', padding: '0.75rem', borderRadius: '0.5rem',
                background: 'var(--bg-primary)', border: '1px solid var(--border)',
                color: 'var(--text-primary)', marginBottom: '1rem'
              }}
            />
            <button
              type="submit"
              style={{
                width: '100%', padding: '0.75rem', borderRadius: '0.5rem',
                background: 'var(--accent)', color: 'white', border: 'none',
                cursor: 'pointer', fontWeight: 600
              }}
            >
              Start Building
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="app-layout">
      <header className="header">
        <div className="logo">
          <Sparkles className="logo-icon" />
          <span>Flowr Agent</span>
        </div>
        <div className="actions">
          <button className="btn-icon" onClick={() => { localStorage.removeItem('gemini_api_key'); setApiKey(''); }}>
            <Key size={18} />
          </button>
        </div>
      </header>

      <main className="main-grid">
        <section className="chat-section">
          <ChatInterface
            apiKey={apiKey}
            messages={messages}
            setMessages={setMessages}
            setHtmlContent={setHtmlContent}
            isTyping={isTyping}
            setIsTyping={setIsTyping}
          />
        </section>
        <section className="preview-section">
          <PreviewFrame htmlContent={htmlContent} />
        </section>
      </main>
    </div>
  );
}

export default App;
