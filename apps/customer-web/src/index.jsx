import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { BrowserRouter as Router } from 'react-router-dom';
import { RestaurantProvider } from './context/RestaurantContext';

console.log('🚀 Index.jsx loaded');

try {
    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(
        <Router>
            <RestaurantProvider>
                <App />
            </RestaurantProvider>
        </Router>
    );
    console.log('✅ React render called');
} catch (error) {
    console.error('❌ React render error:', error);
}

