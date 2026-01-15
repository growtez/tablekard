import { AlertCircle, Search, RefreshCw } from 'lucide-react';
import { useUsers } from '../hooks/useUsers';
import { UserRole } from '@restaurant-saas/types';

const getRoleBadge = (role: string) => {
    switch (role) {
        case UserRole.SUPER_ADMIN:
            return <span className="badge warning">Super Admin</span>;
        case UserRole.RESTAURANT_ADMIN:
            return <span className="badge info">Restaurant Admin</span>;
        case UserRole.DELIVERY_PERSONNEL:
            return <span className="badge neutral">Driver</span>;
        default:
            return <span className="badge">{role}</span>;
    }
};

export default function Users() {
    const { users, loading, error, updateRole, refresh } = useUsers();

    if (loading) {
        return (
            <div className="p-8 flex justify-center items-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <>
            <header className="page-header flex items-center justify-between">
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Users</h1>
                    <p className="text-secondary" style={{ fontSize: '0.875rem' }}>
                        Manage platform users and roles
                    </p>
                </div>
                <button className="btn btn-ghost" onClick={refresh}>
                    <RefreshCw size={18} />
                </button>
            </header>

            <div className="page-content animate-fadeIn">
                {error && (
                    <div className="p-4 mb-4 text-red-700 bg-red-100 rounded-lg flex items-center gap-sm">
                        <AlertCircle size={20} />
                        {error}
                    </div>
                )}

                <div className="card">
                    {/* Search Bar */}
                    <div className="p-4 border-b border-border flex items-center gap-sm">
                        <div className="search-input-wrapper flex-1 max-w-md">
                            <Search className="search-icon" size={18} />
                            <input
                                type="text"
                                placeholder="Search users by name or email..."
                                className="search-input"
                            />
                        </div>
                    </div>

                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>User</th>
                                    <th>Role</th>
                                    <th>Status</th>
                                    <th>Joined</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="text-center p-8 text-secondary">
                                            No users found
                                        </td>
                                    </tr>
                                ) : (
                                    users.map((user) => (
                                        <tr key={user.uid}>
                                            <td>
                                                <div className="flex items-center gap-sm">
                                                    <div className="avatar">
                                                        <div className="avatar-fallback">
                                                            {user.name?.charAt(0) || user.email?.charAt(0)}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="font-medium">{user.name || 'Unknown'}</div>
                                                        <div className="text-muted text-sm">{user.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>{getRoleBadge(user.role)}</td>
                                            <td>
                                                <span className="badge success">Active</span>
                                            </td>
                                            <td>
                                                {user.createdAt ? new Date(user.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}
                                            </td>
                                            <td>
                                                <select
                                                    className="form-input text-sm py-1"
                                                    value={user.role}
                                                    onChange={(e) => updateRole(user.uid, e.target.value)}
                                                    style={{ width: 'auto' }}
                                                >
                                                    <option value={UserRole.CUSTOMER}>Customer</option>
                                                    <option value={UserRole.RESTAURANT_ADMIN}>Restaurant Admin</option>
                                                    <option value={UserRole.DELIVERY_PERSONNEL}>Driver</option>
                                                    <option value={UserRole.SUPER_ADMIN}>Super Admin</option>
                                                </select>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </>
    );
}
