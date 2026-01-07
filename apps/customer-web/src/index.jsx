// Entry point for Customer Web
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
// AuthProvider is used inside App now (based on App.jsx content seen earlier) or wrapped here?
// Checking App.jsx content... it wraps AuthProvider inside App component. 
// "src/App.jsx:29: <AuthProvider>"
// So index.jsx just needs to render <App />.

console.log('🚀 Index.js loaded');

try {
    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(
        <React.StrictMode>
            <App />
        </React.StrictMode>
    );
    console.log('✅ React render called');
} catch (error) {
    console.error('❌ React render error:', error);
}
