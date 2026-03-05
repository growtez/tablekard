import { useState } from 'react';
import {
    AlertTriangle,
    MessageSquare,
    Clock,
    CheckCircle,
    XCircle,
    Eye,
    Reply,
    RefreshCw,
    Search,
    Filter,
    User,
    Store,
    Calendar,
    Scale,
    FileText,
    Send,
    MoreVertical,
    Star,
    TrendingUp,
    Users
} from 'lucide-react';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { PageHeader } from '../components/ui/PageHeader';
import { StatCard } from '../components/ui/StatCard';
import { Card, CardHeader, CardTitle } from '../components/ui/Card';

// Static Data
const complaintsDisputes = [
    {
        id: 'COMP-001',
        type: 'complaint',
        category: 'food_quality',
        priority: 'high',
        status: 'open',
        restaurantName: 'Spice Garden',
        customerName: 'Rajesh Kumar',
        customerEmail: 'rajesh.kumar@email.com',
        customerPhone: '+91 9876543210',
        orderId: 'ORD-4521',
        subject: 'Food quality issue - undercooked chicken',
        description: 'The chicken biryani was undercooked and had a strange smell. This is not the first time I\'ve faced this issue with this restaurant.',
        severity: 4,
        createdAt: '2024-03-05T14:30:00Z',
        updatedAt: '2024-03-05T15:45:00Z',
        assignedTo: 'support_agent_1',
        responses: [
            {
                id: 'RESP-001',
                author: 'Support Team',
                message: 'We apologize for the inconvenience. We have contacted the restaurant management and they are investigating this matter.',
                timestamp: '2024-03-05T15:45:00Z',
                isInternal: false
            }
        ],
        attachments: ['photo_1.jpg', 'receipt.pdf'],
        resolution: null,
        satisfactionRating: null
    },
    {
        id: 'COMP-002',
        type: 'dispute',
        category: 'payment',
        priority: 'medium',
        status: 'investigating',
        restaurantName: 'Biryani House',
        customerName: 'Priya Sharma',
        customerEmail: 'priya.sharma@email.com',
        customerPhone: '+91 9876543211',
        orderId: 'ORD-4520',
        subject: 'Wrong amount charged - double billing',
        description: 'I was charged ₹1780 instead of ₹890 for my order. The restaurant claims it was a system error but hasn\'t refunded the difference.',
        severity: 3,
        createdAt: '2024-03-05T12:15:00Z',
        updatedAt: '2024-03-05T13:30:00Z',
        assignedTo: 'support_agent_2',
        responses: [
            {
                id: 'RESP-002',
                author: 'Support Team',
                message: 'We are investigating the payment gateway logs. The restaurant has been notified about this issue.',
                timestamp: '2024-03-05T13:30:00Z',
                isInternal: false
            }
        ],
        attachments: ['payment_screenshot.png'],
        resolution: null,
        satisfactionRating: null
    },
    {
        id: 'COMP-003',
        type: 'complaint',
        category: 'service',
        priority: 'low',
        status: 'resolved',
        restaurantName: 'Tandoori Nights',
        customerName: 'Sneha Reddy',
        customerEmail: 'sneha.reddy@email.com',
        customerPhone: '+91 9876543212',
        orderId: 'ORD-4519',
        subject: 'Long waiting time for order',
        description: 'Waited 45 minutes for my order despite the restaurant not being crowded.',
        severity: 2,
        createdAt: '2024-03-04T19:20:00Z',
        updatedAt: '2024-03-05T10:00:00Z',
        assignedTo: 'support_agent_1',
        responses: [
            {
                id: 'RESP-003',
                author: 'Support Team',
                message: 'We have spoken to the restaurant management. They apologize for the delay and have offered a 10% discount on your next order.',
                timestamp: '2024-03-04T20:00:00Z',
                isInternal: false
            },
            {
                id: 'RESP-004',
                author: 'Support Team',
                message: 'Customer has accepted the resolution. Case marked as resolved.',
                timestamp: '2024-03-05T10:00:00Z',
                isInternal: true
            }
        ],
        attachments: [],
        resolution: '10% discount offered and accepted by customer',
        satisfactionRating: 4
    },
    {
        id: 'COMP-004',
        type: 'dispute',
        category: 'food_quality',
        priority: 'high',
        status: 'escalated',
        restaurantName: 'Curry Palace',
        customerName: 'Vikram Singh',
        customerEmail: 'vikram.singh@email.com',
        customerPhone: '+91 9876543213',
        orderId: 'ORD-4518',
        subject: 'Food poisoning - severe health issues',
        description: 'After eating at Curry Palace, I experienced severe food poisoning and had to be hospitalized. This is a serious health and safety concern.',
        severity: 5,
        createdAt: '2024-03-03T22:30:00Z',
        updatedAt: '2024-03-05T09:15:00Z',
        assignedTo: 'senior_support_1',
        responses: [
            {
                id: 'RESP-005',
                author: 'Support Team',
                message: 'This is a serious matter. We have escalated this to our senior team and temporarily suspended the restaurant pending investigation.',
                timestamp: '2024-03-04T08:00:00Z',
                isInternal: false
            },
            {
                id: 'RESP-006',
                author: 'Senior Support',
                message: 'Health department has been notified. Restaurant remains suspended until further notice.',
                timestamp: '2024-03-05T09:15:00Z',
                isInternal: true
            }
        ],
        attachments: ['medical_report.pdf', 'hospital_bill.pdf'],
        resolution: 'Restaurant suspended, health department notified',
        satisfactionRating: null
    },
    {
        id: 'COMP-005',
        type: 'complaint',
        category: 'delivery',
        priority: 'medium',
        status: 'pending',
        restaurantName: 'Masala Dhaba',
        customerName: 'Ananya Gupta',
        customerEmail: 'ananya.gupta@email.com',
        customerPhone: '+91 9876543214',
        orderId: 'ORD-4517',
        subject: 'Delivery person behavior - rude and unprofessional',
        description: 'The delivery person was very rude, refused to hand over the order properly, and damaged the food packaging.',
        severity: 3,
        createdAt: '2024-03-05T11:00:00Z',
        updatedAt: '2024-03-05T11:00:00Z',
        assignedTo: null,
        responses: [],
        attachments: ['packaging_damage.jpg'],
        resolution: null,
        satisfactionRating: null
    }
];

const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'food_quality', label: 'Food Quality' },
    { value: 'service', label: 'Service' },
    { value: 'payment', label: 'Payment' },
    { value: 'delivery', label: 'Delivery' },
    { value: 'hygiene', label: 'Hygiene' },
    { value: 'pricing', label: 'Pricing' }
];

const priorities = [
    { value: 'all', label: 'All Priorities' },
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'critical', label: 'Critical' }
];

const statuses = [
    { value: 'all', label: 'All Statuses' },
    { value: 'pending', label: 'Pending' },
    { value: 'open', label: 'Open' },
    { value: 'investigating', label: 'Investigating' },
    { value: 'escalated', label: 'Escalated' },
    { value: 'resolved', label: 'Resolved' },
    { value: 'closed', label: 'Closed' }
];

const metrics = [
    {
        label: 'Total Cases',
        value: '127',
        change: '+12%',
        positive: true,
        icon: MessageSquare,
        color: 'blue'
    },
    {
        label: 'Open Cases',
        value: '23',
        change: '+8%',
        positive: false,
        icon: AlertTriangle,
        color: 'orange'
    },
    {
        label: 'Resolved Today',
        value: '8',
        change: '+25%',
        positive: true,
        icon: CheckCircle,
        color: 'green'
    },
    {
        label: 'Avg Resolution Time',
        value: '24h',
        change: '-15%',
        positive: true,
        icon: Clock,
        color: 'purple'
    }
];

export default function ComplaintsDisputes() {
    const [searchTerm, setSearchTerm] = useState('');
    const [category, setCategory] = useState('all');
    const [priority, setPriority] = useState('all');
    const [status, setStatus] = useState('all');
    const [selectedCase, setSelectedCase] = useState<any>(null);
    const [showDetails, setShowDetails] = useState(false);
    const [newResponse, setNewResponse] = useState('');

    const filteredCases = complaintsDisputes.filter(case_ => {
        const matchesSearch = case_.restaurantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            case_.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            case_.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            case_.id.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = category === 'all' || case_.category === category;
        const matchesPriority = priority === 'all' || case_.priority === priority;
        const matchesStatus = status === 'all' || case_.status === status;
        return matchesSearch && matchesCategory && matchesPriority && matchesStatus;
    });

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending':
                return <Badge variant="info">Pending</Badge>;
            case 'open':
                return <Badge variant="warning">Open</Badge>;
            case 'investigating':
                return <Badge variant="info">Investigating</Badge>;
            case 'escalated':
                return <Badge variant="error">Escalated</Badge>;
            case 'resolved':
                return <Badge variant="success">Resolved</Badge>;
            case 'closed':
                return <Badge variant="default">Closed</Badge>;
            default:
                return <Badge>{status}</Badge>;
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
            case 'critical':
                return <Badge variant="error">Critical</Badge>;
            default:
                return <Badge>{priority}</Badge>;
        }
    };

    const getTypeBadge = (type: string) => {
        switch (type) {
            case 'complaint':
                return <Badge variant="info">Complaint</Badge>;
            case 'dispute':
                return <Badge variant="warning">Dispute</Badge>;
            default:
                return <Badge>{type}</Badge>;
        }
    };

    const getSeverityStars = (severity: number) => {
        return Array.from({ length: 5 }, (_, i) => (
            <Star
                key={i}
                size={16}
                className={i < severity ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}
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

    const handleAddResponse = () => {
        if (newResponse.trim() && selectedCase) {
            // In a real app, this would call an API
            console.log('Adding response:', newResponse);
            setNewResponse('');
        }
    };

    return (
        <>
            <PageHeader
                className="page-header"
                title="Complaints & Disputes"
                description="Manage customer complaints and disputes across all restaurants."
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
                                placeholder="Search by restaurant, customer, or case ID..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-[var(--color-border)] rounded-lg bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)]/20"
                            />
                        </div>
                    </div>
                    
                    <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="px-4 py-2 border border-[var(--color-border)] rounded-lg bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)]/20"
                    >
                        {categories.map(cat => (
                            <option key={cat.value} value={cat.value}>{cat.label}</option>
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
                </div>

                {/* Cases Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Cases</CardTitle>
                        <p className="text-sm text-[var(--color-text-muted)] mt-1">{filteredCases.length} cases found</p>
                    </CardHeader>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-[var(--color-border)]">
                                    <th className="text-left p-4 font-medium text-[var(--color-text-secondary)]">Case ID</th>
                                    <th className="text-left p-4 font-medium text-[var(--color-text-secondary)]">Type</th>
                                    <th className="text-left p-4 font-medium text-[var(--color-text-secondary)]">Restaurant</th>
                                    <th className="text-left p-4 font-medium text-[var(--color-text-secondary)]">Customer</th>
                                    <th className="text-left p-4 font-medium text-[var(--color-text-secondary)]">Subject</th>
                                    <th className="text-left p-4 font-medium text-[var(--color-text-secondary)]">Priority</th>
                                    <th className="text-left p-4 font-medium text-[var(--color-text-secondary)]">Status</th>
                                    <th className="text-left p-4 font-medium text-[var(--color-text-secondary)]">Created</th>
                                    <th className="text-left p-4 font-medium text-[var(--color-text-secondary)]">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredCases.map((case_) => (
                                    <tr key={case_.id} className="border-b border-[var(--color-border)] hover:bg-[var(--color-bg-tertiary)]/50 transition-colors">
                                        <td className="p-4">
                                            <div className="font-mono text-sm text-[var(--color-text-primary)]">{case_.id}</div>
                                        </td>
                                        <td className="p-4">
                                            {getTypeBadge(case_.type)}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--color-accent-primary)] to-[var(--color-accent-secondary)] flex items-center justify-center text-white font-bold text-xs">
                                                    {case_.restaurantName.charAt(0)}
                                                </div>
                                                <div className="font-medium text-[var(--color-text-primary)]">{case_.restaurantName}</div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <User size={14} className="text-[var(--color-text-muted)]" />
                                                <span className="text-[var(--color-text-primary)]">{case_.customerName}</span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="max-w-[200px] truncate text-sm text-[var(--color-text-primary)]">{case_.subject}</div>
                                        </td>
                                        <td className="p-4">
                                            {getPriorityBadge(case_.priority)}
                                        </td>
                                        <td className="p-4">
                                            {getStatusBadge(case_.status)}
                                        </td>
                                        <td className="p-4">
                                            <div className="text-sm text-[var(--color-text-secondary)]">{formatDate(case_.createdAt)}</div>
                                        </td>
                                        <td className="p-4">
                                            <Button
                                                variant="ghost"
                                                onClick={() => {
                                                    setSelectedCase(case_);
                                                    setShowDetails(true);
                                                }}
                                            >
                                                <Eye size={16} />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>

                {/* Case Details Modal */}
                {showDetails && selectedCase && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-[var(--color-bg-card)] rounded-xl border border-[var(--color-border)] max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="p-6 border-b border-[var(--color-border)]">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <h3 className="text-xl font-semibold text-[var(--color-text-primary)]">Case Details</h3>
                                        <div className="flex gap-2">
                                            {getTypeBadge(selectedCase.type)}
                                            {getPriorityBadge(selectedCase.priority)}
                                            {getStatusBadge(selectedCase.status)}
                                        </div>
                                    </div>
                                    <Button variant="ghost" onClick={() => setShowDetails(false)}>
                                        <X size={20} />
                                    </Button>
                                </div>
                            </div>
                            <div className="p-6">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                                    <div>
                                        <h4 className="text-sm font-medium text-[var(--color-text-muted)] mb-3">Case Information</h4>
                                        <div className="space-y-3">
                                            <div className="flex justify-between">
                                                <span className="text-[var(--color-text-secondary)]">Case ID:</span>
                                                <span className="font-mono text-sm text-[var(--color-text-primary)]">{selectedCase.id}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-[var(--color-text-secondary)]">Order ID:</span>
                                                <span className="font-mono text-sm text-[var(--color-text-primary)]">{selectedCase.orderId}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-[var(--color-text-secondary)]">Severity:</span>
                                                <div className="flex gap-1">{getSeverityStars(selectedCase.severity)}</div>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-[var(--color-text-secondary)]">Created:</span>
                                                <span className="text-sm text-[var(--color-text-primary)]">{formatDate(selectedCase.createdAt)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-[var(--color-text-secondary)]">Last Updated:</span>
                                                <span className="text-sm text-[var(--color-text-primary)]">{formatDate(selectedCase.updatedAt)}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-medium text-[var(--color-text-muted)] mb-3">Parties Involved</h4>
                                        <div className="space-y-3">
                                            <div className="p-3 bg-[var(--color-bg-tertiary)] rounded-lg">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Store size={16} className="text-[var(--color-accent-primary)]" />
                                                    <span className="font-medium text-[var(--color-text-primary)]">{selectedCase.restaurantName}</span>
                                                </div>
                                                <div className="text-sm text-[var(--color-text-secondary)]">Restaurant</div>
                                            </div>
                                            <div className="p-3 bg-[var(--color-bg-tertiary)] rounded-lg">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <User size={16} className="text-[var(--color-accent-primary)]" />
                                                    <span className="font-medium text-[var(--color-text-primary)]">{selectedCase.customerName}</span>
                                                </div>
                                                <div className="text-sm text-[var(--color-text-secondary)]">Customer</div>
                                                <div className="text-xs text-[var(--color-text-muted)] mt-1">
                                                    {selectedCase.customerEmail}<br />
                                                    {selectedCase.customerPhone}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mb-6">
                                    <h4 className="text-sm font-medium text-[var(--color-text-muted)] mb-3">Subject</h4>
                                    <div className="p-3 bg-[var(--color-bg-tertiary)] rounded-lg">
                                        <p className="text-[var(--color-text-primary)]">{selectedCase.subject}</p>
                                    </div>
                                </div>

                                <div className="mb-6">
                                    <h4 className="text-sm font-medium text-[var(--color-text-muted)] mb-3">Description</h4>
                                    <div className="p-3 bg-[var(--color-bg-tertiary)] rounded-lg">
                                        <p className="text-[var(--color-text-primary)]">{selectedCase.description}</p>
                                    </div>
                                </div>

                                {selectedCase.attachments && selectedCase.attachments.length > 0 && (
                                    <div className="mb-6">
                                        <h4 className="text-sm font-medium text-[var(--color-text-muted)] mb-3">Attachments</h4>
                                        <div className="flex gap-2">
                                            {selectedCase.attachments.map((attachment: string, idx: number) => (
                                                <div key={idx} className="flex items-center gap-2 px-3 py-2 bg-[var(--color-bg-tertiary)] rounded-lg border border-[var(--color-border)]">
                                                    <FileText size={16} className="text-[var(--color-accent-primary)]" />
                                                    <span className="text-sm text-[var(--color-text-primary)]">{attachment}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="mb-6">
                                    <h4 className="text-sm font-medium text-[var(--color-text-muted)] mb-3">Response History</h4>
                                    <div className="space-y-3">
                                        {selectedCase.responses.map((response: any) => (
                                            <div key={response.id} className={`p-3 rounded-lg ${response.isInternal ? 'bg-blue-50 border border-blue-200' : 'bg-[var(--color-bg-tertiary)]'}`}>
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium text-[var(--color-text-primary)]">{response.author}</span>
                                                        {response.isInternal && <Badge variant="info">Internal</Badge>}
                                                    </div>
                                                    <span className="text-xs text-[var(--color-text-muted)]">{formatDate(response.timestamp)}</span>
                                                </div>
                                                <p className="text-sm text-[var(--color-text-primary)]">{response.message}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {selectedCase.resolution && (
                                    <div className="mb-6">
                                        <h4 className="text-sm font-medium text-[var(--color-text-muted)] mb-3">Resolution</h4>
                                        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                                            <p className="text-[var(--color-text-primary)]">{selectedCase.resolution}</p>
                                        </div>
                                    </div>
                                )}

                                {selectedCase.satisfactionRating && (
                                    <div className="mb-6">
                                        <h4 className="text-sm font-medium text-[var(--color-text-muted)] mb-3">Customer Satisfaction</h4>
                                        <div className="flex items-center gap-2">
                                            <div className="flex gap-1">{getSeverityStars(selectedCase.satisfactionRating)}</div>
                                            <span className="text-sm text-[var(--color-text-secondary)]">({selectedCase.satisfactionRating}/5)</span>
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <h4 className="text-sm font-medium text-[var(--color-text-muted)] mb-3">Add Response</h4>
                                    <div className="flex gap-2">
                                        <textarea
                                            value={newResponse}
                                            onChange={(e) => setNewResponse(e.target.value)}
                                            placeholder="Type your response here..."
                                            className="flex-1 p-3 border border-[var(--color-border)] rounded-lg bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)]/20 resize-none"
                                            rows={3}
                                        />
                                        <Button onClick={handleAddResponse}>
                                            <Send size={16} />
                                        </Button>
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
