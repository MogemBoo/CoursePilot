import React from 'react';
import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    Search,
    MessageSquare,
    BookOpen,
    Settings,
    BrainCircuit
} from 'lucide-react';
import './Sidebar.css';

const Sidebar = () => {
    const navItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
        { icon: Search, label: 'Semantic Search', path: '/search' },
        { icon: MessageSquare, label: 'AI Chat', path: '/chat' },
        { icon: BookOpen, label: 'Content Manager', path: '/cms' },
        { icon: BrainCircuit, label: 'Content Factory', path: '/content-factory', indent: true },
    ];

    return (
        <aside className="sidebar glass-panel">
            <div className="sidebar-header">
                <h1 className="logo-text">Course<span className="logo-accent">Pilot</span></h1>
            </div>

            <nav className="sidebar-nav">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        style={item.indent ? { marginLeft: '1.5rem', fontSize: '0.95em' } : {}}
                        className={({ isActive }) =>
                            `nav-item ${isActive ? 'active' : ''}`
                        }
                    >
                        <item.icon size={item.indent ? 18 : 20} />
                        <span>{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            <div className="sidebar-footer">
                <NavLink to="/login" style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div className="user-profile">
                        <div className="avatar">AD</div>
                        <div className="user-info">
                            <p className="name">Admin User</p>
                            <p className="role" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Sign Out</p>
                        </div>
                        <Settings size={18} className="settings-icon" />
                    </div>
                </NavLink>
            </div>
        </aside>
    );
};

export default Sidebar;
