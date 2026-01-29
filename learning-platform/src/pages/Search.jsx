import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Search as SearchIcon, Filter, ExternalLink, Loader2, Tag, Download } from 'lucide-react';

const API_BASE = ''; // Vite proxy -> backend

function debounce(fn, ms) {
    let t;
    return (...args) => {
        clearTimeout(t);
        t = setTimeout(() => fn(...args), ms);
    };
}

function highlight(text, query) {
    const q = (query || '').trim();
    if (!q) return text;
    const parts = q.split(/\s+/).filter(Boolean).slice(0, 6);
    if (!parts.length) return text;
    const re = new RegExp(`(${parts.map(p => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');
    const segments = String(text).split(re);
    return segments.map((seg, i) =>
        re.test(seg) ? <mark key={i} style={{ background: 'rgba(99,102,241,0.35)', color: 'inherit' }}>{seg}</mark> : <span key={i}>{seg}</span>
    );
}

const Search = () => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [error, setError] = useState(null);

    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    const [filters, setFilters] = useState({
        category: 'all',
        type: 'all',
        weekFrom: '',
        weekTo: '',
        tags: '',
        topK: 5,
    });

    const lastSuggestQ = useRef('');

    const fetchSuggestions = useMemo(() => debounce(async (q) => {
        try {
            if (!q || q.trim().length < 2) {
                setSuggestions([]);
                return;
            }
            lastSuggestQ.current = q;
            const resp = await fetch(`${API_BASE}/api/search/suggestions?q=${encodeURIComponent(q)}&limit=8`);
            if (!resp.ok) return;
            const data = await resp.json();
            if (lastSuggestQ.current === q) setSuggestions(data.suggestions || []);
        } catch {
            // ignore
        }
    }, 250), []);

    useEffect(() => {
        fetchSuggestions(query);
    }, [query, fetchSuggestions]);

    const runSearch = async (qOverride) => {
        const q = (qOverride ?? query).trim();
        if (!q) return;
        setError(null);
        setIsSearching(true);
        setResults([]);
        try {
            const body = {
                query: q,
                topK: Number(filters.topK || 5),
                filters: {
                    category: filters.category,
                    type: filters.type === 'pptx' ? 'slide' : filters.type,
                    weekFrom: filters.weekFrom ? Number(filters.weekFrom) : undefined,
                    weekTo: filters.weekTo ? Number(filters.weekTo) : undefined,
                    tags: filters.tags ? filters.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
                },
            };
            const resp = await fetch(`${API_BASE}/api/search/semantic`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            const data = await resp.json();
            if (!resp.ok) throw new Error(data.error || 'Search failed');
            const raw = data.results || [];
            // Deduplicate by filename (one result per unique file)
            const seen = new Set();
            const deduped = raw.filter((r) => {
                const key = (r?.source?.fileName || r?.source?.title || r?.chunkId || '').toString();
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
            });
            setResults(deduped);
        } catch (e) {
            setError(e.message);
        } finally {
            setIsSearching(false);
        }
    };

    const openOrDownload = async (r, asDownload = false) => {
        try {
            let url = r?.source?.openUrl;
            if (!url && r?.source?.materialId) {
                const ep = `${API_BASE}/api/content/${r.source.materialId}/open`;
                const resp = await fetch(ep);
                const data = await resp.json();
                if (!resp.ok) throw new Error(data.error || 'Failed to get file URL');
                url = data.url;
            }
            if (!url) {
                setError('No file URL available for this result.');
                return;
            }
            if (asDownload) {
                const a = document.createElement('a');
                a.href = url;
                a.download = r?.source?.fileName || r?.source?.title || 'download';
                a.target = '_blank';
                a.rel = 'noopener noreferrer';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            } else {
                window.open(url, '_blank', 'noreferrer');
            }
        } catch (e) {
            setError(e.message);
        }
    };

    return (
        <div className="page-container">
            <h1 className="gradient-text" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Semantic Search</h1>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '1.05rem' }}>
                Ask naturally (“How do loops work?”) or paste a lab error. You’ll get grounded snippets from your uploaded course content.
            </p>

            <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)', maxWidth: '980px', margin: '0 auto' }}>
                <div style={{ position: 'relative' }}>
                    <SearchIcon style={{ position: 'absolute', left: '1rem', top: '1.1rem', color: 'var(--text-muted)' }} />
                    <input
                        value={query}
                        onChange={(e) => { setQuery(e.target.value); setShowSuggestions(true); }}
                        onKeyDown={(e) => { if (e.key === 'Enter') { setShowSuggestions(false); runSearch(); } }}
                        onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                        type="text"
                        placeholder="Search by filename (e.g., test.pdf) or topic (e.g., Binary Trees)…"
                        style={{
                            width: '100%',
                            padding: '0.95rem 1rem 0.95rem 3rem',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--border-color)',
                            background: 'rgba(0,0,0,0.2)',
                            color: 'var(--text-primary)',
                            fontSize: '1.05rem',
                            outline: 'none'
                        }}
                    />

                    {showSuggestions && suggestions.length > 0 && (
                        <div className="glass-panel" style={{
                            position: 'absolute',
                            top: '3.2rem',
                            left: 0,
                            right: 0,
                            zIndex: 10,
                            borderRadius: 'var(--radius-md)',
                            padding: '0.5rem',
                            maxHeight: '240px',
                            overflow: 'auto'
                        }}>
                            {suggestions.map((s) => (
                                <button
                                    key={s}
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => { setQuery(s); setShowSuggestions(false); runSearch(s); }}
                                    style={{
                                        width: '100%',
                                        textAlign: 'left',
                                        padding: '0.6rem 0.75rem',
                                        borderRadius: '10px',
                                        background: 'transparent',
                                        color: 'var(--text-primary)'
                                    }}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Filters */}
                <div style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem', alignItems: 'end' }}>
                    <div>
                        <label style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}><Filter size={14} style={{ verticalAlign: 'middle' }} /> Category</label>
                        <select value={filters.category} onChange={(e) => setFilters(f => ({ ...f, category: e.target.value }))} style={{ width: '100%', marginTop: '0.35rem', padding: '0.6rem', borderRadius: 10, background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>
                            <option value="all">All</option>
                            <option value="Theory">Theory</option>
                            <option value="Lab">Lab</option>
                            <option value="Machine Learning">Machine Learning</option>
                            <option value="Deep Learning">Deep Learning</option>
                            <option value="Programming">Programming</option>
                            <option value="Computer Science">Computer Science</option>
                            <option value="Mathematics">Mathematics</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>

                    <div>
                        <label style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Type</label>
                        <select value={filters.type} onChange={(e) => setFilters(f => ({ ...f, type: e.target.value }))} style={{ width: '100%', marginTop: '0.35rem', padding: '0.6rem', borderRadius: 10, background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>
                            <option value="all">All</option>
                            <option value="pdf">PDF</option>
                            <option value="pptx">Slides</option>
                            <option value="code">Lab Code</option>
                            <option value="note">Notes</option>
                            <option value="link">Links</option>
                        </select>
                    </div>

                    <div>
                        <label style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Week from</label>
                        <input value={filters.weekFrom} onChange={(e) => setFilters(f => ({ ...f, weekFrom: e.target.value }))} placeholder="e.g. 1" style={{ width: '100%', marginTop: '0.35rem', padding: '0.6rem', borderRadius: 10, background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} />
                    </div>

                    <div>
                        <label style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Week to</label>
                        <input value={filters.weekTo} onChange={(e) => setFilters(f => ({ ...f, weekTo: e.target.value }))} placeholder="e.g. 4" style={{ width: '100%', marginTop: '0.35rem', padding: '0.6rem', borderRadius: 10, background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} />
                    </div>

                    <div style={{ gridColumn: 'span 2' }}>
                        <label style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}><Tag size={14} style={{ verticalAlign: 'middle' }} /> Tags (comma separated)</label>
                        <input value={filters.tags} onChange={(e) => setFilters(f => ({ ...f, tags: e.target.value }))} placeholder="graphs, bfs, dfs" style={{ width: '100%', marginTop: '0.35rem', padding: '0.6rem', borderRadius: 10, background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} />
                    </div>

                    <div>
                        <label style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Top K</label>
                        <select value={filters.topK} onChange={(e) => setFilters(f => ({ ...f, topK: e.target.value }))} style={{ width: '100%', marginTop: '0.35rem', padding: '0.6rem', borderRadius: 10, background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>
                            <option value={3}>3</option>
                            <option value={5}>5</option>
                            <option value={8}>8</option>
                            <option value={10}>10</option>
                        </select>
                    </div>
                </div>

                <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center' }}>
                    <button className="btn-primary" onClick={() => runSearch()} disabled={isSearching || !query.trim()}>
                        {isSearching ? <><Loader2 size={18} className="spinning" /> Searching…</> : 'Search'}
                    </button>
                </div>

                {error && (
                    <div style={{ marginTop: '1rem', color: '#fca5a5', textAlign: 'center' }}>
                        {error}
                    </div>
                )}
            </div>

            {/* Results */}
            <div style={{ maxWidth: '980px', margin: '1.5rem auto 0' }}>
                {results.length > 0 && (
                    <div style={{ color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                        Showing top {results.length} matches
                    </div>
                )}

                <div style={{ display: 'grid', gap: '1rem' }}>
                    {results.map((r) => (
                        <div key={r.chunkId} className="glass-panel" style={{ padding: '1.25rem', borderRadius: 'var(--radius-lg)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'start' }}>
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>{r.source.fileName || r.source.title}</div>
                                    <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.15rem' }}>
                                        {r.source.category ? `[${r.source.category}] ` : ''}{r.source.type ? `${String(r.source.type).toUpperCase()}` : ''}
                                        {r.source.week != null && r.source.week !== '' ? ` • Week ${r.source.week}` : ''}
                                        {r.source.topic ? ` • ${r.source.topic}` : ''}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                                    <button className="btn-primary" onClick={() => openOrDownload(r)} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                        <ExternalLink size={16} /> Open
                                    </button>
                                    <button className="btn-secondary" onClick={() => openOrDownload(r, true)} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                        <Download size={16} /> Download
                                    </button>
                                </div>
                            </div>

                            {Array.isArray(r.source.tags) && r.source.tags.length > 0 && (
                                <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                    {r.source.tags.slice(0, 6).map((t) => (
                                        <span key={t} style={{ padding: '0.25rem 0.5rem', border: '1px solid var(--border-color)', borderRadius: 999, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                            {t}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}

                    {!isSearching && results.length === 0 && (
                        <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '1rem' }}>
                            Upload course files in Content Manager, wait for processing, then search here.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Search;
