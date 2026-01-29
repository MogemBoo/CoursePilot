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
    const [isSessionReady, setIsSessionReady] = useState(false);

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
            // For this demo, we create an anonymous chat session on the backend
            const res = await fetch(`${API_BASE}/api/chat/session`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });
            const data = await res.json();
            setSessionId(data.sessionId);
            setIsSessionReady(true);
        } catch (err) {
            console.error('Failed to init session:', err);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSend = async () => {
        if (!input.trim() || !sessionId || loading) return;

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

    const handleQuickPrompt = (prompt) => {
        setInput(prompt);
        // Optionally auto-send:
        // handleSend();
    };

    const handleReferenceClick = (ref) => {
        if (!ref.materialId) return;
        const url = `${API_BASE}/api/content/${ref.materialId}/open`;
        window.open(url, '_blank', 'noopener,noreferrer');
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
                            <p>Try one of these shortcuts to use core features:</p>
                            <div className="suggestion-chips">
                                <button onClick={() => handleQuickPrompt("Search the course materials for introduction to neural networks and list the key topics.")}>
                                    🔍 Search course materials
                                </button>
                                <button onClick={() => handleQuickPrompt("Summarize the lecture on Decision Trees using my uploaded slides.")}>
                                    📝 Summarize existing content
                                </button>
                                <button onClick={() => handleQuickPrompt("Generate detailed theory notes for Lab 3: Hash Tables, aligned with my course materials.")}>
                                    📚 Generate theory material
                                </button>
                                <button onClick={() => handleQuickPrompt("Generate a lab assignment with starter code and tasks for Binary Search Trees in Python.")}>
                                    🧪 Generate lab material
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
                                            <span>Grounded in:</span>
                                            {msg.references.map((ref, i) => (
                                                <button
                                                    key={i}
                                                    type="button"
                                                    className="source-tag"
                                                    onClick={() => handleReferenceClick(ref)}
                                                >
                                                    <BookOpen size={12} />
                                                    {ref.title || 'Course Material'}
                                                </button>
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
                            disabled={!input.trim() || loading || !isSessionReady}
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
