import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

console.log('🚀 Index.jsx loaded');

try {
    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(
        <App />
    );
    console.log('✅ React render called');
} catch (error) {
    console.error('❌ React render error:', error);
}

