import React, { useState } from 'react';
import { Search as SearchIcon, Loader2, FileText, Code, Presentation, FileCode, ExternalLink } from 'lucide-react';
import './Search.css';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const Search = () => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    const getFileIcon = (type) => {
        switch (type) {
            case 'pdf': return <FileText size={20} />;
            case 'pptx': return <Presentation size={20} />;
            case 'code': return <Code size={20} />;
            case 'markdown': return <FileCode size={20} />;
            default: return <FileText size={20} />;
        }
    };

    const handleSearch = async () => {
        if (!query.trim() || isSearching) return;

        setIsSearching(true);
        setHasSearched(true);

        try {
            const response = await fetch(`${API_BASE_URL}/api/search`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ query: query.trim() }),
            });

            if (!response.ok) throw new Error('Search failed');

            const data = await response.json();
            setResults(data.results || []);
        } catch (err) {
            console.error('Search error:', err);
            setResults([]);
        } finally {
            setIsSearching(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    return (
        <div className="page-container search-page">
            <div className="search-header">
                <h1 className="gradient-text">Semantic Search</h1>
                <p className="search-subtitle">Find relevant content across your course materials</p>
            </div>

            <div className="search-box-container glass-panel">
                <div className="search-input-wrapper">
                    <SearchIcon size={24} className="search-icon" />
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Ask a question or search for a topic..."
                        disabled={isSearching}
                    />
                </div>
                <button 
                    className="btn-primary search-btn" 
                    onClick={handleSearch}
                    disabled={!query.trim() || isSearching}
                >
                    {isSearching ? (
                        <><Loader2 size={18} className="spinning" /> Searching...</>
                    ) : (
                        'Search'
                    )}
                </button>
            </div>

            {/* Results Section */}
            <div className="results-section">
                {isSearching ? (
                    <div className="results-loading">
                        <Loader2 size={48} className="spinning" />
                        <p>Searching through your materials...</p>
                    </div>
                ) : hasSearched && results.length === 0 ? (
                    <div className="results-empty glass-panel">
                        <SearchIcon size={48} />
                        <h3>No results found</h3>
                        <p>Try a different search query or upload more content.</p>
                    </div>
                ) : results.length > 0 ? (
                    <div className="results-list">
                        <p className="results-count">{results.length} result{results.length !== 1 ? 's' : ''} found</p>
                        {results.map((result, index) => (
                            <div key={index} className="result-card glass-panel">
                                <div className="result-header">
                                    <div className={`result-icon ${result.type || 'other'}`}>
                                        {getFileIcon(result.type)}
                                    </div>
                                    <div className="result-meta">
                                        <h4>{result.filename || result.title}</h4>
                                        <span className="result-source">{result.source || result.category}</span>
                                    </div>
                                    <span className="result-score">{Math.round((result.score || result.relevance || 0) * 100)}% match</span>
                                </div>
                                <p className="result-excerpt">{result.excerpt || result.content}</p>
                                {result.page && (
                                    <span className="result-page">Page {result.page}</span>
                                )}
                            </div>
                        ))}
                    </div>
                ) : !hasSearched ? (
                    <div className="search-tips glass-panel">
                        <h3>Search Tips</h3>
                        <ul>
                            <li>Ask natural language questions like "What is machine learning?"</li>
                            <li>Search for specific concepts or topics</li>
                            <li>Use keywords from your course materials</li>
                        </ul>
                    </div>
                ) : null}
            </div>
        </div>
    );
};

export default Search;
