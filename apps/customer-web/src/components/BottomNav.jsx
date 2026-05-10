import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, ShoppingBag, ShoppingCart, User } from 'lucide-react';
import { useCart } from '../context/CartContext';

/* ─── Restaurant Menu Card Icon ───────────────────────────────────────────── */
const CustomMenuIcon = ({ size = 22, ...props }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        {...props}
    >
        {/* Menu card outline — rounded rectangle */}
        <rect x="4" y="2" width="16" height="20" rx="2.5" ry="2.5" />
        {/* Header accent bar — bold top section like a menu title */}
        <line x1="4" y1="7" x2="20" y2="7" />
        {/* Menu item lines */}
        <line x1="7.5" y1="11" x2="16.5" y2="11" />
        <line x1="7.5" y1="14.5" x2="16.5" y2="14.5" />
        <line x1="7.5" y1="18" x2="13" y2="18" />
    </svg>
);

const BottomNav = () => {
    const { cartItems } = useCart();

    return (
        <nav className="bottom-nav">
            <NavLink to="/" className={({ isActive }) => `nav-btn ${isActive ? 'active' : ''}`}>
                <Home size={22} />
            </NavLink>

            <NavLink to="/menu" className={({ isActive }) => `nav-btn ${isActive ? 'active' : ''}`}>
                <CustomMenuIcon size={22} />
            </NavLink>

            <NavLink to="/orders" className={({ isActive }) => `nav-btn ${isActive ? 'active' : ''}`}>
                <ShoppingCart size={22} />
                {cartItems?.length > 0 && (
                    <span className="cart-badge">
                        {cartItems.length > 9 ? '9+' : cartItems.length}
                    </span>
                )}
            </NavLink>

            <NavLink to="/profile" className={({ isActive }) => `nav-btn ${isActive ? 'active' : ''}`}>
                <User size={22} />
            </NavLink>
        </nav>
    );
};

export default BottomNav;
export { CustomMenuIcon };
