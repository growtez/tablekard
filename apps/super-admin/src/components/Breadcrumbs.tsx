import { ChevronRight, ArrowLeft } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { usePageHeader } from '../context/PageHeaderContext';

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
    const navigate = useNavigate();
    const { header } = usePageHeader();
    const pathnames = location.pathname.split('/').filter((x) => x);

    if (pathnames.length === 0 || pathnames[0] === 'dashboard') {
        return null; // Don't show breadcrumbs on the dashboard or root
    }

    // Show back button if we are in a sub-page (e.g., /restaurants/123)
    const canGoBack = pathnames.length > 1;
    const parentPath = `/${pathnames.slice(0, -1).join('/')}`;
    const parentLabel = breadcrumbMap[pathnames[pathnames.length - 2]] || 'List';

    return (
        <div className="flex items-center gap-4">
            {canGoBack && (
                <button
                    onClick={() => navigate(parentPath)}
                    className="btn btn-ghost border border-[var(--color-border)] flex items-center gap-2 px-4 py-2 text-sm font-semibold hover:bg-[var(--color-bg-tertiary)] transition-all shrink-0"
                >
                    <ArrowLeft size={16} />

                </button>
            )}
            <nav className="breadcrumbs bg-[var(--color-bg-tertiary)]/30 p-2 rounded-lg inline-block" aria-label="breadcrumb">
                <ol className="flex items-center text-[13px] uppercase tracking-wide font-semibold">
                    <li className="flex items-center">
                        <Link to="/" className="text-[var(--color-text-muted)] hover:text-[var(--color-accent-primary)] transition-colors">
                            Home
                        </Link>
                    </li>
                    {pathnames.map((value, index) => {
                        const isLast = index === pathnames.length - 1;
                        const to = `/${pathnames.slice(0, index + 1).join('/')}`;

                        // Use header title for the last segment if it's available and we're on a detail page
                        let label = breadcrumbMap[value] || value;
                        if (isLast && header?.title && (typeof header.title === 'string')) {
                            label = header.title;
                        }

                        // If it's a numeric ID and we don't have a label from the map or header, hide it
                        const isNumericId = !isNaN(Number(value)) && !breadcrumbMap[value];
                        if (isNumericId && !header?.title) {
                            return null;
                        }

                        return (
                            <li key={to} className="flex items-center">
                                <ChevronRight size={10} className="mx-2 text-[var(--color-text-muted)] opacity-50" />
                                {isLast ? (
                                    <span className="text-[var(--color-accent-primary)]" aria-current="page">
                                        {label}
                                    </span>
                                ) : (
                                    <Link to={to} className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors">
                                        {label}
                                    </Link>
                                )}
                            </li>
                        );
                    })}
                </ol>
            </nav>
        </div>
    );
}
