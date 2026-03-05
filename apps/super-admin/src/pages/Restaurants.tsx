import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ExternalLink, RefreshCw, Calendar, Store, Eye, Edit, ShieldAlert } from 'lucide-react';
import { useRestaurants } from '../hooks/useRestaurants';
import { Restaurant, RestaurantStatus } from '@restaurant-saas/types';
import { DataTable, Column } from '../components/DataTable';
import { TableSkeleton } from '../components/Skeleton';
import AddRestaurantModal from '../components/AddRestaurantModal';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { PageHeader } from '../components/ui/PageHeader';
import { StatCard } from '../components/ui/StatCard';
import toast from 'react-hot-toast';

const getStatusBadge = (status: RestaurantStatus) => {
    switch (status) {
        case RestaurantStatus.ACTIVE:
            return <Badge variant="success" className="px-3 py-1 font-semibold">Active</Badge>;
        case RestaurantStatus.TRIAL:
            return <Badge variant="info" className="px-3 py-1 font-semibold">Trial</Badge>;
        case RestaurantStatus.EXPIRED:
            return <Badge variant="error" className="px-3 py-1 font-semibold">Expired</Badge>;
        case RestaurantStatus.SUSPENDED:
            return <Badge variant="warning" className="px-3 py-1 font-semibold">Suspended</Badge>;
        default:
            return <Badge className="px-3 py-1 font-semibold capitalize">{status}</Badge>;
    }
};

const planBadge = (
    <Badge style={{
        background: 'rgba(217, 181, 80, 0.1)',
        color: 'var(--color-accent-primary)',
        border: '1px solid rgba(217, 181, 80, 0.2)',
        fontWeight: 700,
        letterSpacing: '0.8px',
        fontSize: '10px',
        textTransform: 'uppercase',
        padding: '4px 10px'
    }}>
        QR Menu Plan
    </Badge>
);

export default function Restaurants() {
    const { restaurants, loading, error, actions } = useRestaurants();
    const navigate = useNavigate();
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    const handleRowAction = (action: string, row: Restaurant) => {
        if (action === 'view') {
            navigate(`/restaurants/${row.id}`);
        } else if (action === 'edit') {
            toast('Edit feature coming soon!', { icon: '🚧' });
        } else if (action === 'suspend') {
            toast.success(`Suspended ${row.name}`);
            // TODO: Call API to suspend
        }
    };

    const columns: Column<Restaurant>[] = [
        {
            header: 'Restaurant',
            accessorKey: 'name',
            width: '2.5fr',
            cell: ({ row }) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] flex items-center justify-center text-sm font-bold text-[var(--color-accent-primary)] shadow-sm">
                        {row.name.charAt(0)}
                    </div>
                    <div>
                        <div className="font-semibold text-[var(--color-text-primary)]">{row.name}</div>
                        <div className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider font-medium">/{row.slug}</div>
                    </div>
                </div>
            )
        },
        {
            header: 'Plan',
            accessorKey: 'plan',
            width: '160px',
            cell: () => planBadge,
            enableSorting: false
        },
        {
            header: 'Status',
            accessorKey: 'status',
            width: '140px',
            cell: ({ getValue }) => getStatusBadge(getValue())
        },
        {
            header: 'Contact',
            accessorKey: 'contact',
            width: '1.8fr',
            cell: ({ row }) => (
                <div className="flex flex-col gap-0.5">
                    <div className="text-sm font-medium text-[var(--color-text-primary)]">{row.contact?.email || 'N/A'}</div>
                    <div className="text-[11px] text-[var(--color-text-muted)]">{row.contact?.phone || 'N/A'}</div>
                </div>
            ),
            enableSorting: false
        },
        {
            header: 'Created',
            accessorKey: 'createdAt',
            width: '130px',
            cell: ({ getValue }) => {
                const date = getValue();
                return (
                    <div className="text-sm font-medium text-[var(--color-text-secondary)]">
                        {date ? new Date(date).toLocaleDateString() : 'N/A'}
                    </div>
                );
            }
        },
        {
            header: 'Links',
            accessorKey: 'links',
            width: '100px',
            cell: ({ row }) => (
                <a
                    href={`https://${row.slug}.tablekard.com`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl bg-[var(--color-bg-tertiary)] hover:bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)] hover:text-[var(--color-accent-primary)] border border-[var(--color-border)] transition-all shadow-sm hover:shadow-md inline-flex items-center justify-center"
                    title="Preview Website"
                    onClick={(e) => e.stopPropagation()}
                >
                    <ExternalLink size={16} />
                </a>
            ),
            enableSorting: false
        }
    ];

    const rowActions = [
        { label: 'View Details', value: 'view', icon: Eye },
        { label: 'Edit Restaurant', value: 'edit', icon: Edit },
        { label: 'Suspend Account', value: 'suspend', icon: ShieldAlert, destructive: true }
    ];

    if (error) {
        return (
            <div className="p-8 text-center bg-[var(--color-bg-card)] rounded-xl border border-red-500/20 m-6">
                <div className="text-red-500 mb-4 font-medium">Error loading restaurants: {error}</div>
                <Button onClick={actions.refresh}>Try Again</Button>
            </div>
        );
    }

    const statsData = [
        { label: 'Total Restaurants', value: restaurants.length, icon: Store, color: 'purple' },
        { label: 'Active', value: restaurants.filter(r => r.status === RestaurantStatus.ACTIVE).length, icon: Calendar, color: 'green' },
        { label: 'Pending Approval', value: restaurants.filter(r => r.status === 'pending' as any).length, icon: RefreshCw, color: 'orange' },
    ];

    return (
        <div className="page-content space-y-8 animate-fadeIn">
            {/* Header */}
            <PageHeader
                title={<>Platform <span className="text-gradient">Restaurants</span></>}
                actions={
                    <>
                        <Button
                            className="shadow-premium flex items-center gap-2 px-6 py-2.5"
                            onClick={() => setIsAddModalOpen(true)}
                        >
                            <Plus size={20} />
                            <span className="font-semibold">Add Restaurant</span>
                        </Button>
                    </>
                }
            />

            {/* Quick Stats */}
            <div className="stats-grid grid grid-cols-1 md:grid-cols-3 gap-6">
                {statsData.map((stat, i) => (
                    <StatCard
                        key={i}
                        label={stat.label}
                        value={stat.value}
                        icon={stat.icon}
                        color={stat.color}
                    />
                ))}
            </div>

            {/* Main Content */}
            <div className="glass-card shadow-premium overflow-hidden">
                {loading ? (
                    <div className="p-8">
                        <TableSkeleton rows={5} columns={6} />
                    </div>
                ) : (
                    <DataTable
                        title="Restaurant Management"
                        data={restaurants}
                        columns={columns}
                        searchPlaceholder="Search by name, slug, or email..."
                        actions={rowActions}
                        onRowAction={handleRowAction}
                        className="w-full"
                    />
                )}
            </div>

            {/* Add Restaurant Modal */}
            {isAddModalOpen && (
                <AddRestaurantModal
                    onClose={() => setIsAddModalOpen(false)}
                    onSuccess={() => {
                        actions.refresh();
                        toast.success('Restaurant added successfully!');
                    }}
                />
            )}
        </div>
    );
}
