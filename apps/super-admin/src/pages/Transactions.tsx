import { useState } from 'react';
import {
    DollarSign,
    TrendingUp,
    CreditCard,
    RefreshCw,
    Download,
    Search,
    Eye,
    X,
    Store,
    User,
    ArrowRightLeft
} from 'lucide-react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from 'recharts';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { PageHeader } from '../components/ui/PageHeader';
import { StatCard } from '../components/ui/StatCard';
import { Card, CardHeader, CardTitle } from '../components/ui/Card';

// Static Data
const revenueData = [
    { month: 'Jan', revenue: 45000, refunds: 2300, net: 42700 },
    { month: 'Feb', revenue: 52000, refunds: 1800, net: 50200 },
    { month: 'Mar', revenue: 48000, refunds: 3200, net: 44800 },
    { month: 'Apr', revenue: 61000, refunds: 2100, net: 58900 },
    { month: 'May', revenue: 55000, refunds: 2900, net: 52100 },
    { month: 'Jun', revenue: 67000, refunds: 1500, net: 65500 },
    { month: 'Jul', revenue: 72000, refunds: 2800, net: 69200 },
    { month: 'Aug', revenue: 69000, refunds: 3400, net: 65600 },
    { month: 'Sep', revenue: 78000, refunds: 2200, net: 75800 },
    { month: 'Oct', revenue: 85000, refunds: 1900, net: 83100 },
    { month: 'Nov', revenue: 82000, refunds: 2600, net: 79400 },
    { month: 'Dec', revenue: 91000, refunds: 3100, net: 87900 },
];

const transactions = [
    {
        id: 'TXN-001',
        restaurantId: '1',
        restaurantName: 'Spice Garden',
        orderId: 'ORD-4521',
        customerName: 'Rajesh Kumar',
        amount: 1250,
        paymentMethod: 'ONLINE',
        status: 'COMPLETED',
        timestamp: '2024-03-05T14:30:00Z',
        transactionId: 'razorpay_TXN123456',
        fees: 37.50,
        netAmount: 1212.50
    },
    {
        id: 'TXN-002',
        restaurantId: '2',
        restaurantName: 'Biryani House',
        orderId: 'ORD-4520',
        customerName: 'Priya Sharma',
        amount: 890,
        paymentMethod: 'PAY_AT_COUNTER',
        status: 'COMPLETED',
        timestamp: '2024-03-05T13:45:00Z',
        transactionId: 'cash_TXN789012',
        fees: 0,
        netAmount: 890
    },
    {
        id: 'TXN-003',
        restaurantId: '3',
        restaurantName: 'Tandoori Nights',
        orderId: 'ORD-4519',
        customerName: 'Sneha Reddy',
        amount: 2100,
        paymentMethod: 'ONLINE',
        status: 'FAILED',
        timestamp: '2024-03-05T12:20:00Z',
        transactionId: 'razorpay_TXN345678',
        fees: 0,
        netAmount: 0
    },
    {
        id: 'TXN-004',
        restaurantId: '4',
        restaurantName: 'Curry Palace',
        orderId: 'ORD-4518',
        customerName: 'Vikram Singh',
        amount: 1560,
        paymentMethod: 'ONLINE',
        status: 'COMPLETED',
        timestamp: '2024-03-05T11:15:00Z',
        transactionId: 'razorpay_TXN901234',
        fees: 46.80,
        netAmount: 1513.20
    },
    {
        id: 'TXN-005',
        restaurantId: '5',
        restaurantName: 'Masala Dhaba',
        orderId: 'ORD-4517',
        customerName: 'Ananya Gupta',
        amount: 750,
        paymentMethod: 'PAY_AT_COUNTER',
        status: 'COMPLETED',
        timestamp: '2024-03-05T10:30:00Z',
        transactionId: 'cash_TXN567890',
        fees: 0,
        netAmount: 750
    },
];

const refunds = [
    {
        id: 'REF-001',
        transactionId: 'TXN-001',
        restaurantName: 'Spice Garden',
        customerName: 'Rajesh Kumar',
        originalAmount: 1250,
        refundAmount: 1250,
        reason: 'Food quality issue',
        status: 'APPROVED',
        processedAt: '2024-03-05T16:00:00Z',
        refundId: 'razorpay_REF123456',
        initiatedBy: 'restaurant'
    },
    {
        id: 'REF-002',
        transactionId: 'TXN-004',
        restaurantName: 'Curry Palace',
        customerName: 'Vikram Singh',
        originalAmount: 1560,
        refundAmount: 780,
        reason: 'Partial refund - item not available',
        status: 'PENDING',
        processedAt: null,
        refundId: null,
        initiatedBy: 'customer'
    },
    {
        id: 'REF-003',
        transactionId: 'TXN-006',
        restaurantName: 'Tandoori Nights',
        customerName: 'Karan Malhotra',
        originalAmount: 3200,
        refundAmount: 3200,
        reason: 'Service delay',
        status: 'REJECTED',
        processedAt: null,
        refundId: null,
        initiatedBy: 'platform'
    },
];

const paymentMethods = [
    { value: 'all', label: 'All Methods' },
    { value: 'ONLINE', label: 'Online Payment' },
    { value: 'PAY_AT_COUNTER', label: 'Pay at Counter' },
];

const transactionStatuses = [
    { value: 'all', label: 'All Statuses' },
    { value: 'COMPLETED', label: 'Completed' },
    { value: 'FAILED', label: 'Failed' },
    { value: 'PENDING', label: 'Pending' },
];

const refundStatuses = [
    { value: 'all', label: 'All Statuses' },
    { value: 'APPROVED', label: 'Approved' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'REJECTED', label: 'Rejected' },
];

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-lg p-3 shadow-lg">
                <p className="text-[var(--color-text-primary)] font-medium">{label}</p>
                {payload.map((entry: any, index: number) => (
                    <p key={index} className="text-sm" style={{ color: entry.color }}>
                        {entry.name}: ₹{entry.value.toLocaleString()}
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

export default function Transactions() {
    const [activeTab, setActiveTab] = useState('transactions');
    const [searchTerm, setSearchTerm] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('all');
    const [status, setStatus] = useState('all');
    const [refundStatus, setRefundStatus] = useState('all');
    const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
    const [showDetails, setShowDetails] = useState(false);

    const stats = [
        {
            label: 'Total Revenue',
            value: '₹8,79,000',
            change: '+23%',
            positive: true,
            icon: DollarSign,
            color: 'green'
        },
        {
            label: 'Total Transactions',
            value: '1,247',
            change: '+18%',
            positive: true,
            icon: CreditCard,
            color: 'blue'
        },
        {
            label: 'Refunds Processed',
            value: '₹28,400',
            change: '+12%',
            positive: false,
            icon: ArrowRightLeft,
            color: 'orange'
        },
        {
            label: 'Net Revenue',
            value: '₹8,50,600',
            change: '+25%',
            positive: true,
            icon: TrendingUp,
            color: 'purple'
        }
    ];

    const filteredTransactions = transactions.filter(transaction => {
        const matchesSearch = transaction.restaurantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            transaction.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            transaction.orderId.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesMethod = paymentMethod === 'all' || transaction.paymentMethod === paymentMethod;
        const matchesStatus = status === 'all' || transaction.status === status;
        return matchesSearch && matchesMethod && matchesStatus;
    });

    const filteredRefunds = refunds.filter(refund => {
        const matchesSearch = refund.restaurantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            refund.customerName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = refundStatus === 'all' || refund.status === refundStatus;
        return matchesSearch && matchesStatus;
    });

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'COMPLETED':
                return <Badge variant="success">Completed</Badge>;
            case 'FAILED':
                return <Badge variant="error">Failed</Badge>;
            case 'PENDING':
                return <Badge variant="info">Pending</Badge>;
            case 'APPROVED':
                return <Badge variant="success">Approved</Badge>;
            case 'REJECTED':
                return <Badge variant="error">Rejected</Badge>;
            default:
                return <Badge>{status}</Badge>;
        }
    };

    const getPaymentMethodBadge = (method: string) => {
        switch (method) {
            case 'ONLINE':
                return <Badge variant="info">Online</Badge>;
            case 'PAY_AT_COUNTER':
                return <Badge variant="default">At Counter</Badge>;
            default:
                return <Badge>{method}</Badge>;
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

    return (
        <>
            <PageHeader
                className="page-header"
                title="Transactions & Refunds"
                actions={
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" title="Export Data">
                            <Download size={18} />
                        </Button>
                        <Button variant="ghost" title="Refresh">
                            <RefreshCw size={18} />
                        </Button>
                    </div>
                }
            />

            <div className="page-content animate-fadeIn">
                {/* Stats Grid */}
                <div className="stats-grid">
                    {stats.map((stat) => (
                        <StatCard
                            key={stat.label}
                            label={stat.label}
                            value={stat.value}
                            icon={stat.icon}
                            color={stat.color}
                        />
                    ))}
                </div>

                {/* Revenue Chart */}
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle>Revenue vs Refunds Overview</CardTitle>
                        <p className="text-sm text-[var(--color-text-muted)] mt-1">Monthly revenue and refund trends</p>
                    </CardHeader>
                    <div className="p-4 h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={revenueData}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorRefunds" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                                <XAxis
                                    dataKey="month"
                                    stroke="var(--color-text-muted)"
                                    fontSize={12}
                                    tickLine={false}
                                />
                                <YAxis
                                    stroke="var(--color-text-muted)"
                                    fontSize={12}
                                    tickLine={false}
                                    tickFormatter={(value) => `₹${value / 1000}k`}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend />
                                <Area
                                    type="monotone"
                                    dataKey="revenue"
                                    stroke="#10B981"
                                    strokeWidth={2}
                                    fillOpacity={1}
                                    fill="url(#colorRevenue)"
                                    name="Revenue"
                                />
                                <Area
                                    type="monotone"
                                    dataKey="refunds"
                                    stroke="#EF4444"
                                    strokeWidth={2}
                                    fillOpacity={1}
                                    fill="url(#colorRefunds)"
                                    name="Refunds"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {/* Tabs */}
                <div className="flex gap-1 p-1 bg-[var(--color-bg-tertiary)] rounded-lg mb-6">
                    <button
                        onClick={() => setActiveTab('transactions')}
                        className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'transactions'
                                ? 'bg-[var(--color-bg-card)] text-[var(--color-text-primary)] shadow-sm'
                                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                            }`}
                    >
                        Transactions
                    </button>
                    <button
                        onClick={() => setActiveTab('refunds')}
                        className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'refunds'
                                ? 'bg-[var(--color-bg-card)] text-[var(--color-text-primary)] shadow-sm'
                                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                            }`}
                    >
                        Refunds
                    </button>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-4 mb-6 p-4 bg-[var(--color-bg-card)] rounded-lg border border-[var(--color-border)]">
                    <div className="flex-1 min-w-[200px]">
                        <div className="relative">
                            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--color-text-muted)]" />
                            <input
                                type="text"
                                placeholder="Search by restaurant, customer, or order ID..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-[var(--color-border)] rounded-lg bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)]/20"
                            />
                        </div>
                    </div>

                    {activeTab === 'transactions' ? (
                        <>
                            <select
                                value={paymentMethod}
                                onChange={(e) => setPaymentMethod(e.target.value)}
                                className="px-4 py-2 border border-[var(--color-border)] rounded-lg bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)]/20"
                            >
                                {paymentMethods.map(method => (
                                    <option key={method.value} value={method.value}>{method.label}</option>
                                ))}
                            </select>
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                                className="px-4 py-2 border border-[var(--color-border)] rounded-lg bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)]/20"
                            >
                                {transactionStatuses.map(status => (
                                    <option key={status.value} value={status.value}>{status.label}</option>
                                ))}
                            </select>
                        </>
                    ) : (
                        <select
                            value={refundStatus}
                            onChange={(e) => setRefundStatus(e.target.value)}
                            className="px-4 py-2 border border-[var(--color-border)] rounded-lg bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)]/20"
                        >
                            {refundStatuses.map(status => (
                                <option key={status.value} value={status.value}>{status.label}</option>
                            ))}
                        </select>
                    )}
                </div>

                {/* Transactions Table */}
                {activeTab === 'transactions' && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Recent Transactions</CardTitle>
                            <p className="text-sm text-[var(--color-text-muted)] mt-1">{filteredTransactions.length} transactions found</p>
                        </CardHeader>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-[var(--color-border)]">
                                        <th className="text-left p-4 font-medium text-[var(--color-text-secondary)]">Transaction ID</th>
                                        <th className="text-left p-4 font-medium text-[var(--color-text-secondary)]">Restaurant</th>
                                        <th className="text-left p-4 font-medium text-[var(--color-text-secondary)]">Customer</th>
                                        <th className="text-left p-4 font-medium text-[var(--color-text-secondary)]">Order</th>
                                        <th className="text-left p-4 font-medium text-[var(--color-text-secondary)]">Amount</th>
                                        <th className="text-left p-4 font-medium text-[var(--color-text-secondary)]">Method</th>
                                        <th className="text-left p-4 font-medium text-[var(--color-text-secondary)]">Status</th>
                                        <th className="text-left p-4 font-medium text-[var(--color-text-secondary)]">Time</th>
                                        <th className="text-left p-4 font-medium text-[var(--color-text-secondary)]">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredTransactions.map((transaction) => (
                                        <tr key={transaction.id} className="border-b border-[var(--color-border)] hover:bg-[var(--color-bg-tertiary)]/50 transition-colors">
                                            <td className="p-4">
                                                <div className="font-mono text-sm text-[var(--color-text-primary)]">{transaction.id}</div>
                                                <div className="text-xs text-[var(--color-text-muted)]">{transaction.transactionId}</div>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--color-accent-primary)] to-[var(--color-accent-secondary)] flex items-center justify-center text-white font-bold text-xs">
                                                        {transaction.restaurantName.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-[var(--color-text-primary)]">{transaction.restaurantName}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <User size={14} className="text-[var(--color-text-muted)]" />
                                                    <span className="text-[var(--color-text-primary)]">{transaction.customerName}</span>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="font-mono text-sm text-[var(--color-text-primary)]">{transaction.orderId}</div>
                                            </td>
                                            <td className="p-4">
                                                <div>
                                                    <div className="font-medium text-[var(--color-text-primary)]">₹{transaction.amount.toLocaleString()}</div>
                                                    {transaction.fees > 0 && (
                                                        <div className="text-xs text-[var(--color-text-muted)]">Fees: ₹{transaction.fees}</div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                {getPaymentMethodBadge(transaction.paymentMethod)}
                                            </td>
                                            <td className="p-4">
                                                {getStatusBadge(transaction.status)}
                                            </td>
                                            <td className="p-4">
                                                <div className="text-sm text-[var(--color-text-secondary)]">{formatDate(transaction.timestamp)}</div>
                                            </td>
                                            <td className="p-4">
                                                <Button
                                                    variant="ghost"
                                                    onClick={() => {
                                                        setSelectedTransaction(transaction);
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
                )}

                {/* Refunds Table */}
                {activeTab === 'refunds' && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Refund Requests</CardTitle>
                            <p className="text-sm text-[var(--color-text-muted)] mt-1">{filteredRefunds.length} refunds found</p>
                        </CardHeader>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-[var(--color-border)]">
                                        <th className="text-left p-4 font-medium text-[var(--color-text-secondary)]">Refund ID</th>
                                        <th className="text-left p-4 font-medium text-[var(--color-text-secondary)]">Restaurant</th>
                                        <th className="text-left p-4 font-medium text-[var(--color-text-secondary)]">Customer</th>
                                        <th className="text-left p-4 font-medium text-[var(--color-text-secondary)]">Original Amount</th>
                                        <th className="text-left p-4 font-medium text-[var(--color-text-secondary)]">Refund Amount</th>
                                        <th className="text-left p-4 font-medium text-[var(--color-text-secondary)]">Reason</th>
                                        <th className="text-left p-4 font-medium text-[var(--color-text-secondary)]">Status</th>
                                        <th className="text-left p-4 font-medium text-[var(--color-text-secondary)]">Initiated By</th>
                                        <th className="text-left p-4 font-medium text-[var(--color-text-secondary)]">Processed</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredRefunds.map((refund) => (
                                        <tr key={refund.id} className="border-b border-[var(--color-border)] hover:bg-[var(--color-bg-tertiary)]/50 transition-colors">
                                            <td className="p-4">
                                                <div className="font-mono text-sm text-[var(--color-text-primary)]">{refund.id}</div>
                                                {refund.refundId && (
                                                    <div className="text-xs text-[var(--color-text-muted)]">{refund.refundId}</div>
                                                )}
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--color-accent-primary)] to-[var(--color-accent-secondary)] flex items-center justify-center text-white font-bold text-xs">
                                                        {refund.restaurantName.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-[var(--color-text-primary)]">{refund.restaurantName}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <User size={14} className="text-[var(--color-text-muted)]" />
                                                    <span className="text-[var(--color-text-primary)]">{refund.customerName}</span>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="font-medium text-[var(--color-text-primary)]">₹{refund.originalAmount.toLocaleString()}</div>
                                            </td>
                                            <td className="p-4">
                                                <div className="font-medium text-[var(--color-accent-primary)]">₹{refund.refundAmount.toLocaleString()}</div>
                                            </td>
                                            <td className="p-4">
                                                <div className="max-w-[200px] truncate text-sm text-[var(--color-text-secondary)]">{refund.reason}</div>
                                            </td>
                                            <td className="p-4">
                                                {getStatusBadge(refund.status)}
                                            </td>
                                            <td className="p-4">
                                                <Badge variant={refund.initiatedBy === 'platform' ? 'error' : 'info'}>
                                                    {refund.initiatedBy}
                                                </Badge>
                                            </td>
                                            <td className="p-4">
                                                {refund.processedAt ? (
                                                    <div className="text-sm text-[var(--color-text-secondary)]">{formatDate(refund.processedAt)}</div>
                                                ) : (
                                                    <div className="text-sm text-[var(--color-text-muted)]">Not processed</div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                )}

                {/* Transaction Details Modal */}
                {showDetails && selectedTransaction && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-[var(--color-bg-card)] rounded-xl border border-[var(--color-border)] max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="p-6 border-b border-[var(--color-border)]">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xl font-semibold text-[var(--color-text-primary)]">Transaction Details</h3>
                                    <Button variant="ghost" onClick={() => setShowDetails(false)}>
                                        <X size={20} />
                                    </Button>
                                </div>
                            </div>
                            <div className="p-6 space-y-6">
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <h4 className="text-sm font-medium text-[var(--color-text-muted)] mb-2">Transaction Information</h4>
                                        <div className="space-y-2">
                                            <div className="flex justify-between">
                                                <span className="text-[var(--color-text-secondary)]">Transaction ID:</span>
                                                <span className="font-mono text-sm text-[var(--color-text-primary)]">{selectedTransaction.id}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-[var(--color-text-secondary)]">Gateway ID:</span>
                                                <span className="font-mono text-sm text-[var(--color-text-primary)]">{selectedTransaction.transactionId}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-[var(--color-text-secondary)]">Order ID:</span>
                                                <span className="font-mono text-sm text-[var(--color-text-primary)]">{selectedTransaction.orderId}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-[var(--color-text-secondary)]">Timestamp:</span>
                                                <span className="text-sm text-[var(--color-text-primary)]">{formatDate(selectedTransaction.timestamp)}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-medium text-[var(--color-text-muted)] mb-2">Financial Details</h4>
                                        <div className="space-y-2">
                                            <div className="flex justify-between">
                                                <span className="text-[var(--color-text-secondary)]">Gross Amount:</span>
                                                <span className="font-medium text-[var(--color-text-primary)]">₹{selectedTransaction.amount.toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-[var(--color-text-secondary)]">Processing Fees:</span>
                                                <span className="font-medium text-[var(--color-text-secondary)]">₹{selectedTransaction.fees.toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-[var(--color-text-secondary)]">Net Amount:</span>
                                                <span className="font-medium text-[var(--color-accent-primary)]">₹{selectedTransaction.netAmount.toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-[var(--color-text-secondary)]">Payment Method:</span>
                                                <div>{getPaymentMethodBadge(selectedTransaction.paymentMethod)}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-[var(--color-text-muted)] mb-2">Parties Involved</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="flex items-center gap-3 p-3 bg-[var(--color-bg-tertiary)] rounded-lg">
                                            <Store size={16} className="text-[var(--color-accent-primary)]" />
                                            <div>
                                                <div className="font-medium text-[var(--color-text-primary)]">{selectedTransaction.restaurantName}</div>
                                                <div className="text-xs text-[var(--color-text-muted)]">Restaurant</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 p-3 bg-[var(--color-bg-tertiary)] rounded-lg">
                                            <User size={16} className="text-[var(--color-accent-primary)]" />
                                            <div>
                                                <div className="font-medium text-[var(--color-text-primary)]">{selectedTransaction.customerName}</div>
                                                <div className="text-xs text-[var(--color-text-muted)]">Customer</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-[var(--color-text-muted)] mb-2">Status</h4>
                                    <div className="flex items-center gap-3">
                                        {getStatusBadge(selectedTransaction.status)}
                                        {selectedTransaction.status === 'FAILED' && (
                                            <div className="text-sm text-[var(--color-text-muted)]">
                                                Payment failed - no funds were transferred
                                            </div>
                                        )}
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
