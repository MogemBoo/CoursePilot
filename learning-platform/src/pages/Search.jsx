import React from 'react';
import { Search as SearchIcon } from 'lucide-react';

const Search = () => {
    return (
        <div className="page-container">
            <h1 className="gradient-text" style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Semantic Search</h1>
            <p style={{ color: 'var(--text-muted)', marginBottom: '3rem', fontSize: '1.1rem' }}>
                Find relevant documents, excerpts, and code snippets instantly.
            </p>

            <div className="glass-panel" style={{
                padding: '2rem',
                borderRadius: 'var(--radius-lg)',
                maxWidth: '800px',
                margin: '0 auto'
            }}>
                <div style={{ position: 'relative' }}>
                    <SearchIcon style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                        type="text"
                        placeholder="Ask a question about the course..."
                        style={{
                            width: '100%',
                            padding: '1rem 1rem 1rem 3rem',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--border-color)',
                            background: 'rgba(0,0,0,0.2)',
                            color: 'var(--text-primary)',
                            fontSize: '1.1rem',
                            outline: 'none'
                        }}
                    />
                </div>
                <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                    <button className="btn-primary">Search</button>
                </div>
            </div>
        </div>
    );
};

export default Search;
