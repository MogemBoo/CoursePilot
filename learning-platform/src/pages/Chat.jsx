import React from 'react';

const Chat = () => {
    return (
        <div className="page-container" style={{ height: 'calc(100vh - 4rem)', display: 'flex', flexDirection: 'column' }}>
            <h1 className="gradient-text" style={{ fontSize: '2rem', marginBottom: '1rem' }}>AI Assistant</h1>

            <div className="glass-panel" style={{ flex: 1, borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column' }}>
                <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto' }}>
                    <div style={{
                        marginBottom: '1rem',
                        padding: '1rem',
                        background: 'rgba(255,255,255,0.05)',
                        borderRadius: 'var(--radius-md) var(--radius-md) var(--radius-md) 0',
                        maxWidth: '70%',
                    }}>
                        <p>Hello! How can I help you with your course materials today?</p>
                    </div>
                </div>

                <div style={{ padding: '1.5rem', borderTop: '1px solid var(--glass-border)' }}>
                    <input
                        type="text"
                        placeholder="Type your message..."
                        style={{
                            width: '100%',
                            padding: '1rem',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--border-color)',
                            background: 'rgba(0,0,0,0.2)',
                            color: 'var(--text-primary)',
                            fontSize: '1rem',
                            outline: 'none'
                        }}
                    />
                </div>
            </div>
        </div>
    );
};

export default Chat;
