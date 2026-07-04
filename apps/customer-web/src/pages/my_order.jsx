import React, { useState, useEffect, useRef } from 'react';
import { Home, ShoppingBag, MessageCircle, User, Minus, Plus, Trash2, Clock, CheckCircle, Utensils, ShoppingCart, ListOrdered, ArrowRight, Star, Users, CreditCard, Wallet, Loader2, AlertCircle, Download, Pencil } from 'lucide-react';
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useRestaurant } from '../context/RestaurantContext';
import { processOnlinePayment } from '../services/paymentService';
import { createOrder, getTodaysOrders, cancelOrder, updateOrderType } from '../services/supabaseService';
import './my_order.css';
import Hamburger from '../components/hamburger';
import BottomNav from '../components/BottomNav';
import { jsPDF } from 'jspdf';
import PageSkeleton from '../components/PageSkeleton';
import { supabase } from '@restaurant-saas/supabase';

const MyOrderPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  const { cartItems, updateQuantity, deleteFromCart, cartSubtotal, clearCart, orderSpecialInstructions, setOrderSpecialInstructions } = useCart();
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

    // Header
    doc.setFontSize(22);
    doc.setTextColor(139, 58, 30); // #8B3A1E
    doc.text('TABLEKARD', 105, 20, { align: 'center' });

    doc.setDrawColor(200, 200, 200);
    doc.line(20, 25, 190, 25);

    // Order Info
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Invoice: ${order.id}`, 20, 35);
    doc.text(`Date: ${order.fullDate} ${order.orderDate}`, 20, 42);

    doc.line(20, 48, 190, 48);

    // Items Table Header
    doc.setFont(undefined, 'bold');
    doc.text('Items', 20, 55);
    doc.text('Qty', 140, 55);
    doc.text('Price', 170, 55);
    doc.setFont(undefined, 'normal');

    let y = 62;
    order.items.forEach(item => {
      doc.setFont(undefined, 'bold');
      doc.text(item.name, 20, y);
      doc.setFont(undefined, 'normal');
      doc.text(`x${item.quantity}`, 140, y);
      doc.text(`₹${item.price * item.quantity}`, 170, y);
      y += 6;

      if (item.variant) {
        doc.setFontSize(9);
        doc.setTextColor(120, 120, 120);
        doc.text(`Variant: ${item.variant.name} (+₹${item.variant.price})`, 25, y);
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        y += 5;
      }
      if (item.addons && item.addons.length > 0) {
        doc.setFontSize(9);
        doc.setTextColor(120, 120, 120);
        const addonsText = item.addons.map(a => `${a.name} (+₹${a.price})`).join(', ');
        doc.text(`Add-ons: ${addonsText}`, 25, y);
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        y += 5;
      }
      y += 3;
    });

    doc.line(20, y, 190, y);
    y += 10;

    // Summary
    const subtotal = order.total - Math.round(order.total * 0.18);
    const tax = Math.round(order.total * 0.18);

    doc.text('Subtotal:', 140, y);
    doc.text(`₹${subtotal}`, 170, y);
    y += 8;

    doc.text('Tax (18%):', 140, y);
    doc.text(`₹${tax}`, 170, y);
    y += 8;

    doc.setFont(undefined, 'bold');
    doc.setFontSize(14);
    doc.text('TOTAL:', 140, y);
    doc.text(`₹${order.total}`, 170, y);

    // Footer
    y += 20;
    doc.setFontSize(10);
    doc.setFont(undefined, 'italic');
    doc.text('Payment Status: ' + order.paymentStatus, 20, y);
    doc.text('Thank you for dining with us!', 105, y + 15, { align: 'center' });

    doc.save(`Invoice_${order.id}.pdf`);
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
                {cartItems.map(item => (
                  <div key={item.id} className="cart-item" style={{ opacity: item.outOfStock ? 0.6 : 1, filter: item.outOfStock ? 'grayscale(100%)' : 'none' }}>
                    <div className="cart-image">
                      <img src={item.image} alt={item.name} />
                      {item.outOfStock && (
                        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'rgba(0,0,0,0.7)', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                          OUT OF STOCK
                        </div>
                      )}
                    </div>
                    <div className="cart-info">
                      {/* Row 1: name + [pencil] [trash] */}
                      <div className="cart-header">
                        <h3>{item.name}</h3>
                        <div className="cart-header-actions">
                          <button className="remove-btn" onClick={() => removeItem(item.id)}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                      {item.variant && (
                        <div className="item-customization-info" style={{ textAlign: 'left', fontSize: '11px', color: '#8B3A1E', fontWeight: 600, marginTop: '2px', marginBottom: '2px' }}>
                          Variant: {item.variant.name} (+₹{item.variant.price})
                        </div>
                      )}
                      {item.addons && item.addons.length > 0 && (
                        <div className="item-customization-info" style={{ textAlign: 'left', fontSize: '11px', color: '#666', marginTop: '2px', marginBottom: '2px' }}>
                          Add-ons: {item.addons.map(a => `${a.name} (+₹${a.price})`).join(', ')}
                        </div>
                      )}
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
                        <div className="item-price">₹{(item.price * item.quantity)}</div>
                      </div>

                    </div>
                  </div>
                ))}
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
              <div className="order-special-instructions-container" style={{ margin: '20px 0' }}>
                {!showSpecialInstructions ? (
                  <button
                    className="add-special-instructions-btn"
                    onClick={() => setShowSpecialInstructions(true)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '8px',
                      background: 'transparent', border: '1px dashed #8B3A1E', color: '#8B3A1E',
                      padding: '12px', borderRadius: '12px', width: '100%',
                      justifyContent: 'center', fontSize: '14px', fontWeight: '500',
                      cursor: 'pointer'
                    }}
                  >
                    <Plus size={16} />
                    Add cooking instructions or requests
                  </button>
                ) : (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <h2 className="summary-title" style={{ margin: 0 }}>Special Instructions</h2>
                      <button
                        onClick={() => {
                          setShowSpecialInstructions(false);
                          setOrderSpecialInstructions('');
                        }}
                        style={{ background: 'none', border: 'none', color: '#EF4444', fontSize: '13px', cursor: 'pointer', padding: 0 }}
                      >
                        Remove
                      </button>
                    </div>
                    <textarea
                      className="special-instructions-input"
                      placeholder="e.g. Please make it less spicy, extra napkins..."
                      value={orderSpecialInstructions}
                      onChange={e => setOrderSpecialInstructions(e.target.value)}
                      maxLength={500}
                      rows={3}
                      style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #ddd', fontSize: '14px', resize: 'vertical' }}
                    />
                  </>
                )}
              </div>

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
                          let badgeColor = '#FF9800'; // placed
                          if (itemStatus === 'preparing') badgeColor = '#3B82F6';
                          if (itemStatus === 'ready') badgeColor = '#22C55E';

                          return (
                            <div key={index} style={{ marginBottom: '8px' }}>
                              <div className="oi-item-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span className="oi-item-qty">{item.quantity}×</span>
                                  <span className="oi-item-name">{item.name}</span>
                                  <span style={{
                                    fontSize: '10px',
                                    padding: '2px 8px',
                                    borderRadius: '12px',
                                    fontWeight: 'bold',
                                    color: badgeColor,
                                    backgroundColor: badgeColor + '12',
                                    border: `1px solid ${badgeColor}30`,
                                    textTransform: 'capitalize'
                                  }}>
                                    {itemStatus}
                                  </span>
                                </div>
                                <span className="oi-item-price">₹{item.price * item.quantity}</span>
                              </div>
                              {item.variant && (
                                <div style={{ fontSize: '11px', color: '#8B3A1E', fontStyle: 'italic', marginLeft: '24px', marginTop: '2px' }}>
                                  Variant: {item.variant.name} (+₹{item.variant.price})
                                </div>
                              )}
                              {item.addons && item.addons.length > 0 && (
                                <div style={{ fontSize: '11px', color: '#666', fontStyle: 'italic', marginLeft: '24px', marginTop: '2px' }}>
                                  Add-ons: {item.addons.map(a => `${a.name} (+₹${a.price})`).join(', ')}
                                </div>
                              )}
                              {item.specialInstructions && (
                                <div className="oi-item-note">
                                  <span>📝</span>
                                  <span>{item.specialInstructions}</span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

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
                      <button
                        className="oi-invoice-btn"
                        onClick={() => downloadInvoice(order)}
                      >
                        <Download size={13} />
                        Download Invoice
                      </button>
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