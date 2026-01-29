import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    Upload,
    FileText,
    Code,
    Presentation,
    FileCode,
    Trash2,
    Eye,
    Search,
    Filter,
    CheckCircle,
    Clock,
    AlertCircle,
    X,
    FolderOpen,
    Tag,
    Calendar,
    FileType,
    Layers,
    RefreshCw,
    Download,
    ChevronDown,
    Plus,
    Loader2
} from 'lucide-react';
import './CMS.css';

// API Configuration - Update these when connecting to backend
const API_CONFIG = {
    BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
    ENDPOINTS: {
        UPLOAD: '/upload',
        LIST: '/api/files',
        DELETE: '/api/files',
        REPROCESS: '/api/files/reprocess',
        CATEGORIES: '/api/categories'
    }
};

const CMS = () => {
    const fileInputRef = useRef(null);
    const [dragActive, setDragActive] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [uploadFiles, setUploadFiles] = useState([]);
    const [selectedContent, setSelectedContent] = useState(null);
    
    // Loading and error states
    const [isLoading, setIsLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState(null);
    const [uploadProgress, setUploadProgress] = useState({});

    // Content library - will be populated from API
    const [contentLibrary, setContentLibrary] = useState([]);

    // Categories - can be fetched from API or use defaults
    const [categories, setCategories] = useState(['All', 'Machine Learning', 'Deep Learning', 'Programming', 'Computer Science', 'Mathematics', 'Other']);
    const statuses = ['All', 'Processed', 'Processing', 'Error'];

    // Fetch content from API on mount
    useEffect(() => {
        fetchContent();
    }, []);

    // API Functions - Ready for backend integration
    const fetchContent = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.LIST}`);
            if (!response.ok) throw new Error('Failed to fetch content');
            const data = await response.json();
            setContentLibrary(data);
        } catch (err) {
            console.log('API not connected yet. Content will appear once backend is ready.');
            // Keep empty array - no demo data
            setContentLibrary([]);
        } finally {
            setIsLoading(false);
        }
    };

    const uploadToServer = async (file, metadata) => {
        const formData = new FormData();
        formData.append('file', file.file);
        formData.append('fileType', metadata.fileType || 'Theory');
        formData.append('category', metadata.category || 'General');
        formData.append('tags', JSON.stringify(metadata.tags || []));
        formData.append('description', metadata.description || '');

        const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.UPLOAD}`, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            throw new Error(`Upload failed: ${response.statusText}`);
        }

        return await response.json();
    };

    const deleteFromServer = async (id) => {
        const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.DELETE}/${id}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            throw new Error(`Delete failed: ${response.statusText}`);
        }

        return await response.json();
    };

    const reprocessContent = async (id) => {
        const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.REPROCESS}/${id}`, {
            method: 'POST',
        });

        if (!response.ok) {
            throw new Error(`Reprocess failed: ${response.statusText}`);
        }

        return await response.json();
    };

    const getFileIcon = (type) => {
        switch (type) {
            case 'pdf': return <FileText size={24} />;
            case 'pptx': return <Presentation size={24} />;
            case 'code': return <Code size={24} />;
            case 'markdown': return <FileCode size={24} />;
            default: return <FileText size={24} />;
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'processed':
                return <span className="status-badge status-success"><CheckCircle size={14} /> Processed</span>;
            case 'processing':
                return <span className="status-badge status-pending"><Clock size={14} /> Processing</span>;
            case 'error':
                return <span className="status-badge status-error"><AlertCircle size={14} /> Error</span>;
            default:
                return null;
        }
    };

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFiles(e.dataTransfer.files);
        }
    };

    const handleFiles = (files) => {
        const newFiles = Array.from(files).map((file, index) => ({
            id: Date.now() + index,
            file,
            name: file.name,
            size: formatFileSize(file.size),
            type: getFileType(file.name),
            category: '',
            tags: [],
            description: '',
            progress: 0
        }));
        setUploadFiles([...uploadFiles, ...newFiles]);
        setShowUploadModal(true);
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const getFileType = (filename) => {
        const ext = filename.split('.').pop().toLowerCase();
        if (ext === 'pdf') return 'pdf';
        if (['pptx', 'ppt'].includes(ext)) return 'pptx';
        if (['py', 'js', 'java', 'cpp', 'c', 'ts'].includes(ext)) return 'code';
        if (['md', 'markdown'].includes(ext)) return 'markdown';
        return 'other';
    };

    const removeUploadFile = (id) => {
        setUploadFiles(uploadFiles.filter(f => f.id !== id));
    };

    const handleUpload = async () => {
        setIsUploading(true);
        setError(null);
        
        const results = [];
        
        for (const file of uploadFiles) {
            try {
                // Update progress for this file
                setUploadProgress(prev => ({ ...prev, [file.id]: 'uploading' }));
                
                const result = await uploadToServer(file, {
                    category: file.category,
                    tags: file.tags,
                    description: file.description
                });
                
                setUploadProgress(prev => ({ ...prev, [file.id]: 'complete' }));
                results.push(result);
            } catch (err) {
                console.error(`Failed to upload ${file.name}:`, err);
                setUploadProgress(prev => ({ ...prev, [file.id]: 'error' }));
                
                // For now, add locally with processing status when API not available
                const localContent = {
                    id: Date.now() + Math.random(),
                    name: file.name,
                    type: file.type,
                    category: file.category || 'Other',
                    tags: file.tags || [],
                    uploadDate: new Date().toISOString().split('T')[0],
                    size: file.size,
                    status: 'processing',
                    chunks: 0,
                    description: file.description || ''
                };
                setContentLibrary(prev => [localContent, ...prev]);
            }
        }
        
        // Refresh content list after upload
        await fetchContent();
        
        setUploadFiles([]);
        setUploadProgress({});
        setShowUploadModal(false);
        setIsUploading(false);
    };

    const filteredContent = contentLibrary.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (item.tags && item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())));
        const matchesCategory = selectedCategory === 'all' || item.category?.toLowerCase() === selectedCategory.toLowerCase();
        const matchesStatus = selectedStatus === 'all' || item.status?.toLowerCase() === selectedStatus.toLowerCase();
        return matchesSearch && matchesCategory && matchesStatus;
    });

    const deleteContent = async (id) => {
        try {
            await deleteFromServer(id);
            setContentLibrary(contentLibrary.filter(item => item.id !== id));
            if (selectedContent?.id === id) {
                setSelectedContent(null);
            }
        } catch (err) {
            console.error('Failed to delete:', err);
            // Remove locally anyway for now
            setContentLibrary(contentLibrary.filter(item => item.id !== id));
            if (selectedContent?.id === id) {
                setSelectedContent(null);
            }
        }
    };

    const handleReprocess = async (id) => {
        try {
            await reprocessContent(id);
            // Update local state
            setContentLibrary(prev => prev.map(item => 
                item.id === id ? { ...item, status: 'processing' } : item
            ));
        } catch (err) {
            console.error('Failed to reprocess:', err);
        }
    };

    const handleSync = async () => {
        await fetchContent();
    };

    return (
        <div className="page-container cms-page">
            <div className="cms-header">
                <div>
                    <h1 className="gradient-text">Content Management</h1>
                    <p className="cms-subtitle">Upload, organize, and manage your learning materials</p>
                </div>
                <div className="cms-header-actions">
                    <button className="btn-secondary" onClick={handleSync} disabled={isLoading}>
                        <RefreshCw size={18} className={isLoading ? 'spinning' : ''} /> {isLoading ? 'Syncing...' : 'Sync'}
                    </button>
                    <button className="btn-primary" onClick={() => fileInputRef.current?.click()}>
                        <Plus size={18} /> Upload Content
                    </button>
                </div>
            </div>

            {/* Upload Zone */}
            <div
                className={`upload-zone glass-panel ${dragActive ? 'drag-active' : ''}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".pdf,.pptx,.ppt,.py,.js,.java,.cpp,.c,.ts,.md,.markdown"
                    onChange={(e) => handleFiles(e.target.files)}
                    style={{ display: 'none' }}
                />
                <div className="upload-icon-wrapper">
                    <Upload size={48} />
                </div>
                <h3>Drag & Drop files here</h3>
                <p>or click to browse your computer</p>
                <div className="supported-formats">
                    <span><FileText size={16} /> PDF</span>
                    <span><Presentation size={16} /> PPTX</span>
                    <span><Code size={16} /> Code</span>
                    <span><FileCode size={16} /> Markdown</span>
                </div>
            </div>

            {/* Statistics Bar */}
            <div className="stats-bar">
                <div className="stat-item glass-panel">
                    <Layers size={24} className="stat-icon" />
                    <div>
                        <span className="stat-value">{contentLibrary.length}</span>
                        <span className="stat-label">Total Files</span>
                    </div>
                </div>
                <div className="stat-item glass-panel">
                    <CheckCircle size={24} className="stat-icon success" />
                    <div>
                        <span className="stat-value">{contentLibrary.filter(c => c.status === 'processed').length}</span>
                        <span className="stat-label">Processed</span>
                    </div>
                </div>
                <div className="stat-item glass-panel">
                    <Clock size={24} className="stat-icon pending" />
                    <div>
                        <span className="stat-value">{contentLibrary.filter(c => c.status === 'processing').length}</span>
                        <span className="stat-label">Processing</span>
                    </div>
                </div>
                <div className="stat-item glass-panel">
                    <AlertCircle size={24} className="stat-icon error" />
                    <div>
                        <span className="stat-value">{contentLibrary.filter(c => c.status === 'error').length}</span>
                        <span className="stat-label">Errors</span>
                    </div>
                </div>
            </div>

            {/* Content Library */}
            <div className="content-library-section">
                <div className="library-header">
                    <h2><FolderOpen size={24} /> Content Library</h2>
                    <div className="library-controls">
                        <div className="search-box">
                            <Search size={18} />
                            <input
                                type="text"
                                placeholder="Search files or tags..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="filter-dropdown">
                            <Filter size={18} />
                            <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                            >
                                {categories.map(cat => (
                                    <option key={cat} value={cat.toLowerCase()}>{cat}</option>
                                ))}
                            </select>
                            <ChevronDown size={16} />
                        </div>
                        <div className="filter-dropdown">
                            <select
                                value={selectedStatus}
                                onChange={(e) => setSelectedStatus(e.target.value)}
                            >
                                {statuses.map(status => (
                                    <option key={status} value={status.toLowerCase()}>{status}</option>
                                ))}
                            </select>
                            <ChevronDown size={16} />
                        </div>
                    </div>
                </div>

                <div className="content-grid-wrapper">
                    <div className={`content-grid ${selectedContent ? 'with-details' : ''}`}>
                        {isLoading ? (
                            <div className="empty-state glass-panel">
                                <Loader2 size={48} className="spinning" />
                                <h3>Loading content...</h3>
                                <p>Please wait while we fetch your content library.</p>
                            </div>
                        ) : filteredContent.length === 0 ? (
                            <div className="empty-state glass-panel">
                                <FolderOpen size={64} />
                                <h3>{contentLibrary.length === 0 ? 'No content yet' : 'No matching content'}</h3>
                                <p>{contentLibrary.length === 0 
                                    ? 'Use the upload zone above to add your learning materials.'
                                    : 'Try adjusting your search or filters.'}
                                </p>
                            </div>
                        ) : (
                            filteredContent.map(item => (
                                <div
                                    key={item.id}
                                    className={`content-card glass-panel ${selectedContent?.id === item.id ? 'selected' : ''}`}
                                    onClick={() => setSelectedContent(item)}
                                >
                                    <div className="card-header">
                                        <div className={`file-icon ${item.type}`}>
                                            {getFileIcon(item.type)}
                                        </div>
                                        <div className="card-actions">
                                            <button className="icon-btn" onClick={(e) => { e.stopPropagation(); }}>
                                                <Eye size={16} />
                                            </button>
                                            <button className="icon-btn" onClick={(e) => { e.stopPropagation(); }}>
                                                <Download size={16} />
                                            </button>
                                            <button className="icon-btn danger" onClick={(e) => { e.stopPropagation(); deleteContent(item.id); }}>
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                    <h4 className="card-title">{item.name}</h4>
                                    <div className="card-meta">
                                        <span><Calendar size={14} /> {item.uploadDate}</span>
                                        <span><FileType size={14} /> {item.size}</span>
                                    </div>
                                    <div className="card-tags">
                                        {item.tags && item.tags.slice(0, 2).map(tag => (
                                            <span key={tag} className="tag"><Tag size={12} /> {tag}</span>
                                        ))}
                                        {item.tags && item.tags.length > 2 && <span className="tag">+{item.tags.length - 2}</span>}
                                    </div>
                                    <div className="card-footer">
                                        {getStatusBadge(item.status)}
                                        {item.status === 'processed' && (
                                            <span className="chunks-count">{item.chunks} chunks</span>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Details Panel */}
                    {selectedContent && (
                        <div className="details-panel glass-panel">
                            <div className="details-header">
                                <h3>Content Details</h3>
                                <button className="icon-btn" onClick={() => setSelectedContent(null)}>
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="details-content">
                                <div className={`detail-icon ${selectedContent.type}`}>
                                    {getFileIcon(selectedContent.type)}
                                </div>
                                <h4>{selectedContent.name}</h4>
                                {getStatusBadge(selectedContent.status)}

                                <div className="detail-section">
                                    <label>Description</label>
                                    <p>{selectedContent.description || 'No description provided.'}</p>
                                </div>

                                <div className="detail-section">
                                    <label>Category</label>
                                    <span className="category-badge">{selectedContent.category}</span>
                                </div>

                                <div className="detail-section">
                                    <label>Tags</label>
                                    <div className="detail-tags">
                                        {selectedContent.tags && selectedContent.tags.length > 0 ? (
                                            selectedContent.tags.map(tag => (
                                                <span key={tag} className="tag"><Tag size={12} /> {tag}</span>
                                            ))
                                        ) : (
                                            <span className="no-tags">No tags added</span>
                                        )}
                                    </div>
                                </div>

                                <div className="detail-grid">
                                    <div className="detail-item">
                                        <label>Upload Date</label>
                                        <span>{selectedContent.uploadDate}</span>
                                    </div>
                                    <div className="detail-item">
                                        <label>File Size</label>
                                        <span>{selectedContent.size}</span>
                                    </div>
                                    <div className="detail-item">
                                        <label>File Type</label>
                                        <span className="type-badge">{selectedContent.type.toUpperCase()}</span>
                                    </div>
                                    <div className="detail-item">
                                        <label>Chunks Created</label>
                                        <span>{selectedContent.chunks}</span>
                                    </div>
                                </div>

                                <div className="detail-actions">
                                    <button className="btn-secondary">
                                        <Eye size={16} /> Preview
                                    </button>
                                    <button className="btn-secondary" onClick={() => handleReprocess(selectedContent.id)}>
                                        <RefreshCw size={16} /> Reprocess
                                    </button>
                                    <button className="btn-danger" onClick={() => deleteContent(selectedContent.id)}>
                                        <Trash2 size={16} /> Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Upload Modal */}
            {showUploadModal && uploadFiles.length > 0 && (
                <div className="modal-overlay" onClick={() => setShowUploadModal(false)}>
                    <div className="upload-modal glass-panel" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3><Upload size={24} /> Upload Files</h3>
                            <button className="icon-btn" onClick={() => setShowUploadModal(false)}>
                                <X size={24} />
                            </button>
                        </div>
                        <div className="modal-content">
                            {uploadFiles.map(file => (
                                <div key={file.id} className="upload-file-item">
                                    <div className="file-info">
                                        <div className={`file-icon ${file.type}`}>
                                            {getFileIcon(file.type)}
                                        </div>
                                        <div>
                                            <h4>{file.name}</h4>
                                            <span>{file.size}</span>
                                        </div>
                                    </div>
                                    <div className="file-meta-inputs">
                                        <select
                                            value={file.category}
                                            onChange={(e) => {
                                                const updated = uploadFiles.map(f =>
                                                    f.id === file.id ? { ...f, category: e.target.value } : f
                                                );
                                                setUploadFiles(updated);
                                            }}
                                        >
                                            <option value="">Select Category</option>
                                            {categories.slice(1).map(cat => (
                                                <option key={cat} value={cat}>{cat}</option>
                                            ))}
                                        </select>
                                        <input
                                            type="text"
                                            placeholder="Add tags (comma separated)"
                                            onChange={(e) => {
                                                const tags = e.target.value.split(',').map(t => t.trim()).filter(t => t);
                                                const updated = uploadFiles.map(f =>
                                                    f.id === file.id ? { ...f, tags } : f
                                                );
                                                setUploadFiles(updated);
                                            }}
                                        />
                                    </div>
                                    <button className="icon-btn danger" onClick={() => removeUploadFile(file.id)}>
                                        <X size={18} />
                                    </button>
                                </div>
                            ))}
                        </div>
                        <div className="modal-footer">
                            <button className="btn-secondary" onClick={() => setShowUploadModal(false)} disabled={isUploading}>
                                Cancel
                            </button>
                            <button className="btn-primary" onClick={handleUpload} disabled={isUploading}>
                                {isUploading ? (
                                    <><Loader2 size={18} className="spinning" /> Uploading...</>
                                ) : (
                                    <><Upload size={18} /> Upload {uploadFiles.length} file{uploadFiles.length > 1 ? 's' : ''}</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CMS;
