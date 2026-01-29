
import React, { useEffect, useState } from 'react';
import { fetchMaterials } from '../services/api';
import './MaterialList.css';
import { BookOpen, Code, FileText, MonitorPlay } from 'lucide-react';

const MaterialList = ({ refreshTrigger }) => {
    const [materials, setMaterials] = useState([]);
    const [filter, setFilter] = useState('all'); // all, theory, lab
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadMaterials();
    }, [refreshTrigger, filter]);

    const loadMaterials = async () => {
        setLoading(true);
        try {
            const category = filter === 'all' ? null : filter;
            const data = await fetchMaterials(category);
            setMaterials(data);
        } catch (error) {
            console.error("Failed to load materials");
        } finally {
            setLoading(false);
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case 'slide': return <MonitorPlay size={20} className="icon-slide" />;
            case 'pdf': return <FileText size={20} className="icon-pdf" />;
            case 'code': return <Code size={20} className="icon-code" />;
            case 'note': return <BookOpen size={20} className="icon-note" />;
            default: return <FileText size={20} />;
        }
    };

    return (
        <div className="material-list-container">
            <div className="list-header">
                <h3>Library</h3>
                <div className="filter-tabs">
                    <button
                        className={filter === 'all' ? 'active' : ''}
                        onClick={() => setFilter('all')}
                    >All</button>
                    <button
                        className={filter === 'theory' ? 'active' : ''}
                        onClick={() => setFilter('theory')}
                    >Theory</button>
                    <button
                        className={filter === 'lab' ? 'active' : ''}
                        onClick={() => setFilter('lab')}
                    >Lab</button>
                </div>
            </div>

            {loading ? (
                <div className="loading">Loading materials...</div>
            ) : materials.length === 0 ? (
                <div className="empty-state">No materials found. Add some content to get started!</div>
            ) : (
                <div className="materials-grid">
                    {materials.map((item) => (
                        <div key={item._id} className="material-card">
                            <div className="card-icon">{getIcon(item.type)}</div>
                            <div className="card-content">
                                <h4>{item.title}</h4>
                                <div className="card-meta">
                                    <span className={`badge ${item.category}`}>{item.category}</span>
                                    {item.week && <span className="meta-text">{item.week}</span>}
                                </div>
                                <div className="card-tags">
                                    {item.tags.map((tag, idx) => (
                                        <span key={idx} className="tag">#{tag}</span>
                                    ))}
                                </div>
                                <a href={item.link} target="_blank" rel="noopener noreferrer" className="card-link">
                                    Open Resource
                                </a>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MaterialList;
