import React from 'react';
import { Upload } from 'lucide-react';

const CMS = () => {
    return (
        <div className="page-container">
            <h1 className="gradient-text" style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Content Management</h1>

            <div className="glass-panel" style={{ padding: '2rem', borderRadius: 'var(--radius-lg)', marginBottom: '2rem' }}>
                <h2 style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Upload New Material</h2>

                <div style={{ border: '2px dashed var(--border-color)', borderRadius: 'var(--radius-md)', padding: '3rem', textAlign: 'center', cursor: 'pointer', transition: 'all 0.3s' }}>
                    <Upload size={48} color="var(--accent-primary)" style={{ marginBottom: '1rem' }} />
                    <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Drag & Drop files here or click to browse</p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Supports PDF, PPTX, Code files, MD</p>
                </div>
            </div>
        </div>
    );
};

export default CMS;
