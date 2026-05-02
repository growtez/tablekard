import React, { useState } from 'react';
import { ArrowLeft, MapPin, Phone, Mail, Clock, Instagram, Facebook, Globe, Utensils, Award, Users, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useRestaurant } from '../context/RestaurantContext';
import { getRestaurantById } from '../services/supabaseService';
import './about.css';

const AboutPage = () => {
    const navigate = useNavigate();
    const { restaurantId } = useRestaurant();
    const [restaurant, setRestaurant] = useState(null);

    React.useEffect(() => {
        if (restaurantId) {
            getRestaurantById(restaurantId)
                .then(data => setRestaurant(data))
                .catch(err => console.error("Failed to fetch restaurant", err));
        }
    }, [restaurantId]);

    const checkOperatingStatus = () => {
        const date = new Date();
        const day = date.getDay(); // 0 is Sunday, 6 is Saturday
        const isWeekendToday = day === 0 || day === 6;

        const checkOpen = (hoursString) => {
            if (!hoursString) return false;
            try {
                // Try parsing both formats: "11:00 AM - 10:00 PM" and "11:00 AM — 10:00 PM"
                let parts = hoursString.split('-');
                if (parts.length < 2) parts = hoursString.split('—');
                if (parts.length < 2) return false;
                
                const [openStr, closeStr] = parts.map(s => s.trim());

                const parseTime = (timeStr) => {
                    const [time, modifier] = timeStr.split(' ');
                    if (!time || !modifier) return null;
                    let [hours, minutes] = time.split(':').map(Number);
                    
                    if (hours === 12) {
                        hours = modifier.toUpperCase() === 'AM' ? 0 : 12;
                    } else if (modifier.toUpperCase() === 'PM') {
                        hours += 12;
                    }
                    
                    const d = new Date();
                    d.setHours(hours, minutes || 0, 0, 0);
                    return d;
                };

                const openTime = parseTime(openStr);
                const closeTime = parseTime(closeStr);
                if (!openTime || !closeTime) return false;
                
                const now = new Date();

                if (closeTime <= openTime) {
                    closeTime.setDate(closeTime.getDate() + 1);
                    if (now.getHours() < openTime.getHours()) {
                        now.setDate(now.getDate() + 1);
                    }
                }

                return now >= openTime && now <= closeTime;
            } catch (e) {
                return false;
            }
        };

        const isWeekdaysOpen = checkOpen(restaurant?.operating_hours_weekdays || '11:00 AM - 10:00 PM');
        const isWeekendsOpen = checkOpen(restaurant?.operating_hours_weekends || '10:00 AM - 11:30 PM');

        return {
            isWeekendToday,
            isWeekdaysOpen,
            isWeekendsOpen
        };
    };

    const status = checkOperatingStatus();

    return (
        <div className="about-journal-container">
            {/* Elegant Header */}
            <header className="about-journal-header">
                <button className="global-back-btn" onClick={() => navigate(-1)}>
                    <ArrowLeft size={22} />
                </button>
                <div className="journal-header-title">OUR STORY</div>
                <div className="journal-spacer"></div>
            </header>

            <div className="about-journal-content">
                {/* Hero / Brand Intro */}
                <section className="about-journal-hero">
                    <div className="brand-badge">SINCE {restaurant?.opening_date ? new Date(restaurant.opening_date).getFullYear() : '2020'}</div>
                    <h1 className="brand-main-title">{restaurant?.name?.toUpperCase() || 'TABLEKARD'}</h1>
                    <p className="brand-philosophy">{restaurant?.tagline || 'The art of fine dining, redefined for the modern connoisseur.'}</p>
                    <div className="brand-accent-line"></div>
                </section>

                {/* The Legend / Manifesto */}
                <section className="journal-section legend">
                    <div className="legend-card">
                        <div className="legend-icon-row">
                            <Utensils size={24} className="legend-icon" />
                        </div>
                        <h2 className="legend-title">The Manifesto</h2>
                        <p className="legend-text">
                            {restaurant?.manifesto || 'Tablekard was born from a singular vision: to create a sanctuary where flavors tell stories. Our journey began in 2020, driven by a passion for culinary excellence and a commitment to locally-sourced, seasonal ingredients. We believe that every meal is an opportunity to create a lasting memory.'}
                        </p>
                    </div>
                </section>



                {/* Operating Hours - Modern Timeline Design */}
                <section className="journal-section hours">
                    <div className="section-label-row">
                        <Clock size={16} />
                        <span>OPERATING HOURS</span>
                    </div>
                    <div className="hours-stacked-container">
                        <div className={`hour-pill ${!status.isWeekendToday ? 'active' : ''}`}>
                            <span className="hour-day">MON-FRI</span>
                            <span className="hour-time">{restaurant?.operating_hours_weekdays || '11:00 AM — 10:00 PM'}</span>
                            {!status.isWeekendToday && (
                                <div className={`hour-status ${status.isWeekdaysOpen ? 'open' : 'closed'}`}>
                                    {status.isWeekdaysOpen ? 'Open Now' : 'Closed'}
                                </div>
                            )}
                        </div>
                        <div className={`hour-pill ${status.isWeekendToday ? 'active' : ''}`}>
                            <span className="hour-day">SAT-SUN</span>
                            <span className="hour-time">{restaurant?.operating_hours_weekends || '10:00 AM — 11:30 PM'}</span>
                            {status.isWeekendToday && (
                                <div className={`hour-status ${status.isWeekendsOpen ? 'open' : 'closed'}`}>
                                    {status.isWeekendsOpen ? 'Open Now' : 'Closed'}
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                {/* Contact - Redesigned Visit Us */}
                <section className="journal-section connect">
                    <div className="section-label-row">
                        <MapPin size={16} />
                        <span>VISIT US</span>
                    </div>

                    {/* Location Card with Map Preview */}
                    <div className="visit-location-card">
                        <div className="location-map-placeholder">
                            <MapPin size={32} className="map-icon-pulse" />
                            <span className="map-label">
                                {restaurant?.contact_address?.split(',').slice(-2, -1)[0]?.trim() || 'Location'}
                            </span>
                        </div>
                        <div className="location-details">
                            <h3 className="location-name">{restaurant?.name?.toUpperCase() || 'TABLEKARD'}</h3>
                            <p className="location-address">{restaurant?.contact_address || 'BOC Gate, Chapaguri Rd, Bongaigaon, Assam 783380'}</p>
                            <a href={`https://maps.google.com/?q=${encodeURIComponent(restaurant?.contact_address || 'BOC Gate, Chapaguri Rd, Bongaigaon, Assam 783380')}`} target="_blank" rel="noopener noreferrer" className="directions-btn">
                                <MapPin size={14} /> Get Directions
                            </a>
                        </div>
                    </div>

                    {/* Contact Actions - Minimal Centered Icons */}
                    <div className="contact-icons-row">
                        <a href={`tel:${restaurant?.contact_phone || '+911234567890'}`} className="contact-icon-item">
                            <div className="icon-circle call">
                                <Phone size={24} />
                            </div>
                            <span className="icon-label">Call</span>
                        </a>
                        <a href={`mailto:${restaurant?.contact_email || 'delishbngaigaonhere@gmail.com'}`} className="contact-icon-item">
                            <div className="icon-circle email">
                                <Mail size={24} />
                            </div>
                            <span className="icon-label">Email</span>
                        </a>
                        <a href={`https://wa.me/${(restaurant?.contact_phone || '911234567890').replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="contact-icon-item">
                            <div className="icon-circle whatsapp">
                                <Phone size={24} />
                            </div>
                            <span className="icon-label">WhatsApp</span>
                        </a>
                    </div>
                </section>

                {/* Social Footer */}
                <footer className="about-journal-footer">
                    <div className="social-row">
                        <a href={restaurant?.instagram_url || "https://instagram.com"} target="_blank" rel="noopener noreferrer"><Instagram size={20} /></a>
                        <a href={restaurant?.facebook_url || "https://facebook.com"} target="_blank" rel="noopener noreferrer"><Facebook size={20} /></a>
                        <a href={restaurant?.website_url || "https://example.com"} target="_blank" rel="noopener noreferrer"><Globe size={20} /></a>
                    </div>
                    <div className="footer-signature">
                        <div className="sig-line"></div>
                        <p>© {new Date().getFullYear()} {restaurant?.name?.toUpperCase() || 'TABLEKARD'}</p>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default AboutPage;
