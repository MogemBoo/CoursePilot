import React, { useState, useEffect } from 'react';
import { Layers, CheckCircle, Clock, AlertCircle, TrendingUp, Users, Search, Loader2 } from 'lucide-react';
import './Dashboard.css';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const Dashboard = () => {
    const [stats, setStats] = useState({
        totalMaterials: 0,
        processedMaterials: 0,
        processingMaterials: 0,
        errorMaterials: 0,
        queriesToday: 0,
        activeUsers: 0
    });
    const [isLoading, setIsLoading] = useState(true);
    const [recentActivity, setRecentActivity] = useState([]);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        setIsLoading(true);
        try {
            // Fetch stats from API
            const [statsRes, activityRes] = await Promise.all([
                fetch(`${API_BASE_URL}/api/dashboard/stats`),
                fetch(`${API_BASE_URL}/api/dashboard/activity`)
            ]);

            if (statsRes.ok) {
                const statsData = await statsRes.json();
                setStats(statsData);
            }

            if (activityRes.ok) {
                const activityData = await activityRes.json();
                setRecentActivity(activityData);
            }
        } catch (err) {
            console.log('Dashboard API not connected. Stats will appear once backend is ready.');
        } finally {
            setIsLoading(false);
        }
    };

    const statCards = [
        { 
            label: 'Total Materials', 
            value: stats.totalMaterials, 
            icon: Layers, 
            color: 'cyan' 
        },
        { 
            label: 'Processed', 
            value: stats.processedMaterials, 
            icon: CheckCircle, 
            color: 'green' 
        },
        { 
            label: 'Processing', 
            value: stats.processingMaterials, 
            icon: Clock, 
            color: 'yellow' 
        },
        { 
            label: 'Errors', 
            value: stats.errorMaterials, 
            icon: AlertCircle, 
            color: 'red' 
        }
    ];

    return (
        <div className="page-container dashboard-page">
            <div className="dashboard-header">
                <h1 className="gradient-text">Dashboard</h1>
                <p className="dashboard-subtitle">System overview and analytics</p>
            </div>

            {/* Stats Grid */}
            <div className="stats-grid">
                {statCards.map((stat, index) => (
                    <div key={index} className={`stat-card glass-panel ${stat.color}`}>
                        <div className="stat-icon-wrapper">
                            <stat.icon size={24} />
                        </div>
                        <div className="stat-info">
                            <span className="stat-value">
                                {isLoading ? <Loader2 size={24} className="spinning" /> : stat.value}
                            </span>
                            <span className="stat-label">{stat.label}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Secondary Stats */}
            <div className="secondary-stats">
                <div className="stat-card glass-panel wide">
                    <div className="stat-icon-wrapper magenta">
                        <Search size={24} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">
                            {isLoading ? <Loader2 size={24} className="spinning" /> : stats.queriesToday}
                        </span>
                        <span className="stat-label">Queries Today</span>
                    </div>
                </div>
                <div className="stat-card glass-panel wide">
                    <div className="stat-icon-wrapper cyan">
                        <Users size={24} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">
                            {isLoading ? <Loader2 size={24} className="spinning" /> : stats.activeUsers}
                        </span>
                        <span className="stat-label">Active Users</span>
                    </div>
                </div>
            </div>

            {/* Recent Activity */}
            <div className="activity-section glass-panel">
                <h2>Recent Activity</h2>
                {isLoading ? (
                    <div className="activity-loading">
                        <Loader2 size={32} className="spinning" />
                        <p>Loading activity...</p>
                    </div>
                ) : recentActivity.length === 0 ? (
                    <div className="activity-empty">
                        <p>No recent activity. Upload some content to get started.</p>
                    </div>
                ) : (
                    <div className="activity-list">
                        {recentActivity.map((activity, index) => (
                            <div key={index} className="activity-item">
                                <span className="activity-type">{activity.type}</span>
                                <span className="activity-description">{activity.description}</span>
                                <span className="activity-time">{activity.time}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
