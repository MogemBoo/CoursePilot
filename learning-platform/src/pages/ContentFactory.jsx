import React, { useState } from 'react';
import { Sparkles, FileText, Beaker } from 'lucide-react';

const ContentFactory = () => {
    const [activeTab, setActiveTab] = useState('theory');

    return (
        <div className="page-container">
            <h1 className="gradient-text" style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Content Factory</h1>
            <p style={{ color: 'var(--text-muted)', marginBottom: '3rem', fontSize: '1.1rem' }}>
                Generate grounded learning materials using AI.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>

                {/* Input Section */}
                <div className="glass-panel" style={{ padding: '2rem', borderRadius: 'var(--radius-lg)' }}>
                    <div style={{ marginBottom: '2rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Generation Mode</label>
                        <div style={{ display: 'flex', gap: '1rem', background: 'rgba(0,0,0,0.2)', padding: '0.25rem', borderRadius: 'var(--radius-md)' }}>
                            <button
                                onClick={() => setActiveTab('theory')}
                                style={{
                                    flex: 1,
                                    padding: '0.75rem',
                                    borderRadius: 'var(--radius-sm)',
                                    background: activeTab === 'theory' ? 'var(--accent-primary)' : 'transparent',
                                    color: activeTab === 'theory' ? 'white' : 'var(--text-secondary)',
                                    fontWeight: '500',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.5rem',
                                    transition: 'all 0.3s'
                                }}
                            >
                                <FileText size={18} />
                                Theory
                            </button>
                            <button
                                onClick={() => setActiveTab('lab')}
                                style={{
                                    flex: 1,
                                    padding: '0.75rem',
                                    borderRadius: 'var(--radius-sm)',
                                    background: activeTab === 'lab' ? 'var(--accent-primary)' : 'transparent',
                                    color: activeTab === 'lab' ? 'white' : 'var(--text-secondary)',
                                    fontWeight: '500',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.5rem',
                                    transition: 'all 0.3s'
                                }}
                            >
                                <Beaker size={18} />
                                Lab
                            </button>
                        </div>
                    </div>

                    <div style={{ marginBottom: '2rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Topic / Concept</label>
                        <textarea
                            placeholder="E.g., Explain Neural Networks with Python examples..."
                            style={{
                                width: '100%',
                                height: '150px',
                                padding: '1rem',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--border-color)',
                                background: 'rgba(0,0,0,0.2)',
                                color: 'var(--text-primary)',
                                fontSize: '1rem',
                                outline: 'none',
                                resize: 'none'
                            }}
                        />
                    </div>

                    <button className="btn-primary" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                        <Sparkles size={20} />
                        <span>Generate Content</span>
                    </button>
                </div>

                {/* Output Preview Placeholder */}
                <div className="glass-panel" style={{
                    padding: '2rem',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px dashed var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column',
                    color: 'var(--text-muted)'
                }}>
                    <Sparkles size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                    <p>Generated content will appear here</p>
                </div>

            </div>
        </div>
    );
};

export default ContentFactory;
