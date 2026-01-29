import React, { useState, useEffect } from 'react';
import { FileText, MessageSquare, Users, Sparkles, Loader2 } from 'lucide-react';

const API_BASE = 'http://localhost:5000';

const Dashboard = () => {
    const [stats, setStats] = useState({
        totalMaterials: 0,
        queriesToday: 0,
        activeUsers: 0,
        totalGeneratedContent: 0,
        totalChatSessions: 0
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchDashboardStats();
        // Refresh stats every 30 seconds
        const interval = setInterval(fetchDashboardStats, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchDashboardStats = async () => {
        try {
            const response = await fetch(`${API_BASE}/api/dashboard/stats`);
            if (!response.ok) throw new Error('Failed to fetch dashboard stats');
            const data = await response.json();
            setStats(data);
            setError(null);
        } catch (err) {
            console.error('Dashboard stats error:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="page-container">
                <div style={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center', 
                    minHeight: '50vh',
                    flexDirection: 'column',
                    gap: '1rem'
                }}>
                    <Loader2 size={48} className="spinning" style={{ color: 'var(--accent-primary)' }} />
                    <p style={{ color: 'var(--text-secondary)' }}>Loading dashboard statistics...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="page-container">
            <h1 className="gradient-text" style={{ fontSize: '2.5rem', marginBottom: '2rem' }}>
                Dashboard
            </h1>

            {error && (
                <div className="glass-panel" style={{ 
                    padding: '1rem', 
                    marginBottom: '1.5rem',
                    border: '2px solid rgba(239, 68, 68, 0.5)',
                    background: 'rgba(239, 68, 68, 0.1)'
                }}>
                    <p style={{ color: '#ef4444' }}>⚠️ Error loading stats: {error}</p>
                </div>
            )}

            <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
                gap: '1.5rem',
                marginBottom: '2rem'
            }}>
                <div className="glass-panel" style={{ 
                    padding: '1.5rem', 
                    borderRadius: 'var(--radius-md)',
                    position: 'relative',
                    overflow: 'hidden',
                    border: '2px solid rgba(0, 245, 255, 0.3)',
                    boxShadow: '0 0 20px rgba(0, 245, 255, 0.2)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                        <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: 'var(--radius-md)',
                            background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 0 15px rgba(0, 245, 255, 0.5)'
                        }}>
                            <FileText size={24} color="white" />
                        </div>
                        <h3 style={{ 
                            color: 'var(--text-secondary)', 
                            margin: 0,
                            textTransform: 'uppercase',
                            letterSpacing: '1px',
                            fontSize: '0.85rem'
                        }}>
                            Total Materials
                        </h3>
                    </div>
                    <p style={{ 
                        fontSize: '2.5rem', 
                        fontWeight: '700', 
                        color: 'var(--accent-primary)',
                        margin: 0,
                        textShadow: '0 0 10px rgba(0, 245, 255, 0.5)'
                    }}>
                        {stats.totalMaterials}
                    </p>
                </div>

                <div className="glass-panel" style={{ 
                    padding: '1.5rem', 
                    borderRadius: 'var(--radius-md)',
                    position: 'relative',
                    overflow: 'hidden',
                    border: '2px solid rgba(255, 0, 255, 0.3)',
                    boxShadow: '0 0 20px rgba(255, 0, 255, 0.2)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                        <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: 'var(--radius-md)',
                            background: 'linear-gradient(135deg, var(--accent-secondary), #ff00ff)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 0 15px rgba(255, 0, 255, 0.5)'
                        }}>
                            <MessageSquare size={24} color="white" />
                        </div>
                        <h3 style={{ 
                            color: 'var(--text-secondary)', 
                            margin: 0,
                            textTransform: 'uppercase',
                            letterSpacing: '1px',
                            fontSize: '0.85rem'
                        }}>
                            Queries Today
                        </h3>
                    </div>
                    <p style={{ 
                        fontSize: '2.5rem', 
                        fontWeight: '700', 
                        color: 'var(--accent-secondary)',
                        margin: 0,
                        textShadow: '0 0 10px rgba(255, 0, 255, 0.5)'
                    }}>
                        {stats.queriesToday}
                    </p>
                </div>

                <div className="glass-panel" style={{ 
                    padding: '1.5rem', 
                    borderRadius: 'var(--radius-md)',
                    position: 'relative',
                    overflow: 'hidden',
                    border: '2px solid rgba(0, 255, 65, 0.3)',
                    boxShadow: '0 0 20px rgba(0, 255, 65, 0.2)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                        <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: 'var(--radius-md)',
                            background: 'linear-gradient(135deg, var(--accent-tertiary), #00ff41)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 0 15px rgba(0, 255, 65, 0.5)'
                        }}>
                            <Users size={24} color="white" />
                        </div>
                        <h3 style={{ 
                            color: 'var(--text-secondary)', 
                            margin: 0,
                            textTransform: 'uppercase',
                            letterSpacing: '1px',
                            fontSize: '0.85rem'
                        }}>
                            Active Users
                        </h3>
                    </div>
                    <p style={{ 
                        fontSize: '2.5rem', 
                        fontWeight: '700', 
                        color: 'var(--accent-tertiary)',
                        margin: 0,
                        textShadow: '0 0 10px rgba(0, 255, 65, 0.5)'
                    }}>
                        {stats.activeUsers}
                    </p>
                </div>
            </div>

            {/* Additional Stats Row */}
            <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
                gap: '1.5rem'
            }}>
                <div className="glass-panel" style={{ 
                    padding: '1.25rem', 
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid rgba(0, 245, 255, 0.2)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                        <Sparkles size={20} color="var(--accent-primary)" />
                        <h4 style={{ 
                            color: 'var(--text-secondary)', 
                            margin: 0,
                            fontSize: '0.9rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                        }}>
                            Generated Content
                        </h4>
                    </div>
                    <p style={{ 
                        fontSize: '1.75rem', 
                        fontWeight: '700', 
                        color: 'var(--text-primary)',
                        margin: 0
                    }}>
                        {stats.totalGeneratedContent}
                    </p>
                </div>

                <div className="glass-panel" style={{ 
                    padding: '1.25rem', 
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid rgba(0, 245, 255, 0.2)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                        <MessageSquare size={20} color="var(--accent-secondary)" />
                        <h4 style={{ 
                            color: 'var(--text-secondary)', 
                            margin: 0,
                            fontSize: '0.9rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                        }}>
                            Chat Sessions
                        </h4>
                    </div>
                    <p style={{ 
                        fontSize: '1.75rem', 
                        fontWeight: '700', 
                        color: 'var(--text-primary)',
                        margin: 0
                    }}>
                        {stats.totalChatSessions}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
