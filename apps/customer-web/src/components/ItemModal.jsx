import React, { useRef, useState, useEffect } from 'react';
import { X, Heart, Star, Clock, Users, View, Plus, Minus, ChevronDown, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import './ItemModal.css';

const ItemModal = ({ isOpen, onClose, item, favorites, onToggleFavorite, initialStep = 1, onVariantSheetChange }) => {
    const navigate = useNavigate();
    const { addToCart, removeFromCart, getItemQuantity, cartItems } = useCart();

    const [activeImageIdx, setActiveImageIdx] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);
    const imageSliderRef = useRef(null);

    // Step 2: Variant/Addon selector sheet state
    const [animateIn, setAnimateIn] = useState(false);
    const [showVariantSheet, setShowVariantSheet] = useState(false);
    const [selectedVariant, setSelectedVariant] = useState(null);
    const [selectedAddons, setSelectedAddons] = useState([]);

    // Lock body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            document.documentElement.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
            document.documentElement.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
            document.documentElement.style.overflow = '';
        };
    }, [isOpen]);

    // Reset state when item changes or modal opens
    useEffect(() => {
        if (item && isOpen) {
            setActiveImageIdx(0);
            
            // Small timeout to allow mount before triggering CSS transitions
            setTimeout(() => {
                setAnimateIn(true);
                if (initialStep === 2) {
                    setShowVariantSheet(true);
                    if (onVariantSheetChange) onVariantSheetChange(true);
                }
            }, 10);
            
            // Pre-select the cheapest variant
            if (item.variants && item.variants.length > 0) {
                const cheapest = [...item.variants].sort((a, b) => a.price - b.price)[0];
                setSelectedVariant(cheapest);
            } else {
                setSelectedVariant(null);
            }
            setSelectedAddons([]);
        } else {
            setAnimateIn(false);
            setShowVariantSheet(false);
            if (onVariantSheetChange) onVariantSheetChange(false);
        }
    }, [item, isOpen, initialStep]);

    if (!isOpen || !item) return null;

    const imgs = (item.images && item.images.length > 0) ? item.images : [item.image];
    const hasMany = imgs.length > 1;
    const hasVariantsOrAddons = (item.variants?.length > 0) || (item.addons?.length > 0);

    // Price calculations
    const getDisplayPrice = () => {
        if (item.variants && item.variants.length > 0) {
            return Math.min(...item.variants.map(v => v.price));
        }
        return item.price || 0;
    };

    const getVariantSheetTotal = () => {
        let total = selectedVariant ? selectedVariant.price : (item.price || 0);
        if (selectedAddons.length > 0) {
            total += selectedAddons.reduce((sum, addon) => sum + addon.price, 0);
        }
        return total;
    };

    const getSelectedCompositeId = () => {
        const variantId = selectedVariant ? selectedVariant.id : '';
        return `${item.id}_${variantId}`;
    };

    const selectedQuantity = hasVariantsOrAddons
        ? (cartItems.find(i => i.id === getSelectedCompositeId())?.quantity || 0)
        : getItemQuantity(item.id);

    // Total quantity across ALL variants for this base item
    const baseItemTotalQty = cartItems
        .filter(i => i.menuItemId === item.id || i.id === item.id || i.id.startsWith(item.id + '_'))
        .reduce((sum, i) => sum + i.quantity, 0);

    const handleToggleFavorite = (e) => {
        e.stopPropagation();
        setIsAnimating(true);
        onToggleFavorite(item.id);
        setTimeout(() => setIsAnimating(false), 300);
    };

    // Step 1: Add to Cart clicked
    const handleAddToCart = () => {
        if (hasVariantsOrAddons) {
            // Open variant/addon sheet (Step 2)
            // Reset addons, keep pre-selected variant
            setSelectedAddons([]);
            if (item.variants && item.variants.length > 0) {
                const cheapest = [...item.variants].sort((a, b) => a.price - b.price)[0];
                setSelectedVariant(cheapest);
            }
            setShowVariantSheet(true);
            if (onVariantSheetChange) onVariantSheetChange(true);
        } else {
            // No variants/addons — add directly
            addToCart(item);
        }
    };

    // Step 2: Confirm add from variant sheet
    const handleConfirmAdd = () => {
        addToCart(item, selectedVariant, selectedAddons);
    };

    const handleBack = () => {
        if (initialStep === 2) {
            handleClose();
        } else {
            setShowVariantSheet(false);
            if (onVariantSheetChange) onVariantSheetChange(false);
        }
    };

    // Close entire modal
    const handleClose = () => {
        setShowVariantSheet(false);
        if (onVariantSheetChange) onVariantSheetChange(false);
        onClose();
    };

    return (
        <div className={`item-modal-overlay ${animateIn ? 'show' : ''}`} onClick={handleClose}>
            <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>

                {/* Drag Indicator */}
                <div className="modal-drag-bar"></div>

                {/* Close Button */}
                <button className="modal-x-btn" onClick={handleClose}>
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
                            className={`modal-fav-floating ${isAnimating ? 'animate-pop' : ''}`}
                            onClick={handleToggleFavorite}
                        >
                            <Heart
                                size={20}
                                fill={favorites.includes(item.id) ? '#8B3A1E' : 'transparent'}
                                color="#8B3A1E"
                            />
                        </button>
                        <div className="dish-rating-pill">
                            <Star size={10} fill="#8B3A1E" color="#8B3A1E" />
                            <span>{item.rating || '4.5'}</span>
                        </div>
                    </div>

                    {/* Dish Info — Full Detail */}
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
                </div>

                {/* Sticky Bottom Action Bar — Step 1 */}
                <div className="modal-bottom-bar">
                    <div className="price-display">
                        <span className="price-label-total">Price</span>
                        <span className="price-rupee">₹{getDisplayPrice()}</span>
                        {item.variants && item.variants.length > 0 && (
                            <span className="price-starts-from" style={{ alignSelf: 'flex-end' }}>onwards</span>
                        )}
                    </div>

                    {baseItemTotalQty === 0 || hasVariantsOrAddons ? (
                        <button
                            className="add-to-order-btn"
                            onClick={handleAddToCart}
                        >
                            Add to Cart
                        </button>
                    ) : (
                        <div className="detail-bottom-actions">
                            <div className="qty-stepper">
                                <button
                                    className="stepper-btn"
                                    onClick={() => removeFromCart(item.id)}
                                >
                                    <Minus size={18} />
                                </button>
                                <span className="stepper-count">{baseItemTotalQty}</span>
                                <button
                                    className="stepper-btn"
                                    onClick={handleAddToCart}
                                >
                                    <Plus size={18} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>

            </div>

            {/* ═══ Step 2: Variant/Addon Selector Full-Sheet ═══ */}
            <div
                className={`variant-sheet-overlay ${showVariantSheet ? 'show' : ''}`}
                onClick={handleBack}
            >
                <div className="variant-sheet" onClick={(e) => e.stopPropagation()}>
                    {/* Sheet header */}
                    <div className="variant-sheet-header">
                        <button className="variant-sheet-back-btn" onClick={handleBack}>
                            <ArrowLeft size={20} />
                        </button>
                        <div className="variant-sheet-title-row">
                            <h3 className="variant-sheet-item-name">{item.name}</h3>
                        </div>
                    </div>

                    <div className="variant-sheet-scroll">
                        {/* Variants Section */}
                        {item.variants && item.variants.length > 0 && (
                            <div className="variant-section">
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

                        {/* Addons Section */}
                        {item.addons && item.addons.length > 0 && (
                            <div className="variant-section">
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

                    {/* Variant Sheet Bottom Bar */}
                    <div className="variant-sheet-bottom">
                        <div className="variant-sheet-bottom-layout">
                            <div className="variant-sheet-total-col">
                                <span className="variant-total-label">Total</span>
                                <span className="variant-total-price">₹{getVariantSheetTotal()}</span>
                            </div>
                            <div className="variant-sheet-action-col">
                                {selectedQuantity === 0 ? (
                                    <button className="variant-add-btn compact" onClick={handleConfirmAdd}>
                                        Add to cart
                                    </button>
                                ) : (
                                    <div className="qty-stepper variant-stepper">
                                        <button
                                            className="stepper-btn"
                                            onClick={() => removeFromCart(getSelectedCompositeId())}
                                        >
                                            <Minus size={18} />
                                        </button>
                                        <span className="stepper-count">{selectedQuantity}</span>
                                        <button
                                            className="stepper-btn"
                                            onClick={() => addToCart(item, selectedVariant, selectedAddons)}
                                        >
                                            <Plus size={18} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ItemModal;
