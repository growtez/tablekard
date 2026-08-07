import React from 'react';
import { ArrowLeft, QrCode, Clock, ShieldCheck, ExternalLink, Utensils } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AboutTablekardPage = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <QrCode size={20} color="#8B3A1E" />,
      title: 'Scan & Order',
      desc: 'Access interactive visual menus directly from your table by scanning a simple QR code.'
    },
    {
      icon: <Clock size={20} color="#8B3A1E" />,
      title: 'Live Preparation Updates',
      desc: 'Follow your food status and kitchen queue progression in real time right on your device.'
    },
    {
      icon: <ShieldCheck size={20} color="#8B3A1E" />,
      title: 'Seamless Digital Checkout',
      desc: 'Pay safely and instantly without waiting for physical bills or card terminals.'
    }
  ];

  return (
    <div style={{ 
      background: '#FAFAFA', 
      minHeight: '100vh', 
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif", 
      color: '#1E293B' 
    }}>
      {/* Top Sticky Header */}
      <header style={{ 
        display: 'flex', 
        alignItems: 'center', 
        padding: '16px 20px', 
        background: '#FFFFFF', 
        borderBottom: '1px solid #F1F5F9', 
        position: 'sticky', 
        top: 0, 
        zIndex: 10,
        boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
      }}>
        <button 
          onClick={() => navigate(-1)} 
          style={{ 
            background: '#F1F5F9', 
            border: 'none', 
            borderRadius: '50%',
            width: '36px',
            height: '36px',
            cursor: 'pointer', 
            marginRight: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease'
          }}
          onMouseOver={(e) => e.currentTarget.style.background = '#E2E8F0'}
          onMouseOut={(e) => e.currentTarget.style.background = '#F1F5F9'}
        >
          <ArrowLeft size={18} color="#0F172A" />
        </button>
        <h1 style={{ fontSize: '15px', fontWeight: 600, margin: 0, color: '#0F172A', letterSpacing: '0.3px' }}>
          About Tablekard
        </h1>
      </header>

      <main style={{ 
        padding: '32px 20px 48px 20px', 
        maxWidth: '480px', 
        margin: '0 auto', 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '24px' 
      }}>
        {/* Brand Emblem Header */}
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          textAlign: 'center',
          gap: '16px',
          paddingBottom: '8px'
        }}>
          {/* Logo Badge in Brand Terracotta Accent */}
          <div style={{ 
            background: '#8B3A1E', 
            padding: '16px 32px', 
            borderRadius: '20px', 
            display: 'inline-flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(139, 58, 30, 0.2)',
            border: '1px solid rgba(255, 255, 255, 0.15)'
          }}>
            <img 
              src="/assets/tablekard_logo-white.png" 
              alt="Tablekard Logo" 
              style={{ 
                height: '38px', 
                maxWidth: '190px', 
                objectFit: 'contain' 
              }} 
            />
          </div>

          <div style={{
            background: '#FDF4F0',
            color: '#8B3A1E',
            border: '1px solid #FADECF',
            padding: '5px 14px',
            borderRadius: '20px',
            fontSize: '11px',
            fontWeight: 600,
            letterSpacing: '1px',
            textTransform: 'uppercase',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <Utensils size={13} color="#8B3A1E" /> Digital Dining Experience
          </div>

          <p style={{ 
            fontSize: '14.5px', 
            color: '#475569', 
            margin: 0, 
            lineHeight: 1.6,
            maxWidth: '380px'
          }}>
            Designed to make dining frictionless, fast, and enjoyable through smart QR code technology.
          </p>
        </div>

        {/* Feature Highlights Grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h2 style={{ 
            fontSize: '12px', 
            fontWeight: 700, 
            textTransform: 'uppercase', 
            letterSpacing: '1px', 
            color: '#64748B', 
            margin: '8px 0 4px 4px' 
          }}>
            Key Platform Features
          </h2>
          {features.map((item, idx) => (
            <div 
              key={idx} 
              style={{ 
                background: '#FFFFFF', 
                borderRadius: '16px', 
                padding: '18px 20px', 
                display: 'flex', 
                alignItems: 'flex-start', 
                gap: '16px',
                border: '1px solid #F1F5F9',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.02)',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.05)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.02)';
              }}
            >
              <div style={{ 
                background: '#FDF4F0', 
                padding: '10px', 
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                {item.icon}
              </div>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#0F172A', margin: '0 0 4px 0' }}>
                  {item.title}
                </h3>
                <p style={{ fontSize: '13.5px', color: '#64748B', margin: 0, lineHeight: 1.5 }}>
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Vision & Story Section */}
        <div style={{ 
          background: '#FFFFFF', 
          borderRadius: '20px', 
          padding: '24px', 
          border: '1px solid #F1F5F9',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.02)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A', margin: 0 }}>
            Modernizing Everyday Dining
          </h2>
          <p style={{ fontSize: '14px', color: '#475569', margin: 0, lineHeight: 1.6 }}>
            Tablekard bridges the gap between hungry guests and busy kitchens. From instantly browsing menus to tracking live cooking progress, Tablekard provides clarity and comfort without needing app installs.
          </p>
        </div>

        {/* Corporate Footer */}
        <div style={{ 
          background: '#FFFFFF', 
          borderRadius: '20px', 
          padding: '20px 24px', 
          border: '1px solid #F1F5F9',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.02)',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '6px'
        }}>
          <div style={{ fontSize: '13px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '5px' }}>
            Designed & Developed by
            <a 
              href="https://growtez.com" 
              target="_blank" 
              rel="noopener noreferrer" 
              style={{ 
                color: '#8B3A1E', 
                fontWeight: 700, 
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              GrowTez <ExternalLink size={12} color="#8B3A1E" />
            </a>
          </div>
          <div style={{ fontSize: '12px', color: '#94A3B8' }}>
            © {new Date().getFullYear()} Tablekard. All rights reserved.
          </div>
        </div>
      </main>
    </div>
  );
};

export default AboutTablekardPage;


