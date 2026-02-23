import React, { useState, useEffect } from 'react';
import { Home, ShoppingBag, MessageCircle, User, Minus, Plus, Trash2, Clock, CheckCircle, Utensils, ShoppingCart, ListOrdered, ArrowRight, Star, Users, CreditCard, Wallet, Loader2, AlertCircle } from 'lucide-react';
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { processOnlinePayment } from '../services/paymentService';
import { createOrder } from '../services/supabaseService';
import './my_order.css';
import Hamburger from '../components/hamburger';

const MyOrderPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { cartItems, updateQuantity, deleteFromCart, cartSubtotal, clearCart } = useCart();
  const [activeTab, setActiveTab] = useState('cart');
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('');
  const [error, setError] = useState('');

  const [orders, setOrders] = useState([
    {
      id: 'ORD001',
      status: 'ready',
      items: [
        { name: 'Chicken Wings', quantity: 1, price: 12 },
        { name: 'Iced Coffee', quantity: 2, price: 3 }
      ],
      total: 18,
      discount: 0,
      orderDate: 'Jan 10, 2:30 PM',
      paymentStatus: 'Paid via UPI',
      statusLabel: 'Ready for serving'
    },
    {
      id: 'ORD002',
      status: 'preparing',
      items: [
        { name: 'Pasta Carbonara', quantity: 1, price: 14 },
        { name: 'Chocolate Cake', quantity: 1, price: 7 }
      ],
      total: 21,
      discount: 0,
      orderDate: 'Jan 10, 3:15 PM',
      paymentStatus: 'Not Paid',
      statusLabel: 'Preparing'
    },
    {
      id: 'ORD003',
      status: 'placed',
      items: [
        { name: 'Veggie Burger', quantity: 2, price: 13 },
        { name: 'Smoothie Bowl', quantity: 1, price: 6 }
      ],
      total: 32,
      discount: 5,
      orderDate: 'Jan 10, 3:45 PM',
      paymentStatus: 'Paid via Cash',
      statusLabel: 'Order Placed'
    }
  ]);

  // Alias for template compatibility
  const removeItem = deleteFromCart;
  const getTotalPrice = () => cartSubtotal;

  const getStatusIcon = (status) => {
    switch (status) {
      case 'placed':
        return <CheckCircle size={16} color="#4CAF50" />;
      case 'preparing':
        return <Utensils size={16} color="#FF9800" />;
      case 'ready':
        return <Clock size={16} color="#d9b550" />;
      default:
        return <Clock size={16} color="#888888" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'placed':
        return '#4CAF50';
      case 'preparing':
        return '#FF9800';
      case 'ready':
        return '#d9b550';
      default:
        return '#888888';
    }
  };

  // ─── PAY ONLINE: Razorpay flow ───
  const handlePayOnline = async () => {
    if (cartItems.length === 0) return;
    if (!isAuthenticated) {
      const currentPath = encodeURIComponent(window.location.pathname);
      navigate(`/login?redirect=${currentPath}`);
      return;
    }

    setPaymentLoading(true);
    setError('');

    try {
      // Restaurant ID — for single-restaurant setup
      const restaurantId = 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d';

      const result = await processOnlinePayment({
        restaurantId,
        tableId: null,
        orderType: 'DINE_IN',
        items: cartItems,
        restaurantName: 'Tablekard',
        userName: user?.user_metadata?.full_name || '',
        userEmail: user?.email || '',
        userPhone: user?.phone || '',
        onStatusChange: (status) => setPaymentStatus(status),
      });

      if (result.success) {
        const newOrder = {
          id: result.orderNumber,
          status: 'placed',
          items: cartItems.map(item => ({ name: item.name, quantity: item.quantity, price: item.price })),
          total: getTotalPrice() + Math.round(getTotalPrice() * 0.05) + Math.round(getTotalPrice() * 0.18),
          orderDate: 'Just now',
          paymentStatus: 'Paid Online',
          statusLabel: 'Order Placed'
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
    if (!isAuthenticated) {
      const currentPath = encodeURIComponent(window.location.pathname);
      navigate(`/login?redirect=${currentPath}`);
      return;
    }

    setPaymentLoading(true);
    setError('');

    try {
      // Restaurant ID — for single-restaurant setup
      const restaurantId = 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d';

      const result = await createOrder({
        restaurantId,
        customerId: user?.id,
        customerName: user?.user_metadata?.full_name || null,
        customerPhone: user?.phone || null,
        tableNumber: null,
        items: cartItems,
        paymentMethod: 'PAY_AT_COUNTER',
      });

      const newOrder = {
        id: result.orderNumber,
        status: 'placed',
        items: cartItems.map(item => ({ name: item.name, quantity: item.quantity, price: item.price })),
        total: getTotalPrice() + Math.round(getTotalPrice() * 0.05) + Math.round(getTotalPrice() * 0.18),
        orderDate: 'Just now',
        paymentStatus: 'Pay at Counter',
        statusLabel: 'Order Placed'
      };
      setOrders(prev => [newOrder, ...prev]);
      setCartItems([]);
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

  return (
    <div className="myorder-container">
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
                  <div key={item.id} className="cart-item">
                    <div className="cart-image">
                      <img src={item.image} alt={item.name} />
                    </div>
                    <div className="cart-info">
                      <div className="cart-header">
                        <h3>{item.name}</h3>
                        <button
                          className="remove-btn"
                          onClick={() => removeItem(item.id)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <div className="cart-meta">
                        <div className="cart-rating">
                          <Star size={12} fill="#8B3A1E" color="#8B3A1E" />
                          <span>{item.rating}</span>
                        </div>
                        <div className="cart-serves">
                          <Users size={12} />
                          <span>Serves {item.serves}</span>
                        </div>
                      </div>
                      <div className="cart-bottom">
                        <div className="quantity-controls">
                          <button
                            className="quantity-btn"
                            onClick={() => updateQuantity(item.id, -1)}
                          >
                            <Minus size={14} />
                          </button>
                          <span className="quantity">{item.quantity}</span>
                          <button
                            className="quantity-btn"
                            onClick={() => updateQuantity(item.id, 1)}
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                        <div className="item-price">
                          ₹{(item.price * item.quantity)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Summary */}
              <h2 className="summary-title">Summary</h2>
              <div className="order-summary">
                <div className="summary-row">
                  <span>Subtotal</span>
                  <span>₹{getTotalPrice()}</span>
                </div>
                <div className="summary-row">
                  <span>Service Charge (5%)</span>
                  <span>₹{Math.round(getTotalPrice() * 0.05)}</span>
                </div>
                <div className="summary-row">
                  <span>Tax (18%)</span>
                  <span>₹{Math.round(getTotalPrice() * 0.18)}</span>
                </div>
                <div className="summary-row discount">
                  <span>Discount</span>
                  <span>- ₹0</span>
                </div>
                <div className="summary-row total">
                  <span>Total Amount</span>
                  <span>₹{getTotalPrice() + Math.round(getTotalPrice() * 0.05) + Math.round(getTotalPrice() * 0.18)}</span>
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
                  disabled={paymentLoading}
                  style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                    padding: '10px 12px', fontSize: '13px', whiteSpace: 'nowrap',
                    opacity: paymentLoading ? 0.6 : 1
                  }}
                >
                  <Wallet size={16} />
                  Pay at Counter
                </button>
                <button
                  className="place-order-btn"
                  onClick={handlePayOnline}
                  disabled={paymentLoading}
                  style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                    background: 'transparent', border: '2px solid #8B3A1E', color: '#8B3A1E',
                    padding: '10px 12px', fontSize: '13px', whiteSpace: 'nowrap',
                    opacity: paymentLoading ? 0.6 : 1
                  }}
                >
                  <CreditCard size={16} />
                  Pay Online
                </button>
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
          {orders.length === 0 ? (
            <div className="empty-state">
              <ShoppingBag size={64} color="#888888" />
              <h3>No active orders yet.</h3>
              <p>Order some delicious food!</p>
            </div>
          ) : (
            <>
              <h2 className="section-heading">Today's Orders</h2>
              <div className="orders-list">
                {orders.map(order => (
                  <div key={order.id} className="order-item">
                    <div className="order-header">
                      <div className="order-id-row">
                        <span className="order-id">Order #{order.id}</span>
                        <div className="order-status" style={{ backgroundColor: getStatusColor(order.status) + '20' }}>
                          {getStatusIcon(order.status)}
                          <span className="status-text">
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </span>
                        </div>
                      </div>
                      <span className="order-date">{order.orderDate}</span>
                    </div>

                    <div className="order-items">
                      {order.items.map((item, index) => (
                        <div key={index} className="order-item-row">
                          <span>{item.quantity}x {item.name}</span>
                          <span>₹{(item.price * item.quantity)}</span>
                        </div>
                      ))}
                    </div>

                    <div className="order-footer">
                      <div className={`payment-badge ${order.paymentStatus?.includes('Not') ? 'not-paid' : 'paid'}`}>
                        {order.paymentStatus}
                      </div>
                      <div className="order-total-inline">
                        <span className="order-total">₹{order.total}</span>
                        <span className="order-total-note">(Incl. all taxes)</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Bottom Navigation */}
      <nav className="bottom-nav">
        <NavLink to="/" className={({ isActive }) => `nav-btn ${isActive ? 'active' : ''}`}>
          <Home size={22} />
        </NavLink>

        <NavLink to="/menu" className={({ isActive }) => `nav-btn ${isActive ? 'active' : ''}`}>
          <ShoppingBag size={22} />
        </NavLink>

        <NavLink to="/orders" className={({ isActive }) => `nav-btn ${isActive ? 'active' : ''}`}>
          <ShoppingCart size={22} />
          {cartItems.length > 0 && <span className="cart-badge">{cartItems.length > 9 ? '9+' : cartItems.length}</span>}
        </NavLink>

        <NavLink to="/profile" className={({ isActive }) => `nav-btn ${isActive ? 'active' : ''}`}>
          <User size={22} />
        </NavLink>
      </nav>
    </div>
  );
};

export default MyOrderPage;