import { useState } from 'react';
import {
    DollarSign,
    TrendingUp,
    Users,
    Store,
    CheckCircle,
    X,
    Plus,
    Edit,
    Trash2,
    Crown,
    Zap,
    Shield,
    Star,
    CreditCard,
    RefreshCw,
    Search,
    Filter
} from 'lucide-react';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { PageHeader } from '../components/ui/PageHeader';
import { StatCard } from '../components/ui/StatCard';
import { Card, CardHeader, CardTitle } from '../components/ui/Card';

// Static Data
const pricingPlans = [
    {
        id: 1,
        name: 'Starter',
        price: 999,
        billingCycle: 'monthly',
        description: 'Perfect for small restaurants just getting started',
        icon: Store,
        color: 'blue',
        features: [
            'Up to 50 tables',
            'Basic QR menu generation',
            'Order management',
            'Customer support (email)',
            'Basic analytics',
            'Mobile app access'
        ],
        limitations: [
            'No advanced analytics',
            'Limited customization',
            'Email support only'
        ],
        activeSubscriptions: 45,
        revenue: 44955,
        status: 'active'
    },
    {
        id: 2,
        name: 'Professional',
        price: 2499,
        billingCycle: 'monthly',
        description: 'Ideal for growing restaurants with multiple locations',
        icon: TrendingUp,
        color: 'purple',
        features: [
            'Up to 200 tables',
            'Advanced QR menu with customization',
            'Complete order management',
            'Priority support (email + phone)',
            'Advanced analytics & insights',
            'Mobile app access',
            'API access',
            'Custom branding',
            'Staff management',
            'Inventory tracking'
        ],
        limitations: [
            'Limited API calls',
            'No white-label options'
        ],
        activeSubscriptions: 128,
        revenue: 319872,
        status: 'active',
        popular: true
    },
    {
        id: 3,
        name: 'Enterprise',
        price: 5999,
        billingCycle: 'monthly',
        description: 'Complete solution for large restaurant chains',
        icon: Crown,
        color: 'gold',
        features: [
            'Unlimited tables',
            'Fully customizable QR menu system',
            'Complete order & delivery management',
            '24/7 dedicated support',
            'Enterprise-grade analytics',
            'Mobile app access',
            'Unlimited API access',
            'White-label options',
            'Advanced staff management',
            'Complete inventory system',
            'Multi-location management',
            'Custom integrations',
            'Dedicated account manager'
        ],
        limitations: [],
        activeSubscriptions: 23,
        revenue: 137977,
        status: 'active'
    },
    {
        id: 4,
        name: 'Custom',
        price: null,
        billingCycle: 'custom',
        description: 'Tailored solutions for specific requirements',
        icon: Zap,
        color: 'green',
        features: [
            'All Enterprise features',
            'Custom feature development',
            'On-premise deployment option',
            'SLA guarantees',
            'Custom training programs'
        ],
        limitations: [],
        activeSubscriptions: 5,
        revenue: 150000,
        status: 'active'
    }
];

const planMetrics = [
    {
        label: 'Total Revenue',
        value: '₹6,52,804',
        change: '+28%',
        positive: true,
        icon: DollarSign,
        color: 'green'
    },
    {
        label: 'Active Subscriptions',
        value: '201',
        change: '+15%',
        positive: true,
        icon: Users,
        color: 'blue'
    },
    {
        label: 'Average Revenue/Plan',
        value: '₹3,247',
        change: '+12%',
        positive: true,
        icon: TrendingUp,
        color: 'purple'
    },
    {
        label: 'Conversion Rate',
        value: '18.5%',
        change: '+5%',
        positive: true,
        icon: Star,
        color: 'orange'
    }
];

const subscriptionHistory = [
    {
        id: 'SUB-001',
        restaurantName: 'Spice Garden',
        planName: 'Professional',
        amount: 2499,
        status: 'active',
        startDate: '2024-01-15',
        nextBilling: '2024-04-15',
        autoRenew: true
    },
    {
        id: 'SUB-002',
        restaurantName: 'Biryani House',
        planName: 'Starter',
        amount: 999,
        status: 'active',
        startDate: '2024-02-01',
        nextBilling: '2024-05-01',
        autoRenew: true
    },
    {
        id: 'SUB-003',
        restaurantName: 'Tandoori Nights',
        planName: 'Enterprise',
        amount: 5999,
        status: 'cancelled',
        startDate: '2023-08-20',
        endDate: '2024-02-20',
        autoRenew: false
    },
    {
        id: 'SUB-004',
        restaurantName: 'Curry Palace',
        planName: 'Professional',
        amount: 2499,
        status: 'active',
        startDate: '2023-12-10',
        nextBilling: '2024-03-10',
        autoRenew: true
    },
    {
        id: 'SUB-005',
        restaurantName: 'Masala Dhaba',
        planName: 'Custom',
        amount: 15000,
        status: 'active',
        startDate: '2024-01-01',
        nextBilling: '2024-04-01',
        autoRenew: true
    }
];

export default function PricingPlans() {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [showAddPlan, setShowAddPlan] = useState(false);
    const [editingPlan, setEditingPlan] = useState<any>(null);

    const filteredPlans = pricingPlans.filter(plan => {
        const matchesSearch = plan.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            plan.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'all' || plan.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    const filteredSubscriptions = subscriptionHistory.filter(sub => {
        const matchesSearch = sub.restaurantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            sub.planName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'all' || sub.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'active':
                return <Badge variant="success">Active</Badge>;
            case 'cancelled':
                return <Badge variant="error">Cancelled</Badge>;
            case 'trial':
                return <Badge variant="info">Trial</Badge>;
            default:
                return <Badge>{status}</Badge>;
        }
    };

    const getPlanIcon = (iconName: string) => {
        switch (iconName) {
            case 'Store': return Store;
            case 'TrendingUp': return TrendingUp;
            case 'Crown': return Crown;
            case 'Zap': return Zap;
            default: return Store;
        }
    };

    const getPlanColor = (color: string) => {
        switch (color) {
            case 'blue': return 'from-blue-500 to-blue-600';
            case 'purple': return 'from-purple-500 to-purple-600';
            case 'gold': return 'from-yellow-500 to-orange-500';
            case 'green': return 'from-green-500 to-green-600';
            default: return 'from-gray-500 to-gray-600';
        }
    };

    return (
        <>
            <PageHeader
                className="page-header"
                title="Pricing Plans"
                description="Manage subscription plans and pricing for your restaurant platform."
                actions={
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" title="Refresh">
                            <RefreshCw size={18} />
                        </Button>
                        <Button onClick={() => setShowAddPlan(true)} className="flex items-center gap-2">
                            <Plus size={18} />
                            Add Plan
                        </Button>
                    </div>
                }
            />

            <div className="page-content animate-fadeIn">
                {/* Stats Grid */}
                <div className="stats-grid">
                    {planMetrics.map((metric) => (
                        <StatCard
                            key={metric.label}
                            label={metric.label}
                            value={metric.value}
                            icon={metric.icon}
                            color={metric.color}
                        />
                    ))}
                </div>

                {/* Pricing Plans Grid */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">Available Plans</h2>
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--color-text-muted)]" />
                                <input
                                    type="text"
                                    placeholder="Search plans..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 pr-4 py-2 border border-[var(--color-border)] rounded-lg bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)]/20"
                                />
                            </div>
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="px-4 py-2 border border-[var(--color-border)] rounded-lg bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)]/20"
                            >
                                <option value="all">All Plans</option>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {filteredPlans.map((plan) => {
                            const Icon = getPlanIcon(plan.icon);
                            return (
                                <Card key={plan.id} className={`relative ${plan.popular ? 'ring-2 ring-[var(--color-accent-primary)]' : ''}`}>
                                    {plan.popular && (
                                        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                                            <Badge variant="info" className="px-3 py-1">
                                                Most Popular
                                            </Badge>
                                        </div>
                                    )}
                                    <CardHeader className="text-center">
                                        <div className={`w-16 h-16 mx-auto rounded-xl bg-gradient-to-br ${getPlanColor(plan.color)} flex items-center justify-center text-white mb-4`}>
                                            <Icon size={24} />
                                        </div>
                                        <h3 className="text-xl font-bold text-[var(--color-text-primary)]">{plan.name}</h3>
                                        <div className="mt-2">
                                            {plan.price ? (
                                                <div className="flex items-baseline justify-center">
                                                    <span className="text-3xl font-bold text-[var(--color-text-primary)]">₹{plan.price.toLocaleString()}</span>
                                                    <span className="text-sm text-[var(--color-text-muted)] ml-2">/{plan.billingCycle}</span>
                                                </div>
                                            ) : (
                                                <div className="text-xl font-bold text-[var(--color-accent-primary)]">Custom Pricing</div>
                                            )}
                                        </div>
                                        <p className="text-sm text-[var(--color-text-secondary)] mt-2">{plan.description}</p>
                                    </CardHeader>
                                    <div className="p-4">
                                        <div className="space-y-3 mb-4">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-[var(--color-text-secondary)]">Active Subscriptions</span>
                                                <span className="font-medium text-[var(--color-text-primary)]">{plan.activeSubscriptions}</span>
                                            </div>
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-[var(--color-text-secondary)]">Monthly Revenue</span>
                                                <span className="font-medium text-[var(--color-accent-primary)]">₹{plan.revenue.toLocaleString()}</span>
                                            </div>
                                        </div>
                                        <div className="space-y-2 mb-4">
                                            <h4 className="text-sm font-medium text-[var(--color-text-primary)]">Features</h4>
                                            {plan.features.slice(0, 3).map((feature, idx) => (
                                                <div key={idx} className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                                                    <CheckCircle size={14} className="text-green-500 flex-shrink-0" />
                                                    <span>{feature}</span>
                                                </div>
                                            ))}
                                            {plan.features.length > 3 && (
                                                <div className="text-xs text-[var(--color-text-muted)]">+{plan.features.length - 3} more features</div>
                                            )}
                                        </div>
                                        <div className="flex gap-2">
                                            <Button variant="ghost" size="sm" onClick={() => setEditingPlan(plan)}>
                                                <Edit size={14} />
                                            </Button>
                                            <Button variant="ghost" size="sm" className="text-red-500">
                                                <Trash2 size={14} />
                                            </Button>
                                        </div>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                </div>

                {/* Recent Subscriptions */}
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Subscriptions</CardTitle>
                        <p className="text-sm text-[var(--color-text-muted)] mt-1">Latest plan changes and subscriptions</p>
                    </CardHeader>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-[var(--color-border)]">
                                    <th className="text-left p-4 font-medium text-[var(--color-text-secondary)]">Subscription ID</th>
                                    <th className="text-left p-4 font-medium text-[var(--color-text-secondary)]">Restaurant</th>
                                    <th className="text-left p-4 font-medium text-[var(--color-text-secondary)]">Plan</th>
                                    <th className="text-left p-4 font-medium text-[var(--color-text-secondary)]">Amount</th>
                                    <th className="text-left p-4 font-medium text-[var(--color-text-secondary)]">Status</th>
                                    <th className="text-left p-4 font-medium text-[var(--color-text-secondary)]">Start Date</th>
                                    <th className="text-left p-4 font-medium text-[var(--color-text-secondary)]">Next Billing</th>
                                    <th className="text-left p-4 font-medium text-[var(--color-text-secondary)]">Auto Renew</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredSubscriptions.map((subscription) => (
                                    <tr key={subscription.id} className="border-b border-[var(--color-border)] hover:bg-[var(--color-bg-tertiary)]/50 transition-colors">
                                        <td className="p-4">
                                            <div className="font-mono text-sm text-[var(--color-text-primary)]">{subscription.id}</div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--color-accent-primary)] to-[var(--color-accent-secondary)] flex items-center justify-center text-white font-bold text-xs">
                                                    {subscription.restaurantName.charAt(0)}
                                                </div>
                                                <div className="font-medium text-[var(--color-text-primary)]">{subscription.restaurantName}</div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="font-medium text-[var(--color-text-primary)]">{subscription.planName}</div>
                                        </td>
                                        <td className="p-4">
                                            <div className="font-medium text-[var(--color-text-primary)]">₹{subscription.amount.toLocaleString()}</div>
                                        </td>
                                        <td className="p-4">
                                            {getStatusBadge(subscription.status)}
                                        </td>
                                        <td className="p-4">
                                            <div className="text-sm text-[var(--color-text-secondary)]">{subscription.startDate}</div>
                                        </td>
                                        <td className="p-4">
                                            <div className="text-sm text-[var(--color-text-secondary)]">
                                                {subscription.nextBilling || subscription.endDate || '-'}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <Badge variant={subscription.autoRenew ? 'success' : 'error'}>
                                                {subscription.autoRenew ? 'Yes' : 'No'}
                                            </Badge>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>

            {/* Add/Edit Plan Modal */}
            {(showAddPlan || editingPlan) && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-[var(--color-bg-card)] rounded-xl border border-[var(--color-border)] max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-[var(--color-border)]">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-semibold text-[var(--color-text-primary)]">
                                    {editingPlan ? 'Edit Plan' : 'Add New Plan'}
                                </h3>
                                <Button variant="ghost" onClick={() => {
                                    setShowAddPlan(false);
                                    setEditingPlan(null);
                                }}>
                                    <X size={20} />
                                </Button>
                            </div>
                        </div>
                        <div className="p-6">
                            <div className="text-center text-[var(--color-text-muted)]">
                                Plan creation form would go here with fields for:
                                <ul className="mt-4 space-y-2 text-sm">
                                    <li>• Plan name and description</li>
                                    <li>• Pricing and billing cycle</li>
                                    <li>• Features and limitations</li>
                                    <li>• Plan icon and color theme</li>
                                    <li>• Usage limits and restrictions</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
