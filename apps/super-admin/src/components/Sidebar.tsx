import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Store,
    CreditCard,
    Settings,
    Users,
    LogOut,
    ChevronDown,
    ChevronRight,
    Headphones // Replaced Headset with Headphones or similar if Headset is missing
} from 'lucide-react';

type NavItem = {
    path?: string;
    icon: any;
    label: string;
    subItems?: { path: string; label: string }[];
};

const navItems: NavItem[] = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    {
        icon: Store,
        label: 'Restaurants',
        subItems: [
            { path: '/restaurants', label: 'All Restaurants' },
            { path: '/restaurants/pending', label: 'Pending Approvals' },
        ]
    },
    {
        icon: Users,
        label: 'Users',
        subItems: [
            { path: '/users', label: 'All Users' },
            { path: '/users/roles', label: 'Roles & Permissions' },
        ]
    },
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

const NavItemComponent = ({ item, collapsed }: { item: NavItem, collapsed: boolean }) => {
    const location = useLocation();

    // Check if any subitem is active to keep accordion open
    const isSubItemActive = item.subItems?.some(sub => location.pathname.startsWith(sub.path));
    const [isOpen, setIsOpen] = useState(isSubItemActive || false);

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
            to={item.path!}
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

export default function Sidebar({ collapsed = false }: { collapsed?: boolean }) {
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


        </aside>
    );
}
