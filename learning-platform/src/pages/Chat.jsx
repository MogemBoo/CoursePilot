import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Bot, User, Trash2 } from 'lucide-react';
import './Chat.css';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const Chat = () => {
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const sendMessage = async () => {
        if (!inputValue.trim() || isLoading) return;

        const userMessage = {
            id: Date.now(),
            role: 'user',
            content: inputValue.trim(),
            timestamp: new Date().toISOString()
        };

        setMessages(prev => [...prev, userMessage]);
        setInputValue('');
        setIsLoading(true);

        try {
            const response = await fetch(`${API_BASE_URL}/api/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: userMessage.content,
                    history: messages.map(m => ({ role: m.role, content: m.content }))
                }),
            });

            if (!response.ok) throw new Error('Failed to get response');

            const data = await response.json();

            const assistantMessage = {
                id: Date.now() + 1,
                role: 'assistant',
                content: data.response || data.message,
                timestamp: new Date().toISOString(),
                sources: data.sources || []
            };

            setMessages(prev => [...prev, assistantMessage]);
        } catch (err) {
            const errorMessage = {
                id: Date.now() + 1,
                role: 'assistant',
                content: 'Unable to connect to the AI service. Please ensure the backend is running.',
                timestamp: new Date().toISOString(),
                isError: true
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const clearChat = () => {
        setMessages([]);
    };

    return (
        <div className="page-container chat-page">
            <div className="chat-header">
                <div>
                    <h1 className="gradient-text">AI Assistant</h1>
                    <p className="chat-subtitle">Ask questions about your course materials</p>
                </div>
                {messages.length > 0 && (
                    <button className="btn-secondary" onClick={clearChat}>
                        <Trash2 size={16} /> Clear Chat
                    </button>
                )}
            </div>

            <div className="chat-container glass-panel">
                <div className="messages-area">
                    {messages.length === 0 ? (
                        <div className="chat-empty">
                            <Bot size={48} />
                            <h3>Start a Conversation</h3>
                            <p>Ask me anything about your uploaded course materials.</p>
                        </div>
                    ) : (
                        messages.map((message) => (
                            <div
                                key={message.id}
                                className={`message ${message.role} ${message.isError ? 'error' : ''}`}
                            >
                                <div className="message-avatar">
                                    {message.role === 'user' ? <User size={20} /> : <Bot size={20} />}
                                </div>
                                <div className="message-content">
                                    <p>{message.content}</p>
                                    {message.sources && message.sources.length > 0 && (
                                        <div className="message-sources">
                                            <span>Sources:</span>
                                            {message.sources.map((source, idx) => (
                                                <span key={idx} className="source-tag">{source}</span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                    {isLoading && (
                        <div className="message assistant loading">
                            <div className="message-avatar">
                                <Bot size={20} />
                            </div>
                            <div className="message-content">
                                <Loader2 size={20} className="spinning" />
                                <span>Thinking...</span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <div className="chat-input-area">
                    <textarea
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Type your message..."
                        rows={1}
                        disabled={isLoading}
                    />
                    <button 
                        className="send-btn" 
                        onClick={sendMessage}
                        disabled={!inputValue.trim() || isLoading}
                    >
                        {isLoading ? <Loader2 size={20} className="spinning" /> : <Send size={20} />}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Chat;
