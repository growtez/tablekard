import React from 'react';
import BottomNav from './BottomNav';

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

  /* Inject real BottomNav styles during skeleton phase before home.css loads */
  .bottom-nav {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: #FFFFFF;
    padding: 12px 24px 24px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-top: 1px solid #F0F0F0;
    z-index: 100;
  }
  .nav-btn {
    background: none;
    border: none;
    color: #D4A59A;
    cursor: pointer;
    padding: 12px;
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    text-decoration: none;
    position: relative;
    -webkit-tap-highlight-color: transparent;
    transition: all 0.2s ease;
  }
  .nav-btn.active {
    background: #8B3A1E !important;
    color: #FFFFFF !important;
    box-shadow: 0 4px 12px rgba(139, 58, 30, 0.3);
  }
  .cart-badge {
    position: absolute;
    top: -4px;
    right: -4px;
    background: #8B3A1E;
    color: #FFFFFF;
    font-size: 9px;
    font-weight: 700;
    min-width: 18px;
    height: 18px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 4px;
  }
`;

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

      {/* Render the EXACT same BottomNav component used by the real pages */}
      <BottomNav />
    </div>
  );
}

export default PageSkeleton;
