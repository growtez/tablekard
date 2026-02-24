import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, ShoppingBag, ShoppingCart, User, ArrowLeft, Bell, Globe, Shield, HelpCircle } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import './settings.css';

const SettingsPage = () => {
    const { theme } = useTheme();

    const settingsItems = [
        { id: 1, icon: Bell, label: 'Notifications', value: 'On' },
        { id: 2, icon: Globe, label: 'Language', value: 'English' },
        { id: 3, icon: Shield, label: 'Privacy', value: '' },
        { id: 4, icon: HelpCircle, label: 'Help & Support', value: '' },
    ];

    return (
        <div className="settings-container" style={{ backgroundColor: theme.background }}>
            {/* Header */}
            <header className="settings-header" style={{ backgroundColor: theme.background }}>
                <NavLink to="/profile" className="back-btn" style={{ backgroundColor: theme.inputBg }}>
                    <ArrowLeft size={24} color={theme.text} />
                </NavLink>
                <h1 className="header-title" style={{ color: theme.text }}>Settings</h1>
                <div style={{ width: 44 }}></div>
            </header>

            <div className="settings-content">
                {/* Preferences */}
                <section className="settings-section">
                    <h2 className="section-title" style={{ color: theme.text }}>Preferences</h2>
                    <div className="settings-card" style={{ backgroundColor: theme.card }}>
                        {settingsItems.map((item, index) => {
                            const IconComponent = item.icon;
                            return (
                                <div
                                    key={item.id}
                                    className="setting-item"
                                    style={{ borderBottom: index !== settingsItems.length - 1 ? `1px solid ${theme.border}` : 'none' }}
                                >
                                    <div className="setting-icon" style={{ backgroundColor: `${theme.primary}15` }}>
                                        <IconComponent size={20} color={theme.primary} />
                                    </div>
                                    <span className="setting-label" style={{ color: theme.text }}>{item.label}</span>
                                    <div className="setting-right">
                                        {item.value && <span className="setting-value" style={{ color: theme.textMuted }}>{item.value}</span>}
                                        <ArrowLeft size={16} color={theme.textMuted} style={{ transform: 'rotate(180deg)' }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* App Info */}
                <div className="app-info">
                    <span style={{ color: theme.textMuted }}>Customer Web</span>
                    <span style={{ color: theme.textMuted }}>Version 1.0.0</span>
                </div>
            </div>

            {/* Bottom Navigation */}
            <nav className="bottom-nav" style={{ backgroundColor: theme.card, borderTopColor: theme.border }}>
                <NavLink to="/" className="nav-btn"><Home size={24} color={theme.textMuted} /></NavLink>
                <NavLink to="/menu" className="nav-btn"><ShoppingBag size={24} color={theme.textMuted} /></NavLink>
                <NavLink to="/orders" className="nav-btn"><ShoppingCart size={24} color={theme.textMuted} /></NavLink>
                <NavLink to="/profile" className="nav-btn active"><User size={24} color={theme.text} /></NavLink>
            </nav>
        </div>
    );
};

export default SettingsPage;
