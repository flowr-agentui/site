import { useRef, useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Send, Loader2 } from 'lucide-react';
import { sendMessageToAgent } from '../lib/agent';
import './ChatInterface.css';

export function ChatInterface({ apiKey, messages, setMessages, setHtmlContent, isTyping, setIsTyping }) {
    const [input, setInput] = useState('');
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!input.trim() || isTyping) return;

        const userMsg = { role: 'user', content: input };
        const updatedMessages = [...messages, userMsg];

        setMessages(updatedMessages);
        setInput('');
        setIsTyping(true);

        const result = await sendMessageToAgent(apiKey, updatedMessages);

        const botMsg = { role: 'assistant', content: result.content };
        setMessages(prev => [...prev, botMsg]);

        if (result.code) {
            setHtmlContent(result.code);
        }

        setIsTyping(false);
    };

    return (
        <div className="chat-container">
            <div className="messages-area">
                {messages.map((msg, idx) => (
                    <div key={idx} className={`message ${msg.role}`}>
                        <div className="message-content">
                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                    </div>
                ))}
                {isTyping && (
                    <div className="message assistant">
                        <div className="message-content typing-indicator">
                            <Loader2 className="spinner" size={16} />
                            Thinking...
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <form className="input-area" onSubmit={handleSubmit}>
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Describe your website..."
                    disabled={isTyping}
                />
                <button type="submit" disabled={!input.trim() || isTyping}>
                    <Send size={18} />
                </button>
            </form>
        </div>
    );
}
