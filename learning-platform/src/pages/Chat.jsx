import React, { useState, useEffect, useRef } from 'react';
import { Send, User, Sparkles, BookOpen, Clock, Trash2, Bot, PlusCircle } from 'lucide-react';
import './Chat.css';

const API_BASE = 'http://localhost:5000';

const Chat = () => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [sessionId, setSessionId] = useState(null);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        // Create or retrieve session on mount
        createSession();
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const createSession = async () => {
        try {
            // In a real app, you might check localStorage for an existing sessionId
            // For now, we'll create a new one or just use a dummy user ID if auth isn't fully ready
            const res = await fetch(`${API_BASE}/api/chat/session`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: 'dummy-user-id' }) // Replace with auth context
            });
            const data = await res.json();
            setSessionId(data.sessionId);
        } catch (err) {
            console.error('Failed to init session:', err);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSend = async () => {
        if (!input.trim() || !sessionId) return;

        const userMsg = { sender: 'user', text: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            const res = await fetch(`${API_BASE}/api/chat/message`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionId,
                    text: userMsg.text
                })
            });

            const data = await res.json();

            const botMsg = {
                sender: 'assistant',
                text: data.reply,
                references: data.references || []
            };

            setMessages(prev => [...prev, botMsg]);
        } catch (err) {
            setMessages(prev => [...prev, {
                sender: 'assistant',
                text: 'Sorry, I encountered an error. Please try again.',
                isError: true
            }]);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="chat-page page-container">
            <div className="chat-container glass-panel">

                {/* Chat Header */}
                <div className="chat-header">
                    <div className="chat-title">
                        <Bot className="text-accent" />
                        <h2>ScholarSync AI Assistant</h2>
                    </div>
                    <p className="chat-subtitle">Ask me anything about your course materials!</p>
                </div>

                {/* Messages Component */}
                <div className="messages-area">
                    {messages.length === 0 && (
                        <div className="empty-state">
                            <Sparkles size={48} className="text-accent opacity-50 mb-4" />
                            <h3>How can I help you today?</h3>
                            <p>Try asking about:</p>
                            <div className="suggestion-chips">
                                <button onClick={() => setInput("Summarize the last lecture on Neural Networks")}>
                                    📝 Summarize the last lecture
                                </button>
                                <button onClick={() => setInput("Generate a quiz about Data Structures")}>
                                    ❓ Generate a quiz
                                </button>
                                <button onClick={() => setInput("Explain 'Polymorphism' with code examples")}>
                                    💻 Explain key concepts
                                </button>
                            </div>
                        </div>
                    )}

                    {messages.map((msg, idx) => (
                        <div key={idx} className={`message-row ${msg.sender}`}>
                            <div className="message-bubble">
                                <div className="message-icon">
                                    {msg.sender === 'user' ? <User size={18} /> : <Sparkles size={18} />}
                                </div>
                                <div className="message-content">
                                    <p>{msg.text}</p>

                                    {/* References Section */}
                                    {msg.references && msg.references.length > 0 && (
                                        <div className="message-sources">
                                            <span>Sources:</span>
                                            {msg.references.map((ref, i) => (
                                                <div key={i} className="source-tag">
                                                    <BookOpen size={12} />
                                                    {ref.title || 'Course Material'}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}

                    {loading && (
                        <div className="message-row assistant">
                            <div className="message-bubble loading">
                                <div className="typing-indicator">
                                    <span></span><span></span><span></span>
                                </div>
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="input-area">
                    <div className="input-wrapper">
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Ask a question..."
                            rows={1}
                        />
                        <button
                            className="send-btn"
                            onClick={handleSend}
                            disabled={!input.trim() || loading}
                        >
                            <Send size={20} />
                        </button>
                    </div>
                    <p className="disclaimer">
                        AI responses are generated based on your course materials. Always verify with original sources.
                    </p>
                </div>

            </div>
        </div>
    );
};

export default Chat;
