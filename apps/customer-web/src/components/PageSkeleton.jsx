import React from 'react';
import { Home, ShoppingBag, ShoppingCart, User } from 'lucide-react';
import { NavLink } from 'react-router-dom';

const SHIMMER_CSS = `
  @keyframes _sk_shimmer {
    0%   { background-position: -200% 0; }
    100% { background-position:  200% 0; }
  }
  .sk-pulse {
    background: linear-gradient(90deg, #FFF0EC 25%, #FFD6C9 50%, #FFF0EC 75%);
    background-size: 200% 100%;
    animation: _sk_shimmer 1.5s infinite;
    border-radius: 8px;
  }
  .sk-nav-link {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    border-radius: 12px;
    text-decoration: none;
    color: #9C8F8A;
    transition: background 0.15s, color 0.15s;
  }
  .sk-nav-link.active {
    background: rgba(139, 58, 30, 0.10);
    color: #8B3A1E;
  }
`;

const NAV_ITEMS = [
  { to: "/",        Icon: Home,          label: "Home"    },
  { to: "/menu",    Icon: ShoppingBag,   label: "Menu"    },
  { to: "/orders",  Icon: ShoppingCart,  label: "Orders"  },
  { to: "/profile", Icon: User,          label: "Profile" },
];

function SkeletonBottomNav() {
  return (
    <nav style={{
      position: "fixed", bottom: 0, left: 0, right: 0, height: 64,
      display: "flex", alignItems: "center", justifyContent: "space-around",
      background: "#FFF7F3",
      borderTop: "1.5px solid #F0F0F0",
      boxShadow: "0 -4px 20px rgba(139,58,30,0.06)",
      zIndex: 1000,
    }}>
      {NAV_ITEMS.map(({ to, Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          end={to === "/"}
          className={({ isActive }) => `sk-nav-link${isActive ? " active" : ""}`}
          aria-label={label}
        >
          <Icon size={22} strokeWidth={1.8} />
        </NavLink>
      ))}
    </nav>
  );
}

export function PageSkeleton() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "#fff",
      display: "flex",
      flexDirection: "column",
      paddingBottom: 70,
    }}>
      <style>{SHIMMER_CSS}</style>

      {/* Header */}
      <div style={{
        padding: "16px 20px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        borderBottom: "1px solid #f5ede9",
      }}>
        <div className="sk-pulse" style={{ width: 42, height: 42, borderRadius: 12 }} />
        <div className="sk-pulse" style={{ width: 120, height: 22 }} />
        <div className="sk-pulse" style={{ width: 42, height: 42, borderRadius: 12 }} />
      </div>

      {/* Hero banner */}
      <div style={{ padding: "20px 20px 0" }}>
        <div className="sk-pulse" style={{ height: 140, borderRadius: 20 }} />
      </div>

      {/* Section label */}
      <div style={{ padding: "20px 20px 8px" }}>
        <div className="sk-pulse" style={{ width: 130, height: 18 }} />
      </div>

      {/* Card list */}
      <div style={{ padding: "0 20px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
        {[1, 2, 3].map(i => (
          <div key={i} style={{
            display: "flex", gap: 14, padding: 16,
            background: "#FFF7F3", borderRadius: 16, border: "1.5px solid #F0F0F0",
          }}>
            <div className="sk-pulse" style={{ width: 90, height: 90, borderRadius: 12, flexShrink: 0 }} />
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
              <div className="sk-pulse" style={{ height: 18, width: "75%" }} />
              <div className="sk-pulse" style={{ height: 13, width: "100%" }} />
              <div className="sk-pulse" style={{ height: 13, width: "55%" }} />
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                <div className="sk-pulse" style={{ height: 20, width: 50 }} />
                <div className="sk-pulse" style={{ height: 32, width: 80, borderRadius: 20 }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Real icon bottom nav */}
      <SkeletonBottomNav />
    </div>
  );
}

export default PageSkeleton;
