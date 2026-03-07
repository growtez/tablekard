import { AlertCircle, Search, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { useUsers } from '../hooks/useUsers';
import { UserRole } from '@restaurant-saas/types';
import { PageHeader } from '../components/ui/PageHeader';
import { Button } from '../components/ui/Button';

const getRoleBadge = (role: string) => {
    switch (role) {
        case UserRole.SUPER_ADMIN:
            return <span className="badge warning">Super Admin</span>;
        case UserRole.RESTAURANT_ADMIN:
            return <span className="badge info">Restaurant Admin</span>;
        case UserRole.RESTAURANT_STAFF:
            return <span className="badge neutral">Restaurant Staff</span>;
        default:
            return <span className="badge">{role}</span>;
    }
};

export default function Users() {
    const { users, loading, error, updateRole, refresh } = useUsers();
    const [globalFilter, setGlobalFilter] = useState('');

    if (loading) {
        return (
            <div className="p-8 flex justify-center items-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <>
            <PageHeader
                title="Users"
                actions={
                    <Button variant="ghost" onClick={refresh}>
                        <RefreshCw size={18} />
                    </Button>
                }
            />

            <div className="page-content animate-fadeIn">
                {error && (
                    <div className="p-4 mb-4 text-red-700 bg-red-100 rounded-lg flex items-center gap-sm">
                        <AlertCircle size={20} />
                        {error}
                    </div>
                )}

                <div className="card">
                    {/* Search Bar */}
                    <div className="p-4 border-b border-border flex justify-center">
                        <div className="flex-1 flex justify-center">
                            <div className="flex items-center gap-3 bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-xl p-3 w-full max-w-xs">
                                <Search className="text-[var(--color-text-muted)] shrink-0" size={16} />
                                <input
                                    type="text"
                                    placeholder="Search users by name or email..."
                                    value={globalFilter ?? ''}
                                    onChange={(e) => setGlobalFilter(e.target.value)}
                                    className="bg-transparent border-none outline-none text-sm text-[var(--color-text-primary)] w-full"
                                />
                            </div>
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
                                {users.filter((user) => {
                                    if (!globalFilter) return true;
                                    const q = globalFilter.toLowerCase();
                                    return user.name?.toLowerCase().includes(q) || user.email?.toLowerCase().includes(q);
                                }).length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="text-center p-8 text-secondary">
                                            No users found
                                        </td>
                                    </tr>
                                ) : (
                                    users.filter((user) => {
                                        if (!globalFilter) return true;
                                        const q = globalFilter.toLowerCase();
                                        return user.name?.toLowerCase().includes(q) || user.email?.toLowerCase().includes(q);
                                    }).map((user) => (
                                        <tr key={user.id}>
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
                                                {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                                            </td>
                                            <td>
                                                <select
                                                    className="form-input text-sm py-1"
                                                    value={user.role}
                                                    onChange={(e) => updateRole(user.id, e.target.value)}
                                                    style={{ width: 'auto' }}
                                                >
                                                    <option value={UserRole.CUSTOMER}>Customer</option>
                                                    <option value={UserRole.RESTAURANT_ADMIN}>Restaurant Admin</option>
                                                    <option value={UserRole.RESTAURANT_STAFF}>Restaurant Staff</option>
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