import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Sidebar from '../../components/sidebar';
import { getRestaurantById } from '../../services/supabaseService';
import type { Restaurant } from '@restaurant-saas/types';
import { BuildingIcon, UserCircleIcon, PhoneIcon, MailIcon, MapPinIcon, CreditCardIcon, Bell } from 'lucide-react';
import './profile.css';

const ProfilePage: React.FC = () => {
    const { userProfile, activeRestaurantId, memberships } = useAuth();
    const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Get the specific membership for the active restaurant
    const activeMembership = memberships.find(m => m.restaurantId === activeRestaurantId);

    useEffect(() => {
        const fetchRestaurantDetails = async () => {
            if (!activeRestaurantId) {
                setIsLoading(false);
                return;
            }

            try {
                setIsLoading(true);
                setError(null);
                const data = await getRestaurantById(activeRestaurantId);
                setRestaurant(data);
            } catch (err: any) {
                console.error('Error fetching restaurant context:', err);
                setError('Failed to load restaurant details. Please try again.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchRestaurantDetails();
    }, [activeRestaurantId]);

    if (isLoading) {
        return (
            <div className="profile-container">
                <Sidebar />
                <div className="profile-main-content">
                    <div className="profile-loading">
                        <div className="profile-loading-spinner"></div>
                        <p>Loading profile information...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="profile-container">
            <Sidebar />
            
            <div className="profile-main-content">
                {/* Header */}
                <div className="profile-header">
                    <div>
                        <h1 className="profile-page-title">Restaurant Profile</h1>
                        <p className="profile-page-subtitle">Manage your restaurant specifics and administrator details</p>
                    </div>
                    <div className="profile-header-right">
                        <div className="profile-icon-button">
                            <Bell size={20} color="#718096" />
                        </div>
                        <div className="order-user-avatar">👨‍💼</div>
                    </div>
                </div>

                {error && (
                    <div className="error-container">
                        <span>⚠️</span> {error}
                    </div>
                )}

                <div className="profile-content-grid">
                    {/* Restaurant Details Card */}
                    {restaurant && (
                        <div className="profile-card">
                            <div className="profile-card-header">
                                <div className="profile-icon-wrapper">
                                    <BuildingIcon size={20} />
                                </div>
                                <h2>Restaurant Information</h2>
                            </div>

                            <div className="profile-info-list">
                                <div className="profile-info-item">
                                    <span className="profile-info-label">Restaurant Name</span>
                                    <span className="profile-info-value">{restaurant.name}</span>
                                </div>

                                <div className="profile-info-item">
                                    <span className="profile-info-label">Status</span>
                                    <span className={`status-badge ${restaurant.status?.toLowerCase()}`}>
                                        {restaurant.status || 'Unknown'}
                                    </span>
                                </div>

                                <div className="profile-info-item">
                                    <span className="profile-info-label">Contact Email</span>
                                    <span className="profile-info-value">
                                        {restaurant.contact?.email || 'N/A'}
                                    </span>
                                </div>

                                <div className="profile-info-item">
                                    <span className="profile-info-label">Contact Phone</span>
                                    <span className="profile-info-value">
                                        {restaurant.contact?.phone || 'N/A'}
                                    </span>
                                </div>

                                <div className="profile-info-item">
                                    <span className="profile-info-label">Address</span>
                                    <span className="profile-info-value">
                                        {restaurant.contact?.address || 'N/A'}
                                    </span>
                                </div>

                                <div className="profile-info-item">
                                    <span className="profile-info-label">Subscription Status</span>
                                    <span className="profile-info-value">
                                        {restaurant.subscriptionStatus ? 'Active' : 'Inactive'}
                                        {restaurant.subscriptionType ? ` (${restaurant.subscriptionType})` : ''}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Admin/User Details Card */}
                    <div className="profile-card">
                        <div className="profile-card-header">
                            <div className="profile-icon-wrapper">
                                <UserCircleIcon size={20} />
                            </div>
                            <h2>Administrator Details</h2>
                        </div>

                        <div className="profile-info-list">
                            <div className="profile-info-item">
                                <span className="profile-info-label">Full Name</span>
                                <span className="profile-info-value">
                                    {userProfile?.name || 'Admin User'}
                                </span>
                            </div>

                            <div className="profile-info-item">
                                <span className="profile-info-label">Email Address</span>
                                <span className="profile-info-value">
                                    {userProfile?.email || 'N/A'}
                                </span>
                            </div>

                            <div className="profile-info-item">
                                <span className="profile-info-label">Global Role</span>
                                <span className={`status-badge admin`}>
                                    {(userProfile?.role || 'User').replace('_', ' ')}
                                </span>
                            </div>

                            {activeMembership && (
                                <div className="profile-info-item">
                                    <span className="profile-info-label">Restaurant Access Role</span>
                                    <span className="status-badge active">
                                        {activeMembership.role || 'Staff'}
                                    </span>
                                </div>
                            )}

                            <div className="profile-info-item">
                                <span className="profile-info-label">Account ID</span>
                                <span className="profile-info-value" style={{ fontSize: '12px', fontFamily: 'monospace', color: '#718096', overflow: 'hidden', textOverflow: 'ellipsis' }} title={userProfile?.id}>
                                    {userProfile?.id || 'N/A'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;