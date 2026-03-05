import { useParams } from 'react-router-dom';
import { ExternalLink, Edit, RefreshCw } from 'lucide-react';
import { useRestaurantDetails } from '../hooks/useRestaurantDetails';
import { RestaurantStatus } from '@restaurant-saas/types';
import { PageHeader } from '../components/ui/PageHeader';
import { Button } from '../components/ui/Button';

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
            <PageHeader
                title={restaurant.name}
                actions={
                    <div className="flex items-center gap-sm">
                        <Button variant="ghost" onClick={refresh}>
                            <RefreshCw size={18} />
                        </Button>
                        <a
                            href={`/r/${restaurant.slug}`}
                            className="btn btn-secondary flex items-center gap-2"
                            style={{ textDecoration: 'none' }}
                        >
                            <ExternalLink size={18} />
                            Preview QR Menu
                        </a>
                        <Button variant="primary" className="flex items-center gap-2">
                            <Edit size={18} />
                            Edit
                        </Button>
                    </div>
                }
            />

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

                    {/* Stats Card */}
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
            </div>
        </>
    );
}
