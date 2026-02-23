import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    Store,
    CreditCard,
    Settings,
    Users,
    BarChart3,
    Bell,
    HelpCircle,
    LogOut
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const navItems = [
    {
        section: 'Overview',
        items: [
            { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
            { path: '/restaurants', icon: Store, label: 'Restaurants' },
            { path: '/subscriptions', icon: CreditCard, label: 'Subscriptions' },
        ]
    },
    {
        section: 'Analytics',
        items: [
            { path: '/analytics', icon: BarChart3, label: 'Reports' },
            { path: '/users', icon: Users, label: 'Users' },
        ]
    },
    {
        section: 'System',
        items: [
            { path: '/notifications', icon: Bell, label: 'Notifications' },
            { path: '/settings', icon: Settings, label: 'Settings' },
            { path: '/help', icon: HelpCircle, label: 'Help & Docs' },
        ]
    }
];

export default function Sidebar() {
    const { signOut, userProfile } = useAuth();

    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <div className="sidebar-logo">
                    <div className="sidebar-logo-icon">🍽️</div>
                    <span className="sidebar-logo-text">Restaurant SaaS</span>
                </div>
            </div>

            <nav className="sidebar-nav">
                {navItems.map((section) => (
                    <div key={section.section} className="nav-section">
                        <div className="nav-section-title">{section.section}</div>
                        {section.items.map((item) => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                className={({ isActive }) =>
                                    `nav-item ${isActive ? 'active' : ''}`
                                }
                            >
                                <item.icon className="nav-item-icon" />
                                <span>{item.label}</span>
                            </NavLink>
                        ))}
                    </div>
                ))}
            </nav>

            <div style={{ padding: '1rem', borderTop: '1px solid var(--color-border)', marginTop: 'auto' }}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-sm">
                        <div style={{
                            width: 36,
                            height: 36,
                            borderRadius: '50%',
                            background: 'var(--color-accent-gradient)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.875rem',
                            fontWeight: 600
                        }}>
                            {userProfile?.name?.charAt(0) || 'A'}
                        </div>
                        <div>
                            <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>{userProfile?.name || 'Admin'}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {userProfile?.email}
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={() => signOut()}
                        className="btn btn-ghost"
                        title="Logout"
                        style={{ padding: '8px', minWidth: 'auto' }}
                    >
                        <LogOut size={18} />
                    </button>
                </div>
            </div>
        </aside>
    );
}
