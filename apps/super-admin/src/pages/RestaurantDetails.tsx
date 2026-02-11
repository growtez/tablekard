import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Edit, Trash2, RefreshCw } from 'lucide-react';
import { useRestaurantDetails } from '../hooks/useRestaurantDetails';
import { RestaurantStatus } from '@restaurant-saas/types';

const getStatusBadge = (status: RestaurantStatus) => {
    switch (status) {
        case RestaurantStatus.ACTIVE:
            return <span className="badge success">Active</span>;
        case RestaurantStatus.TRIAL:
            return <span className="badge info">Trial</span>;
        case RestaurantStatus.EXPIRED:
            return <span className="badge error">Expired</span>;
        default:
            return <span className="badge">{status}</span>;
    }
};

const planBadge = (
    <span className="badge" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa' }}>
        QR Only
    </span>
);

export default function RestaurantDetails() {
    const { id } = useParams();
    const { restaurant, loading, error, refresh } = useRestaurantDetails(id);

    if (loading) return <div className="p-8 text-center">Loading...</div>;
    if (error) return <div className="p-8 text-center text-red-500">Error: {error}</div>;
    if (!restaurant) return <div className="p-8 text-center">Restaurant not found</div>;

    return (
        <>
            <header className="page-header">
                <Link to="/restaurants" className="flex items-center gap-sm text-secondary" style={{ marginBottom: '0.5rem', textDecoration: 'none' }}>
                    <ArrowLeft size={18} />
                    Back to Restaurants
                </Link>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 600 }}>{restaurant.name}</h1>
                        <p className="text-secondary" style={{ fontSize: '0.875rem' }}>
                            {restaurant.slug}
                        </p>
                    </div>
                    <div className="flex items-center gap-sm">
                        <button className="btn btn-ghost" onClick={refresh}>
                            <RefreshCw size={18} />
                        </button>
                        <a
                            href={`/r/${restaurant.slug}`}
                            className="btn btn-secondary"
                            style={{ textDecoration: 'none' }}
                        >
                            <ExternalLink size={18} />
                            Preview QR Menu
                        </a>
                        <button className="btn btn-primary">
                            <Edit size={18} />
                            Edit
                        </button>
                    </div>
                </div>
            </header>

            <div className="page-content animate-fadeIn">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                    {/* Info Card */}
                    <div className="card">
                        <div className="card-header">
                            <h2 className="card-title">Restaurant Information</h2>
                        </div>
                        <div className="card-content">
                            <div style={{ display: 'grid', gap: '1rem' }}>
                                <div>
                                    <div className="text-muted" style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>Email</div>
                                    <div>{restaurant.contact?.email || 'N/A'}</div>
                                </div>
                                <div>
                                    <div className="text-muted" style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>Phone</div>
                                    <div>{restaurant.contact?.phone || 'N/A'}</div>
                                </div>
                                <div>
                                    <div className="text-muted" style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>Address</div>
                                    <div>{restaurant.contact?.address || 'N/A'}</div>
                                </div>
                                <div>
                                    <div className="text-muted" style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>Created</div>
                                    <div>{restaurant.createdAt ? new Date(restaurant.createdAt).toLocaleDateString() : 'N/A'}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Subscription Card */}
                    <div className="card">
                        <div className="card-header">
                            <h2 className="card-title">Subscription</h2>
                        </div>
                        <div className="card-content">
                            <div style={{ display: 'grid', gap: '1rem' }}>
                                <div>
                                    <div className="text-muted" style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>Plan</div>
                                    <div className="flex">
                                        {planBadge}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-muted" style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>Status</div>
                                    <div className="flex">
                                        {getStatusBadge(restaurant.status)}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-muted" style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>Status Reason</div>
                                    <div>{restaurant.statusReason || 'N/A'}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Stats Card - Mock data for now as we don't have sub-collections aggregations yet */}
                    <div className="card" style={{ gridColumn: 'span 2' }}>
                        <div className="card-header">
                            <h2 className="card-title">Statistics (Coming Soon)</h2>
                        </div>
                        <div className="card-content">
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem' }}>
                                <div>
                                    <div className="text-muted" style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>Tables</div>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>-</div>
                                </div>
                                <div>
                                    <div className="text-muted" style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>Menu Items</div>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>-</div>
                                </div>
                                <div>
                                    <div className="text-muted" style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>Total Orders</div>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>-</div>
                                </div>
                                <div>
                                    <div className="text-muted" style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>Revenue</div>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-success)' }}>-</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Danger Zone */}
                <div className="card" style={{ marginTop: '1.5rem', borderColor: 'var(--color-error)' }}>
                    <div className="card-header" style={{ background: 'rgba(239, 68, 68, 0.1)' }}>
                        <h2 className="card-title" style={{ color: 'var(--color-error)' }}>Danger Zone</h2>
                    </div>
                    <div className="card-content flex items-center justify-between">
                        <div>
                            <div className="font-medium">Delete Restaurant</div>
                            <div className="text-secondary" style={{ fontSize: '0.875rem' }}>
                                Permanently delete this restaurant and all its data
                            </div>
                        </div>
                        <button className="btn" style={{ background: 'var(--color-error)', color: 'white' }}>
                            <Trash2 size={18} />
                            Delete
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
