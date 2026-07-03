import React, { useRef, useState } from 'react';
import { X, Heart, Star, Clock, Users, View, Plus, Minus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import './ItemModal.css';

const ItemModal = ({ isOpen, onClose, item, favorites, onToggleFavorite }) => {
    const navigate = useNavigate();
    const { addToCart, removeFromCart, getItemQuantity } = useCart();
    
    const [activeImageIdx, setActiveImageIdx] = useState(0);
    const [selectedVariant, setSelectedVariant] = useState(item?.variants ? item.variants[0] : null);
    const [selectedAddons, setSelectedAddons] = useState([]);
    const imageSliderRef = useRef(null);

    if (!isOpen || !item) return null;

    const imgs = (item.images && item.images.length > 0) ? item.images : [item.image];
    const hasMany = imgs.length > 1;

    const getModalTotalPrice = () => {
        let total = item.price || 0;
        if (selectedVariant) total = selectedVariant.price;
        if (selectedAddons.length > 0) {
            total += selectedAddons.reduce((sum, addon) => sum + addon.price, 0);
        }
        return total;
    };

    return (
        <div className={`item-modal-overlay ${isOpen ? 'show' : ''}`} onClick={onClose}>
            <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>

                {/* Drag Indicator */}
                <div className="modal-drag-bar"></div>

                {/* Close Button */}
                <button className="modal-x-btn" onClick={onClose}>
                    <X size={18} />
                </button>

                <div className="modal-scrollable-content">
                    {/* Dish Slideshow */}
                    <div className="modal-dish-showcase">
                        <div
                            className="dish-slideshow-track"
                            ref={imageSliderRef}
                            onScroll={(e) => {
                                const el = e.currentTarget;
                                const idx = Math.round(el.scrollLeft / el.offsetWidth);
                                setActiveImageIdx(idx);
                            }}
                        >
                            {imgs.map((imgUrl, idx) => (
                                <div key={idx} className="dish-slide">
                                    <img src={imgUrl} alt={`${item.name} ${idx + 1}`} loading="lazy" />
                                </div>
                            ))}
                        </div>

                        {/* Dot indicators */}
                        {hasMany && (
                            <div className="dish-slide-dots">
                                {imgs.map((_, idx) => (
                                    <button
                                        key={idx}
                                        className={`dish-slide-dot${activeImageIdx === idx ? ' active' : ''}`}
                                        onClick={() => {
                                            setActiveImageIdx(idx);
                                            imageSliderRef.current?.scrollTo({ left: idx * imageSliderRef.current.offsetWidth, behavior: 'smooth' });
                                        }}
                                        aria-label={`Photo ${idx + 1}`}
                                    />
                                ))}
                            </div>
                        )}

                        <button
                            className="modal-fav-floating"
                            onClick={(e) => { e.stopPropagation(); onToggleFavorite(item.id); }}
                        >
                            <Heart
                                size={20}
                                fill={favorites.includes(item.id) ? '#8B3A1E' : 'transparent'}
                                color="#8B3A1E"
                            />
                        </button>
                        <div className="dish-rating-pill">
                            <Star size={12} fill="#8B3A1E" color="#8B3A1E" />
                            <span>{item.rating || '4.5'}</span>
                        </div>
                    </div>

                    {/* Dish Info */}
                    <div className="modal-dish-info">
                        <h2 className="dish-title">{item.name}</h2>

                        <div className="dish-meta-chips">
                            <span className="meta-chip"><Clock size={13} />{item.time || '15min'}</span>
                            <span className="meta-chip"><Users size={13} /> {item.serves || 1}</span>
                            {item.dietType === 'vegan' && (
                                <span className="meta-chip vegan">Vegan</span>
                            )}
                            {item.dietType === 'veg' && (
                                <span className="meta-chip green">Veg</span>
                            )}
                            {item.dietType === 'non-veg' && (
                                <span className="meta-chip red">Non-Veg</span>
                            )}
                        </div>

                        <p className="dish-full-desc">{item.description}</p>
                        
                        {item.modelUrl && (
                            <button 
                                className="view-ar-btn"
                                onClick={() => navigate(`/ar/${item.id}`, { state: { modelUrl: item.modelUrl } })}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    width: '100%',
                                    padding: '12px',
                                    marginTop: '16px',
                                    backgroundColor: '#f5ede9',
                                    color: '#8B3A1E',
                                    border: 'none',
                                    borderRadius: '12px',
                                    fontSize: '15px',
                                    fontWeight: '600',
                                    cursor: 'pointer'
                                }}
                            >
                                <View size={18} />
                                View in AR
                            </button>
                        )}
                    </div>

                    {item.variants && item.variants.length > 0 && (
                        <div className="modal-customization-section">
                            <div className="customization-title-container">
                                <h3 className="customization-title">Choose Variant</h3>
                                <span className="customization-badge required">Required</span>
                            </div>
                            <div className="customization-options-list">
                                {item.variants.map((v) => {
                                    const vKey = v._key ?? v.id ?? v.name;
                                    const selKey = selectedVariant?._key ?? selectedVariant?.id ?? selectedVariant?.name;
                                    const isActive = vKey !== undefined && vKey === selKey;
                                    return (
                                        <div
                                            key={vKey}
                                            className={`customization-option-row ${isActive ? 'active' : ''}`}
                                            onClick={() => setSelectedVariant(v)}
                                        >
                                            <div className="customization-option-left">
                                                <div className="custom-radio">
                                                    {isActive && <div className="custom-radio-inner" />}
                                                </div>
                                                <span className="customization-option-name">{v.name}</span>
                                            </div>
                                            <span className="customization-option-price">₹{v.price}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {item.addons && item.addons.length > 0 && (
                        <div className="modal-customization-section">
                            <div className="customization-title-container">
                                <h3 className="customization-title">Add-ons</h3>
                                <span className="customization-badge optional">Optional</span>
                            </div>
                            <div className="customization-options-list">
                                {item.addons.map((addon) => {
                                    const addonKey = addon._key ?? addon.id ?? addon.name;
                                    const isSelected = selectedAddons.some(a => (a._key ?? a.id ?? a.name) === addonKey);
                                    const handleToggleAddon = () => {
                                        if (isSelected) {
                                            setSelectedAddons(prev => prev.filter(a => (a._key ?? a.id ?? a.name) !== addonKey));
                                        } else {
                                            setSelectedAddons(prev => [...prev, addon]);
                                        }
                                    };
                                    return (
                                        <div
                                            key={addon.id || addonKey}
                                            className={`customization-option-row ${isSelected ? 'active' : ''}`}
                                            onClick={handleToggleAddon}
                                        >
                                            <div className="customization-option-left">
                                                <div className="custom-checkbox">
                                                    {isSelected && <div className="custom-checkbox-inner" />}
                                                </div>
                                                <span className="customization-option-name">{addon.name}</span>
                                            </div>
                                            <span className="customization-option-price">+₹{addon.price}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* Sticky Bottom Action Bar */}
                <div className="modal-bottom-bar">
                    <div className="price-display">
                        <span className="price-rupee">₹{getModalTotalPrice()}</span>
                    </div>

                    {(item.variants?.length > 0 || item.addons?.length > 0) ? (
                        <button
                            className="add-to-order-btn"
                            onClick={() => {
                                addToCart(item, selectedVariant, selectedAddons);
                                onClose();
                            }}
                        >
                            Add to Order {getItemQuantity(item.id) > 0 && `(${getItemQuantity(item.id)} in cart)`}
                        </button>
                    ) : getItemQuantity(item.id) === 0 ? (
                        <button
                            className="add-to-order-btn"
                            onClick={() => {
                                addToCart(item);
                            }}
                        >
                            Add to Order
                        </button>
                    ) : (
                        <div className="qty-stepper">
                            <button
                                className="stepper-btn"
                                onClick={() => removeFromCart(item.id)}
                            >
                                <Minus size={18} />
                            </button>
                            <span className="stepper-count">{getItemQuantity(item.id)}</span>
                            <button
                                className="stepper-btn"
                                onClick={() => addToCart(item)}
                            >
                                <Plus size={18} />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ItemModal;
