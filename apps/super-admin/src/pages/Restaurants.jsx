import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Store, Globe, Mail, Phone, Calendar, Search, RefreshCw, MoreVertical, ExternalLink, Edit2, Trash2 } from 'lucide-react';
import { Card, CardHeader, CardTitle } from '../components/ui/Card';
import { StatCard } from '../components/ui/StatCard';
import { Badge } from '../components/ui/Badge';

export default function Restaurants({ openDrawer }) {
    const [restaurants, setRestaurants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchRestaurants();
    }, []);

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

    const filteredRestaurants = restaurants.filter(res =>
        res.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        res.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (res.contact_email && res.contact_email.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const stats = [
        { label: 'Total Restaurants', value: restaurants.length, icon: Store, color: 'purple' },
        { label: 'Active Status', value: restaurants.filter(r => r.status === 'active').length, icon: Globe, color: 'blue' },
        {
            label: 'Recently Added', value: restaurants.filter(r => {
                const date = new Date(r.created_at);
                const now = new Date();
                const diffDays = (now - date) / (1000 * 60 * 60 * 24);
                return diffDays <= 7;
            }).length, icon: Calendar, color: 'orange'
        }
    ];

    return (
        <div className="space-y-8">
            {/* Stats Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
                {stats.map((stat, i) => (
                    <StatCard key={i} {...stat} />
                ))}
            </div>

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
                    <button
                        onClick={fetchRestaurants}
                        className="btn-refresh"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            height: '46px',
                            whiteSpace: 'nowrap'
                        }}
                    >
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                        Sync Fleet
                    </button>
                </div>
            </Card>

            {/* Restaurants Table */}
            <div className="table-container">
                <table className="premium-table">
                    <thead>
                        <tr>
                            <th>Brand Identity</th>
                            <th>Status & Plan</th>
                            <th>Contact Direct</th>
                            <th>Onboarded</th>
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
                                <tr key={res.id}>
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
                                            <Badge variant={res.status === 'active' ? 'success' : 'warning'}>
                                                {res.status || 'Active'}
                                            </Badge>
                                            <span style={{ fontSize: '0.7rem', color: 'var(--accent-primary)', opacity: 0.8, fontWeight: 600 }}>PREMIUM PLAN</span>
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
                                                title="Edit Settings"
                                                onClick={() => openDrawer('restaurant', res, fetchRestaurants)}
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
