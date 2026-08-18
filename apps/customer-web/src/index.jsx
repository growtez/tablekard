import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { BrowserRouter as Router } from 'react-router-dom';
import { RestaurantProvider } from './context/RestaurantContext';

try {
    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(
        <Router>
            <RestaurantProvider>
                <App />
            </RestaurantProvider>
        </Router>
    );
} catch (error) {
    console.error('❌ React render error:', error);
}
