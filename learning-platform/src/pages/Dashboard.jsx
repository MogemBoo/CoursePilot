import React from 'react';

const Dashboard = () => {
    return (
        <div className="page-container">
            <h1 className="gradient-text" style={{ fontSize: '2.5rem', marginBottom: '2rem' }}>Dashboard</h1>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: 'var(--radius-md)' }}>
                    <h3 style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Total Materials</h3>
                    <p style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-primary)' }}>124</p>
                </div>

                <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: 'var(--radius-md)' }}>
                    <h3 style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Queries Today</h3>
                    <p style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-primary)' }}>48</p>
                </div>

                <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: 'var(--radius-md)' }}>
                    <h3 style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Active Users</h3>
                    <p style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-primary)' }}>12</p>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
