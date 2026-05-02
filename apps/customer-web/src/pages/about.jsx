import React, { useState, useRef } from 'react';
import { ArrowLeft, MapPin, Phone, Mail, Clock, Instagram, Facebook, Globe, Utensils, Award, Users, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useRestaurant } from '../context/RestaurantContext';
import { getRestaurantById } from '../services/supabaseService';
import './about.css';

const AboutPage = () => {
    const navigate = useNavigate();
    const { restaurantId } = useRestaurant();
    const [restaurant, setRestaurant] = useState(null);
    const [activeHourIndex, setActiveHourIndex] = useState(0);
    const scrollerRef = useRef(null);

    React.useEffect(() => {
        if (restaurantId) {
            getRestaurantById(restaurantId)
                .then(data => setRestaurant(data))
                .catch(err => console.error("Failed to fetch restaurant", err));
        }
    }, [restaurantId]);

    const handleScroll = () => {
        if (scrollerRef.current) {
            const container = scrollerRef.current;
            const scrollLeft = container.scrollLeft;
            const scrollWidth = container.scrollWidth;
            const clientWidth = container.clientWidth;
            const cardWidth = 232; // min-width (220px) + gap (12px)

            // Check if scrolled to the end (for last dot)
            if (scrollLeft + clientWidth >= scrollWidth - 10) {
                setActiveHourIndex(2); // Last card
            } else {
                const index = Math.round(scrollLeft / cardWidth);
                setActiveHourIndex(Math.min(index, 2));
            }
        }
    };

    const scrollToCard = (index) => {
        if (scrollerRef.current) {
            const cardWidth = 232;
            scrollerRef.current.scrollTo({
                left: index * cardWidth,
                behavior: 'smooth'
            });
            setActiveHourIndex(index);
        }
    };

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
                    <div
                        className="hours-modern-scroller"
                        ref={scrollerRef}
                        onScroll={handleScroll}
                    >
                        <div className="hour-pill active">
                            <span className="hour-day">WEEKDAYS</span>
                            <span className="hour-time">{restaurant?.operating_hours_weekdays || '11:00 AM — 10:00 PM'}</span>
                            <div className="hour-status">Open Now</div>
                        </div>
                        <div className="hour-pill">
                            <span className="hour-day">WEEKENDS</span>
                            <span className="hour-time">{restaurant?.operating_hours_weekends || '10:00 AM — 11:30 PM'}</span>
                        </div>
                        {(!restaurant?.operating_hours_weekdays && !restaurant?.operating_hours_weekends) && (
                            <div className="hour-pill">
                                <span className="hour-day">SUNDAY</span>
                                <span className="hour-time">10:00 AM — 09:00 PM</span>
                            </div>
                        )}
                    </div>
                    {/* Pagination Dots */}
                    <div className="hours-pagination-dots">
                        {[0, 1, 2].map((index) => (
                            <span
                                key={index}
                                className={`dot ${activeHourIndex === index ? 'active' : ''}`}
                                onClick={() => scrollToCard(index)}
                            ></span>
                        ))}
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
