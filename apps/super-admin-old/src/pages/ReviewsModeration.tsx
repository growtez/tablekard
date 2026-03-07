import { useState } from 'react';
import {
    Star,
    MessageSquare,
    ThumbsUp,
    ThumbsDown,
    Flag,
    Eye,
    CheckCircle,
    XCircle,
    Clock,
    RefreshCw,
    Search,
    Filter,
    User,
    Store,
    Calendar,
    TrendingUp,
    TrendingDown,
    AlertTriangle,
    CheckSquare,
    XSquare
} from 'lucide-react';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { PageHeader } from '../components/ui/PageHeader';
import { StatCard } from '../components/ui/StatCard';
import { Card, CardHeader, CardTitle } from '../components/ui/Card';

// Static Data
const reviews = [
    {
        id: 'REV-001',
        restaurantName: 'Spice Garden',
        customerName: 'Rajesh Kumar',
        customerEmail: 'rajesh.kumar@email.com',
        rating: 5,
        title: 'Amazing food and excellent service!',
        content: 'The biryani was absolutely delicious and the service was top-notch. Will definitely come back again!',
        orderId: 'ORD-4521',
        status: 'approved',
        flagged: false,
        helpful: 12,
        notHelpful: 2,
        createdAt: '2024-03-05T14:30:00Z',
        updatedAt: '2024-03-05T14:30:00Z',
        response: null,
        moderatorNotes: null
    },
    {
        id: 'REV-002',
        restaurantName: 'Biryani House',
        customerName: 'Priya Sharma',
        customerEmail: 'priya.sharma@email.com',
        rating: 2,
        title: 'Very disappointing experience',
        content: 'Food was cold and tasted like it was made yesterday. The packaging was terrible and everything was mixed up. Very poor service.',
        orderId: 'ORD-4520',
        status: 'flagged',
        flagged: true,
        flagReason: 'Inappropriate language',
        helpful: 3,
        notHelpful: 8,
        createdAt: '2024-03-05T12:15:00Z',
        updatedAt: '2024-03-05T13:30:00Z',
        response: null,
        moderatorNotes: 'Review contains potentially defamatory statements. Needs review before approval.'
    },
    {
        id: 'REV-003',
        restaurantName: 'Tandoori Nights',
        customerName: 'Sneha Reddy',
        customerEmail: 'sneha.reddy@email.com',
        rating: 4,
        title: 'Good food but slow delivery',
        content: 'Food quality was great as always, but had to wait 45 minutes for delivery. Please improve delivery times.',
        orderId: 'ORD-4519',
        status: 'approved',
        flagged: false,
        helpful: 6,
        notHelpful: 1,
        createdAt: '2024-03-04T19:20:00Z',
        updatedAt: '2024-03-04T19:20:00Z',
        response: {
            author: 'Restaurant Management',
            message: 'Thank you for your feedback! We apologize for the delay and are working on improving our delivery times.',
            timestamp: '2024-03-04T20:00:00Z'
        },
        moderatorNotes: null
    },
    {
        id: 'REV-004',
        restaurantName: 'Curry Palace',
        customerName: 'Vikram Singh',
        customerEmail: 'vikram.singh@email.com',
        rating: 1,
        title: 'Worst restaurant ever - food poisoning!!!',
        content: 'This place should be shut down. Got severe food poisoning after eating here. Health department should investigate. DO NOT EAT HERE!!!',
        orderId: 'ORD-4518',
        status: 'pending',
        flagged: true,
        flagReason: 'Health & safety claims',
        helpful: 15,
        notHelpful: 3,
        createdAt: '2024-03-03T22:30:00Z',
        updatedAt: '2024-03-05T09:15:00Z',
        response: null,
        moderatorNotes: 'Serious health claims. Requires immediate investigation and verification before any action.'
    },
    {
        id: 'REV-005',
        restaurantName: 'Masala Dhaba',
        customerName: 'Ananya Gupta',
        customerEmail: 'ananya.gupta@email.com',
        rating: 3,
        title: 'Average experience',
        content: 'Food was okay, nothing special. Prices are reasonable but quality could be better.',
        orderId: 'ORD-4517',
        status: 'approved',
        flagged: false,
        helpful: 4,
        notHelpful: 4,
        createdAt: '2024-03-05T11:00:00Z',
        updatedAt: '2024-03-05T11:00:00Z',
        response: null,
        moderatorNotes: null
    },
    {
        id: 'REV-006',
        restaurantName: 'Spice Garden',
        customerName: 'Karan Malhotra',
        customerEmail: 'karan.malhotra@email.com',
        rating: 5,
        title: 'Consistently excellent',
        content: 'Have been ordering from here for months and they never disappoint. Best biryani in town!',
        orderId: 'ORD-4516',
        status: 'approved',
        flagged: false,
        helpful: 8,
        notHelpful: 0,
        createdAt: '2024-03-02T18:45:00Z',
        updatedAt: '2024-03-02T18:45:00Z',
        response: null,
        moderatorNotes: null
    }
];

const metrics = [
    {
        label: 'Total Reviews',
        value: '1,847',
        change: '+23%',
        positive: true,
        icon: MessageSquare,
        color: 'blue'
    },
    {
        label: 'Pending Review',
        value: '12',
        change: '+8%',
        positive: false,
        icon: Clock,
        color: 'orange'
    },
    {
        label: 'Flagged Content',
        value: '5',
        change: '-15%',
        positive: true,
        icon: Flag,
        color: 'red'
    },
    {
        label: 'Avg Rating',
        value: '4.2',
        change: '+5%',
        positive: true,
        icon: Star,
        color: 'yellow'
    }
];

const statuses = [
    { value: 'all', label: 'All Statuses' },
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'flagged', label: 'Flagged' }
];

const ratings = [
    { value: 'all', label: 'All Ratings' },
    { value: '5', label: '5 Stars' },
    { value: '4', label: '4 Stars' },
    { value: '3', label: '3 Stars' },
    { value: '2', label: '2 Stars' },
    { value: '1', label: '1 Star' }
];

export default function ReviewsModeration() {
    const [searchTerm, setSearchTerm] = useState('');
    const [status, setStatus] = useState('all');
    const [rating, setRating] = useState('all');
    const [selectedReview, setSelectedReview] = useState<any>(null);
    const [showDetails, setShowDetails] = useState(false);

    const filteredReviews = reviews.filter(review => {
        const matchesSearch = review.restaurantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            review.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            review.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            review.content.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = status === 'all' || review.status === status;
        const matchesRating = rating === 'all' || review.rating.toString() === rating;
        return matchesSearch && matchesStatus && matchesRating;
    });

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending':
                return <Badge variant="info">Pending</Badge>;
            case 'approved':
                return <Badge variant="success">Approved</Badge>;
            case 'rejected':
                return <Badge variant="error">Rejected</Badge>;
            case 'flagged':
                return <Badge variant="warning">Flagged</Badge>;
            default:
                return <Badge>{status}</Badge>;
        }
    };

    const getRatingStars = (rating: number) => {
        return Array.from({ length: 5 }, (_, i) => (
            <Star
                key={i}
                size={16}
                className={i < rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}
            />
        ));
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

    const handleApprove = (reviewId: string) => {
        console.log('Approving review:', reviewId);
        // In a real app, this would call an API
    };

    const handleReject = (reviewId: string) => {
        console.log('Rejecting review:', reviewId);
        // In a real app, this would call an API
    };

    const handleFlag = (reviewId: string, reason: string) => {
        console.log('Flagging review:', reviewId, reason);
        // In a real app, this would call an API
    };

    return (
        <>
            <PageHeader
                className="page-header"
                title="Reviews Moderation"
                actions={
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" title="Refresh">
                            <RefreshCw size={18} />
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
                                placeholder="Search by restaurant, customer, or content..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-[var(--color-border)] rounded-lg bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)]/20"
                            />
                        </div>
                    </div>

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
                        value={rating}
                        onChange={(e) => setRating(e.target.value)}
                        className="px-4 py-2 border border-[var(--color-border)] rounded-lg bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)]/20"
                    >
                        {ratings.map(rat => (
                            <option key={rat.value} value={rat.value}>{rat.label}</option>
                        ))}
                    </select>
                </div>

                {/* Reviews Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Reviews</CardTitle>
                        <p className="text-sm text-[var(--color-text-muted)] mt-1">{filteredReviews.length} reviews found</p>
                    </CardHeader>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-[var(--color-border)]">
                                    <th className="text-left p-4 font-medium text-[var(--color-text-secondary)]">Review ID</th>
                                    <th className="text-left p-4 font-medium text-[var(--color-text-secondary)]">Restaurant</th>
                                    <th className="text-left p-4 font-medium text-[var(--color-text-secondary)]">Customer</th>
                                    <th className="text-left p-4 font-medium text-[var(--color-text-secondary)]">Rating</th>
                                    <th className="text-left p-4 font-medium text-[var(--color-text-secondary)]">Title</th>
                                    <th className="text-left p-4 font-medium text-[var(--color-text-secondary)]">Status</th>
                                    <th className="text-left p-4 font-medium text-[var(--color-text-secondary)]">Helpful</th>
                                    <th className="text-left p-4 font-medium text-[var(--color-text-secondary)]">Created</th>
                                    <th className="text-left p-4 font-medium text-[var(--color-text-secondary)]">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredReviews.map((review) => (
                                    <tr key={review.id} className="border-b border-[var(--color-border)] hover:bg-[var(--color-bg-tertiary)]/50 transition-colors">
                                        <td className="p-4">
                                            <div className="font-mono text-sm text-[var(--color-text-primary)]">{review.id}</div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--color-accent-primary)] to-[var(--color-accent-secondary)] flex items-center justify-center text-white font-bold text-xs">
                                                    {review.restaurantName.charAt(0)}
                                                </div>
                                                <div className="font-medium text-[var(--color-text-primary)]">{review.restaurantName}</div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <User size={14} className="text-[var(--color-text-muted)]" />
                                                <span className="text-[var(--color-text-primary)]">{review.customerName}</span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex gap-1">{getRatingStars(review.rating)}</div>
                                        </td>
                                        <td className="p-4">
                                            <div className="max-w-[200px]">
                                                <div className="font-medium text-sm text-[var(--color-text-primary)] truncate">{review.title}</div>
                                                <div className="text-xs text-[var(--color-text-muted)] truncate">{review.content}</div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                {getStatusBadge(review.status)}
                                                {review.flagged && <Flag size={14} className="text-red-500" />}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2 text-sm">
                                                <div className="flex items-center gap-1 text-green-500">
                                                    <ThumbsUp size={12} />
                                                    <span>{review.helpful}</span>
                                                </div>
                                                <div className="flex items-center gap-1 text-red-500">
                                                    <ThumbsDown size={12} />
                                                    <span>{review.notHelpful}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="text-sm text-[var(--color-text-secondary)]">{formatDate(review.createdAt)}</div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="ghost"
                                                    onClick={() => {
                                                        setSelectedReview(review);
                                                        setShowDetails(true);
                                                    }}
                                                >
                                                    <Eye size={16} />
                                                </Button>
                                                {review.status === 'pending' && (
                                                    <>
                                                        <Button
                                                            variant="ghost"
                                                            onClick={() => handleApprove(review.id)}
                                                            className="text-green-500"
                                                        >
                                                            <CheckSquare size={16} />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            onClick={() => handleReject(review.id)}
                                                            className="text-red-500"
                                                        >
                                                            <XSquare size={16} />
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>

                {/* Review Details Modal */}
                {showDetails && selectedReview && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-[var(--color-bg-card)] rounded-xl border border-[var(--color-border)] max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="p-6 border-b border-[var(--color-border)]">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <h3 className="text-xl font-semibold text-[var(--color-text-primary)]">Review Details</h3>
                                        <div className="flex gap-2">
                                            {getStatusBadge(selectedReview.status)}
                                            {selectedReview.flagged && <Flag size={16} className="text-red-500" />}
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
                                        <h4 className="text-sm font-medium text-[var(--color-text-muted)] mb-3">Review Information</h4>
                                        <div className="space-y-3">
                                            <div className="flex justify-between">
                                                <span className="text-[var(--color-text-secondary)]">Review ID:</span>
                                                <span className="font-mono text-sm text-[var(--color-text-primary)]">{selectedReview.id}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-[var(--color-text-secondary)]">Order ID:</span>
                                                <span className="font-mono text-sm text-[var(--color-text-primary)]">{selectedReview.orderId}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-[var(--color-text-secondary)]">Rating:</span>
                                                <div className="flex gap-1">{getRatingStars(selectedReview.rating)}</div>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-[var(--color-text-secondary)]">Created:</span>
                                                <span className="text-sm text-[var(--color-text-primary)]">{formatDate(selectedReview.createdAt)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-[var(--color-text-secondary)]">Helpful:</span>
                                                <div className="flex items-center gap-2">
                                                    <div className="flex items-center gap-1 text-green-500">
                                                        <ThumbsUp size={12} />
                                                        <span>{selectedReview.helpful}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1 text-red-500">
                                                        <ThumbsDown size={12} />
                                                        <span>{selectedReview.notHelpful}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-medium text-[var(--color-text-muted)] mb-3">Parties Involved</h4>
                                        <div className="space-y-3">
                                            <div className="p-3 bg-[var(--color-bg-tertiary)] rounded-lg">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Store size={16} className="text-[var(--color-accent-primary)]" />
                                                    <span className="font-medium text-[var(--color-text-primary)]">{selectedReview.restaurantName}</span>
                                                </div>
                                                <div className="text-sm text-[var(--color-text-secondary)]">Restaurant</div>
                                            </div>
                                            <div className="p-3 bg-[var(--color-bg-tertiary)] rounded-lg">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <User size={16} className="text-[var(--color-accent-primary)]" />
                                                    <span className="font-medium text-[var(--color-text-primary)]">{selectedReview.customerName}</span>
                                                </div>
                                                <div className="text-sm text-[var(--color-text-secondary)]">Customer</div>
                                                <div className="text-xs text-[var(--color-text-muted)] mt-1">
                                                    {selectedReview.customerEmail}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mb-6">
                                    <h4 className="text-sm font-medium text-[var(--color-text-muted)] mb-3">Review Title</h4>
                                    <div className="p-3 bg-[var(--color-bg-tertiary)] rounded-lg">
                                        <p className="text-[var(--color-text-primary)] font-medium">{selectedReview.title}</p>
                                    </div>
                                </div>

                                <div className="mb-6">
                                    <h4 className="text-sm font-medium text-[var(--color-text-muted)] mb-3">Review Content</h4>
                                    <div className="p-3 bg-[var(--color-bg-tertiary)] rounded-lg">
                                        <p className="text-[var(--color-text-primary)]">{selectedReview.content}</p>
                                    </div>
                                </div>

                                {selectedReview.flagged && (
                                    <div className="mb-6">
                                        <h4 className="text-sm font-medium text-[var(--color-text-muted)] mb-3">Flag Information</h4>
                                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Flag size={16} className="text-red-500" />
                                                <span className="font-medium text-red-700">Flagged: {selectedReview.flagReason}</span>
                                            </div>
                                            {selectedReview.moderatorNotes && (
                                                <p className="text-sm text-red-600 mt-2">{selectedReview.moderatorNotes}</p>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {selectedReview.response && (
                                    <div className="mb-6">
                                        <h4 className="text-sm font-medium text-[var(--color-text-muted)] mb-3">Restaurant Response</h4>
                                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="font-medium text-blue-700">{selectedReview.response.author}</span>
                                                <span className="text-xs text-blue-600">{formatDate(selectedReview.response.timestamp)}</span>
                                            </div>
                                            <p className="text-sm text-blue-600">{selectedReview.response.message}</p>
                                        </div>
                                    </div>
                                )}

                                <div className="flex gap-3">
                                    {selectedReview.status === 'pending' && (
                                        <>
                                            <Button onClick={() => handleApprove(selectedReview.id)} className="flex items-center gap-2">
                                                <CheckSquare size={16} />
                                                Approve
                                            </Button>
                                            <Button variant="ghost" onClick={() => handleReject(selectedReview.id)} className="flex items-center gap-2 text-red-500">
                                                <XSquare size={16} />
                                                Reject
                                            </Button>
                                        </>
                                    )}
                                    <Button variant="ghost" onClick={() => handleFlag(selectedReview.id, 'Manual flag by moderator')} className="flex items-center gap-2 text-orange-500">
                                        <Flag size={16} />
                                        Flag
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
