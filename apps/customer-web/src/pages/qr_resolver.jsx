import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@restaurant-saas/supabase';

/**
 * QrResolver – /q/:token
 *
 * When a customer scans a pre-printed generic QR sticker, they land here.
 * This page:
 *  1. Looks up the token in `qr_code_tokens`
 *  2. If assigned, grabs the restaurant_id + table_id and redirects
 *     to the normal entry URL:  /order/:restaurantId/:tableId
 *  3. If not found / not assigned, shows a friendly error page.
 */

const QrResolver = () => {
    const { token } = useParams();
    const [status, setStatus] = useState('loading'); // 'loading' | 'redirecting' | 'not_found' | 'error'
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        if (!token) { setStatus('not_found'); return; }

        let cancelled = false;

        const resolve = async () => {
            try {
                // 1. Lookup token
                const { data, error } = await supabase
                    .from('qr_code_tokens')
                    .select('status, assigned_restaurant_id, assigned_table_id')
                    .eq('token', token.toUpperCase())
                    .maybeSingle();

                if (cancelled) return;

                if (error) throw error;

                if (!data) {
                    setStatus('not_found');
                    return;
                }

                if (data.status !== 'assigned' || !data.assigned_restaurant_id || !data.assigned_table_id) {
                    setStatus('not_found');
                    return;
                }

                const restaurantId = data.assigned_restaurant_id;
                const tableId = data.assigned_table_id;
                sessionStorage.setItem('tablekard_restaurant_id', restaurantId);
                sessionStorage.setItem('tablekard_table_id', tableId);

                setStatus('redirecting');

                // 4. Full-page navigation (same pattern as scan_qr.jsx)
                setTimeout(() => {
                    window.location.href = `/order/${restaurantId}/${tableId}`;
                }, 150);
            } catch (err) {
                if (!cancelled) {
                    console.error('[QrResolver] Error:', err);
                    setErrorMsg(err.message || 'Unexpected error.');
                    setStatus('error');
                }
            }
        };

        resolve();
        return () => { cancelled = true; };
    }, [token]);

    // ── Styles (inline — zero deps, no external CSS needed) ──────────────────
    const containerStyle = {
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#1a1a1a',
        color: '#ffffff',
        fontFamily: "'Segoe UI', Arial, sans-serif",
        padding: '2rem',
        textAlign: 'center',
    };

    const iconStyle = {
        width: 72, height: 72,
        borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: '1.5rem',
        fontSize: '2rem',
    };

    if (status === 'loading' || status === 'redirecting') {
        return (
            <div style={containerStyle}>
                <div style={{ ...iconStyle, background: 'rgba(5,150,105,0.15)' }}>
                    {status === 'loading' ? (
                        <div style={{
                            width: 36, height: 36, border: '3px solid rgba(5,150,105,0.3)',
                            borderTopColor: '#059669', borderRadius: '50%',
                            animation: 'spin 0.8s linear infinite'
                        }} />
                    ) : '✓'}
                </div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 0.5rem' }}>
                    {status === 'loading' ? 'Verifying QR Code…' : 'Redirecting to menu…'}
                </h2>
                <p style={{ color: '#9ca3af', fontSize: '0.875rem', margin: 0 }}>
                    {status === 'loading' ? 'Please wait a moment.' : 'Taking you to the restaurant menu.'}
                </p>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    if (status === 'not_found') {
        return (
            <div style={containerStyle}>
                <div style={{ ...iconStyle, background: 'rgba(139,58,30,0.15)', fontSize: '2.5rem' }}>🔗</div>
                <p style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', color: '#6b7280', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
                    Tablekard
                </p>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0 0 0.75rem' }}>QR Not Linked Yet</h2>
                <p style={{ color: '#9ca3af', fontSize: '0.875rem', maxWidth: 300, lineHeight: 1.6, margin: 0 }}>
                    This QR code hasn't been linked to a table yet.
                    Please ask a staff member to set it up.
                </p>
                {token && (
                    <p style={{ marginTop: '1.5rem', fontSize: '0.75rem', color: '#4b5563', fontFamily: 'monospace' }}>
                        Token: {token.toUpperCase()}
                    </p>
                )}
            </div>
        );
    }

    // error
    return (
        <div style={containerStyle}>
            <div style={{ ...iconStyle, background: 'rgba(239,68,68,0.15)', fontSize: '2rem' }}>⚠️</div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 0.5rem' }}>Something went wrong</h2>
            <p style={{ color: '#9ca3af', fontSize: '0.875rem', maxWidth: 300, margin: 0 }}>
                {errorMsg || 'Unable to resolve this QR code. Please try again.'}
            </p>
        </div>
    );
};

export default QrResolver;
