import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Store,
    CreditCard,
    Settings,
    Users,
    ChevronDown,
    ChevronRight,
    Headphones,
    LogOut
} from 'lucide-react';

const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/restaurants', icon: Store, label: 'Restaurants' },
    { path: '/', icon: Users, label: 'Users' }, // Pointed Users back to root for now
    {
        icon: CreditCard,
        label: 'Billing',
        subItems: [
            { path: '/subscriptions', label: 'Subscriptions Overview' },
            { path: '/billing/transactions', label: 'Transactions & Refunds' },
            { path: '/billing/plans', label: 'Pricing Plans' },
        ]
    },
    {
        icon: Headphones,
        label: 'Support',
        subItems: [
            { path: '/support/complaints', label: 'Complaints & Disputes' },
            { path: '/support/reviews', label: 'Reviews Moderation' },
            { path: '/support/announcements', label: 'Announcements' },
        ]
    },
    {
        icon: Settings,
        label: 'Settings',
        subItems: [
            { path: '/settings/general', label: 'General Settings' },
            { path: '/settings/integrations', label: 'Integrations & API' },
            { path: '/settings/security', label: 'Security & Backups' },
            { path: '/settings/email', label: 'Email Templates' },
        ]
    }
];

const NavItemComponent = ({ item, collapsed }) => {
    const location = useLocation();

    // Check if any subitem is active to keep accordion open
    const isSubItemActive = item.subItems?.some(sub => location.pathname.startsWith(sub.path));
    const [isOpen, setIsOpen] = useState(true);

    if (item.subItems) {
        return (
            <div className="nav-item-group">
                <button
                    className={`nav-item ${isSubItemActive ? 'group-active' : ''}`}
                    onClick={() => setIsOpen(!isOpen)}
                >
                    <div className="flex items-center gap-sm">
                        <item.icon className="nav-item-icon" />
                        {!collapsed && <span>{item.label}</span>}
                    </div>
                    {!collapsed && (
                        isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />
                    )}
                </button>
                {isOpen && !collapsed && (
                    <div className="nav-sub-items">
                        {item.subItems.map((sub, idx) => (
                            <NavLink
                                key={idx}
                                to={sub.path}
                                className={({ isActive }) =>
                                    `nav-sub-item ${isActive ? 'active' : ''}`
                                }
                            >
                                {sub.label}
                            </NavLink>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    return (
        <NavLink
            to={item.path}
            className={({ isActive }) =>
                `nav-item ${isActive ? 'active' : ''}`
            }
            title={collapsed ? item.label : undefined}
        >
            <item.icon className="nav-item-icon" />
            {!collapsed && <span>{item.label}</span>}
        </NavLink>
    );
};

export default function Sidebar({ collapsed = false, session, onLogout }) {
    return (
        <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
            <div className="sidebar-header">
                <div className="sidebar-logo">
                    <div className="sidebar-logo-icon flex items-center justify-center">🍣</div>
                    {!collapsed && <span className="sidebar-logo-text">TableKard</span>}
                </div>
            </div>

            <nav className="sidebar-nav">
                {navItems.map((item, idx) => (
                    <NavItemComponent key={idx} item={item} collapsed={collapsed} />
                ))}
            </nav>

            <div className="sidebar-footer">
                <div className="sidebar-user">
                    <div className="sidebar-user-avatar">
                        {session?.user?.email?.[0]?.toUpperCase() || 'A'}
                    </div>
                    {!collapsed && (
                        <div className="sidebar-user-info">
                            <span className="sidebar-user-email">{session?.user?.email}</span>
                            <span className="sidebar-user-role">Super Admin</span>
                        </div>
                    )}
                </div>

                <button className="sidebar-logout-btn" onClick={onLogout} title="Logout">
                    <LogOut size={20} />
                    {!collapsed && <span>Logout</span>}
                </button>
            </div>
        </aside>
    );
}
