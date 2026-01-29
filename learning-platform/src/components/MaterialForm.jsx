
import React, { useState } from 'react';
import { addMaterial } from '../services/api';
import './MaterialForm.css';

const MaterialForm = ({ onMaterialAdded }) => {
    const [formData, setFormData] = useState({
        title: '',
        type: 'slide',
        category: 'theory',
        link: '',
        week: '',
        topic: '',
        tags: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const tagsArray = formData.tags.split(',').map(tag => tag.trim()).filter(t => t);
            await addMaterial({ ...formData, tags: tagsArray });

            // Reset form
            setFormData({
                title: '',
                type: 'slide',
                category: 'theory',
                link: '',
                week: '',
                topic: '',
                tags: '',
            });

            if (onMaterialAdded) onMaterialAdded();
            alert('Material added successfully!');
        } catch (err) {
            setError(err.message || 'Failed to add material. Is the backend running?');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="material-form-container">
            <h3>Add New Content</h3>
            {error && <div className="error-message">{error}</div>}
            <form onSubmit={handleSubmit} className="material-form">
                <div className="form-group">
                    <label>Title</label>
                    <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        required
                        placeholder="e.g. Introduction to React"
                    />
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label>Type</label>
                        <select name="type" value={formData.type} onChange={handleChange}>
                            <option value="slide">Slide</option>
                            <option value="pdf">PDF</option>
                            <option value="code">Code</option>
                            <option value="note">Note</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Category</label>
                        <select name="category" value={formData.category} onChange={handleChange}>
                            <option value="theory">Theory</option>
                            <option value="lab">Lab</option>
                        </select>
                    </div>
                </div>

                <div className="form-group">
                    <label>Link / Path</label>
                    <input
                        type="text"
                        name="link"
                        value={formData.link}
                        onChange={handleChange}
                        required
                        placeholder="https://... or path/to/file"
                    />
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label>Week</label>
                        <input
                            type="text"
                            name="week"
                            value={formData.week}
                            onChange={handleChange}
                            placeholder="e.g. Week 1"
                        />
                    </div>
                    <div className="form-group">
                        <label>Topic</label>
                        <input
                            type="text"
                            name="topic"
                            value={formData.topic}
                            onChange={handleChange}
                            placeholder="e.g. Frontend"
                        />
                    </div>
                </div>

                <div className="form-group">
                    <label>Tags (comma separated)</label>
                    <input
                        type="text"
                        name="tags"
                        value={formData.tags}
                        onChange={handleChange}
                        placeholder="react, javascript, ui"
                    />
                </div>

                <button type="submit" className="submit-btn" disabled={loading}>
                    {loading ? 'Adding...' : 'Add Material'}
                </button>
            </form>
        </div>
    );
};

export default MaterialForm;
