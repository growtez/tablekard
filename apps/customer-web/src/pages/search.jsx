import React, { useState, useEffect } from 'react';
import { Search, ArrowLeft, Heart, Star, Clock, X, Plus, Minus } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import './search.css';

const SearchPage = () => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState([]);

    // Dish Modal States
    const [selectedItem, setSelectedItem] = useState(null);
    const [showItemModal, setShowItemModal] = useState(false);
    const [modalQuantity, setModalQuantity] = useState(0);

    // Mock data for search
    const allItems = [
        {
            id: 'popular1',
            name: 'Margherita Pizza',
            price: 168,
            time: '25min',
            rating: 4.9,
            serves: 'Serves 2',
            description: 'A timeless Italian masterpiece. Hand-stretched sourdough base topped with rich San Marzano tomato sauce, fresh buffalo mozzarella, and aromatic basil leaves.',
            image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&h=400&fit=crop'
        },
        {
            id: 'popular2',
            name: 'Chicken Tikka Masala',
            price: 198,
            time: '30min',
            rating: 4.8,
            serves: 'Serves 1',
            description: 'Experience a burst of authentic Indian spices. Succulent chicken pieces marinated in yogurt and spices, simmered in a creamy, mildly spicy tomato-based gravy.',
            image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&h=400&fit=crop'
        },
        {
            id: 'popular3',
            name: 'Chocolate Lava Cake',
            price: 568,
            time: '15min',
            rating: 4.9,
            serves: 'Serves 1',
            description: 'The ultimate dessert indulgence. A warm dark chocolate cake with a soft, gooey molten chocolate center that flows out with every bite.',
            image: 'https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=400&h=400&fit=crop'
        },
        {
            id: 'popular4',
            name: 'Classic Caesar Salad',
            price: 120,
            time: '10min',
            rating: 4.7,
            serves: 'Serves 1',
            description: 'Fresh, crisp heads of romaine lettuce tossed in our signature creamy Caesar dressing. Loaded with herb-infused croutons and generous shavings of aged Parmesan cheese.',
            image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=400&fit=crop'
        },
        {
            id: 'featured1',
            name: 'Special Sushi Platter',
            price: 24.99,
            time: '20 min',
            rating: 4.9,
            serves: 'Serves 1-2',
            description: 'A curated selection of premium seafood, including fresh Atlantic salmon nigiri, spicy tuna rolls, and delicate cucumber maki.',
            image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400&h=400&fit=crop'
        },
        {
            id: 'featured2',
            name: 'Grilled Salmon Fillet',
            price: 15.99,
            time: '15 min',
            rating: 4.8,
            serves: 'Serves 1',
            description: 'Heart-healthy Atlantic salmon fillet, seasoned with a blend of Mediterranean herbs and lemon zest.',
            image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=400&h=400&fit=crop'
        }
    ];

    useEffect(() => {
        if (searchTerm.trim() === '') {
            setResults([]);
        } else {
            const filtered = allItems.filter(item =>
                item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.description.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setResults(filtered);
        }
    }, [searchTerm]);

    const handleItemClick = (item) => {
        setSelectedItem(item);
        setModalQuantity(0);
        setShowItemModal(true);
    };

    const closeItemModal = () => {
        setShowItemModal(false);
    };

    return (
        <div className="search-page-container">
            {/* Search Header */}
            <header className="search-header">
                <button className="back-btn" onClick={() => navigate(-1)}>
                    <ArrowLeft size={24} color="#1A1A1A" />
                </button>
                <div className="search-bar-wrapper">
                    <Search className="search-icon" size={20} color="#B8ADA9" />
                    <input
                        type="text"
                        placeholder="Search your favourite food"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        autoFocus
                        className="main-search-input"
                    />
                    {searchTerm && (
                        <button className="clear-btn" onClick={() => setSearchTerm('')}>
                            <X size={18} color="#B8ADA9" />
                        </button>
                    )}
                </div>
            </header>

            {/* Results Section */}
            <main className="search-main">
                {searchTerm === '' ? (
                    <div className="search-placeholder">
                        <div className="search-illustration">
                            <img src="/assets/search-illustration.png" alt="Search for food" />
                        </div>
                        <h3>Search for your cravings</h3>
                        <p>Try searching for "Pizza", "Sushi" or "Cake"</p>
                    </div>
                ) : results.length > 0 ? (
                    <div className="results-grid">
                        <p className="results-count">{results.length} results found for "{searchTerm}"</p>
                        {results.map(item => (
                            <div key={item.id} className="search-result-card" onClick={() => handleItemClick(item)}>
                                <div className="result-image">
                                    <img src={item.image} alt={item.name} />
                                    <div className="result-rating">
                                        <Star size={10} fill="#FFD700" color="#FFD700" />
                                        <span>{item.rating}</span>
                                    </div>
                                </div>
                                <div className="result-info">
                                    <div className="result-header">
                                        <h3>{item.name}</h3>
                                        <Heart size={18} color="#8B3A1E" />
                                    </div>
                                    <p className="result-desc">{item.description}</p>
                                    <div className="result-footer">
                                        <span className="result-price">₹{item.price}</span>
                                        <span className="result-time">
                                            <Clock size={12} /> {item.time}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="search-no-results">
                        <div className="search-illustration">
                            <img src="/assets/no-results-illustration.png" alt="No results found" />
                        </div>
                        <h3>No results found</h3>
                        <p>We couldn't find anything matching "{searchTerm}"</p>
                    </div>
                )}
            </main>

            {/* Dish Modal (Same design as home/menu) */}
            {showItemModal && selectedItem && (
                <div className="item-modal-overlay" onClick={closeItemModal}>
                    <div className="item-modal-content slide-up" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header-info">
                            <h2 className="modal-item-name">{selectedItem.name}</h2>
                            <button className="modal-close-btn" onClick={closeItemModal}>
                                <X size={20} />
                            </button>
                        </div>

                        <div className="modal-main-image">
                            <img src={selectedItem.image} alt={selectedItem.name} />
                        </div>

                        <div className="modal-content-section">
                            <div className="modal-serves-info">{selectedItem.serves}</div>

                            <div className="modal-time-rating-row">
                                <div className="modal-time-rating-left">
                                    <div className="modal-item-time">
                                        <Clock size={16} />
                                        <span>{selectedItem.time}</span>
                                    </div>
                                    <div className="modal-rating-section">
                                        <Star size={16} fill="#FFD700" color="#FFD700" />
                                        <span>{selectedItem.rating}</span>
                                    </div>
                                </div>

                                {modalQuantity === 0 ? (
                                    <button
                                        className="modal-main-add-btn"
                                        onClick={() => setModalQuantity(1)}
                                    >
                                        ADD
                                    </button>
                                ) : (
                                    <div className="modal-quantity-controls">
                                        <button
                                            className="modal-qty-btn"
                                            onClick={() => setModalQuantity(prev => Math.max(0, prev - 1))}
                                        >
                                            <Minus size={16} />
                                        </button>
                                        <span className="modal-qty-value">{modalQuantity}</span>
                                        <button
                                            className="modal-qty-btn"
                                            onClick={() => setModalQuantity(prev => prev + 1)}
                                        >
                                            <Plus size={16} />
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="modal-main-price">₹{selectedItem.price}</div>
                            <p className="modal-main-description">{selectedItem.description}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SearchPage;
