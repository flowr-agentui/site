import { useRef, useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Send, Loader2, X } from 'lucide-react';
import { streamMessageToAgent } from '../lib/agent';
import './ChatInterface.css';

const OptionButton = ({ label, onClick, disabled }) => (
    <button
        className="option-button"
        onClick={onClick}
        disabled={disabled}
    >
        {label}
    </button>
);

export function ChatInterface({ apiKey, messages, setMessages, setHtmlContent, isTyping, setIsTyping, selectedElement, setSelectedElement }) {
    const [input, setInput] = useState('');
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    const handleOptionClick = (optionValue) => {
        if (isTyping) return;
        handleSendMessage(optionValue);
    };

    const handleSendMessage = async (text) => {
        if (!text.trim() || isTyping) return;

        let contentToSend = text;
        if (selectedElement) {
            contentToSend += `\n\n[CONTEXT] User selected element: ${selectedElement.tagName}${selectedElement.id}${selectedElement.className} (Text: "${selectedElement.text}")\nHTML Snippet: \`${selectedElement.outerHTML}\`\n[/CONTEXT]`;
            // Clear selection after sending
            setSelectedElement(null);
        }

        const userMsg = { role: 'user', content: contentToSend };
        const updatedMessages = [...messages, userMsg];

        setMessages(updatedMessages);
        setInput('');
        setIsTyping(true);

        // Add placeholder for assistant message
        setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

        let fullContent = '';

        try {
            const stream = streamMessageToAgent(apiKey, updatedMessages);

            for await (const chunk of stream) {
                fullContent += chunk;

                // Real-time code extraction
                const codeStart = fullContent.indexOf("<<<CODE_START>>>");
                const codeEnd = fullContent.indexOf("<<<CODE_END>>>");

                if (codeStart !== -1 && codeEnd !== -1) {
                    const code = fullContent.substring(codeStart + 16, codeEnd).trim();
                    setHtmlContent(code);
                }

                setMessages(prev => {
                    const newMsgs = [...prev];
                    newMsgs[newMsgs.length - 1] = {
                        role: 'assistant',
                        content: fullContent
                    };
                    return newMsgs;
                });
            }
        } catch (err) {
            console.error("Stream error:", err);
            setMessages(prev => [...prev, { role: 'assistant', content: "Error: Could not connect to agent." }]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        handleSendMessage(input);
    };

    // Helper to render message content with hidden code blocks and visible options
    const renderMessageContent = (content) => {
        // 1. Hide Code Blocks for display
        let displayContent = content;
        const codeStart = content.indexOf("<<<CODE_START>>>");
        const codeEnd = content.indexOf("<<<CODE_END>>>");

        if (codeStart !== -1 && codeEnd !== -1) {
            displayContent = content.substring(0, codeStart) + "\n\n*(Updating Preview...)*\n" + content.substring(codeEnd + 14);
        } else if (codeStart !== -1) {
            // Code is streaming in...
            displayContent = content.substring(0, codeStart) + "\n\n*(Generating Code...)*";
        }

        // 2. Extract Options
        let options = [];
        const optStart = displayContent.indexOf("<<<OPTIONS_START>>>");
        const optEnd = displayContent.indexOf("<<<OPTIONS_END>>>");

        if (optStart !== -1 && optEnd !== -1) {
            try {
                const jsonStr = displayContent.substring(optStart + 19, optEnd);
                options = JSON.parse(jsonStr);
                // Remove the options block from the text shown above headers
                displayContent = displayContent.substring(0, optStart) + displayContent.substring(optEnd + 15);
            } catch (e) {
                console.error("Failed to parse options JSON", e);
            }
        }

        return (
            <div className="message-content-wrapper">
                <ReactMarkdown>{displayContent}</ReactMarkdown>
                {options.length > 0 && (
                    <div className="options-container">
                        {options.map((opt, i) => (
                            <OptionButton
                                key={i}
                                label={opt.label}
                                onClick={() => handleOptionClick(opt.value || opt.label)}
                                disabled={isTyping}
                            />
                        ))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="chat-container">
            <div className="messages-area">
                {messages.map((msg, idx) => (
                    <div key={idx} className={`message ${msg.role}`}>
                        <div className="message-content">
                            {msg.role === 'assistant' ? renderMessageContent(msg.content) : <ReactMarkdown>{msg.content}</ReactMarkdown>}
                        </div>
                    </div>
                ))}
                {isTyping && messages[messages.length - 1]?.role !== 'assistant' && (
                    <div className="message assistant">
                        <div className="message-content typing-indicator">
                            <Loader2 className="spinner" size={16} />
                            <span>Thinking...</span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="input-wrapper">
                {selectedElement && (
                    <div className="selected-element-chip">
                        <span>Selected: <strong>{selectedElement.tagName}</strong> (Text: {selectedElement.text.substring(0, 20)}...)</span>
                        <button onClick={() => setSelectedElement(null)}><X size={14} /></button>
                    </div>
                )}
                <form className="input-area" onSubmit={handleSubmit}>
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={selectedElement ? "What change do you want for this element?" : "Describe your website..."}
                        disabled={isTyping}
                    />
                    <button type="submit" disabled={!input.trim() || isTyping}>
                        <Send size={18} />
                    </button>
                </form>
            </div>
        </div>
    );
}
