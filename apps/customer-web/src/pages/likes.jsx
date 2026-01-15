import React, { useState } from 'react';
import { ArrowLeft, Heart, Star, Trash2, ShoppingCart, Plus, Minus, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './likes.css';

const LikesPage = () => {
    const navigate = useNavigate();

    const [favorites, setFavorites] = useState([
        {
            id: 1,
            name: 'Margherita Pizza',
            description: 'Fresh tomatoes, mozzarella, basil',
            price: 168,
            rating: 4.9,
            serves: '2',
            image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=300&h=300&fit=crop',
        },
        {
            id: 2,
            name: 'Caesar Salad',
            description: 'Romaine lettuce, parmesan, croutons',
            price: 120,
            rating: 4.7,
            serves: '1',
            image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=300&h=300&fit=crop',
        },
        {
            id: 3,
            name: 'Grilled Salmon',
            description: 'Atlantic salmon with herbs & lemon',
            price: 450,
            rating: 4.9,
            serves: '1',
            image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=300&h=300&fit=crop',
        },
        {
            id: 4,
            name: 'Lava Cake',
            description: 'Molten chocolate center with cream',
            price: 180,
            rating: 4.8,
            serves: '1',
            image: 'https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=300&h=300&fit=crop',
        },
    ]);

    const [cart, setCart] = useState({});

    const removeFavorite = (id) => {
        setFavorites(prev => prev.filter(item => item.id !== id));
    };

    const addToCart = (id) => {
        setCart(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
    };

    const removeFromCart = (id) => {
        setCart(prev => {
            const newCart = { ...prev };
            if (newCart[id] > 1) {
                newCart[id]--;
            } else {
                delete newCart[id];
            }
            return newCart;
        });
    };

    const totalItems = Object.values(cart).reduce((a, b) => a + b, 0);

    return (
        <div className="likes-page-container">
            {/* Header */}
            <header className="likes-page-header">
                <button className="likes-page-back-btn" onClick={() => navigate(-1)}>
                    <ArrowLeft size={22} />
                </button>
                <h1 className="likes-page-title">Favourites</h1>
                <div className="likes-page-count-badge">
                    <span>{favorites.length}</span>
                    <Heart size={18} fill="#FFFFFF" color="#FFFFFF" />
                </div>
            </header>

            {/* Content */}
            <div className="likes-page-content">
                {favorites.length === 0 ? (
                    <div className="likes-page-empty">
                        <div className="likes-page-empty-icon">
                            <Heart size={48} />
                        </div>
                        <h3>No favorites yet</h3>
                        <p>Start adding dishes you love!</p>
                        <button className="likes-page-browse-btn" onClick={() => navigate('/menu')}>
                            Browse Menu
                        </button>
                    </div>
                ) : (
                    <div className="likes-page-grid">
                        {favorites.map(item => (
                            <div key={item.id} className="likes-page-card">
                                {/* Remove Button */}
                                <button
                                    className="likes-page-remove-btn"
                                    onClick={() => removeFavorite(item.id)}
                                >
                                    <Trash2 size={16} />
                                </button>

                                {/* Image */}
                                <div className="likes-page-image">
                                    <img src={item.image} alt={item.name} />
                                </div>

                                {/* Info */}
                                <div className="likes-page-info">
                                    <h3 className="likes-page-name">{item.name}</h3>
                                    <p className="likes-page-desc">{item.description}</p>

                                    <div className="likes-page-meta">
                                        <span className="likes-page-meta-item rating">
                                            <Star size={12} fill="#8B3A1E" color="#8B3A1E" />
                                            {item.rating}
                                        </span>
                                        <span className="likes-page-meta-item serves">
                                            <Users size={12} />
                                            Serves {item.serves}
                                        </span>
                                    </div>
                                </div>

                                {/* Footer */}
                                <div className="likes-page-card-footer">
                                    <span className="likes-page-price">₹{item.price}</span>

                                    {cart[item.id] ? (
                                        <div className="likes-page-qty-control">
                                            <button onClick={() => removeFromCart(item.id)}>
                                                <Minus size={14} />
                                            </button>
                                            <span>{cart[item.id]}</span>
                                            <button onClick={() => addToCart(item.id)}>
                                                <Plus size={14} />
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            className="likes-page-add-btn"
                                            onClick={() => addToCart(item.id)}
                                        >
                                            <Plus size={16} />
                                            Add
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Cart Indicator */}
            {totalItems > 0 && (
                <div className="likes-page-cart-bar" onClick={() => navigate('/orders')}>
                    <div className="likes-page-cart-info">
                        <ShoppingCart size={20} />
                        <span>{totalItems} item{totalItems > 1 ? 's' : ''} added</span>
                    </div>
                    <span className="likes-page-cart-action">View Cart →</span>
                </div>
            )}
        </div>
    );
};

export default LikesPage;
