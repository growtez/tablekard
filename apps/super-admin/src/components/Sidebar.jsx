import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Store,
    CreditCard,
    // Settings,
    Users,
    ChevronDown,
    ChevronRight,
    // Headphones,
    LogOut,
    Menu,
    FileText,
    Layers,
    Inbox
} from 'lucide-react';

const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/restaurants', icon: Store, label: 'Restaurants' },
    { path: '/users', icon: Users, label: 'Users' },
    { path: '/subscriptions', icon: CreditCard, label: 'Subscriptions' },
    { path: '/billing/transactions', icon: FileText, label: 'Transactions' },
    { path: '/billing/plans', icon: Layers, label: 'Pricing Plans' },
    { path: '/leads', icon: Inbox, label: 'Landing Leads' },
    // {
    //     icon: Headphones,
    //     label: 'Support',
    //     subItems: [
    //         { path: '/support/complaints', label: 'Complaints & Disputes' },
    //         { path: '/support/reviews', label: 'Reviews Moderation' },
    //         { path: '/support/announcements', label: 'Announcements' },
    //     ]
    // },
    // {
    //     icon: Settings,
    //     label: 'Settings',
    //     subItems: [
    //         { path: '/settings/general', label: 'General Settings' },
    //         { path: '/settings/integrations', label: 'Integrations & API' },
    //         { path: '/settings/security', label: 'Security & Backups' },
    //         { path: '/settings/email', label: 'Email Templates' },
    //     ]
    // }
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
                    className={`w-full flex items-center justify-between px-3 py-2.5 text-[14px] font-medium rounded-lg mb-1 transition-colors ${isSubItemActive ? 'bg-sidebar-hover text-sidebar-text' : 'text-sidebar-text-muted bg-transparent hover:bg-sidebar-hover hover:text-sidebar-text'}`}
                    onClick={() => setIsOpen(!isOpen)}
                >
                    <div className="flex items-center gap-3">
                        <item.icon className="w-5 h-5 shrink-0" />
                        {!collapsed && <span>{item.label}</span>}
                    </div>
                    {!collapsed && (
                        isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />
                    )}
                </button>
                {isOpen && !collapsed && (
                    <div className="flex flex-col pl-7 mt-0.5 ml-5 border-l border-sidebar-border">
                        {item.subItems.map((sub, idx) => (
                            <NavLink
                                key={idx}
                                to={sub.path}
                                className={({ isActive }) =>
                                    `px-3 py-2 text-[13px] rounded transition-colors mb-0.5 block ${isActive ? 'text-sidebar-accent font-semibold bg-[#A0D9B4]/15' : 'text-sidebar-text-muted hover:text-sidebar-text hover:bg-sidebar-hover'}`
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
                `w-full flex items-center gap-3 px-3 py-2.5 text-[14px] font-medium rounded-lg mb-1 transition-colors ${isActive ? 'bg-sidebar-accent text-[#1A202C] border border-sidebar-accent font-semibold' : 'text-sidebar-text-muted bg-transparent hover:bg-sidebar-hover hover:text-sidebar-text'}`
            }
            title={collapsed ? item.label : undefined}
        >
            <item.icon className="w-5 h-5 shrink-0" />
            {!collapsed && <span>{item.label}</span>}
        </NavLink>
    );
};

export default function Sidebar({ collapsed: isLocked = true, setCollapsed: setIsLocked, session, onLogout, mobileOpen = false, setMobileOpen }) {
    const [isHovered, setIsHovered] = useState(false);
    const effectiveCollapsed = isLocked && !isHovered && !mobileOpen;

    return (
        <aside
            className={`fixed top-0 left-0 h-screen flex flex-col bg-sidebar-bg border-r border-sidebar-border z-50 transition-all duration-300 ${effectiveCollapsed ? 'w-[80px]' : 'w-[260px]'} ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className={`border-b border-sidebar-border ${effectiveCollapsed ? 'py-6 px-0' : 'p-6 pb-5'}`}>
                <div className={`flex items-center w-full ${effectiveCollapsed ? 'justify-center gap-0' : 'justify-start gap-3'}`}>
                    <button
                        className={`p-2 rounded-lg flex items-center justify-center transition-colors ${!isLocked ? 'bg-accent-primary/10 text-accent-primary border border-accent-primary/10' : 'bg-surface-hover hover:bg-border text-text-muted'}`}
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsLocked(!isLocked);
                        }}
                        title={isLocked ? "Lock Sidebar Open" : "Unlock Sidebar (Hover Mode)"}
                    >
                        <Menu size={20} />
                    </button>
                    <div className="flex items-center">
                        {!effectiveCollapsed && <span className="text-xl font-extrabold bg-gradient-to-br from-white to-sidebar-text-muted text-transparent bg-clip-text tracking-tight font-poppins">TableKard</span>}
                    </div>
                </div>
            </div>

            <nav className="flex-1 overflow-y-auto px-2 mt-4">
                {navItems.map((item, idx) => (
                    <NavItemComponent key={idx} item={item} collapsed={effectiveCollapsed} />
                ))}
            </nav>

            <div className={`mt-auto border-t border-sidebar-border flex flex-col gap-4 ${effectiveCollapsed ? 'py-5 items-center' : 'p-5'}`}>
                <div className={`flex items-center gap-3 p-2 w-full overflow-hidden ${effectiveCollapsed ? 'justify-center p-0' : ''}`}>
                    <div className="w-9 h-9 rounded-lg bg-accent-primary/15 text-accent-primary flex items-center justify-center font-bold text-sm border border-accent-primary/15 shrink-0">
                        {session?.user?.email?.[0]?.toUpperCase() || 'A'}
                    </div>
                    {!effectiveCollapsed && (
                        <div className="flex flex-col min-w-0 flex-1">
                            <span className="text-[13px] text-sidebar-text font-semibold truncate block w-full">{session?.user?.email}</span>
                            <span className="text-[11px] text-sidebar-text-muted">Super Admin</span>
                        </div>
                    )}
                </div>

                <button className="flex items-center gap-3 px-3 py-2.5 w-full bg-transparent border-none rounded-lg text-sidebar-text-muted text-sm font-medium transition-colors hover:bg-red-500/10 hover:text-red-400 cursor-pointer" onClick={onLogout} title="Logout">
                    <LogOut size={20} className={effectiveCollapsed ? 'mx-auto' : ''} />
                    {!effectiveCollapsed && <span>Logout</span>}
                </button>
            </div>
        </aside>
    );
}
