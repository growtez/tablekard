import React, { useState } from 'react';
import { ArrowLeft, Send, CheckCircle, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TestWebhookPage = () => {
    const navigate = useNavigate();
    const [secret, setSecret] = useState('ZNYy@3@fhA7PXCg');
    const [orderId, setOrderId] = useState('order_P1234567890');
    const [paymentId, setPaymentId] = useState('pay_P0987654321');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);

    const goBack = () => navigate(-1);

    // Helper to compute HMAC SHA-256 for the webhook signature
    const computeSignature = async (payload, secretKey) => {
        const encoder = new TextEncoder();
        const keyData = encoder.encode(secretKey);

        const key = await window.crypto.subtle.importKey(
            'raw',
            keyData,
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            ['sign']
        );

        const signatureBuffer = await window.crypto.subtle.sign(
            'HMAC',
            key,
            encoder.encode(payload)
        );

        // Convert buffer to hex string
        return Array.from(new Uint8Array(signatureBuffer))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    };

    const triggerWebhook = async () => {
        setLoading(true);
        setResult(null);

        try {
            // Build a mock Razorpay payment.captured event payload
            const payloadObject = {
                entity: "event",
                account_id: "acc_demo123",
                event: "payment.captured",
                contains: ["payment"],
                payload: {
                    payment: {
                        entity: {
                            id: paymentId,
                            entity: "payment",
                            amount: 50000, // 500.00
                            currency: "INR",
                            status: "captured",
                            order_id: orderId,
                            invoice_id: null,
                            international: false,
                            method: "upi",
                            amount_refunded: 0,
                            refund_status: null,
                            captured: true,
                            description: "Test transaction from Demo UI",
                            card_id: null,
                            bank: null,
                            wallet: null,
                            vpa: "test@upi",
                            email: "test@example.com",
                            contact: "+919999999999",
                            fee: 1000,
                            tax: 150,
                            error_code: null,
                            error_description: null,
                            created_at: Math.floor(Date.now() / 1000)
                        }
                    }
                },
                created_at: Math.floor(Date.now() / 1000)
            };

            const payloadStr = JSON.stringify(payloadObject);
            const signature = await computeSignature(payloadStr, secret);

            // Using the real deployed webhook URL
            const webhookUrl = "https://sguegujmoawhtstzsdqs.supabase.co/functions/v1/razorpay-webhook";

            const response = await fetch(webhookUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-razorpay-signature": signature
                },
                body: payloadStr
            });

            const responseText = await response.text();

            setResult({
                status: response.status,
                ok: response.ok,
                text: responseText
            });

        } catch (error) {
            setResult({
                status: 0,
                ok: false,
                text: `Error: ${error.message}`
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', background: 'var(--color-background)', color: 'var(--color-text)', padding: '20px' }}>
            <header style={{ display: 'flex', alignItems: 'center', marginBottom: '30px' }}>
                <button onClick={goBack} style={{ background: 'transparent', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', marginRight: '16px' }}>
                    <ArrowLeft size={24} />
                </button>
                <h1 style={{ fontSize: '24px', margin: 0 }}>Webhook Demo Tool</h1>
            </header>

            <div style={{ background: 'var(--color-inputBg)', padding: '24px', borderRadius: '12px', maxWidth: '600px', margin: '0 auto' }}>
                <p style={{ marginBottom: '20px', fontSize: '14px', opacity: 0.8 }}>
                    This tool constructs a "payment.captured" JSON payload, legally signs it with HMAC-SHA256 using your secret, and posts it to the live Supabase Edge Function.
                </p>

                <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '14px', marginBottom: '6px' }}>Webhook Secret</label>
                    <input
                        type="text"
                        value={secret}
                        onChange={e => setSecret(e.target.value)}
                        style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-background)', color: 'var(--color-text)' }}
                    />
                </div>

                <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '14px', marginBottom: '6px' }}>Razorpay Order ID</label>
                    <input
                        type="text"
                        value={orderId}
                        onChange={e => setOrderId(e.target.value)}
                        style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-background)', color: 'var(--color-text)' }}
                    />
                    <small style={{ opacity: 0.6 }}>Create a real order string to see database changes, e.g., an order currently in "PENDING" state.</small>
                </div>

                <div style={{ marginBottom: '24px' }}>
                    <label style={{ display: 'block', fontSize: '14px', marginBottom: '6px' }}>Mock Payment ID</label>
                    <input
                        type="text"
                        value={paymentId}
                        onChange={e => setPaymentId(e.target.value)}
                        style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-background)', color: 'var(--color-text)' }}
                    />
                </div>

                <button
                    onClick={triggerWebhook}
                    disabled={loading}
                    style={{
                        width: '100%',
                        padding: '16px',
                        background: 'var(--color-primary)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        fontWeight: 'bold',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        opacity: loading ? 0.7 : 1
                    }}
                >
                    <Send size={18} />
                    {loading ? 'Sending to Supabase...' : 'Fire Webhook'}
                </button>

                {result && (
                    <div style={{
                        marginTop: '24px',
                        padding: '16px',
                        borderRadius: '8px',
                        background: result.ok ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        border: `1px solid ${result.ok ? '#22c55e' : '#ef4444'}`,
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '12px'
                    }}>
                        {result.ok ? <CheckCircle color="#22c55e" /> : <XCircle color="#ef4444" />}
                        <div>
                            <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', color: result.ok ? '#22c55e' : '#ef4444' }}>
                                HTTP {result.status}
                            </h3>
                            <pre style={{ margin: 0, fontSize: '13px', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                                {result.text}
                            </pre>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TestWebhookPage;
