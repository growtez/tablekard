import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

// Simple breadcrumb mapping for MVP, could be dynamic later
const breadcrumbMap: Record<string, string> = {
    'dashboard': 'Dashboard',
    'restaurants': 'Restaurants',
    'pending': 'Pending Approvals',
    'users': 'Users',
    'roles': 'Roles & Permissions',
    'subscriptions': 'Subscriptions Overview',
    'billing': 'Billing',
    'transactions': 'Transactions & Refunds',
    'plans': 'Pricing Plans',
    'support': 'Support',
    'complaints': 'Complaints & Disputes',
    'reviews': 'Reviews Moderation',
    'announcements': 'Announcements',
    'settings': 'Settings',
    'general': 'General Settings',
    'integrations': 'Integrations & API',
    'security': 'Security & Backups',
    'email': 'Email Templates',
};

export default function Breadcrumbs() {
    const location = useLocation();
    const pathnames = location.pathname.split('/').filter((x) => x);

    if (pathnames.length === 0 || pathnames[0] === 'dashboard') {
        return null; // Don't show breadcrumbs on the dashboard or root
    }

    return (
        <nav className="breadcrumbs" aria-label="breadcrumb">
            <ol className="flex items-center space-x-2 text-sm text-gray-400">
                <li>
                    <Link to="/" className="hover:text-white transition-colors">Home</Link>
                </li>
                {pathnames.map((value, index) => {
                    const isLast = index === pathnames.length - 1;
                    const to = `/${pathnames.slice(0, index + 1).join('/')}`;
                    const label = breadcrumbMap[value] || value; // Fallback to raw path if not mapped

                    return (
                        <li key={to} className="flex items-center">
                            <ChevronRight size={14} className="mx-2 text-gray-500" />
                            {isLast ? (
                                <span className="text-white font-medium" aria-current="page">
                                    {label}
                                </span>
                            ) : (
                                <Link to={to} className="hover:text-white transition-colors">
                                    {label}
                                </Link>
                            )}
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
}
