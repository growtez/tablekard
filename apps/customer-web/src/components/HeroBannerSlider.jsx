import React, { useState, useEffect, useRef, useCallback } from 'react';

const AUTO_PLAY_INTERVAL = 4000;

const HeroBannerSlider = ({ banners = [], fallback }) => {
    const [current, setCurrent] = useState(0);
    const touchStartX = useRef(null);
    const touchStartY = useRef(null);
    const autoPlayRef = useRef(null);

    const count = banners.length;

    const next = useCallback(() => {
        setCurrent(prev => (prev + 1) % count);
    }, [count]);

    const prev = useCallback(() => {
        setCurrent(prev => (prev - 1 + count) % count);
    }, [count]);

    useEffect(() => {
        if (count <= 1) return;
        autoPlayRef.current = setInterval(next, AUTO_PLAY_INTERVAL);
        return () => clearInterval(autoPlayRef.current);
    }, [count, next]);

    const resetAutoPlay = () => {
        clearInterval(autoPlayRef.current);
        if (count > 1) {
            autoPlayRef.current = setInterval(next, AUTO_PLAY_INTERVAL);
        }
    };

    const onTouchStart = (e) => {
        touchStartX.current = e.touches[0].clientX;
        touchStartY.current = e.touches[0].clientY;
    };

    const onTouchEnd = (e) => {
        if (touchStartX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchStartX.current;
        const dy = Math.abs(e.changedTouches[0].clientY - touchStartY.current);
        if (Math.abs(dx) > 40 && dy < 50) {
            if (dx < 0) next(); else prev();
            resetAutoPlay();
        }
        touchStartX.current = null;
    };

    if (count === 0) {
        return fallback || null;
    }

    return (
        <section
            className="hero-banner-slider"
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
        >
            <div className="hero-banner-track" style={{ transform: `translateX(-${current * 100}%)` }}>
                {banners.map((banner, i) => (
                    <div key={banner.id} className="hero-banner-slide">
                        <img
                            src={banner.image_url}
                            alt={banner.title || `Banner ${i + 1}`}
                            className="hero-banner-img"
                            draggable={false}
                        />
                        {(banner.title || banner.subtitle) && (
                            <div className="hero-banner-overlay">
                                {banner.title && <h2 className="hero-banner-title">{banner.title}</h2>}
                                {banner.subtitle && <p className="hero-banner-subtitle">{banner.subtitle}</p>}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {count > 1 && (
                <div className="hero-banner-dots">
                    {banners.map((_, i) => (
                        <button
                            key={i}
                            className={`hero-banner-dot ${i === current ? 'active' : ''}`}
                            onClick={() => { setCurrent(i); resetAutoPlay(); }}
                            aria-label={`Go to banner ${i + 1}`}
                        />
                    ))}
                </div>
            )}
        </section>
    );
};

export default HeroBannerSlider;
