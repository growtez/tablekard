import React, { useState, useEffect } from 'react';
import { ArrowLeft, Bell, ChefHat, Clock, Utensils } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './live_queue.css';

const LiveQueuePage = () => {
    const navigate = useNavigate();
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // Queue data
    const [queueData] = useState({
        nowServing: 47,
        preparing: [48, 49],
        upcoming: [50, 51, 52, 53],
        yourToken: 51, // User's token number
    });

    const formatTime = (date) => {
        return date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    };

    const getYourPosition = () => {
        const allQueue = [...queueData.preparing, ...queueData.upcoming];
        const index = allQueue.indexOf(queueData.yourToken);
        return index >= 0 ? index + 1 : null;
    };

    return (
        <div className="live-queue-container">
            {/* Header */}
            <header className="queue-header">
                <button className="back-btn" onClick={() => navigate(-1)}>
                    <ArrowLeft size={22} />
                </button>
                <div className="header-title">
                    <h1>Live Queue</h1>
                </div>
                <div className="live-badge">
                    <span className="pulse-dot"></span>
                    Live
                </div>
            </header>

            {/* Now Serving - Big Display */}
            <section className="now-serving-section">
                <span className="serving-label">Now Serving</span>
                <div className="serving-number">
                    <Bell size={28} className="serving-icon" />
                    <span>{queueData.nowServing}</span>
                </div>
                <span className="serving-time">{formatTime(currentTime)}</span>
            </section>

            {/* Your Token Card */}
            {queueData.yourToken && (
                <div className="your-token-card">
                    <div className="your-token-left">
                        <span className="your-label">Your Token</span>
                        <span className="your-number">{queueData.yourToken}</span>
                    </div>
                    <div className="your-token-right">
                        <span className="position-label">Position in Queue</span>
                        <span className="position-number">#{getYourPosition()}</span>
                    </div>
                </div>
            )}

            {/* Queue Timeline */}
            <div className="queue-timeline">

                {/* Preparing */}
                <div className="timeline-section">
                    <div className="timeline-header">
                        <ChefHat size={18} />
                        <span>Preparing Now</span>
                    </div>
                    <div className="timeline-tokens">
                        {queueData.preparing.map((token) => (
                            <div
                                key={token}
                                className={`timeline-token preparing ${token === queueData.yourToken ? 'yours' : ''}`}
                            >
                                {token}
                                {token === queueData.yourToken && <span className="yours-badge">You</span>}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Up Next */}
                <div className="timeline-section">
                    <div className="timeline-header">
                        <Clock size={18} />
                        <span>Up Next</span>
                    </div>
                    <div className="timeline-tokens">
                        {queueData.upcoming.map((token, index) => (
                            <div
                                key={token}
                                className={`timeline-token upcoming ${token === queueData.yourToken ? 'yours' : ''}`}
                            >
                                {token}
                                {token === queueData.yourToken && <span className="yours-badge">You</span>}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Info Footer */}
            <div className="queue-info">
                <div className="info-item">
                    <span className="info-value">{queueData.preparing.length}</span>
                    <span className="info-label">Preparing</span>
                </div>
                <div className="info-divider"></div>
                <div className="info-item">
                    <span className="info-value">{queueData.upcoming.length}</span>
                    <span className="info-label">Waiting</span>
                </div>
                <div className="info-divider"></div>
                <div className="info-item">
                    <span className="info-value">~8 min</span>
                    <span className="info-label">Est. Wait</span>
                </div>
            </div>

            {/* Empty State */}
            {!queueData.nowServing && (
                <div className="empty-queue">
                    <Utensils size={64} />
                    <h3>No orders in queue</h3>
                    <p>All orders have been served!</p>
                </div>
            )}
        </div>
    );
};

export default LiveQueuePage;
