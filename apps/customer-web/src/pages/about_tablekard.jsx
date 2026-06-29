import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AboutTablekardPage = () => {
  const navigate = useNavigate();

  return (
    <div style={{ background: '#FCFCFC', minHeight: '100vh', fontFamily: "'Inter', sans-serif", color: '#2D2D2D' }}>
      <header style={{ 
        display: 'flex', 
        alignItems: 'center', 
        padding: '20px 24px', 
        background: '#FFFFFF', 
        borderBottom: '1px solid #ECECEC', 
        position: 'sticky', 
        top: 0, 
        zIndex: 10 
      }}>
        <button onClick={() => navigate(-1)} style={{ 
          background: 'none', 
          border: 'none', 
          padding: '0', 
          cursor: 'pointer', 
          marginRight: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <ArrowLeft size={22} color="#1A1A1A" />
        </button>
        <h1 style={{ fontSize: '15px', fontWeight: 600, margin: 0, color: '#1A1A1A', letterSpacing: '1px', textTransform: 'uppercase' }}>About us</h1>
      </header>

      <div style={{ padding: '40px 24px', maxWidth: '480px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '32px' }}>
        {/* Brand Emblem */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', borderBottom: '1px solid #EAEAEA', paddingBottom: '32px' }}>
          <div style={{ 
            width: '64px', 
            height: '64px', 
            background: '#8B3A1E', 
            borderRadius: '16px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(139, 58, 30, 0.1)'
          }}>
            <span style={{ color: '#FFFFFF', fontSize: '24px', fontWeight: 700, fontFamily: "'Playfair Display', serif" }}>T</span>
          </div>
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#1A1A1A', margin: '0 0 4px 0', fontFamily: "'Playfair Display', serif" }}>Tablekard</h2>
            <span style={{ fontSize: '11px', color: '#888888', textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: 600 }}>Digital Dining Platform</span>
          </div>
        </div>

        {/* Professional Body Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', lineHeight: 1.75, fontSize: '15px', color: '#4A4A4A' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#1A1A1A', margin: '0 0 -8px 0', fontFamily: "'Playfair Display', serif" }}>
            Welcome to Tablekard
          </h3>
          
          <p style={{ margin: 0 }}>
            You're using Tablekard, a modern digital dining platform designed to make ordering food as simple as scanning a QR code.
          </p>

          <p style={{ margin: 0 }}>
            From browsing the menu and placing your order to making secure payments and tracking your food live, everything happens right from your phone—no app downloads, no unnecessary waiting.
          </p>

          <p style={{ margin: 0 }}>
            Behind the scenes, Tablekard helps restaurants manage orders efficiently so you enjoy a smoother, faster dining experience.
          </p>

          <p style={{ 
            margin: '8px 0 0 0', 
            borderLeft: '3px solid #8B3A1E', 
            paddingLeft: '16px', 
            fontStyle: 'italic', 
            color: '#555555',
            fontSize: '14.5px'
          }}>
            Designed and developed by{' '}
            <a 
              href="https://growtez.com" 
              target="_blank" 
              rel="noopener noreferrer" 
              style={{ color: '#8B3A1E', fontWeight: 600, textDecoration: 'none', transition: 'opacity 0.2s' }}
              onMouseOver={(e) => e.currentTarget.style.opacity = '0.8'}
              onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
            >
              growtez
            </a>
            , Tablekard is part of our mission to build smart, reliable, and user-friendly technology that improves everyday experiences for both customers and businesses.
          </p>
        </div>

        {/* Corporate Style Footer */}
        <div style={{ 
          marginTop: '16px',
          paddingTop: '24px',
          borderTop: '1px solid #EAEAEA',
          textAlign: 'center',
          fontSize: '12px',
          color: '#999999',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px'
        }}>
          <div>
            Developed by{' '}
            <a 
              href="https://growtez.com" 
              target="_blank" 
              rel="noopener noreferrer" 
              style={{ color: '#8B3A1E', fontWeight: 600, textDecoration: 'none' }}
            >
              growtez
            </a>
          </div>
          <div>© {new Date().getFullYear()} Tablekard. All rights reserved.</div>
        </div>
      </div>
    </div>
  );
};

export default AboutTablekardPage;
