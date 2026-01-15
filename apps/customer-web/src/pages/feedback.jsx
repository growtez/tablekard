import React, { useState, useEffect } from 'react';
import { ArrowLeft, Star, Send, MessageSquare, ThumbsUp, Edit3, Calendar, ShoppingBag, ChevronRight } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import './feedback.css';

const FeedbackPage = () => {
    const navigate = useNavigate();
    const { orderId: paramOrderId } = useParams();

    // Hardcoded orders for demonstration
    const orders = [
        {
            id: '#ORD-9901',
            date: '10 Jan / 02:30 PM',
            items: ['Margherita Pizza', 'Caesar Salad'],
            total: 3568,
            status: 'completed',
            isReviewed: false
        },
        {
            id: '#ORD-9844',
            date: '08 Jan / 12:15 PM',
            items: ['Grilled Salmon', 'Orange Juice'],
            total: 728,
            status: 'completed',
            isReviewed: true,
            review: {
                rating: 5,
                text: "Excellent service and amazing food!",
                categories: { food: 5, service: 5, ambiance: 4, speed: 5 }
            }
        },
        {
            id: '#ORD-9801',
            date: '05 Jan / 07:45 PM',
            items: ['Chef Special Omakase'],
            total: 4500,
        },
        {
            id: '#ORD-9700',
            date: '04 Jan / 09:15 PM',
            items: [
                'Butter Chicken',
                'Garlic Naan (2)',
                'Dal Makhani',
                'Jeera Rice',
                'Paneer Tikka',
                'Mango Lassi (3)',
                'Gulab Jamun (4)',
                'Raita'
            ],
            total: 2850,
            status: 'completed',
            isReviewed: false
        }
    ];

    const [selectedOrderId, setSelectedOrderId] = useState(paramOrderId || null);
    const [isEditing, setIsEditing] = useState(false);

    // Rating form states
    const [rating, setRating] = useState(0);
    const [hoveredRating, setHoveredRating] = useState(0);
    const [feedback, setFeedback] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [categoryRatings, setCategoryRatings] = useState({});

    const categories = [
        { id: 'food', label: 'Food Quality', emoji: '🍽️' },
        { id: 'service', label: 'Service', emoji: '👨‍🍳' },
        { id: 'ambiance', label: 'Ambiance', emoji: '✨' },
        { id: 'speed', label: 'Speed', emoji: '⚡' },
    ];

    useEffect(() => {
        if (paramOrderId) {
            const order = orders.find(o => o.id === paramOrderId);
            if (order && order.isReviewed) {
                setRating(order.review.rating);
                setFeedback(order.review.text);
                setCategoryRatings(order.review.categories);
            }
        }
    }, [paramOrderId]);

    const handleOrderSelect = (order) => {
        setSelectedOrderId(order.id);
        if (order.isReviewed) {
            setRating(order.review.rating);
            setFeedback(order.review.text);
            setCategoryRatings(order.review.categories);
            setIsEditing(false);
        } else {
            setRating(0);
            setFeedback('');
            setCategoryRatings({});
            setIsEditing(true);
        }
    };

    const handleSubmit = () => {
        if (rating > 0) {
            setSubmitted(true);
            // In a real app, you'd send this to your backend
        }
    };

    if (submitted) {
        return (
            <div className="feedback-page-container">
                <div className="feedback-page-success">
                    <div className="feedback-page-success-icon">
                        <ThumbsUp size={48} />
                    </div>
                    <h2>Feedback Received!</h2>
                    <p>Thank you for rating Order {selectedOrderId}. It helps us serve you better.</p>

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
                    <button className="feedback-page-back-btn" onClick={() => navigate(-1)}>
                        <ArrowLeft size={22} />
                    </button>
                    <h1>Order Feedback</h1>
                    <div className="feedback-page-spacer"></div>
                </header>

                <div className="feedback-page-content">
                    <div className="feedback-page-info-box">
                        <ShoppingBag size={20} />
                        <p>Select a completed order to share your dining experience.</p>
                    </div>

                    <div className="feedback-order-list">
                        {orders.map(order => (
                            <div
                                key={order.id}
                                className={`feedback-order-card ${order.isReviewed ? 'reviewed' : ''}`}
                                onClick={() => handleOrderSelect(order)}
                            >
                                <div className="feedback-order-main">
                                    <div className="feedback-order-info">
                                        <span className="feedback-order-id">{order.id}</span>
                                        <span className="feedback-order-date">
                                            <Calendar size={12} /> {order.date}
                                        </span>
                                    </div>
                                    <div className="feedback-order-status">
                                        {order.isReviewed ? (
                                            <span className="status-tag reviewed">Reviewed</span>
                                        ) : (
                                            <span className="status-tag pending">Rate Now</span>
                                        )}
                                        <ChevronRight size={18} />
                                    </div>
                                </div>
                                <div className="feedback-order-items-wrapper">
                                    <p className="feedback-order-items">
                                        {order.items.slice(0, 3).join(', ')}
                                        {order.items.length > 3 && (
                                            <span className="items-more-tag"> +{order.items.length - 3} more</span>
                                        )}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // View: Detail View (Form or Summary)
    const currentOrder = orders.find(o => o.id === selectedOrderId);
    const showSummary = currentOrder?.isReviewed && !isEditing;

    return (
        <div className="feedback-page-container">
            <header className="feedback-page-header">
                <button className="feedback-page-back-btn" onClick={() => setSelectedOrderId(null)}>
                    <ArrowLeft size={22} />
                </button>
                <h1>{showSummary ? 'Review Details' : 'Rate Order'}</h1>
                <div className="feedback-page-spacer"></div>
            </header>

            <div className="feedback-page-content">
                <div className="feedback-active-order-label">
                    <span>Order {selectedOrderId}</span>
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
                            <span className="feedback-page-review-date">{currentOrder.date}</span>
                        </div>

                        <p className="feedback-page-review-text">"{feedback}"</p>

                        <div className="feedback-page-review-categories">
                            {categories.map(cat => (
                                <div key={cat.id} className="feedback-page-review-chip">
                                    <span>{cat.emoji}</span>
                                    <span>{cat.label}: {categoryRatings[cat.id] || 0}/5</span>
                                </div>
                            ))}
                        </div>

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
                            <h2 className="feedback-page-section-title">Rate Categories</h2>
                            <div className="feedback-page-categories">
                                {categories.map((category) => (
                                    <div key={category.id} className="feedback-page-category-card">
                                        <div className="feedback-page-category-info">
                                            <span className="feedback-page-category-emoji">{category.emoji}</span>
                                            <span className="feedback-page-category-label">{category.label}</span>
                                        </div>
                                        <div className="feedback-page-category-stars">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <button
                                                    key={star}
                                                    className="feedback-page-mini-star"
                                                    onClick={() => {
                                                        const newRatings = { ...categoryRatings, [category.id]: star };
                                                        setCategoryRatings(newRatings);
                                                    }}
                                                >
                                                    <Star
                                                        size={18}
                                                        fill={(categoryRatings[category.id] || 0) >= star ? '#8B3A1E' : 'transparent'}
                                                        color="#8B3A1E"
                                                    />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
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
                                disabled={rating === 0}
                            >
                                <Send size={18} />
                                {currentOrder?.isReviewed ? 'Update Review' : 'Submit Review'}
                            </button>
                            {isEditing && currentOrder?.isReviewed && (
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
