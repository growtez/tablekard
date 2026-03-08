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
    LogOut,
    Menu
} from 'lucide-react';

const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/restaurants', icon: Store, label: 'Restaurants' },
    { path: '/users', icon: Users, label: 'Users' },
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

export default function Sidebar({ collapsed: isLocked = true, setCollapsed: setIsLocked, session, onLogout }) {
    const [isHovered, setIsHovered] = useState(false);
    const effectiveCollapsed = isLocked && !isHovered;

    return (
        <aside
            className={`sidebar ${effectiveCollapsed ? 'collapsed' : ''} ${!isLocked && !isHovered ? 'locked-open' : ''}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className="sidebar-header" style={{ padding: effectiveCollapsed ? '1.5rem 0' : '1.5rem 1.25rem' }}>
                <div className="sidebar-logo-container flex items-center w-full" style={{ gap: effectiveCollapsed ? '0' : '0.75rem', justifyContent: effectiveCollapsed ? 'center' : 'flex-start' }}>
                    <button
                        className={`sidebar-toggle-btn ${!isLocked ? 'active' : ''}`}
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsLocked(!isLocked);
                        }}
                        title={isLocked ? "Lock Sidebar Open" : "Unlock Sidebar (Hover Mode)"}
                    >
                        <Menu size={20} />
                    </button>
                    <div className="sidebar-logo flex items-center">
                        {!effectiveCollapsed && <span className="sidebar-logo-text" style={{ fontSize: '1.25rem', fontWeight: 800, background: 'linear-gradient(135deg, white 0%, var(--text-muted) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.02em' }}>TableKard</span>}
                    </div>
                </div>
            </div>

            <nav className="sidebar-nav">
                {navItems.map((item, idx) => (
                    <NavItemComponent key={idx} item={item} collapsed={effectiveCollapsed} />
                ))}
            </nav>

            <div className="sidebar-footer">
                <div className="sidebar-user">
                    <div className="sidebar-user-avatar">
                        {session?.user?.email?.[0]?.toUpperCase() || 'A'}
                    </div>
                    {!effectiveCollapsed && (
                        <div className="sidebar-user-info">
                            <span className="sidebar-user-email">{session?.user?.email}</span>
                            <span className="sidebar-user-role">Super Admin</span>
                        </div>
                    )}
                </div>

                <button className="sidebar-logout-btn" onClick={onLogout} title="Logout">
                    <LogOut size={20} />
                    {!effectiveCollapsed && <span>Logout</span>}
                </button>
            </div>
        </aside>
    );
}
