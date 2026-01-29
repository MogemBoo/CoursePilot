import React, { useState, useEffect } from 'react';
import {
    Sparkles, FileText, Beaker, Code2, Presentation, FileDown,
    Copy, Download, CheckCircle, AlertTriangle, XCircle,
    Shield, RefreshCw, Clock, Loader2
} from 'lucide-react';
import './ContentFactory.css';

const API_BASE = 'http://localhost:5000';

const THEORY_FORMATS = [
    { id: 'notes', label: 'Notes', icon: FileText },
    { id: 'slides', label: 'Slides', icon: Presentation },
    { id: 'pdf', label: 'PDF', icon: FileDown },
];

const LANGUAGES = [
    { id: 'python', label: 'Python' },
    { id: 'javascript', label: 'JavaScript' },
    { id: 'typescript', label: 'TypeScript' },
    { id: 'java', label: 'Java' },
    { id: 'cpp', label: 'C++' },
    { id: 'c', label: 'C' },
];

const ContentFactory = () => {
    const [activeTab, setActiveTab] = useState('theory');
    const [prompt, setPrompt] = useState('');
    const [format, setFormat] = useState('notes');
    const [language, setLanguage] = useState('python');
    const [generating, setGenerating] = useState(false);
    const [validating, setValidating] = useState(false);

    const [generatedContent, setGeneratedContent] = useState(null);
    const [validationResults, setValidationResults] = useState(null);
    const [history, setHistory] = useState([]);
    const [error, setError] = useState(null);

    // Load history on mount
    useEffect(() => {
        loadHistory();
    }, []);

    const loadHistory = async () => {
        try {
            const res = await fetch(`${API_BASE}/api/generated?limit=10`);
            if (res.ok) {
                const data = await res.json();
                setHistory(data);
            }
        } catch (err) {
            console.warn('Failed to load history:', err);
        }
    };

    const handleGenerate = async () => {
        if (!prompt.trim()) return;

        setGenerating(true);
        setError(null);
        setGeneratedContent(null);
        setValidationResults(null);

        try {
            const endpoint = activeTab === 'theory'
                ? `${API_BASE}/api/generate/theory`
                : `${API_BASE}/api/generate/lab`;

            const body = activeTab === 'theory'
                ? { prompt, topic: prompt, format }
                : { prompt, topic: prompt, language };

            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Generation failed');
            }

            setGeneratedContent(data);
            loadHistory();
        } catch (err) {
            setError(err.message);
        } finally {
            setGenerating(false);
        }
    };

    const handleValidate = async () => {
        if (!generatedContent?.id) return;

        setValidating(true);
        setError(null);

        try {
            const res = await fetch(`${API_BASE}/api/validate/${generatedContent.id}`, {
                method: 'POST'
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Validation failed');
            }

            setValidationResults(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setValidating(false);
        }
    };

    const handleCopy = () => {
        if (generatedContent?.content) {
            navigator.clipboard.writeText(generatedContent.content);
        }
    };

    const handleDownload = () => {
        if (!generatedContent?.content) return;

        const blob = new Blob([generatedContent.content], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${generatedContent.topic || 'content'}.md`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const loadHistoryItem = async (id) => {
        try {
            const res = await fetch(`${API_BASE}/api/generated/${id}`);
            if (res.ok) {
                const data = await res.json();
                setGeneratedContent(data);
                setPrompt(data.prompt || data.topic);
                setActiveTab(data.type);
                if (data.format) setFormat(data.format);
                if (data.programmingLanguage) setLanguage(data.programmingLanguage);

                // Load validation results if available
                const valRes = await fetch(`${API_BASE}/api/validation/${id}`);
                if (valRes.ok) {
                    const valData = await valRes.json();
                    if (valData.results?.length > 0) {
                        setValidationResults({ results: valData.results });
                    }
                }
            }
        } catch (err) {
            console.warn('Failed to load history item:', err);
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'pass': return <CheckCircle size={16} className="text-green-500" />;
            case 'warning': return <AlertTriangle size={16} className="text-yellow-500" />;
            case 'fail': return <XCircle size={16} className="text-red-500" />;
            default: return <Clock size={16} className="text-gray-500" />;
        }
    };

    const renderMarkdown = (content) => {
        // Simple markdown rendering - you can enhance with a library like marked
        return content
            .replace(/^### (.*$)/gm, '<h3>$1</h3>')
            .replace(/^## (.*$)/gm, '<h2>$1</h2>')
            .replace(/^# (.*$)/gm, '<h1>$1</h1>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
            .replace(/`([^`]+)`/g, '<code>$1</code>')
            .replace(/^- (.*$)/gm, '<li>$1</li>')
            .replace(/\n/g, '<br />');
    };

    return (
        <div className="content-factory page-container">
            {/* Header */}
            <div className="cf-header">
                <h1 className="gradient-text">Content Factory</h1>
                <p>Generate AI-powered learning materials grounded in your course content</p>
            </div>

            {/* Main Grid */}
            <div className="cf-main-grid">
                {/* Input Panel */}
                <div className="cf-input-panel glass-panel">
                    {/* Mode Selector */}
                    <div className="cf-mode-selector">
                        <button
                            className={`cf-mode-btn ${activeTab === 'theory' ? 'active' : ''}`}
                            onClick={() => setActiveTab('theory')}
                        >
                            <FileText size={18} />
                            Theory
                        </button>
                        <button
                            className={`cf-mode-btn ${activeTab === 'lab' ? 'active' : ''}`}
                            onClick={() => setActiveTab('lab')}
                        >
                            <Beaker size={18} />
                            Lab / Code
                        </button>
                    </div>

                    {/* Format/Language Selector */}
                    <div className="cf-form-group">
                        <label>{activeTab === 'theory' ? 'Output Format' : 'Programming Language'}</label>
                        <div className="cf-format-selector">
                            {activeTab === 'theory' ? (
                                THEORY_FORMATS.map(f => (
                                    <button
                                        key={f.id}
                                        className={`cf-format-btn ${format === f.id ? 'active' : ''}`}
                                        onClick={() => setFormat(f.id)}
                                    >
                                        <f.icon size={14} />
                                        {f.label}
                                    </button>
                                ))
                            ) : (
                                LANGUAGES.map(l => (
                                    <button
                                        key={l.id}
                                        className={`cf-format-btn ${language === l.id ? 'active' : ''}`}
                                        onClick={() => setLanguage(l.id)}
                                    >
                                        <Code2 size={14} />
                                        {l.label}
                                    </button>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Topic/Prompt Input */}
                    <div className="cf-form-group">
                        <label>Topic / Prompt</label>
                        <textarea
                            className="cf-textarea"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder={
                                activeTab === 'theory'
                                    ? "E.g., Explain the backpropagation algorithm in neural networks..."
                                    : "E.g., Implement a binary search tree in Python with insert, delete, and search operations..."
                            }
                        />
                    </div>

                    {/* Generate Button */}
                    <button
                        className="cf-generate-btn"
                        onClick={handleGenerate}
                        disabled={generating || !prompt.trim()}
                    >
                        {generating ? (
                            <>
                                <div className="spinner" />
                                Generating...
                            </>
                        ) : (
                            <>
                                <Sparkles size={20} />
                                Generate {activeTab === 'theory' ? 'Content' : 'Code'}
                            </>
                        )}
                    </button>

                    {error && (
                        <div style={{ marginTop: '1rem', color: '#ef4444', fontSize: '0.9rem' }}>
                            ⚠️ {error}
                        </div>
                    )}
                </div>

                {/* Output Panel */}
                <div className="cf-output-panel glass-panel">
                    {!generatedContent ? (
                        <div className="cf-output-empty">
                            <Sparkles size={48} />
                            <p>Generated content will appear here</p>
                            <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
                                Enter a topic and click Generate
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Content Header */}
                            <div className="cf-content-header">
                                <h3>
                                    {activeTab === 'theory' ? <FileText size={20} /> : <Code2 size={20} />}
                                    {generatedContent.topic?.substring(0, 50) || 'Generated Content'}
                                </h3>
                                <div className="cf-content-actions">
                                    <button className="cf-action-btn" onClick={handleCopy} title="Copy">
                                        <Copy size={14} />
                                    </button>
                                    <button className="cf-action-btn" onClick={handleDownload} title="Download">
                                        <Download size={14} />
                                    </button>
                                </div>
                            </div>

                            {/* Content Display */}
                            <div className="cf-content-wrapper">
                                <div
                                    className="cf-markdown-content"
                                    dangerouslySetInnerHTML={{ __html: renderMarkdown(generatedContent.content) }}
                                />
                            </div>

                            {/* Sources Panel */}
                            {(generatedContent.sources?.length > 0 || generatedContent.externalSources?.length > 0) && (
                                <div className="cf-sources-panel">
                                    <h4>Sources</h4>
                                    <div className="cf-source-list">
                                        {generatedContent.sources?.map((s, i) => (
                                            <span key={`int-${i}`} className="cf-source-tag">
                                                📚 {s.title || 'Course Material'}
                                            </span>
                                        ))}
                                        {generatedContent.externalSources?.map((s, i) => (
                                            <span key={`ext-${i}`} className="cf-source-tag">
                                                🌐 {s.title}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Validation Panel */}
                            <div className="cf-validation-panel">
                                <div className="cf-validation-header">
                                    <h4>
                                        <Shield size={18} />
                                        Content Validation
                                    </h4>
                                    <button
                                        className="cf-validate-btn"
                                        onClick={handleValidate}
                                        disabled={validating}
                                    >
                                        {validating ? (
                                            <>
                                                <Loader2 size={14} className="animate-spin" />
                                                Validating...
                                            </>
                                        ) : (
                                            <>
                                                <RefreshCw size={14} />
                                                Run Validation
                                            </>
                                        )}
                                    </button>
                                </div>

                                {validationResults ? (
                                    <>
                                        <div className="cf-validation-results">
                                            {validationResults.results?.map((r, i) => (
                                                <div key={i} className="cf-validation-item">
                                                    <div className="cf-validation-item-info">
                                                        {getStatusIcon(r.status)}
                                                        <span className="cf-validation-type">
                                                            {r.type.replace('_', ' ')}
                                                        </span>
                                                        <span className="cf-validation-score">
                                                            Score: {r.score}/100
                                                        </span>
                                                    </div>
                                                    <span className={`cf-status-badge ${r.status}`}>
                                                        {r.status}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Overall Status */}
                                        <div className={`cf-overall-status ${validationResults.overallStatus}`}>
                                            <span className="cf-overall-label">Overall Status</span>
                                            <span className={`cf-status-badge ${validationResults.overallStatus}`}>
                                                {validationResults.overallStatus}
                                            </span>
                                        </div>

                                        {/* Errors */}
                                        {validationResults.results?.some(r => r.errors?.length > 0) && (
                                            <div className="cf-error-list">
                                                <strong>Issues Found:</strong>
                                                <ul>
                                                    {validationResults.results
                                                        .flatMap(r => r.errors || [])
                                                        .slice(0, 5)
                                                        .map((e, i) => (
                                                            <li key={i}>{e}</li>
                                                        ))
                                                    }
                                                </ul>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                                        Click "Run Validation" to check content quality, accuracy, and code syntax.
                                    </p>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* History Panel */}
            {history.length > 0 && (
                <div className="cf-history-panel glass-panel" style={{ marginTop: '2rem', padding: '1.5rem' }}>
                    <h3>Recent Generations</h3>
                    <div className="cf-history-list">
                        {history.map(item => (
                            <div
                                key={item.id}
                                className="cf-history-item"
                                onClick={() => loadHistoryItem(item.id)}
                            >
                                <div className="cf-history-info">
                                    <span className={`cf-history-type ${item.type}`}>
                                        {item.type}
                                    </span>
                                    <span className="cf-history-topic">
                                        {item.topic?.substring(0, 50) || 'Untitled'}
                                        {item.topic?.length > 50 ? '...' : ''}
                                    </span>
                                </div>
                                <div className="cf-history-meta">
                                    <span className={`cf-status-badge ${item.validationStatus}`}>
                                        {item.validationStatus}
                                    </span>
                                    <span>
                                        {new Date(item.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ContentFactory;
