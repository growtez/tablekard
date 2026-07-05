import React, { useState, useEffect, useRef } from 'react';
import { Home, ShoppingBag, MessageCircle, User, Minus, Plus, Trash2, Clock, CheckCircle, Utensils, ShoppingCart, ListOrdered, ArrowRight, Star, Users, CreditCard, Wallet, Loader2, AlertCircle, Download, Pencil } from 'lucide-react';
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useRestaurant } from '../context/RestaurantContext';
import { processOnlinePayment } from '../services/paymentService';
import { createOrder, getTodaysOrders, cancelOrder, updateOrderType, getBeveragesForCart } from '../services/supabaseService';
import './my_order.css';
import Hamburger from '../components/hamburger';
import BottomNav from '../components/BottomNav';
import { jsPDF } from 'jspdf';
import PageSkeleton from '../components/PageSkeleton';
import ItemModal from '../components/ItemModal';
import { supabase } from '@restaurant-saas/supabase';

const MyOrderPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  const { cartItems, updateQuantity, updateAddonQuantity, deleteFromCart, cartSubtotal, clearCart, orderSpecialInstructions, setOrderSpecialInstructions, addToCart, getItemQuantity } = useCart();
  const { restaurantId, tableId, table, geofenceStatus, distance, allowedRadius, checkGeofence, restaurant } = useRestaurant();
  const [activeTab, setActiveTab] = useState('cart');
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('');
  const [error, setError] = useState('');
  const [orderType, setOrderType] = useState('dine_in');
  const [showSpecialInstructions, setShowSpecialInstructions] = useState(!!orderSpecialInstructions);


  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const [showPayCounterPopup, setShowPayCounterPopup] = useState(false);

  // Pull to refresh state
  const [isPulling, setIsPulling] = useState(false);
  const [pullY, setPullY] = useState(0);
  const touchStartY = useRef(0);

  // Beverages Upsell
  const [beverages, setBeverages] = useState([]);
  const [showItemModal, setShowItemModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [modalStep, setModalStep] = useState(1);
  const [isVariantSheetOpen, setIsVariantSheetOpen] = useState(false);

  useEffect(() => {
    if (restaurant?.id) {
      getBeveragesForCart(restaurant.id, 5)
        .then(data => setBeverages(data))
        .catch(err => console.error("Error fetching beverages:", err));
    }
  }, [restaurant?.id]);

  const handleBeverageAdd = (item, e) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    if (item.variants?.length > 0 || item.addons?.length > 0) {
      setSelectedItem(item);
      setModalStep(2);
      setShowItemModal(true);
    } else {
      addToCart(item);
    }
  };

  const closeItemModal = () => {
    setShowItemModal(false);
    setIsVariantSheetOpen(false);
    setSelectedItem(null);
  };

  const fetchOrders = async (isBackground = false) => {
    if (!isAuthenticated || !user) return;
    if (!isBackground) {
      setOrdersLoading(true);
    }
    try {
      const data = await getTodaysOrders(user.id);
      const mapped = data
        .map(order => ({
          id: order.order_number || order.id.substring(0, 8),
          status: order.status.toLowerCase(),
          items: order.order_items.map(item => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            status: item.status || 'placed',
            specialInstructions: item.special_instructions || null,
            variant: item.variant || null,
            addons: item.addons || null
          })),
          total: order.total,
          discount: order.discount || 0,
          orderDate: new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          fullDate: new Date(order.created_at).toLocaleDateString(),
          paymentStatus: order.payment_status?.toLowerCase(),
          paymentMethod: order.payment_method,
          statusLabel: order.status.charAt(0).toUpperCase() + order.status.slice(1).toLowerCase(),
          rawOrder: order
        }));

      // Final mapping to UI labels for consistency
      const finalMapped = mapped.map(o => ({
        ...o,
        status: (o.status === 'pending' || o.status === 'confirmed') ? 'placed' : o.status
      }));

      setOrders(finalMapped);
    } catch (err) {
      console.error("Failed to fetch today's orders:", err);
    } finally {
      setOrdersLoading(false);
      setIsInitialLoad(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (isAuthenticated && user) {
      fetchOrders();

      // Set up realtime subscription for updates to orders and order items
      const subscription = supabase
        .channel('public:orders-and-items')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'orders', filter: `customer_id=eq.${user.id}` },
          (payload) => {
            console.log('Order update received:', payload);
            fetchOrders(true); // Silently re-fetch to get the latest data
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'order_items' },
          (payload) => {
            console.log('Order item update received:', payload);
            fetchOrders(true); // Silently re-fetch to get the latest data
          }
        )
        .subscribe();

      // Fallback: poll every 15 seconds in case Supabase Realtime is disabled for the 'orders' table
      const pollInterval = setInterval(() => {
        fetchOrders(true); // Background fetch
      }, 15000);

      return () => {
        supabase.removeChannel(subscription);
        clearInterval(pollInterval);
      };
    } else {
      setOrdersLoading(false);
      setIsInitialLoad(false);
    }
  }, [authLoading, isAuthenticated, user]);

  const handleTouchStart = (e) => {
    if (window.scrollY === 0) {
      touchStartY.current = e.touches[0].clientY;
    }
  };

  const handleTouchMove = (e) => {
    if (touchStartY.current > 0 && window.scrollY <= 0) {
      const y = e.touches[0].clientY;
      const pullDist = y - touchStartY.current;
      if (pullDist > 0) {
        setPullY(Math.min(pullDist, 100)); // Cap at 100px
        if (pullDist > 10 && e.cancelable) {
          e.preventDefault(); // prevent native pull-to-refresh
        }
      }
    }
  };

  const handleTouchEnd = async () => {
    if (pullY > 50 && !isPulling) {
      setIsPulling(true);
      await fetchOrders(true); // Silent fetch, use spinner instead of skeleton
      setIsPulling(false);
    }
    setPullY(0);
    touchStartY.current = 0;
  };



  // Alias for template compatibility
  const removeItem = deleteFromCart;
  const getTotalPrice = () => cartSubtotal;

  const getStatusIcon = (status) => {
    switch (status) {
      case 'placed':
        return <Clock size={16} color="#FF9800" />;
      case 'preparing':
        return <Utensils size={16} color="#3B82F6" />;
      case 'ready':
      case 'served':
      case 'completed':
        return <CheckCircle size={16} color="#22C55E" />;
      case 'cancelled':
        return <AlertCircle size={16} color="#EF4444" />;
      default:
        return <Clock size={16} color="#888888" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'placed':
        return '#FF9800';
      case 'preparing':
        return '#3B82F6';
      case 'ready':
      case 'served':
      case 'completed':
        return '#22C55E';
      case 'cancelled':
        return '#EF4444';
      default:
        return '#888888';
    }
  };

  // ─── PAY ONLINE: Razorpay flow ───
  const handlePayOnline = async () => {
    if (cartItems.length === 0) return;
    if (cartItems.some(item => item.outOfStock)) {
      setError('Please remove out of stock items from your cart before proceeding.');
      return;
    }
    if (!isAuthenticated) {
      const currentPath = encodeURIComponent(window.location.pathname);
      navigate(`/login?redirect=${currentPath}`);
      return;
    }

    if (geofenceStatus === 'outside') {
      setError(`Cannot place order. You are outside the allowed radius of ${allowedRadius}m (current distance: ${Math.round(distance)}m).`);
      return;
    }
    if (geofenceStatus === 'checking') {
      setError('Verifying your location. Please wait...');
      return;
    }

    setPaymentLoading(true);
    setError('');

    try {
      const result = await processOnlinePayment({
        restaurantId,
        tableId: table?.id ?? tableId,   // always use the UUID from fetched table
        orderType: orderType,
        items: cartItems,
        restaurantName: 'Tablekard',
        userName: user?.user_metadata?.full_name || '',
        userEmail: user?.email || '',
        userPhone: user?.phone || '',
        specialInstructions: orderSpecialInstructions,
        onStatusChange: (status) => setPaymentStatus(status),
      });

      if (result.success) {
        const newOrder = {
          id: result.orderNumber,
          status: 'placed',
          items: cartItems.map(item => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            variant: item.variant || null,
            addons: item.addons || null
          })),
          total: getTotalPrice(),
          orderDate: 'Just now',
          paymentStatus: 'Paid Online',
          statusLabel: 'Order Placed',
          rawOrder: { id: result.orderId || result.order_id, type: orderType }
        };
        setOrders(prev => [newOrder, ...prev]);
        clearCart();
        setActiveTab('orders');
      }
    } catch (err) {
      console.error('Payment error:', err);
      if (err.message !== 'Payment cancelled by user') {
        setError(err.message || 'Payment failed. Please try again.');
      }
    } finally {
      setPaymentLoading(false);
      setPaymentStatus('');
    }
  };

  // ─── PAY AT COUNTER: Direct order ───
  const handlePayAtCounter = async () => {
    if (cartItems.length === 0) return;
    if (cartItems.some(item => item.outOfStock)) {
      setError('Please remove out of stock items from your cart before proceeding.');
      return;
    }
    if (!isAuthenticated) {
      const currentPath = encodeURIComponent(window.location.pathname);
      navigate(`/login?redirect=${currentPath}`);
      return;
    }

    if (geofenceStatus === 'outside') {
      setError(`Cannot place order. You are outside the allowed radius of ${allowedRadius}m (current distance: ${Math.round(distance)}m).`);
      return;
    }
    if (geofenceStatus === 'checking') {
      setError('Verifying your location. Please wait...');
      return;
    }

    setShowPayCounterPopup(true);
  };

  const confirmPayAtCounter = async () => {
    setShowPayCounterPopup(false);
    setPaymentLoading(true);
    setError('');

    try {
      const result = await createOrder({
        restaurantId,
        customerId: user?.id,
        customerName: user?.user_metadata?.full_name || null,
        customerPhone: user?.phone || null,
        tableNumber: table?.id ?? tableId,   // always use the UUID from fetched table
        items: cartItems,
        paymentMethod: 'cash',
        type: orderType,
        specialInstructions: orderSpecialInstructions,
      });

      const newOrder = {
        id: result.orderNumber,
        status: 'placed',
        items: cartItems.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          addons: item.addons || null
        })),
        total: getTotalPrice(),
        orderDate: 'Just now',
        paymentStatus: 'Pay at Counter',
        statusLabel: 'Order Placed',
        rawOrder: { id: result.orderId, type: orderType }
      };
      setOrders(prev => [newOrder, ...prev]);
      clearCart();
      setActiveTab('orders');
    } catch (err) {
      console.error('Order error:', err);
      setError(err.message || 'Failed to place order.');
    } finally {
      setPaymentLoading(false);
    }
  };

  const statusMessages = {
    creating_order: 'Preparing your order...',
    opening_checkout: 'Opening payment gateway...',
    verifying_payment: 'Verifying payment...',
    success: 'Payment successful!',
  };

  const downloadInvoice = (order) => {
    const doc = new jsPDF();

    // Set colors
    const primaryColor = [139, 58, 30]; // #8B3A1E
    const darkGray = [50, 50, 50];
    const lightGray = [240, 240, 240];

    // Header Background
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, 210, 40, 'F');

    // Header Text
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont(undefined, 'bold');
    doc.text('TABLEKARD', 20, 25);
    
    doc.setFontSize(14);
    doc.setFont(undefined, 'normal');
    doc.text('INVOICE', 190, 25, { align: 'right' });

    // Invoice Details
    doc.setTextColor(...darkGray);
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text('Invoice No:', 20, 55);
    doc.setFont(undefined, 'normal');
    doc.text(order.id || 'N/A', 45, 55);
    
    doc.setFont(undefined, 'bold');
    doc.text('Date:', 20, 62);
    doc.setFont(undefined, 'normal');
    doc.text(`${order.fullDate || ''} ${order.orderDate || ''}`, 45, 62);
    
    doc.setFont(undefined, 'bold');
    doc.text('Order Type:', 130, 55);
    doc.setFont(undefined, 'normal');
    const typeText = (order.rawOrder?.type || 'Dine In').replace('_', ' ').toUpperCase();
    doc.text(typeText, 155, 55);

    doc.setFont(undefined, 'bold');
    doc.text('Payment:', 130, 62);
    doc.setFont(undefined, 'normal');
    doc.text(order.paymentStatus || 'Pending', 155, 62);

    // Table Header Background
    doc.setFillColor(...lightGray);
    doc.rect(20, 75, 170, 10, 'F');

    // Table Headers
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text('Item Description', 25, 82);
    doc.text('Qty', 130, 82, { align: 'center' });
    doc.text('Price', 150, 82, { align: 'right' });
    doc.text('Total', 185, 82, { align: 'right' });

    // Table Items
    let y = 92;
    doc.setFont(undefined, 'normal');
    
    order.items.forEach(item => {
      // Add page if needed
      if (y > 270) {
        doc.addPage();
        y = 20;
      }

      doc.setFont(undefined, 'bold');
      doc.setTextColor(...darkGray);
      doc.text(item.name, 25, y);
      doc.setFont(undefined, 'normal');
      doc.text(String(item.quantity), 130, y, { align: 'center' });
      doc.text(`Rs. ${item.price}`, 150, y, { align: 'right' });
      
      const baseItemTotal = item.price * item.quantity;
      doc.text(`Rs. ${baseItemTotal}`, 185, y, { align: 'right' });
      y += 5;

      // Variant and Addons
      if (item.variant || (item.addons && item.addons.length > 0)) {
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        
        if (item.variant) {
          if (item.quantity > 1) {
            doc.text(`- Variant: ${item.variant.name} (Rs. ${item.variant.price} x ${item.quantity})`, 28, y);
          } else {
            doc.text(`- Variant: ${item.variant.name}`, 28, y);
          }
          doc.text(`Rs. ${item.variant.price * item.quantity}`, 185, y, { align: 'right' });
          y += 5;
        }
        
        if (item.addons && item.addons.length > 0) {
          const addonCounts = {};
          item.addons.forEach(a => {
              const key = a.name;
              if (!addonCounts[key]) addonCounts[key] = { ...a, count: 0, totalPrice: 0 };
              addonCounts[key].count += 1;
              addonCounts[key].totalPrice += a.price;
          });
          
          Object.values(addonCounts).forEach(a => {
              let addonLabel = `- Add-on: ${a.name}`;
              if (a.count > 1) addonLabel += ` x${a.count}`;
              
              if (item.quantity > 1) {
                doc.text(`${addonLabel} (Rs. ${a.totalPrice} x ${item.quantity})`, 28, y);
              } else {
                doc.text(`${addonLabel}`, 28, y);
              }
              doc.text(`Rs. ${a.totalPrice * item.quantity}`, 185, y, { align: 'right' });
              y += 5;
          });
        }
        doc.setFontSize(10);
        doc.setTextColor(...darkGray);
      }
      
      // Draw line under item
      y += 3;
      doc.setDrawColor(230, 230, 230);
      doc.line(20, y, 190, y);
      y += 7;
    });

    // Summary Box
    const subtotal = order.total - Math.round(order.total * 0.18);
    const tax = Math.round(order.total * 0.18);
    
    y += 5;
    if (y > 230) { doc.addPage(); y = 30; }
    
    doc.setDrawColor(...primaryColor);
    doc.setLineWidth(0.5);
    doc.line(120, y, 190, y);
    y += 8;

    doc.text('Subtotal:', 140, y);
    doc.text(`Rs. ${subtotal}`, 185, y, { align: 'right' });
    y += 7;

    doc.text('Tax (18%):', 140, y);
    doc.text(`Rs. ${tax}`, 185, y, { align: 'right' });
    y += 7;

    // Total Background
    doc.setFillColor(...lightGray);
    doc.rect(125, y, 65, 10, 'F');
    
    y += 7;
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(...primaryColor);
    doc.text('TOTAL:', 140, y);
    doc.text(`Rs. ${order.total}`, 185, y, { align: 'right' });

    // Footer
    y += 30;
    if (y > 270) { doc.addPage(); y = 30; }
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'italic');
    doc.setTextColor(150, 150, 150);
    doc.text('Thank you for dining with us!', 105, y, { align: 'center' });
    doc.text('This is a computer generated invoice.', 105, y + 6, { align: 'center' });

    doc.save(`Invoice_${order.id || 'order'}.pdf`);
  };

  if (authLoading || isInitialLoad) {
    return <PageSkeleton />;
  }

  return (
    <div
      className="myorder-container"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull to refresh indicator */}
      <div style={{
        height: `${isPulling ? 60 : pullY}px`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        transition: isPulling ? 'height 0.3s' : 'none',
        backgroundColor: 'transparent'
      }}>
        {pullY > 0 && (
          <Loader2
            size={24}
            color="#8B3A1E"
            style={{
              transform: `rotate(${pullY * 2}deg)`,
              ...(isPulling ? { animation: 'spin 1s linear infinite' } : {})
            }}
          />
        )}
      </div>

      {/* Loading Overlay */}
      {paymentLoading && paymentStatus !== 'opening_checkout' && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, gap: '16px',
        }}>
          <Loader2 size={40} color="#8B3A1E" style={{ animation: 'spin 1s linear infinite' }} />
          <p style={{ color: '#fff', fontSize: '16px', fontWeight: 500 }}>
            {statusMessages[paymentStatus] || 'Processing...'}
          </p>
        </div>
      )}

      {/* Header - Same style as Home page */}
      <header className="menu-header-nav">
        <div className="header-left">
          <Hamburger />
        </div>
        <div className="header-nav-right">
          <NavLink to="/live-queue" className="header-nav-btn live-queue-btn">
            <ListOrdered size={22} color="#8B3A1E" />
            <span className="live-dot"></span>
          </NavLink>
        </div>
      </header>

      {/* Hero Title Section */}
      <section className="hero-section">
        <div className="hero-text">
          <h1>My <span className="highlight">Orders</span></h1>
          <h1><span className="ampersand">&</span> <span className="highlight">Cart</span></h1>
        </div>
      </section>

      {/* Tab Navigation */}
      <div className="tab-section">
        <div className="tab-navigation">
          <button
            className={`tab-btn ${activeTab === 'cart' ? 'active' : ''}`}
            onClick={() => setActiveTab('cart')}
          >
            Cart ({cartItems.length})
          </button>
          <button
            className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => {
              if (!isAuthenticated) {
                const currentPath = encodeURIComponent('/orders');
                navigate(`/login?redirect=${currentPath}`);
                return;
              }
              setActiveTab('orders');
            }}
          >
            Orders ({orders.length})
          </button>
        </div>
      </div>

      {/* Cart Content */}
      {activeTab === 'cart' && (
        <div className="cart-content">
          {geofenceStatus !== 'disabled' && geofenceStatus !== 'inside' && (
            <div className={`geofence-banner geofence-banner--${geofenceStatus}`}>
              <div className="geofence-banner-content">
                <AlertCircle size={20} className="geofence-icon" />
                <div className="geofence-text">
                  {geofenceStatus === 'checking' && (
                    <>
                      <strong>Checking Location</strong>
                      <p>Verifying you are at the restaurant...</p>
                    </>
                  )}
                  {geofenceStatus === 'outside' && (
                    <>
                      <strong>Outside Allowed Area</strong>
                      <p>You are {Math.round(distance)}m away. Ordering is restricted to {allowedRadius}m.</p>
                    </>
                  )}
                  {geofenceStatus === 'error' && (
                    <>
                      <strong>Location Verification Failed</strong>
                      <p>Please enable location access to place your order.</p>
                    </>
                  )}
                </div>
              </div>
              {(geofenceStatus === 'outside' || geofenceStatus === 'error') && (
                <button className="geofence-retry-btn" onClick={() => checkGeofence()}>
                  Retry
                </button>
              )}
            </div>
          )}

          {cartItems.length === 0 ? (
            <div className="empty-state">
              <ShoppingBag size={64} color="#888888" />
              <h3>Your cart is empty</h3>
              <p>Add some delicious items to your cart to get started!</p>
            </div>
          ) : (
            <>
              <div className="cart-items">
                {cartItems.map(item => {
                  const aggregatedAddons = (() => {
                    const counts = {};
                    (item.configurations || []).forEach(config => {
                      (config.addons || []).forEach(addon => {
                        const addonKey = addon._key ?? addon.id ?? addon.name;
                        if (!counts[addonKey]) {
                          counts[addonKey] = { ...addon, count: 0 };
                        }
                        counts[addonKey].count += 1;
                      });
                    });
                    return Object.values(counts);
                  })();
                  const itemTotal = (item.basePrice * item.quantity) + (item.configurations || []).reduce((sum, c) => sum + (c.addonsPrice || 0), 0);

                  return (
                  <div key={item.id} className="cart-item" style={{ opacity: item.outOfStock ? 0.6 : 1, filter: item.outOfStock ? 'grayscale(100%)' : 'none', flexDirection: 'column', gap: 0 }}>
                    {item.variant && (
                      <span className="cart-variant-badge">{item.variant.name}</span>
                    )}
                    <div className="cart-item-main" style={{ display: 'flex' }}>
                      <div className="cart-image">
                        <img src={item.image} alt={item.name} />
                        {item.outOfStock && (
                          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'rgba(0,0,0,0.7)', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                            OUT OF STOCK
                          </div>
                        )}
                      </div>
                      <div className="cart-info">
                        {/* Row 1: name + [badge] [trash] */}
                        <div className="cart-header">
                          <h3>{item.name}</h3>
                          <div className="cart-header-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <button className="remove-btn" onClick={() => removeItem(item.id)}>
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                        
                        {/* Row 2: meta */}
                        <div className="cart-meta">
                          <div className="cart-rating">
                            <Star size={12} fill="#8B3A1E" color="#8B3A1E" />
                            <span>{item.rating}</span>
                          </div>
                          <div className="cart-serves">
                            <Users size={12} />
                            <span>{item.serves}</span>
                          </div>
                        </div>
                        {/* Row 3: qty + price */}
                        <div className="cart-bottom">
                          <div className="quantity-controls">
                            {item.outOfStock ? (
                              <span style={{ fontSize: '12px', color: '#EF4444', fontWeight: 'bold' }}>Out of stock</span>
                            ) : (
                              <>
                                <button className="quantity-btn" onClick={() => updateQuantity(item.id, -1)}><Minus size={14} /></button>
                                <span className="quantity">{item.quantity}</span>
                                <button className="quantity-btn" onClick={() => updateQuantity(item.id, 1)}><Plus size={14} /></button>
                              </>
                            )}
                          </div>
                          <div className="item-price">₹{itemTotal}</div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Add-ons Section */}
                    {aggregatedAddons.length > 0 && (
                      <div className="cart-addons-section">
                        <div className="cart-addons-header">Add-ons</div>
                        <div className="cart-addons-list-new">
                          {aggregatedAddons.map(a => (
                            <div key={a.name} className="cart-addon-row-new">
                              <span className="cart-addon-name-new">{a.name} <span className="cart-addon-price-new">(+₹{a.price})</span></span>
                              <div className="addon-stepper">
                                <button className="addon-stepper-btn" onClick={() => updateAddonQuantity(item.id, a, -1)}><Minus size={12} /></button>
                                <span className="addon-stepper-count">{a.count}</span>
                                <button className="addon-stepper-btn" onClick={() => updateAddonQuantity(item.id, a, 1)}><Plus size={12} /></button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )})}
              </div>

              {/* Order Type Selection - Premium Sliding Toggle */}
              <div className="order-type-wrapper">
                <div className="order-type-toggle">
                  <div className={`toggle-slider ${orderType}`} />
                  <button
                    className={`toggle-btn ${orderType === 'dine_in' ? 'active' : ''}`}
                    onClick={() => setOrderType('dine_in')}
                  >
                    <Utensils size={18} />
                    <span>Dine In</span>
                  </button>
                  <button
                    className={`toggle-btn ${orderType === 'takeaway' ? 'active' : ''}`}
                    onClick={() => setOrderType('takeaway')}
                  >
                    <ShoppingBag size={18} />
                    <span>Takeaway</span>
                  </button>
                </div>
              </div>

              {/* Order Special Instructions */}
              <div className="order-special-instructions-container">
                {!showSpecialInstructions ? (
                  <button
                    className="add-special-instructions-btn"
                    onClick={() => setShowSpecialInstructions(true)}
                  >
                    <div className="special-inst-icon-wrapper">
                      <MessageCircle size={16} color="#8B3A1E" />
                    </div>
                    {orderSpecialInstructions ? (
                      <div style={{ flex: 1, textAlign: 'left', overflow: 'hidden' }}>
                        <span className="special-inst-text" style={{ display: 'block', fontSize: '12px', color: '#666' }}>Cooking Instructions</span>
                        <span style={{ display: 'block', fontSize: '13px', color: '#1A1A1A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: '500' }}>
                          "{orderSpecialInstructions}"
                        </span>
                      </div>
                    ) : (
                      <span className="special-inst-text">Add cooking instructions or requests</span>
                    )}
                    {orderSpecialInstructions ? (
                      <Pencil size={16} className="special-inst-plus" />
                    ) : (
                      <Plus size={18} className="special-inst-plus" />
                    )}
                  </button>
                ) : (
                  <div className="special-instructions-active">
                    <div className="special-instructions-header">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <MessageCircle size={16} color="#8B3A1E" />
                        <h3 className="special-inst-title">Cooking Instructions</h3>
                      </div>
                      <button
                        className="special-inst-remove"
                        onClick={() => {
                          setShowSpecialInstructions(false);
                          setOrderSpecialInstructions('');
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <textarea
                      className="special-instructions-textarea"
                      placeholder="e.g. Please make it less spicy, extra napkins..."
                      value={orderSpecialInstructions}
                      onChange={e => setOrderSpecialInstructions(e.target.value)}
                      maxLength={500}
                      rows={3}
                      autoFocus
                    />
                    <div className="special-inst-footer">
                      <span>{orderSpecialInstructions.length}/500</span>
                      <span>Instructions sent to kitchen for entire order.</span>
                    </div>
                    <button 
                      className="special-inst-done-btn"
                      onClick={() => setShowSpecialInstructions(false)}
                    >
                      <CheckCircle size={16} style={{ marginRight: '6px' }} /> Done
                    </button>
                  </div>
                )}
              </div>

              {/* Beverages Upsell Section */}
              {beverages.length > 0 && cartItems.length > 0 && (
                <div className="cart-upsell-section">
                  <h3 className="upsell-title">Add a Beverage</h3>
                  <div className="upsell-horizontal-scroll">
                    {beverages.map(bev => {
                      const qty = getItemQuantity(bev.id);
                      return (
                        <div key={bev.id} className="upsell-card">
                          <div className="upsell-img-wrapper">
                            <img src={bev.image} alt={bev.name} loading="lazy" />
                            {qty > 0 ? (
                                <div className="upsell-qty-controls">
                                    <button className="upsell-qty-btn" onClick={(e) => {
                                        e.stopPropagation();
                                        e.preventDefault();
                                        // For beverages, find the composite ID in cart and remove it.
                                        // If it has variants, it might be complex. But since we use updateQuantity from useCart, it expects the exact cart item ID.
                                        // For simplicity in upselling UI, if it's a simple item:
                                        const cartItem = cartItems.find(i => i.menuItemId === bev.id || i.id === bev.id || i.id.startsWith(bev.id + '_'));
                                        if (cartItem) {
                                            updateQuantity(cartItem.id, -1);
                                        }
                                    }}><Minus size={12} /></button>
                                    <span>{qty}</span>
                                    <button className="upsell-qty-btn" onClick={() => handleBeverageAdd(bev)}><Plus size={12} /></button>
                                </div>
                            ) : (
                                <button className="upsell-add-btn" onClick={(e) => handleBeverageAdd(bev, e)}>
                                  <Plus size={14} /> Add
                                </button>
                            )}
                          </div>
                          <div className="upsell-info">
                            <div className="upsell-name">{bev.name}</div>
                            <div className="upsell-price">₹{bev.price}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Order Summary */}
              <h2 className="summary-title">Summary</h2>
              <div className="order-summary">
                <div className="summary-row">
                  <span>Subtotal</span>
                  <span>₹{getTotalPrice() - Math.round(getTotalPrice() * 0.05) - Math.round(getTotalPrice() * 0.18)}</span>
                </div>
                <div className="summary-row" style={{ color: '#888' }}>
                  <span>Service Charge (5%)</span>
                  <span>₹{Math.round(getTotalPrice() * 0.05)}</span>
                </div>
                <div className="summary-row" style={{ color: '#888' }}>
                  <span>Tax (18%)</span>
                  <span>₹{Math.round(getTotalPrice() * 0.18)}</span>
                </div>
                <div className="summary-row discount">
                  <span>Discount</span>
                  <span>- ₹0</span>
                </div>
                <div className="summary-row total" style={{ alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span>Total Amount</span>
                    <span style={{ fontSize: '11px', fontWeight: '500', color: '#8B3A1E', marginTop: '2px' }}>(Inclusive of all taxes)</span>
                  </div>
                  <span>₹{getTotalPrice()}</span>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)',
                  padding: '10px 14px', borderRadius: '10px', marginBottom: '12px',
                }}>
                  <AlertCircle size={16} color="#ef4444" />
                  <p style={{ color: '#ef4444', fontSize: '13px', margin: 0 }}>{error}</p>
                </div>
              )}

              {/* Payment Buttons */}
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  className="place-order-btn"
                  onClick={handlePayAtCounter}
                  disabled={paymentLoading || cartItems.some(i => i.outOfStock)}
                  style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                    padding: '10px 12px', fontSize: '13px', whiteSpace: 'nowrap',
                    opacity: (paymentLoading || cartItems.some(i => i.outOfStock)) ? 0.6 : 1
                  }}
                >
                  <Wallet size={16} />
                  Pay at Counter
                </button>
                {restaurant?.pay_online !== false && (
                  <button
                    className="place-order-btn"
                    onClick={handlePayOnline}
                    disabled={paymentLoading || cartItems.some(i => i.outOfStock)}
                    style={{
                      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                      background: 'transparent', border: '2px solid #8B3A1E', color: '#8B3A1E',
                      padding: '10px 12px', fontSize: '13px', whiteSpace: 'nowrap',
                      opacity: (paymentLoading || cartItems.some(i => i.outOfStock)) ? 0.6 : 1
                    }}
                  >
                    <CreditCard size={16} />
                    Pay Online
                  </button>
                )}
              </div>

              <style>{`
                @keyframes spin {
                  from { transform: rotate(0deg); }
                  to { transform: rotate(360deg); }
                }
              `}</style>
            </>
          )}
        </div>
      )}

      {/* Orders Content */}
      {activeTab === 'orders' && (
        <div className="orders-content">
          {error && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)',
              padding: '10px 14px', borderRadius: '10px', marginBottom: '20px',
            }}>
              <AlertCircle size={16} color="#ef4444" />
              <p style={{ color: '#ef4444', fontSize: '13px', margin: 0 }}>{error}</p>
            </div>
          )}
          {ordersLoading ? (
            <div className="orders-list">
              {[1, 2, 3].map(i => (
                <div key={i} className="skeleton-item" style={{ flexDirection: 'column', height: '140px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                    <div className="skeleton-pulse skeleton-text title" style={{ width: '40%' }}></div>
                    <div className="skeleton-pulse skeleton-text" style={{ width: '80px', borderRadius: '20px' }}></div>
                  </div>
                  <div className="skeleton-pulse skeleton-text short" style={{ marginTop: '12px' }}></div>
                  <div className="skeleton-pulse skeleton-text" style={{ width: '30%', marginTop: 'auto' }}></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', borderTop: '1px solid #f0f0f0', paddingTop: '16px' }}>
                    <div className="skeleton-pulse skeleton-text" style={{ width: '80px', height: '24px', borderRadius: '12px' }}></div>
                    <div className="skeleton-pulse skeleton-text title" style={{ width: '60px' }}></div>
                  </div>
                </div>
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="empty-state">
              <ShoppingBag size={64} color="#888888" />
              <h3>No active orders yet.</h3>
              <p>You haven't ordered anything today.</p>
            </div>
          ) : (
            <>
              <h2 className="section-heading">Today's Orders</h2>
              <div className="orders-list">
                {orders.map(order => {
                  const shortId = order.id?.slice(-4) || order.id;
                  const isCancelled = order.status === 'cancelled';
                  const orderTypeName = (order.rawOrder?.type || '').toLowerCase() === 'takeaway' ? 'Takeaway' : 'Dine In';
                  const isPaid = order.paymentStatus === 'paid' || order.paymentStatus === 'Paid Online';
                  const statusLabel = order.status.charAt(0).toUpperCase() + order.status.slice(1);

                  return (
                    <div key={order.id} className={`order-item${isCancelled ? ' order-item--cancelled' : ''}`}>
                      {/* ── Tier 1: Identity Row ── */}
                      <div className="oi-identity">
                        <div className="oi-identity-left">
                          <span className="oi-order-id">#{shortId}</span>
                          <span className="oi-type-chip">{orderTypeName}</span>
                        </div>
                        <div className={`oi-payment-chip ${isPaid ? 'paid' : 'unpaid'}`}>
                          <span className="oi-payment-symbol">₹</span>
                          {isPaid ? 'Paid' : 'Pending'}
                        </div>
                      </div>

                      {/* ── Tier 2: Items ── */}
                      <div className="oi-items">
                        {order.items.map((item, index) => {
                          const itemStatus = item.status || 'placed';
                          let badgeColor = '#FF9800';
                          if (itemStatus === 'preparing') badgeColor = '#3B82F6';
                          if (itemStatus === 'ready') badgeColor = '#22C55E';

                          // Aggregate addons by name
                          const addonCounts = {};
                          if (item.addons && item.addons.length > 0) {
                            item.addons.forEach(a => {
                              const key = a.name;
                              if (!addonCounts[key]) addonCounts[key] = { ...a, count: 0, totalPrice: 0 };
                              addonCounts[key].count += 1;
                              addonCounts[key].totalPrice += a.price;
                            });
                          }
                          const aggregatedAddons = Object.values(addonCounts);

                          return (
                            <div key={index} className="oi-item-block">
                              {/* Item header row */}
                              <div className="oi-item-top">
                                <div className="oi-item-left">
                                  <span className="oi-item-qty-badge">{item.quantity}×</span>
                                  <span className="oi-item-name">{item.name}</span>
                                  <span className="oi-item-status-badge" style={{
                                    color: badgeColor, backgroundColor: badgeColor + '12',
                                    border: `1px solid ${badgeColor}30`
                                  }}>
                                    {itemStatus}
                                  </span>
                                </div>
                                <span className="oi-item-price">₹{item.price * item.quantity}</span>
                              </div>

                              {/* Extras: Variants & Addons */}
                              {(item.variant || aggregatedAddons.length > 0) && (
                                <div className="oi-extras-list">
                                  {item.variant && (
                                    <div className="oi-extra-item">
                                      <div className="oi-extra-name">
                                        <span className="oi-extra-badge">Variant</span>
                                        <span>{item.variant.name}</span>
                                      </div>
                                      <div className="oi-extra-price-group">
                                        {item.quantity > 1 && (
                                          <span className="oi-price-breakdown">₹{item.variant.price} × {item.quantity} =</span>
                                        )}
                                        <span className="oi-extra-price">+₹{item.variant.price * item.quantity}</span>
                                      </div>
                                    </div>
                                  )}
                                  
                                  {aggregatedAddons.map((a, idx) => (
                                    <div key={idx} className="oi-extra-item">
                                      <div className="oi-extra-name">
                                        <span className="oi-extra-badge">Add-on</span>
                                        <span>{a.name} {a.count > 1 ? <span className="oi-addon-count">×{a.count}</span> : ''}</span>
                                      </div>
                                      <div className="oi-extra-price-group">
                                        {item.quantity > 1 && (
                                          <span className="oi-price-breakdown">₹{a.totalPrice} × {item.quantity} =</span>
                                        )}
                                        <span className="oi-extra-price">+₹{a.totalPrice * item.quantity}</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {index < order.items.length - 1 && (
                                <div className="oi-item-divider"></div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Order Level Special Instructions */}
                      {order.items.find(i => i.specialInstructions)?.specialInstructions && (
                        <div className="oi-order-instructions">
                          <MessageCircle size={14} color="#8B3A1E" style={{ flexShrink: 0, marginTop: '1px' }} />
                          <span>{order.items.find(i => i.specialInstructions).specialInstructions}</span>
                        </div>
                      )}

                      {/* ── Tier 3: Footer ── */}
                      <div className="oi-footer">
                        <div className="oi-footer-left">
                          <div className="oi-status" style={{
                            color: getStatusColor(order.status),
                            backgroundColor: getStatusColor(order.status) + '15',
                            borderColor: getStatusColor(order.status) + '30',
                          }}>
                            {getStatusIcon(order.status)}
                            <span>{statusLabel}</span>
                          </div>
                          <span className="oi-time">{order.orderDate}</span>
                        </div>
                        <div className="oi-footer-right">
                          <span className="oi-total">₹{order.total}</span>
                          <span className="oi-total-note">incl. taxes</span>
                        </div>
                      </div>

                      {/* ── Invoice action ── */}
                      {order.paymentStatus?.toLowerCase() === 'paid' && (
                        <button
                          className="oi-invoice-btn"
                          onClick={() => downloadInvoice(order)}
                        >
                          <Download size={13} />
                          Download Invoice
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* Bottom Navigation */}
      <BottomNav />

      {/* Pay at Counter Modal */}
      {showPayCounterPopup && (
        <div className="pay-counter-modal-overlay">
          <div className="pay-counter-modal">
            <div className="modal-icon">
              <Wallet size={36} color="#8B3A1E" />
            </div>
            <h3>Pay at Counter</h3>
            <p>Are you sure you want to place your order and pay at the counter?</p>
            <div className="modal-actions">
              <button
                className="modal-btn-cancel"
                onClick={() => setShowPayCounterPopup(false)}
              >
                Cancel
              </button>
              <button
                className="modal-btn-confirm"
                onClick={confirmPayAtCounter}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyOrderPage;