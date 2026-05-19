import React, { useState, useEffect } from 'react';
import { ArrowLeft, Star, Send, ThumbsUp, Edit3, Calendar, ShoppingBag, ChevronRight, Loader2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getOrderHistory, submitFeedback } from '../services/supabaseService';
import { supabase } from '@restaurant-saas/supabase';
import './feedback.css';

const FeedbackPage = () => {
    const navigate = useNavigate();
    const { orderId: paramOrderId } = useParams();
    const { user, isAuthenticated } = useAuth();

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrderId, setSelectedOrderId] = useState(paramOrderId || null);
    const [isEditing, setIsEditing] = useState(false);

    // Rating form states
    const [rating, setRating] = useState(0);
    const [hoveredRating, setHoveredRating] = useState(0);
    const [feedback, setFeedback] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // 1. Fetch Real Orders
    const fetchOrders = async () => {
        if (!user) return;
        try {
            setLoading(true);
            const data = await getOrderHistory(user.id);
            // Filter only orders that are ready, served, or completed for review
            setOrders(data.filter(o => 
                ['ready', 'READY', 'served', 'SERVED', 'completed', 'COMPLETED'].includes(o.status)
            ));
        } catch (err) {
            console.error('Error fetching orders for feedback:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isAuthenticated && user) {
            fetchOrders();

            // 2. Real-time Subscription for Feedback table
            const channel = supabase
                .channel('realtime-feedback')
                .on(
                    'postgres_changes',
                    { event: '*', schema: 'public', table: 'feedback', filter: `user_id=eq.${user.id}` },
                    () => {
                        fetchOrders(); // Re-fetch orders to get updated feedback
                    }
                )
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        }
    }, [isAuthenticated, user]);

    // Handle initial selection from URL params
    useEffect(() => {
        if (paramOrderId && orders.length > 0) {
            const order = orders.find(o => o.id === paramOrderId || o.order_number === paramOrderId);
            if (order) {
                setSelectedOrderId(order.id);
                if (order.rating) {
                    setRating(order.rating);
                    setFeedback(order.comment || '');
                    setIsEditing(false);
                } else {
                    setIsEditing(true);
                }
            }
        }
    }, [paramOrderId, orders]);

    const handleOrderSelect = (order) => {
        setSelectedOrderId(order.id);
        if (order.rating) {
            setRating(order.rating);
            setFeedback(order.comment || '');
            setIsEditing(false);
        } else {
            setRating(0);
            setFeedback('');
            setIsEditing(true);
        }
    };

    const handleSubmit = async () => {
        if (rating > 0 && selectedOrderId && user) {
            try {
                setIsSubmitting(true);
                await submitFeedback({
                    orderId: selectedOrderId,
                    userId: user.id,
                    rating,
                    comment: feedback
                });
                setSubmitted(true);
            } catch (err) {
                console.error('Error submitting feedback:', err);
                alert('Failed to submit feedback. Please try again.');
            } finally {
                setIsSubmitting(false);
            }
        }
    };

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-IN', { 
            day: '2-digit', 
            month: 'short', 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    };

    if (loading && orders.length === 0) {
        return (
            <div className="feedback-page-container">
                <div className="feedback-page-loading">
                    <Loader2 size={40} className="spin-animation" color="#8B3A1E" />
                    <p>Loading your orders...</p>
                </div>
            </div>
        );
    }

    if (submitted) {
        return (
            <div className="feedback-page-container">
                <div className="feedback-page-success">
                    <div className="feedback-page-success-icon">
                        <ThumbsUp size={48} />
                    </div>
                    <h2>Feedback Received!</h2>
                    <p>Thank you for rating your order. It helps us serve you better.</p>

                    <div className="feedback-success-actions">
                        <button className="feedback-page-btn-primary" onClick={() => {
                            setSubmitted(false);
                            setSelectedOrderId(null);
                            navigate('/feedback');
                        }}>
                            <ShoppingBag size={18} />
                            Review Other Orders
                        </button>

                        <button className="feedback-page-btn-secondary" onClick={() => navigate('/')}>
                            Back to Home
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // View: List of all orders to review
    if (!selectedOrderId) {
        return (
            <div className="feedback-page-container">
                <header className="feedback-page-header">
                    <button className="global-back-btn" onClick={() => navigate(-1)}>
                        <ArrowLeft size={22} />
                    </button>
                    <h1>Order Feedback</h1>
                    <div className="feedback-page-spacer"></div>
                </header>

                <div className="feedback-page-content">
                    {orders.length === 0 ? (
                        <div className="feedback-empty-state">
                            <p>Select a completed order to share your dining experience.</p>
                        </div>
                    ) : (
                        <div className="feedback-order-list">
                            {orders.map(order => (
                                <div
                                    key={order.id}
                                    className={`feedback-order-card ${order.rating ? 'reviewed' : ''}`}
                                    onClick={() => handleOrderSelect(order)}
                                >
                                    <div className="feedback-order-main">
                                        <div className="feedback-order-info">
                                            <span className="feedback-order-id">#{order.order_number}</span>
                                            <span className="feedback-order-date">
                                                <Calendar size={12} /> {formatDate(order.created_at)}
                                            </span>
                                        </div>
                                        <div className="feedback-order-status">
                                            {order.rating ? (
                                                <span className="status-tag reviewed">Reviewed</span>
                                            ) : (
                                                <span className="status-tag pending">Rate Now</span>
                                            )}
                                            <ChevronRight size={18} />
                                        </div>
                                    </div>
                                    <div className="feedback-order-items-wrapper">
                                        <p className="feedback-order-items">
                                            {order.order_items?.slice(0, 3).map(i => i.name).join(', ')}
                                            {order.order_items?.length > 3 && (
                                                <span className="items-more-tag"> +{order.order_items.length - 3} more</span>
                                            )}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // View: Detail View (Form or Summary)
    const currentOrder = orders.find(o => o.id === selectedOrderId);
    const showSummary = currentOrder?.rating && !isEditing;

    return (
        <div className="feedback-page-container">
            <header className="feedback-page-header">
                <button className="global-back-btn" onClick={() => setSelectedOrderId(null)}>
                    <ArrowLeft size={22} />
                </button>
                <h1>{showSummary ? 'Review Details' : 'Rate Order'}</h1>
                <div className="feedback-page-spacer"></div>
            </header>

            <div className="feedback-page-content">
                <div className="feedback-active-order-label">
                    <span>Order #{currentOrder?.order_number}</span>
                </div>

                {showSummary ? (
                    <div className="feedback-page-review-card">
                        <div className="feedback-page-review-header">
                            <div className="feedback-page-review-stars">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                        key={star}
                                        size={20}
                                        fill={rating >= star ? '#8B3A1E' : 'transparent'}
                                        color="#8B3A1E"
                                    />
                                ))}
                            </div>
                            <span className="feedback-page-review-date">{formatDate(currentOrder.created_at)}</span>
                        </div>

                        <p className="feedback-page-review-text">{feedback ? `"${feedback}"` : "No comments shared."}</p>

                        <button
                            className="feedback-page-edit-btn"
                            onClick={() => setIsEditing(true)}
                        >
                            <Edit3 size={16} />
                            Edit Your Review
                        </button>
                    </div>
                ) : (
                    <>
                        <section className="feedback-page-section">
                            <h2 className="feedback-page-section-title">
                                <Star size={20} />
                                Overall Rating
                            </h2>
                            <div className="feedback-page-stars-container">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        className={`feedback-page-star ${(hoveredRating || rating) >= star ? 'active' : ''}`}
                                        onClick={() => setRating(star)}
                                        onMouseEnter={() => setHoveredRating(star)}
                                        onMouseLeave={() => setHoveredRating(0)}
                                    >
                                        <Star size={36} fill={(hoveredRating || rating) >= star ? '#8B3A1E' : 'transparent'} color="#8B3A1E" />
                                    </button>
                                ))}
                            </div>
                        </section>

                        <section className="feedback-page-section">
                            <h2 className="feedback-page-section-title">Your Comments</h2>
                            <textarea
                                className="feedback-page-textarea"
                                placeholder="What did you think of the food and service?"
                                value={feedback}
                                onChange={(e) => setFeedback(e.target.value)}
                                rows={4}
                            />
                        </section>

                        <div className="feedback-page-footer">
                            <button
                                className={`feedback-page-submit-btn ${rating > 0 ? 'active' : ''}`}
                                onClick={handleSubmit}
                                disabled={rating === 0 || isSubmitting}
                            >
                                {isSubmitting ? (
                                    <Loader2 size={18} className="spin-animation" />
                                ) : (
                                    <Send size={18} />
                                )}
                                {currentOrder?.rating ? 'Update Review' : 'Submit Review'}
                            </button>
                            {isEditing && currentOrder?.rating && (
                                <button
                                    className="feedback-page-cancel-btn"
                                    onClick={() => setIsEditing(false)}
                                >
                                    Cancel
                                </button>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default FeedbackPage;
