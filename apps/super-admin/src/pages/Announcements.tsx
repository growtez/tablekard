import { useState } from 'react';
import {
    Megaphone,
    Calendar,
    Clock,
    Send,
    Eye,
    Edit,
    Trash2,
    Plus,
    RefreshCw,
    Search,
    Filter,
    Bell,
    Mail,
    MessageSquare,
    Users,
    Store,
    CheckCircle,
    AlertCircle,
    XCircle,
    Zap,
    Target,
    Globe,
    Smartphone
} from 'lucide-react';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { PageHeader } from '../components/ui/PageHeader';
import { StatCard } from '../components/ui/StatCard';
import { Card, CardHeader, CardTitle } from '../components/ui/Card';

// Static Data
const announcements = [
    {
        id: 'ANN-001',
        title: 'Platform Maintenance Scheduled',
        content: 'We will be performing scheduled maintenance on our platform this weekend. Services may be temporarily unavailable from 2 AM to 6 AM IST on Sunday, March 10th.',
        type: 'maintenance',
        priority: 'high',
        status: 'scheduled',
        targetAudience: 'all',
        channels: ['email', 'in_app', 'sms'],
        scheduledFor: '2024-03-10T02:00:00Z',
        scheduledUntil: '2024-03-10T06:00:00Z',
        createdAt: '2024-03-05T10:00:00Z',
        createdBy: 'admin_1',
        sentCount: 0,
        openedCount: 0,
        clickedCount: 0
    },
    {
        id: 'ANN-002',
        title: 'New Payment Gateway Integration',
        content: 'We are excited to announce the integration of a new payment gateway supporting UPI, credit cards, and digital wallets. This will provide faster and more reliable payment processing.',
        type: 'feature',
        priority: 'medium',
        status: 'sent',
        targetAudience: 'restaurants',
        channels: ['email', 'in_app'],
        scheduledFor: '2024-03-04T09:00:00Z',
        scheduledUntil: null,
        createdAt: '2024-03-03T15:30:00Z',
        createdBy: 'admin_2',
        sentCount: 156,
        openedCount: 98,
        clickedCount: 45
    },
    {
        id: 'ANN-003',
        title: 'Mobile App Update Available',
        content: 'A new version of our mobile app is now available with enhanced features including real-time order tracking and improved UI. Update now from the App Store or Google Play.',
        type: 'update',
        priority: 'medium',
        status: 'sent',
        targetAudience: 'customers',
        channels: ['email', 'push', 'sms'],
        scheduledFor: '2024-03-01T12:00:00Z',
        scheduledUntil: null,
        createdAt: '2024-02-29T16:45:00Z',
        createdBy: 'admin_1',
        sentCount: 2340,
        openedCount: 1876,
        clickedCount: 892
    },
    {
        id: 'ANN-004',
        title: 'Holiday Pricing Adjustments',
        content: 'During the upcoming holiday season, we will be implementing dynamic pricing adjustments to better manage demand. Please review the updated pricing structure.',
        type: 'policy',
        priority: 'high',
        status: 'draft',
        targetAudience: 'restaurants',
        channels: ['email'],
        scheduledFor: null,
        scheduledUntil: null,
        createdAt: '2024-03-05T14:20:00Z',
        createdBy: 'admin_3',
        sentCount: 0,
        openedCount: 0,
        clickedCount: 0
    },
    {
        id: 'ANN-005',
        title: 'Customer Support Enhancement',
        content: 'We have expanded our customer support team and now offer 24/7 assistance through phone, email, and live chat. Response times have been improved by 40%.',
        type: 'service',
        priority: 'low',
        status: 'sent',
        targetAudience: 'all',
        channels: ['email', 'in_app'],
        scheduledFor: '2024-02-28T11:00:00Z',
        scheduledUntil: null,
        createdAt: '2024-02-27T09:15:00Z',
        createdBy: 'admin_2',
        sentCount: 2847,
        openedCount: 1923,
        clickedCount: 234
    }
];

const metrics = [
    {
        label: 'Total Sent',
        value: '5,543',
        change: '+18%',
        positive: true,
        icon: Send,
        color: 'blue'
    },
    {
        label: 'Open Rate',
        value: '68.2%',
        change: '+5%',
        positive: true,
        icon: Eye,
        color: 'green'
    },
    {
        label: 'Click Rate',
        value: '12.4%',
        change: '+3%',
        positive: true,
        icon: Target,
        color: 'purple'
    },
    {
        label: 'Scheduled',
        value: '2',
        change: '+1',
        positive: false,
        icon: Clock,
        color: 'orange'
    }
];

const types = [
    { value: 'all', label: 'All Types' },
    { value: 'maintenance', label: 'Maintenance' },
    { value: 'feature', label: 'Feature' },
    { value: 'update', label: 'Update' },
    { value: 'policy', label: 'Policy' },
    { value: 'service', label: 'Service' }
];

const priorities = [
    { value: 'all', label: 'All Priorities' },
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' }
];

const statuses = [
    { value: 'all', label: 'All Statuses' },
    { value: 'draft', label: 'Draft' },
    { value: 'scheduled', label: 'Scheduled' },
    { value: 'sent', label: 'Sent' },
    { value: 'cancelled', label: 'Cancelled' }
];

const audiences = [
    { value: 'all', label: 'All Audiences' },
    { value: 'restaurants', label: 'Restaurants' },
    { value: 'customers', label: 'Customers' },
    { value: 'all', label: 'All Users' }
];

export default function Announcements() {
    const [searchTerm, setSearchTerm] = useState('');
    const [type, setType] = useState('all');
    const [priority, setPriority] = useState('all');
    const [status, setStatus] = useState('all');
    const [audience, setAudience] = useState('all');
    const [selectedAnnouncement, setSelectedAnnouncement] = useState<any>(null);
    const [showDetails, setShowDetails] = useState(false);
    const [showCreate, setShowCreate] = useState(false);

    const filteredAnnouncements = announcements.filter(announcement => {
        const matchesSearch = announcement.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            announcement.content.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = type === 'all' || announcement.type === type;
        const matchesPriority = priority === 'all' || announcement.priority === priority;
        const matchesStatus = status === 'all' || announcement.status === status;
        const matchesAudience = audience === 'all' || announcement.targetAudience === audience;
        return matchesSearch && matchesType && matchesPriority && matchesStatus && matchesAudience;
    });

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'draft':
                return <Badge variant="default">Draft</Badge>;
            case 'scheduled':
                return <Badge variant="info">Scheduled</Badge>;
            case 'sent':
                return <Badge variant="success">Sent</Badge>;
            case 'cancelled':
                return <Badge variant="error">Cancelled</Badge>;
            default:
                return <Badge>{status}</Badge>;
        }
    };

    const getTypeBadge = (type: string) => {
        switch (type) {
            case 'maintenance':
                return <Badge variant="warning">Maintenance</Badge>;
            case 'feature':
                return <Badge variant="success">Feature</Badge>;
            case 'update':
                return <Badge variant="info">Update</Badge>;
            case 'policy':
                return <Badge variant="error">Policy</Badge>;
            case 'service':
                return <Badge variant="default">Service</Badge>;
            default:
                return <Badge>{type}</Badge>;
        }
    };

    const getPriorityBadge = (priority: string) => {
        switch (priority) {
            case 'low':
                return <Badge variant="default">Low</Badge>;
            case 'medium':
                return <Badge variant="info">Medium</Badge>;
            case 'high':
                return <Badge variant="warning">High</Badge>;
            default:
                return <Badge>{priority}</Badge>;
        }
    };

    const getChannelIcon = (channel: string) => {
        switch (channel) {
            case 'email':
                return <Mail size={16} className="text-blue-500" />;
            case 'in_app':
                return <Bell size={16} className="text-purple-500" />;
            case 'sms':
                return <MessageSquare size={16} className="text-green-500" />;
            case 'push':
                return <Smartphone size={16} className="text-orange-500" />;
            default:
                return <Globe size={16} className="text-gray-500" />;
        }
    };

    const getAudienceIcon = (audience: string) => {
        switch (audience) {
            case 'restaurants':
                return <Store size={16} className="text-blue-500" />;
            case 'customers':
                return <Users size={16} className="text-green-500" />;
            case 'all':
                return <Globe size={16} className="text-purple-500" />;
            default:
                return <Users size={16} className="text-gray-500" />;
        }
    };

    const formatDate = (timestamp: string) => {
        return new Date(timestamp).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const calculateEngagementRate = (opened: number, sent: number) => {
        return sent > 0 ? ((opened / sent) * 100).toFixed(1) : '0.0';
    };

    return (
        <>
            <PageHeader
                className="page-header"
                title="Announcements"
                actions={
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" title="Refresh">
                            <RefreshCw size={18} />
                        </Button>
                        <Button onClick={() => setShowCreate(true)} className="flex items-center gap-2">
                            <Plus size={18} />
                            New Announcement
                        </Button>
                    </div>
                }
            />

            <div className="page-content animate-fadeIn">
                {/* Stats Grid */}
                <div className="stats-grid">
                    {metrics.map((metric) => (
                        <StatCard
                            key={metric.label}
                            label={metric.label}
                            value={metric.value}
                            icon={metric.icon}
                            color={metric.color}
                        />
                    ))}
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-4 mb-6 p-4 bg-[var(--color-bg-card)] rounded-lg border border-[var(--color-border)]">
                    <div className="flex-1 min-w-[200px]">
                        <div className="relative">
                            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--color-text-muted)]" />
                            <input
                                type="text"
                                placeholder="Search announcements..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-[var(--color-border)] rounded-lg bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)]/20"
                            />
                        </div>
                    </div>

                    <select
                        value={type}
                        onChange={(e) => setType(e.target.value)}
                        className="px-4 py-2 border border-[var(--color-border)] rounded-lg bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)]/20"
                    >
                        {types.map(t => (
                            <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                    </select>
                    <select
                        value={priority}
                        onChange={(e) => setPriority(e.target.value)}
                        className="px-4 py-2 border border-[var(--color-border)] rounded-lg bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)]/20"
                    >
                        {priorities.map(pri => (
                            <option key={pri.value} value={pri.value}>{pri.label}</option>
                        ))}
                    </select>
                    <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="px-4 py-2 border border-[var(--color-border)] rounded-lg bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)]/20"
                    >
                        {statuses.map(stat => (
                            <option key={stat.value} value={stat.value}>{stat.label}</option>
                        ))}
                    </select>
                    <select
                        value={audience}
                        onChange={(e) => setAudience(e.target.value)}
                        className="px-4 py-2 border border-[var(--color-border)] rounded-lg bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)]/20"
                    >
                        {audiences.map(aud => (
                            <option key={aud.value} value={aud.value}>{aud.label}</option>
                        ))}
                    </select>
                </div>

                {/* Announcements Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Announcements</CardTitle>
                        <p className="text-sm text-[var(--color-text-muted)] mt-1">{filteredAnnouncements.length} announcements found</p>
                    </CardHeader>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-[var(--color-border)]">
                                    <th className="text-left p-4 font-medium text-[var(--color-text-secondary)]">Title</th>
                                    <th className="text-left p-4 font-medium text-[var(--color-text-secondary)]">Type</th>
                                    <th className="text-left p-4 font-medium text-[var(--color-text-secondary)]">Audience</th>
                                    <th className="text-left p-4 font-medium text-[var(--color-text-secondary)]">Channels</th>
                                    <th className="text-left p-4 font-medium text-[var(--color-text-secondary)]">Status</th>
                                    <th className="text-left p-4 font-medium text-[var(--color-text-secondary)]">Engagement</th>
                                    <th className="text-left p-4 font-medium text-[var(--color-text-secondary)]">Scheduled</th>
                                    <th className="text-left p-4 font-medium text-[var(--color-text-secondary)]">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredAnnouncements.map((announcement) => (
                                    <tr key={announcement.id} className="border-b border-[var(--color-border)] hover:bg-[var(--color-bg-tertiary)]/50 transition-colors">
                                        <td className="p-4">
                                            <div>
                                                <div className="font-medium text-[var(--color-text-primary)]">{announcement.title}</div>
                                                <div className="text-sm text-[var(--color-text-muted)] max-w-[300px] truncate">{announcement.content}</div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                {getTypeBadge(announcement.type)}
                                                {getPriorityBadge(announcement.priority)}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                {getAudienceIcon(announcement.targetAudience)}
                                                <span className="text-sm text-[var(--color-text-primary)] capitalize">{announcement.targetAudience}</span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex gap-1">
                                                {announcement.channels.map((channel, idx) => (
                                                    <div key={idx} title={channel}>
                                                        {getChannelIcon(channel)}
                                                    </div>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            {getStatusBadge(announcement.status)}
                                        </td>
                                        <td className="p-4">
                                            {announcement.status === 'sent' ? (
                                                <div className="text-sm">
                                                    <div className="text-[var(--color-text-primary)]">{calculateEngagementRate(announcement.openedCount, announcement.sentCount)}% opened</div>
                                                    <div className="text-[var(--color-text-muted)]">{announcement.sentCount} sent</div>
                                                </div>
                                            ) : (
                                                <div className="text-sm text-[var(--color-text-muted)]">Not sent</div>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            {announcement.scheduledFor ? (
                                                <div className="text-sm text-[var(--color-text-secondary)]">
                                                    {formatDate(announcement.scheduledFor)}
                                                </div>
                                            ) : (
                                                <div className="text-sm text-[var(--color-text-muted)]">Immediate</div>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="ghost"
                                                    onClick={() => {
                                                        setSelectedAnnouncement(announcement);
                                                        setShowDetails(true);
                                                    }}
                                                >
                                                    <Eye size={16} />
                                                </Button>
                                                {announcement.status === 'draft' && (
                                                    <Button variant="ghost">
                                                        <Edit size={16} />
                                                    </Button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>

                {/* Announcement Details Modal */}
                {showDetails && selectedAnnouncement && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-[var(--color-bg-card)] rounded-xl border border-[var(--color-border)] max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="p-6 border-b border-[var(--color-border)]">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <h3 className="text-xl font-semibold text-[var(--color-text-primary)]">Announcement Details</h3>
                                        <div className="flex gap-2">
                                            {getTypeBadge(selectedAnnouncement.type)}
                                            {getPriorityBadge(selectedAnnouncement.priority)}
                                            {getStatusBadge(selectedAnnouncement.status)}
                                        </div>
                                    </div>
                                    <Button variant="ghost" onClick={() => setShowDetails(false)}>
                                        <XCircle size={20} />
                                    </Button>
                                </div>
                            </div>
                            <div className="p-6">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                                    <div>
                                        <h4 className="text-sm font-medium text-[var(--color-text-muted)] mb-3">Campaign Details</h4>
                                        <div className="space-y-3">
                                            <div className="flex justify-between">
                                                <span className="text-[var(--color-text-secondary)]">Announcement ID:</span>
                                                <span className="font-mono text-sm text-[var(--color-text-primary)]">{selectedAnnouncement.id}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-[var(--color-text-secondary)]">Created:</span>
                                                <span className="text-sm text-[var(--color-text-primary)]">{formatDate(selectedAnnouncement.createdAt)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-[var(--color-text-secondary)]">Created By:</span>
                                                <span className="text-sm text-[var(--color-text-primary)]">{selectedAnnouncement.createdBy}</span>
                                            </div>
                                            {selectedAnnouncement.scheduledFor && (
                                                <div className="flex justify-between">
                                                    <span className="text-[var(--color-text-secondary)]">Scheduled For:</span>
                                                    <span className="text-sm text-[var(--color-text-primary)]">{formatDate(selectedAnnouncement.scheduledFor)}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-medium text-[var(--color-text-muted)] mb-3">Targeting</h4>
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[var(--color-text-secondary)]">Audience:</span>
                                                <div className="flex items-center gap-2">
                                                    {getAudienceIcon(selectedAnnouncement.targetAudience)}
                                                    <span className="text-sm text-[var(--color-text-primary)] capitalize">{selectedAnnouncement.targetAudience}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[var(--color-text-secondary)]">Channels:</span>
                                                <div className="flex gap-2">
                                                    {selectedAnnouncement.channels.map((channel, idx) => (
                                                        <div key={idx} className="flex items-center gap-1">
                                                            {getChannelIcon(channel)}
                                                            <span className="text-sm text-[var(--color-text-primary)]">{channel}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mb-6">
                                    <h4 className="text-sm font-medium text-[var(--color-text-muted)] mb-3">Title</h4>
                                    <div className="p-3 bg-[var(--color-bg-tertiary)] rounded-lg">
                                        <p className="text-[var(--color-text-primary)] font-medium">{selectedAnnouncement.title}</p>
                                    </div>
                                </div>

                                <div className="mb-6">
                                    <h4 className="text-sm font-medium text-[var(--color-text-muted)] mb-3">Content</h4>
                                    <div className="p-3 bg-[var(--color-bg-tertiary)] rounded-lg">
                                        <p className="text-[var(--color-text-primary)]">{selectedAnnouncement.content}</p>
                                    </div>
                                </div>

                                {selectedAnnouncement.status === 'sent' && (
                                    <div className="mb-6">
                                        <h4 className="text-sm font-medium text-[var(--color-text-muted)] mb-3">Performance Metrics</h4>
                                        <div className="grid grid-cols-3 gap-4">
                                            <div className="p-3 bg-[var(--color-bg-tertiary)] rounded-lg text-center">
                                                <div className="text-2xl font-bold text-[var(--color-text-primary)]">{selectedAnnouncement.sentCount}</div>
                                                <div className="text-sm text-[var(--color-text-muted)]">Sent</div>
                                            </div>
                                            <div className="p-3 bg-[var(--color-bg-tertiary)] rounded-lg text-center">
                                                <div className="text-2xl font-bold text-[var(--color-accent-primary)]">{calculateEngagementRate(selectedAnnouncement.openedCount, selectedAnnouncement.sentCount)}%</div>
                                                <div className="text-sm text-[var(--color-text-muted)]">Open Rate</div>
                                            </div>
                                            <div className="p-3 bg-[var(--color-bg-tertiary)] rounded-lg text-center">
                                                <div className="text-2xl font-bold text-[var(--color-accent-secondary)]">{calculateEngagementRate(selectedAnnouncement.clickedCount, selectedAnnouncement.sentCount)}%</div>
                                                <div className="text-sm text-[var(--color-text-muted)]">Click Rate</div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Create Announcement Modal */}
                {showCreate && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-[var(--color-bg-card)] rounded-xl border border-[var(--color-border)] max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="p-6 border-b border-[var(--color-border)]">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xl font-semibold text-[var(--color-text-primary)]">Create New Announcement</h3>
                                    <Button variant="ghost" onClick={() => setShowCreate(false)}>
                                        <XCircle size={20} />
                                    </Button>
                                </div>
                            </div>
                            <div className="p-6">
                                <div className="text-center text-[var(--color-text-muted)]">
                                    <Megaphone size={48} className="mx-auto mb-4 text-[var(--color-accent-primary)]" />
                                    <p className="mb-4">Create and send announcements to restaurants, customers, or all users</p>
                                    <div className="text-left space-y-2 text-sm">
                                        <div>• Target specific audiences (restaurants, customers, or all)</div>
                                        <div>• Choose delivery channels (email, in-app, SMS, push)</div>
                                        <div>• Schedule announcements for optimal timing</div>
                                        <div>• Track engagement and performance metrics</div>
                                        <div>• Support for rich content and attachments</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
