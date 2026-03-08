import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Store, Globe, Mail, Phone, Calendar, Search, RefreshCw, MoreVertical, ExternalLink, Edit2, Trash2, Filter, SlidersHorizontal, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Card, CardHeader, CardTitle } from '../components/ui/Card';
import { StatCard } from '../components/ui/StatCard';
import { Badge } from '../components/ui/Badge';

export default function Restaurants({ openDrawer, setSyncAction }) {
    const navigate = useNavigate();
    const [restaurants, setRestaurants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [sortBy, setSortBy] = useState('newest');
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchRestaurants();
    }, []);

    useEffect(() => {
        if (setSyncAction) {
            setSyncAction({
                onSync: fetchRestaurants,
                loading: loading
            });
        }
    }, [loading, setSyncAction]);

    const fetchRestaurants = async () => {
        setLoading(true);
        setError(null);
        try {
            const { data, error } = await supabase
                .from('restaurants')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setRestaurants(data || []);
        } catch (err) {
            console.error('Failed to fetch restaurants:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const deleteRestaurant = async (id) => {
        if (!window.confirm('Are you sure you want to delete this restaurant? This cannot be undone.')) return;

        try {
            const { error } = await supabase
                .from('restaurants')
                .delete()
                .eq('id', id);

            if (error) throw error;
            setRestaurants(prev => prev.filter(r => r.id !== id));
        } catch (err) {
            alert('Failed to delete restaurant: ' + err.message);
        }
    };

    const filteredRestaurants = restaurants
        .filter(res => {
            const matchesSearch = res.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                res.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (res.contact_email && res.contact_email.toLowerCase().includes(searchQuery.toLowerCase()));

            const matchesFilter = filterStatus === 'all' || res.status === filterStatus;

            return matchesSearch && matchesFilter;
        })
        .sort((a, b) => {
            if (sortBy === 'newest') return new Date(b.created_at) - new Date(a.created_at);
            if (sortBy === 'oldest') return new Date(a.created_at) - new Date(b.created_at);
            if (sortBy === 'name') return a.name.localeCompare(b.name);
            if (sortBy === 'status') return (a.status || '').localeCompare(b.status || '');
        });

    const toggleSort = (newSort) => {
        if (sortBy === newSort) {
            setSortBy(newSort === 'newest' ? 'oldest' : newSort === 'name' ? 'newest' : 'newest');
        } else {
            setSortBy(newSort);
        }
    };

    const getSortIcon = (field) => {
        if (sortBy === field) return <ArrowUp size={14} />;
        if (field === 'newest' && sortBy === 'oldest') return <ArrowDown size={14} />;
        return <ArrowUpDown size={14} style={{ opacity: 0.3 }} />;
    };

    return (
        <div className="space-y-8">
            {/* List Control */}
            <Card>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                        <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={18} />
                        <input
                            type="text"
                            placeholder="Search by name, slug, or contact email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '12px 12px 12px 42px',
                                background: 'var(--surface-hover)',
                                border: '1px solid var(--border-color)',
                                borderRadius: '12px',
                                color: 'white',
                                fontSize: '0.9rem'
                            }}
                        />
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <div className="dropdown-wrapper">
                            <button className={`btn-ghost ${filterStatus !== 'all' ? 'active-filter' : ''}`} style={{ padding: '10px 16px', borderRadius: '12px', background: filterStatus !== 'all' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(255,255,255,0.05)', border: `1px solid ${filterStatus !== 'all' ? 'var(--accent-primary)' : 'var(--border-color)'}`, gap: '8px', fontSize: '0.9rem', color: filterStatus !== 'all' ? 'var(--accent-primary)' : 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                                <Filter size={18} />
                                {filterStatus === 'all' ? 'Filter' : `Status: ${filterStatus}`}
                            </button>
                            <div className="dropdown-content">
                                {['all', 'active', 'pending', 'suspended', 'approved'].map(status => (
                                    <button key={status} onClick={() => setFilterStatus(status)} className={filterStatus === status ? 'active' : ''}>
                                        {status.charAt(0).toUpperCase() + status.slice(1)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="dropdown-wrapper">
                            <button className="btn-ghost" style={{ padding: '10px 16px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', gap: '8px', fontSize: '0.9rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                                <SlidersHorizontal size={18} />
                                {sortBy === 'newest' ? 'Sort By' : `Sorted: ${sortBy}`}
                            </button>
                            <div className="dropdown-content">
                                <button onClick={() => setSortBy('newest')} className={sortBy === 'newest' ? 'active' : ''}>Newest First</button>
                                <button onClick={() => setSortBy('oldest')} className={sortBy === 'oldest' ? 'active' : ''}>Oldest First</button>
                                <button onClick={() => setSortBy('name')} className={sortBy === 'name' ? 'active' : ''}>Brand Name (A-Z)</button>
                                <button onClick={() => setSortBy('status')} className={sortBy === 'status' ? 'active' : ''}>Current Status</button>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Restaurants Table */}
            <div className="table-container">
                <table className="premium-table">
                    <thead>
                        <tr>
                            <th className="sortable-header" onClick={() => toggleSort('name')}>
                                <div className="flex items-center gap-2">
                                    Name {getSortIcon('name')}
                                </div>
                            </th>
                            <th className="sortable-header" onClick={() => toggleSort('status')}>
                                <div className="flex items-center gap-2">
                                    Status & Plan {getSortIcon('status')}
                                </div>
                            </th>
                            <th>Contacts</th>
                            <th className="sortable-header" onClick={() => toggleSort('newest')}>
                                <div className="flex items-center gap-2">
                                    Onboarded {getSortIcon('newest')}
                                </div>
                            </th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="5" style={{ textAlign: 'center', padding: '4rem' }}>
                                    <div className="loader" style={{ margin: '0 auto' }}></div>
                                    <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Scanning restaurant records...</p>
                                </td>
                            </tr>
                        ) : filteredRestaurants.length === 0 ? (
                            <tr>
                                <td colSpan="5" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                                    No restaurants found matching your criteria.
                                </td>
                            </tr>
                        ) : (
                            filteredRestaurants.map((res) => (
                                <tr
                                    key={res.id}
                                    className="clickable-row"
                                    onClick={(e) => {
                                        // Don't navigate if clicking action buttons or the menu
                                        if (e.target.closest('.actions-cell') || e.target.closest('.action-trigger') || e.target.closest('.actions-menu')) {
                                            return;
                                        }
                                        navigate(`/restaurants/${res.id}`);
                                    }}
                                >
                                    <td>
                                        <div className="user-cell">
                                            <div className="user-avatar" style={{ borderRadius: '10px', background: 'var(--surface-hover)', border: '1px solid var(--border-color)' }}>
                                                {res.name[0].toUpperCase()}
                                            </div>
                                            <div className="user-info-text">
                                                <span className="user-name" style={{ fontSize: '1rem' }}>{res.name}</span>
                                                <span className="user-email" style={{ fontSize: '0.75rem', opacity: 0.6 }}>/{res.slug}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                            <Badge variant={res.status === 'active' ? 'success' : res.status === 'pending' ? 'warning' : 'error'}>
                                                {(res.status || 'pending').toUpperCase()}
                                            </Badge>
                                            <span style={{ fontSize: '0.7rem', color: res.subscription_status ? 'var(--accent-primary)' : 'var(--text-muted)', opacity: 0.8, fontWeight: 600 }}>
                                                {(res.subscription_type || (res.subscription_status ? 'PRO PLAN' : 'TRIAL PLAN')).toUpperCase()}
                                            </span>
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
                                                <Mail size={12} className="text-muted" />
                                                <span>{res.contact_email || 'N/A'}</span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
                                                <Phone size={12} className="text-muted" />
                                                <span>{res.contact_phone || 'N/A'}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                            <Calendar size={14} />
                                            {new Date(res.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </div>
                                    </td>
                                    <td className="actions-cell">
                                        <button className="action-trigger">
                                            <MoreVertical size={18} />
                                        </button>
                                        <div className="actions-menu">
                                            <a
                                                href={`https://${res.slug}.tablekard.com`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="action-btn edit"
                                                title="Visit Website"
                                            >
                                                <ExternalLink size={14} />
                                            </a>
                                            <button
                                                className="action-btn edit"
                                                title="View Details & Edit"
                                                onClick={() => navigate(`/restaurants/${res.id}`, { state: { edit: true } })}
                                            >
                                                <Edit2 size={14} />
                                            </button>
                                            <button
                                                className="action-btn delete"
                                                title="De-list Restaurant"
                                                onClick={() => deleteRestaurant(res.id)}
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
