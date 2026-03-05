import { useParams } from 'react-router-dom';
import {
    ExternalLink,
    Edit,
    RefreshCw,
    Mail,
    Phone,
    MapPin,
    Globe,
    Shield,
    CreditCard,
    Settings,
    Layout as LayoutIcon,
    Palette,
    CheckCircle2,
    XCircle,
    ChevronRight,
    Activity
} from 'lucide-react';
import { useRestaurantDetails } from '../hooks/useRestaurantDetails';
import { RestaurantStatus } from '@restaurant-saas/types';
import { PageHeader } from '../components/ui/PageHeader';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import AddRestaurantModal from '../components/AddRestaurantModal';
import { useState } from 'react';

const statusConfig = {
    [RestaurantStatus.ACTIVE]: { label: 'Active', color: '#22c55e', bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.2)' },
    [RestaurantStatus.TRIAL]: { label: 'Trial', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.2)' },
    [RestaurantStatus.EXPIRED]: { label: 'Expired', color: '#ef4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.2)' },
    [RestaurantStatus.SUSPENDED]: { label: 'Suspended', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.2)' },
};

const StatusPill = ({ status }: { status: RestaurantStatus }) => {
    const cfg = statusConfig[status] || { label: status, color: '#888', bg: 'rgba(136,136,136,0.1)', border: 'rgba(136,136,136,0.2)' };
    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
            borderRadius: '999px', padding: '4px 12px', fontSize: '12px', fontWeight: 700,
            letterSpacing: '0.3px'
        }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.color, display: 'inline-block' }} />
            {cfg.label}
        </span>
    );
};

const SectionHeader = ({ icon: Icon, title, iconColor = 'var(--color-accent-primary)', subtitle }: {
    icon: any; title: string; iconColor?: string; subtitle?: string
}) => (
    <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
            width: 36, height: 36, borderRadius: '10px',
            background: `color-mix(in srgb, ${iconColor} 12%, transparent)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
        }}>
            <Icon size={18} color={iconColor} />
        </div>
        <div>
            <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--color-text-primary)', lineHeight: 1.2 }}>{title}</div>
            {subtitle && <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: 2 }}>{subtitle}</div>}
        </div>
    </div>
);

const InfoRow = ({ icon: Icon, label, value, mono = false }: { icon: any; label: string; value: string; mono?: boolean }) => (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        <div style={{
            width: 34, height: 34, borderRadius: '8px', flexShrink: 0, marginTop: 2,
            background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
            <Icon size={15} color="var(--color-accent-primary)" />
        </div>
        <div>
            <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--color-text-muted)', marginBottom: 3 }}>{label}</div>
            <div style={{ fontSize: '14px', color: 'var(--color-text-primary)', fontWeight: 500, fontFamily: mono ? 'monospace' : undefined }}>{value}</div>
        </div>
    </div>
);

const KeyField = ({ label, value, masked = false }: { label: string; value: string | undefined; masked?: boolean }) => (
    <div style={{
        padding: '12px 14px', background: 'var(--color-bg-tertiary)',
        borderRadius: '10px', border: '1px solid var(--color-border)'
    }}>
        <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--color-text-muted)', marginBottom: 5 }}>{label}</div>
        <div style={{ fontSize: '12px', fontFamily: 'monospace', color: value ? 'var(--color-text-primary)' : 'var(--color-text-muted)' }}>
            {value ? (masked ? '••••••••••••••••' : value) : 'Not configured'}
        </div>
    </div>
);

export default function RestaurantDetails() {
    const { id } = useParams();
    const { restaurant, loading, error, refresh } = useRestaurantDetails(id);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400, flexDirection: 'column', gap: 16 }}>
            <RefreshCw className="animate-spin" size={28} color="var(--color-accent-primary)" />
            <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>Loading restaurant…</span>
        </div>
    );

    if (error) return (
        <div style={{ margin: 24, padding: 32, borderRadius: 16, background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)', textAlign: 'center' }}>
            <XCircle size={32} color="#ef4444" style={{ marginBottom: 12 }} />
            <div style={{ color: '#ef4444', fontWeight: 600, marginBottom: 12 }}>Failed to load restaurant</div>
            <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: 20 }}>{error}</div>
            <Button onClick={refresh}>Try Again</Button>
        </div>
    );

    if (!restaurant) return (
        <div style={{ padding: 32, textAlign: 'center', color: 'var(--color-text-muted)' }}>Restaurant not found</div>
    );

    return (
        <div className="page-content animate-fadeIn" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

            {/* Page Header */}
            <PageHeader title={restaurant.name} />

            {/* Identity Bar */}
            <div style={{
                background: 'var(--color-bg-card)', border: '1px solid var(--color-border)',
                borderRadius: 16, padding: '20px 24px',
                display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap'
            }}>
                {/* Avatar */}
                <div style={{
                    width: 56, height: 56, borderRadius: 14, flexShrink: 0,
                    background: 'var(--color-accent-gradient)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 22, fontWeight: 800, color: 'var(--color-on-accent)',
                    boxShadow: '0 4px 16px rgba(217,181,80,0.3)'
                }}>
                    {restaurant.name.charAt(0)}
                </div>

                {/* Name + slug */}
                <div style={{ flex: 1, minWidth: 160 }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-text-primary)', lineHeight: 1.2 }}>{restaurant.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 3, fontFamily: 'monospace' }}>/{restaurant.slug}</div>
                </div>

                {/* Divider */}
                <div style={{ width: 1, height: 40, background: 'var(--color-border)', flexShrink: 0 }} />

                {/* Status */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center' }}>
                    <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--color-text-muted)' }}>Status</div>
                    <StatusPill status={restaurant.status} />
                </div>

                <div style={{ width: 1, height: 40, background: 'var(--color-border)', flexShrink: 0 }} />

                {/* Plan */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center' }}>
                    <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--color-text-muted)' }}>Plan</div>
                    <span style={{
                        background: 'rgba(217,181,80,0.1)', color: 'var(--color-accent-primary)',
                        border: '1px solid rgba(217,181,80,0.25)', borderRadius: 999,
                        padding: '4px 12px', fontSize: 11, fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase'
                    }}>
                        {restaurant.subscriptionType || 'QR Menu'}
                    </span>
                </div>

                <div style={{ width: 1, height: 40, background: 'var(--color-border)', flexShrink: 0 }} />

                {/* Joined */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div>
                        <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--color-text-muted)' }}>Joined</div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>{new Date(restaurant.createdAt).toLocaleDateString()}</div>
                    </div>
                </div>

                <div style={{ width: 1, height: 40, background: 'var(--color-border)', flexShrink: 0 }} />

                {/* Actions moved from header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <a
                        href={`https://${restaurant.slug}.tablekard.com`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-secondary shadow-sm hover:shadow-md transition-all"
                        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', textDecoration: 'none', fontSize: 13, fontWeight: 600 }}
                    >
                        <ExternalLink size={15} />
                        Preview Website
                    </a>
                    <Button
                        className="flex items-center gap-2 shadow-premium"
                        style={{ padding: '10px 22px' }}
                        onClick={() => setIsEditModalOpen(true)}
                    >
                        <Edit size={15} />
                        <span style={{ fontWeight: 700, fontSize: 13 }}>Edit Details</span>
                    </Button>
                </div>
            </div>

            {/* Edit Modal */}
            {isEditModalOpen && restaurant && (
                <AddRestaurantModal
                    restaurant={restaurant}
                    onClose={() => setIsEditModalOpen(false)}
                    onSuccess={() => {
                        refresh();
                        setIsEditModalOpen(false);
                    }}
                />
            )}

            {/* Main Content Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 340px', gap: 20, alignItems: 'start' }}>

                {/* Contact Info */}
                <div style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: 16, overflow: 'hidden' }}>
                    <SectionHeader icon={Mail} title="Contact Information" subtitle="How to reach this restaurant" />
                    <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
                        <InfoRow icon={Mail} label="Email Address" value={restaurant.contact?.email || 'Not provided'} />
                        <div style={{ height: 1, background: 'var(--color-border)' }} />
                        <InfoRow icon={Phone} label="Phone Number" value={restaurant.contact?.phone || 'Not provided'} />
                        <div style={{ height: 1, background: 'var(--color-border)' }} />
                        <InfoRow icon={MapPin} label="Physical Address" value={restaurant.contact?.address || 'Not provided'} />
                        {restaurant.location?.latitude && (
                            <>
                                <div style={{ height: 1, background: 'var(--color-border)' }} />
                                <InfoRow icon={Globe} label="Coordinates" value={`${restaurant.location.latitude}, ${restaurant.location.longitude}`} mono />
                                <div style={{
                                    padding: '8px 12px', borderRadius: 8,
                                    background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)',
                                    fontSize: 11, color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 6
                                }}>
                                    <Activity size={11} />
                                    Allowed radius: <strong style={{ color: 'var(--color-text-secondary)' }}>{restaurant.location.allowedRadius}m</strong>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Branding */}
                <div style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: 16, overflow: 'hidden' }}>
                    <SectionHeader icon={Palette} title="Branding & Visuals" subtitle="Logo and color identity" />
                    <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
                        {/* Logo */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                            <div style={{
                                width: 72, height: 72, borderRadius: 16, flexShrink: 0,
                                background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden'
                            }}>
                                {restaurant.branding?.logoUrl
                                    ? <img src={restaurant.branding.logoUrl as string} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    : <LayoutIcon size={28} color="var(--color-text-muted)" style={{ opacity: 0.3 }} />
                                }
                            </div>
                            <div>
                                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>
                                    {restaurant.branding?.logoUrl ? 'Custom logo' : 'No logo uploaded'}
                                </div>
                                {restaurant.branding?.logoUrl && (
                                    <div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginTop: 4, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'monospace' }}>
                                        {restaurant.branding.logoUrl}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div style={{ height: 1, background: 'var(--color-border)' }} />

                        {/* Color swatches */}
                        <div>
                            <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--color-text-muted)', marginBottom: 12 }}>Brand Colors</div>
                            <div style={{ display: 'flex', gap: 10 }}>
                                {[
                                    { label: 'Primary', color: restaurant.branding?.primaryColor || '#d9b550' },
                                    { label: 'Secondary', color: restaurant.branding?.secondaryColor || '#121212' }
                                ].map(({ label, color }) => (
                                    <div key={label} style={{
                                        flex: 1, padding: '12px', borderRadius: 12,
                                        background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)',
                                        display: 'flex', alignItems: 'center', gap: 10
                                    }}>
                                        <div style={{
                                            width: 32, height: 32, borderRadius: 8,
                                            background: color, flexShrink: 0,
                                            boxShadow: `0 2px 8px ${color}55`, border: '1px solid rgba(255,255,255,0.1)'
                                        }} />
                                        <div>
                                            <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
                                            <div style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--color-text-primary)', marginTop: 1 }}>{color}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right sidebar: Security + Subscription stacked */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                    {/* Security & API */}
                    <div style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: 16, overflow: 'hidden' }}>
                        <SectionHeader icon={Shield} title="Security & API" iconColor="#22c55e" />
                        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                                <CreditCard size={12} /> Razorpay Integration
                            </div>
                            <KeyField label="Key ID" value={restaurant.settings?.razorpayKeyId ? 'rzp_live_configured' : undefined} />
                            <KeyField label="Key Secret" value={restaurant.settings?.razorpayKeySecret} masked />

                            <div style={{ height: 1, background: 'var(--color-border)', margin: '4px 0' }} />

                            <div style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                padding: '10px 14px', borderRadius: 10,
                                background: restaurant.settings?.allowPayAtCounter ? 'rgba(34,197,94,0.06)' : 'var(--color-bg-tertiary)',
                                border: `1px solid ${restaurant.settings?.allowPayAtCounter ? 'rgba(34,197,94,0.2)' : 'var(--color-border)'}`
                            }}>
                                <div>
                                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-primary)' }}>Counter Payments</div>
                                    <div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginTop: 2 }}>Pay at cashier/counter</div>
                                </div>
                                {restaurant.settings?.allowPayAtCounter
                                    ? <CheckCircle2 size={18} color="#22c55e" />
                                    : <XCircle size={18} color="var(--color-text-muted)" />
                                }
                            </div>
                        </div>
                    </div>

                    {/* Subscription */}
                    <div style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: 16, overflow: 'hidden' }}>
                        <SectionHeader icon={CreditCard} title="Subscription" iconColor="#3b82f6" />
                        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: 14,
                                padding: '14px', borderRadius: 12,
                                background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)'
                            }}>
                                <div style={{
                                    width: 40, height: 40, borderRadius: 10,
                                    background: 'rgba(59,130,246,0.1)', flexShrink: 0,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                    <Settings size={18} color="#3b82f6" />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-primary)' }}>{restaurant.subscriptionType || 'Monthly Base Plan'}</div>
                                    <div style={{ fontSize: 10, color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px', marginTop: 2 }}>Current Tier</div>
                                </div>
                                <StatusPill status={restaurant.subscriptionStatus ? RestaurantStatus.ACTIVE : RestaurantStatus.EXPIRED} />
                            </div>

                            <button style={{
                                width: '100%', padding: '9px 0', borderRadius: 10,
                                background: 'transparent', border: '1px solid var(--color-border)',
                                color: 'var(--color-text-secondary)', fontSize: 12, fontWeight: 600,
                                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
                            }}>
                                Manage Subscription <ChevronRight size={13} />
                            </button>
                        </div>
                    </div>

                    {/* Analytics placeholder */}
                    <div style={{
                        borderRadius: 16, border: '1px dashed rgba(217,181,80,0.3)',
                        background: 'rgba(217,181,80,0.04)', padding: '24px 20px', textAlign: 'center'
                    }}>
                        <div style={{
                            width: 44, height: 44, borderRadius: '50%', margin: '0 auto 12px',
                            background: 'rgba(217,181,80,0.12)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <Activity size={20} color="var(--color-accent-primary)" />
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-accent-primary)', marginBottom: 6 }}>Analytics Coming Soon</div>
                        <div style={{ fontSize: 11, color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
                            Live performance data will appear once this restaurant starts processing orders.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
