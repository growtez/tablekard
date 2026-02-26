import { useState } from 'react';
import { Plus, ExternalLink, RefreshCw, Mail, Phone, Calendar } from 'lucide-react';
import { useRestaurants } from '../hooks/useRestaurants';
import { Restaurant, RestaurantStatus } from '@restaurant-saas/types';
import { DataTable, Column } from '../components/DataTable';
import { SlideOver } from '../components/SlideOver';
import { TableSkeleton } from '../components/Skeleton';
import AddRestaurantModal from '../components/AddRestaurantModal';
import toast from 'react-hot-toast';

const getStatusBadge = (status: RestaurantStatus) => {
    switch (status) {
        case RestaurantStatus.ACTIVE:
            return <span className="badge success">Active</span>;
        case RestaurantStatus.TRIAL:
            return <span className="badge info">Trial</span>;
        case RestaurantStatus.EXPIRED:
            return <span className="badge error">Expired</span>;
        case RestaurantStatus.SUSPENDED:
            return <span className="badge warning">Suspended</span>;
        default:
            return <span className="badge">{status}</span>;
    }
};

const planBadge = (
    <span className="badge" style={{ background: 'var(--color-bg-tertiary)', color: 'var(--color-accent-primary)', border: '1px solid var(--color-border)' }}>
        QR Only
    </span>
);

export default function Restaurants() {
    const { restaurants, loading, error, actions } = useRestaurants();
    const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
    const [isSlideOverOpen, setIsSlideOverOpen] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    const handleRowAction = (action: string, row: Restaurant) => {
        if (action === 'view') {
            setSelectedRestaurant(row);
            setIsSlideOverOpen(true);
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
            cell: ({ row }) => (
                <div>
                    <div className="font-medium text-[var(--color-text-primary)]">{row.name}</div>
                    <div className="text-xs text-[var(--color-text-muted)]">{row.slug}</div>
                </div>
            )
        },
        {
            header: 'Plan',
            accessorKey: 'plan',
            cell: () => planBadge,
            enableSorting: false
        },
        {
            header: 'Status',
            accessorKey: 'status',
            cell: ({ getValue }) => getStatusBadge(getValue())
        },
        {
            header: 'Contact',
            accessorKey: 'contact',
            cell: ({ row }) => (
                <div>
                    <div className="text-sm font-medium">{row.contact?.email || 'N/A'}</div>
                    <div className="text-xs text-[var(--color-text-muted)]">{row.contact?.phone || 'N/A'}</div>
                </div>
            ),
            enableSorting: false
        },
        {
            header: 'Created',
            accessorKey: 'createdAt',
            cell: ({ getValue }) => {
                const date = getValue();
                return date ? new Date(date).toLocaleDateString() : 'N/A';
            }
        },
        {
            header: 'Links',
            accessorKey: 'links',
            cell: ({ row }) => (
                <a
                    href={`/r/${row.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 rounded hover:bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)] hover:text-[var(--color-accent-primary)] transition-colors inline-block"
                    title="Preview QR Menu"
                    onClick={(e) => e.stopPropagation()}
                >
                    <ExternalLink size={16} />
                </a>
            ),
            enableSorting: false
        }
    ];

    const rowActions = [
        { label: 'View Details', value: 'view' },
        { label: 'Edit Restaurant', value: 'edit' },
        { label: 'Suspend Account', value: 'suspend', destructive: true }
    ];

    if (error) {
        return (
            <div className="p-8 text-center bg-[var(--color-bg-card)] rounded-xl border border-red-500/20 m-6">
                <div className="text-red-500 mb-4 font-medium">Error loading restaurants: {error}</div>
                <button onClick={actions.refresh} className="btn btn-primary">Try Again</button>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6 animate-fadeIn">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--color-text-primary)] mb-1">Restaurants</h1>
                    <p className="text-sm text-[var(--color-text-secondary)]">
                        Manage all registered restaurants on your platform
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        className="btn-icon bg-[var(--color-bg-tertiary)] hover:bg-[var(--color-bg-hover)]"
                        onClick={actions.refresh}
                        title="Refresh Data"
                    >
                        <RefreshCw size={18} className={loading ? 'animate-spin text-[var(--color-accent-primary)]' : 'text-[var(--color-text-secondary)]'} />
                    </button>
                    <button
                        className="btn btn-primary shadow-lg shadow-black/20 flex items-center gap-2"
                        onClick={() => setIsAddModalOpen(true)}
                    >
                        <Plus size={18} />
                        <span>Add Restaurant</span>
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="card shadow-lg shadow-black/40 overflow-hidden border border-[var(--color-border)]">
                {loading ? (
                    <TableSkeleton rows={5} columns={6} />
                ) : (
                    <DataTable
                        data={restaurants}
                        columns={columns}
                        searchPlaceholder="Search by name, slug, or email..."
                        actions={rowActions}
                        onRowAction={handleRowAction}
                    />
                )}
            </div>

            {/* Restaurant Details Drawer */}
            <SlideOver
                isOpen={isSlideOverOpen}
                onClose={() => {
                    setIsSlideOverOpen(false);
                    setTimeout(() => setSelectedRestaurant(null), 300); // Clear after animation
                }}
                title="Restaurant Details"
                width="max-w-md"
                footer={
                    <>
                        <button
                            className="btn btn-ghost border border-[var(--color-border)] text-sm"
                            onClick={() => setIsSlideOverOpen(false)}
                        >
                            Close
                        </button>
                        <button className="btn btn-primary text-sm shadow-md">
                            Edit Configurations
                        </button>
                    </>
                }
            >
                {selectedRestaurant ? (
                    <div className="space-y-6">
                        {/* Header Profile */}
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-xl bg-[var(--color-accent-gradient)] flex items-center justify-center text-2xl font-bold text-[var(--color-on-accent)] shadow-glow">
                                {selectedRestaurant.name.charAt(0)}
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-[var(--color-text-primary)] mb-1">
                                    {selectedRestaurant.name}
                                </h3>
                                <div className="text-sm border border-[var(--color-border)] bg-[var(--color-bg-tertiary)] px-2 py-0.5 rounded text-[var(--color-text-secondary)] inline-block">
                                    /{selectedRestaurant.slug}
                                </div>
                            </div>
                        </div>

                        {/* Status & Plan Details */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-[var(--color-bg-tertiary)] p-4 rounded-xl border border-[var(--color-border)]">
                                <div className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider mb-2 font-semibold">Status</div>
                                <div>{getStatusBadge(selectedRestaurant.status)}</div>
                            </div>
                            <div className="bg-[var(--color-bg-tertiary)] p-4 rounded-xl border border-[var(--color-border)]">
                                <div className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider mb-2 font-semibold">Plan Tier</div>
                                <div>{planBadge}</div>
                            </div>
                        </div>

                        {/* Contact Information */}
                        <div className="space-y-4">
                            <h4 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-text-muted)] border-b border-[var(--color-border)] pb-2">
                                Contact Information
                            </h4>
                            <div className="space-y-3">
                                <div className="flex items-center gap-3 text-sm">
                                    <div className="w-8 h-8 rounded-full bg-[var(--color-bg-tertiary)] flex items-center justify-center text-[var(--color-accent-primary)]">
                                        <Mail size={16} />
                                    </div>
                                    <div>
                                        <div className="text-[var(--color-text-muted)] text-xs">Email Address</div>
                                        <div className="text-[var(--color-text-primary)] font-medium">
                                            {selectedRestaurant.contact?.email || 'No email provided'}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                    <div className="w-8 h-8 rounded-full bg-[var(--color-bg-tertiary)] flex items-center justify-center text-[var(--color-accent-primary)]">
                                        <Phone size={16} />
                                    </div>
                                    <div>
                                        <div className="text-[var(--color-text-muted)] text-xs">Phone Number</div>
                                        <div className="text-[var(--color-text-primary)] font-medium">
                                            {selectedRestaurant.contact?.phone || 'No phone provided'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* System Information */}
                        <div className="space-y-4">
                            <h4 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-text-muted)] border-b border-[var(--color-border)] pb-2">
                                System Information
                            </h4>
                            <div className="space-y-3">
                                <div className="flex items-center gap-3 text-sm">
                                    <div className="w-8 h-8 rounded-full bg-[var(--color-bg-tertiary)] flex items-center justify-center text-[var(--color-text-secondary)]">
                                        <Calendar size={16} />
                                    </div>
                                    <div>
                                        <div className="text-[var(--color-text-muted)] text-xs">Creation Date</div>
                                        <div className="text-[var(--color-text-primary)] font-medium">
                                            {selectedRestaurant.createdAt ? new Date(selectedRestaurant.createdAt).toLocaleString() : 'Unknown'}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] mt-2">
                                    <div className="text-sm">
                                        <div className="text-[var(--color-text-muted)] text-xs">Restaurant ID</div>
                                        <div className="text-[var(--color-text-primary)] font-mono text-xs mt-1">{selectedRestaurant.id}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-full text-[var(--color-text-muted)]">
                        No restaurant selected
                    </div>
                )}
            </SlideOver>

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
