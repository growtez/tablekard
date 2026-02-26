import { Link } from 'react-router-dom';
import { Search, Plus, Bell, ChevronDown, Menu } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function TopBar({ onMenuClick }: { onMenuClick?: () => void }) {
    const { userProfile, signOut } = useAuth();

    return (
        <header className="top-bar">
            {/* Left: Global Search & Menu Toggle */}
            <div className="flex items-center gap-md">
                <button
                    className="btn-icon"
                    onClick={onMenuClick}
                    title="Toggle Menu"
                    style={{ color: 'var(--color-text-secondary)' }}
                >
                    <Menu size={20} />
                </button>
                <div className="top-bar-search">
                    <Search size={18} className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search restaurants, users, or settings..."
                        className="search-input"
                    />
                </div>
            </div>

            {/* Right: Actions & Profile */}
            <div className="top-bar-actions">
                <button className="btn-icon notification-btn">
                    <Bell size={20} />
                    <span className="notification-badge">3</span>
                </button>

                <div className="profile-dropdown">
                    <button className="profile-btn flex items-center gap-sm">
                        <div className="avatar">
                            {userProfile?.name?.charAt(0) || 'A'}
                        </div>
                        <span className="profile-name">{userProfile?.name || 'Admin'}</span>
                        <ChevronDown size={16} className="text-muted" />
                    </button>
                    {/* Simplified dropdown for now */}
                    <div className="dropdown-menu">
                        <Link to="/settings" className="dropdown-item">Settings</Link>
                        <button onClick={signOut} className="dropdown-item">Logout</button>
                    </div>
                </div>
            </div>
        </header>
    );
}
