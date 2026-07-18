import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ChefHat,
  CreditCard,
  Key,
  Loader2,
  Lock,
  ShieldCheck,
  ToggleLeft,
  ToggleRight,
  Webhook,
  X,
  XCircle,
} from 'lucide-react';
import { supabase as db } from '@restaurant-saas/supabase';
import { useAuth } from '../context/AuthContext';
import {
  getRestaurantPaymentSettings,
  updateRestaurantPaymentSettings,
  updateRestaurantProfile,
} from '../services/supabaseService';

// ─── Types ───────────────────────────────────────────────────────────────────

interface PaymentSettings {
  razorpayKeyId: string;
  hasRazorpayKeySecret: boolean;
  hasRazorpayWebhookSecret: boolean;
  onlinePaymentsEnabled: boolean;
}

interface ConfirmModal {
  open: boolean;
  title: string;
  description: string;
  warning: string;
  confirmLabel: string;
  confirmColor: string;
  onConfirm: () => void;
}

// ─── Toggle Switch ────────────────────────────────────────────────────────────

const ToggleSwitch: React.FC<{
  enabled: boolean;
  onToggle: () => void;
  disabled?: boolean;
  size?: 'sm' | 'md';
}> = ({ enabled, onToggle, disabled = false, size = 'md' }) => {
  const trackW = size === 'md' ? 52 : 44;
  const trackH = size === 'md' ? 28 : 24;
  const knobS = size === 'md' ? 22 : 18;
  const knobOff = size === 'md' ? 3 : 3;
  const knobOn = size === 'md' ? 27 : 23;

  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      disabled={disabled}
      onClick={onToggle}
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        width: trackW,
        height: trackH,
        borderRadius: 9999,
        border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        flexShrink: 0,
        transition: 'background-color 0.25s ease',
        backgroundColor: disabled
          ? '#CBD5E0'
          : enabled
            ? '#8B3A1E'
            : '#CBD5E0',
        padding: 0,
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <span
        style={{
          display: 'block',
          width: knobS,
          height: knobS,
          borderRadius: '50%',
          backgroundColor: '#fff',
          boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
          transition: 'transform 0.25s ease',
          transform: `translateX(${enabled ? knobOn : knobOff}px)`,
        }}
      />
    </button>
  );
};

// ─── Confirm Modal ────────────────────────────────────────────────────────────

const ConfirmDialog: React.FC<{
  modal: ConfirmModal;
  onClose: () => void;
  loading?: boolean;
}> = ({ modal, onClose, loading = false }) => {
  if (!modal.open) return null;
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.55)',
        backdropFilter: 'blur(4px)',
        padding: 20,
      }}
    >
      <div
        style={{
          background: 'var(--tk-bg-surface, #fff)',
          borderRadius: 20,
          padding: '32px 28px',
          maxWidth: 440,
          width: '100%',
          boxShadow: '0 24px 60px rgba(0,0,0,0.25)',
          animation: 'slideUp 0.2s ease',
        }}
      >
        <style>{`@keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}`}</style>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: 'rgba(245,158,11,0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <AlertTriangle size={24} color="#F59E0B" />
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#94A3B8',
              padding: 4,
              borderRadius: 8,
            }}
          >
            <X size={18} />
          </button>
        </div>

        <h3
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: 'var(--tk-text, #1A202C)',
            marginBottom: 8,
            fontFamily: "'Outfit', sans-serif",
          }}
        >
          {modal.title}
        </h3>

        <p
          style={{
            fontSize: 14,
            color: '#64748B',
            lineHeight: 1.6,
            marginBottom: 16,
            fontFamily: "'Outfit', sans-serif",
          }}
        >
          {modal.description}
        </p>

        <div
          style={{
            background: 'rgba(245,158,11,0.08)',
            border: '1px solid rgba(245,158,11,0.25)',
            borderRadius: 10,
            padding: '10px 14px',
            fontSize: 13,
            color: '#92400E',
            display: 'flex',
            gap: 8,
            alignItems: 'flex-start',
            marginBottom: 24,
            fontFamily: "'Outfit', sans-serif",
          }}
        >
          <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
          {modal.warning}
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onClose}
            disabled={loading}
            style={{
              flex: 1,
              padding: '11px 16px',
              borderRadius: 10,
              border: '1.5px solid #E2E8F0',
              background: 'transparent',
              color: 'var(--tk-text, #1A202C)',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: "'Outfit', sans-serif",
            }}
          >
            Cancel
          </button>
          <button
            onClick={modal.onConfirm}
            disabled={loading}
            style={{
              flex: 1,
              padding: '11px 16px',
              borderRadius: 10,
              border: 'none',
              background: modal.confirmColor,
              color: '#fff',
              fontSize: 14,
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              fontFamily: "'Outfit', sans-serif",
            }}
          >
            {loading && <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />}
            {modal.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Payment Setup Modal ──────────────────────────────────────────────────────

const PaymentSetupModal: React.FC<{
  open: boolean;
  onClose: () => void;
  onSaved: (settings: PaymentSettings) => void;
  restaurantId: string;
  existingKeyId: string;
}> = ({ open, onClose, onSaved, restaurantId, existingKeyId }) => {
  const [form, setForm] = useState({
    razorpayKeyId: existingKeyId,
    razorpayKeySecret: '',
    razorpayWebhookSecret: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setForm(f => ({ ...f, razorpayKeyId: existingKeyId }));
  }, [existingKeyId, open]);

  if (!open) return null;

  const isComplete =
    form.razorpayKeyId.trim() &&
    form.razorpayKeySecret.trim() &&
    form.razorpayWebhookSecret.trim();

  const handleSave = async () => {
    if (!isComplete) {
      setError('All three Razorpay credentials are required to enable payments.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const updated = await updateRestaurantPaymentSettings(restaurantId, {
        razorpayKeyId: form.razorpayKeyId.trim(),
        razorpayKeySecret: form.razorpayKeySecret.trim(),
        razorpayWebhookSecret: form.razorpayWebhookSecret.trim(),
        onlinePaymentsEnabled: true,
      });
      await updateRestaurantProfile(restaurantId, { pay_online: true });
      onSaved({
        razorpayKeyId: updated.razorpayKeyId ?? '',
        hasRazorpayKeySecret: updated.hasRazorpayKeySecret,
        hasRazorpayWebhookSecret: updated.hasRazorpayWebhookSecret,
        onlinePaymentsEnabled: true,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message ?? 'Failed to save payment credentials.');
    } finally {
      setSaving(false);
    }
  };

  const fieldStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 14px',
    borderRadius: 10,
    border: '1.5px solid #E2E8F0',
    fontSize: 14,
    fontFamily: "'Outfit', sans-serif",
    background: 'var(--tk-bg-hover, #F7FAFC)',
    color: 'var(--tk-text, #1A202C)',
    outline: 'none',
    boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 600,
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: 6,
    display: 'block',
    fontFamily: "'Outfit', sans-serif",
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.55)',
        backdropFilter: 'blur(4px)',
        padding: 20,
      }}
    >
      <div
        style={{
          background: 'var(--tk-bg-surface, #fff)',
          borderRadius: 20,
          padding: '32px 28px',
          maxWidth: 500,
          width: '100%',
          boxShadow: '0 24px 60px rgba(0,0,0,0.25)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: 'linear-gradient(135deg,#8B3A1E,#6B2A15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <CreditCard size={18} color="#fff" />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--tk-text,#1A202C)', fontFamily: "'Outfit',sans-serif" }}>
                Setup Razorpay
              </h3>
            </div>
            <p style={{ fontSize: 13, color: '#64748B', fontFamily: "'Outfit',sans-serif" }}>
              All credentials are required to enable online payments
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}>
            <X size={20} />
          </button>
        </div>

        {/* Info Banner */}
        <div
          style={{
            background: 'rgba(59,130,246,0.08)',
            border: '1px solid rgba(59,130,246,0.2)',
            borderRadius: 10,
            padding: '10px 14px',
            fontSize: 13,
            color: '#1D4ED8',
            display: 'flex',
            gap: 8,
            alignItems: 'flex-start',
            marginBottom: 20,
            fontFamily: "'Outfit',sans-serif",
          }}
        >
          <ShieldCheck size={14} style={{ flexShrink: 0, marginTop: 1 }} />
          Credentials are encrypted and stored securely. Secret keys are never shown after saving.
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={labelStyle}>
              <Key size={11} style={{ display: 'inline', marginRight: 4 }} />
              Razorpay Key ID
            </label>
            <input
              style={fieldStyle}
              placeholder="rzp_live_xxxxxxxxxxxxx"
              value={form.razorpayKeyId}
              onChange={e => setForm(f => ({ ...f, razorpayKeyId: e.target.value }))}
            />
          </div>

          <div>
            <label style={labelStyle}>
              <Lock size={11} style={{ display: 'inline', marginRight: 4 }} />
              Razorpay Key Secret
            </label>
            <input
              style={fieldStyle}
              type="password"
              placeholder="••••••••••••••••••••"
              value={form.razorpayKeySecret}
              onChange={e => setForm(f => ({ ...f, razorpayKeySecret: e.target.value }))}
            />
          </div>

          <div>
            <label style={labelStyle}>
              <Webhook size={11} style={{ display: 'inline', marginRight: 4 }} />
              Webhook Secret
            </label>
            <input
              style={fieldStyle}
              type="password"
              placeholder="••••••••••••••••••••"
              value={form.razorpayWebhookSecret}
              onChange={e => setForm(f => ({ ...f, razorpayWebhookSecret: e.target.value }))}
            />
          </div>
        </div>

        {error && (
          <div
            style={{
              marginTop: 14,
              padding: '10px 14px',
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: 10,
              fontSize: 13,
              color: '#B91C1C',
              display: 'flex',
              gap: 8,
              alignItems: 'center',
              fontFamily: "'Outfit',sans-serif",
            }}
          >
            <XCircle size={14} />
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '11px 16px',
              borderRadius: 10,
              border: '1.5px solid #E2E8F0',
              background: 'transparent',
              color: 'var(--tk-text,#1A202C)',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: "'Outfit',sans-serif",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !isComplete}
            style={{
              flex: 1,
              padding: '11px 16px',
              borderRadius: 10,
              border: 'none',
              background: !isComplete ? '#CBD5E0' : 'linear-gradient(135deg,#8B3A1E,#6B2A15)',
              color: '#fff',
              fontSize: 14,
              fontWeight: 600,
              cursor: !isComplete || saving ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              fontFamily: "'Outfit',sans-serif",
            }}
          >
            {saving && <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />}
            Save & Enable
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const FeatureSettingsPage: React.FC = () => {
  const { activeRestaurantId } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ tone: 'success' | 'error'; msg: string } | null>(null);

  // Feature flags
  const [payOnline, setPayOnline] = useState(false);
  const [kitchenEnabled, setKitchenEnabled] = useState(true);

  // Payment credentials state
  const [paySettings, setPaySettings] = useState<PaymentSettings>({
    razorpayKeyId: '',
    hasRazorpayKeySecret: false,
    hasRazorpayWebhookSecret: false,
    onlinePaymentsEnabled: false,
  });

  // Modals
  const [confirmModal, setConfirmModal] = useState<ConfirmModal>({
    open: false,
    title: '',
    description: '',
    warning: '',
    confirmLabel: 'Confirm',
    confirmColor: '#EF4444',
    onConfirm: () => {},
  });
  const [modalLoading, setModalLoading] = useState(false);
  const [showPaymentSetup, setShowPaymentSetup] = useState(false);

  useEffect(() => {
    if (!activeRestaurantId) return;
    const load = async () => {
      setLoading(true);
      try {
        const [{ data: rest }, pmtSettings] = await Promise.all([
          db.from('restaurants').select('pay_online, kitchen_app_enabled').eq('id', activeRestaurantId).single(),
          getRestaurantPaymentSettings(activeRestaurantId),
        ]);
        if (rest) {
          setPayOnline(!!(rest as any).pay_online);
          setKitchenEnabled((rest as any).kitchen_app_enabled !== false);
        }
        setPaySettings({
          razorpayKeyId: pmtSettings.razorpayKeyId ?? '',
          hasRazorpayKeySecret: pmtSettings.hasRazorpayKeySecret,
          hasRazorpayWebhookSecret: pmtSettings.hasRazorpayWebhookSecret,
          onlinePaymentsEnabled: pmtSettings.onlinePaymentsEnabled,
        });
      } catch {
        setFeedback({ tone: 'error', msg: 'Failed to load settings.' });
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [activeRestaurantId]);

  const showFeedback = (tone: 'success' | 'error', msg: string) => {
    setFeedback({ tone, msg });
    setTimeout(() => setFeedback(null), 4000);
  };

  // ── Toggle: Online Payments ──────────────────────────────────────────────

  const handlePayOnlineToggle = () => {
    if (!payOnline) {
      // Turning ON: require credentials
      const hasAll =
        paySettings.razorpayKeyId &&
        paySettings.hasRazorpayKeySecret &&
        paySettings.hasRazorpayWebhookSecret;
      if (!hasAll) {
        setShowPaymentSetup(true);
        return;
      }
      // Has credentials, confirm enable
      setConfirmModal({
        open: true,
        title: 'Enable Online Payments?',
        description:
          'Customers will be able to pay online via Razorpay. Make sure your Razorpay account is active and the webhook is correctly configured.',
        warning: 'This will allow real money transactions on your storefront.',
        confirmLabel: 'Enable Payments',
        confirmColor: '#16A34A',
        onConfirm: async () => {
          setModalLoading(true);
          try {
            await updateRestaurantProfile(activeRestaurantId!, { pay_online: true });
            setPayOnline(true);
            showFeedback('success', 'Online payments enabled.');
          } catch {
            showFeedback('error', 'Failed to enable payments.');
          } finally {
            setModalLoading(false);
            setConfirmModal(m => ({ ...m, open: false }));
          }
        },
      });
    } else {
      // Turning OFF
      setConfirmModal({
        open: true,
        title: 'Disable Online Payments?',
        description:
          'Customers will no longer be able to pay online. The "Pay Online" button will be removed from your storefront.',
        warning: 'Any in-progress payments may be interrupted. Ensure there are no pending transactions.',
        confirmLabel: 'Disable Payments',
        confirmColor: '#EF4444',
        onConfirm: async () => {
          setModalLoading(true);
          try {
            await updateRestaurantProfile(activeRestaurantId!, { pay_online: false });
            setPayOnline(false);
            showFeedback('success', 'Online payments disabled.');
          } catch {
            showFeedback('error', 'Failed to disable payments.');
          } finally {
            setModalLoading(false);
            setConfirmModal(m => ({ ...m, open: false }));
          }
        },
      });
    }
  };

  // ── Toggle: Kitchen Web App ──────────────────────────────────────────────

  const handleKitchenToggle = () => {
    if (!kitchenEnabled) {
      // Turning ON
      setConfirmModal({
        open: true,
        title: 'Enable Kitchen Web App?',
        description:
          'Kitchen staff will be able to log in to the Kitchen Web App. Customers will see the Live Queue feature.',
        warning: 'Make sure your kitchen staff accounts are set up before enabling.',
        confirmLabel: 'Enable Kitchen App',
        confirmColor: '#16A34A',
        onConfirm: async () => {
          setModalLoading(true);
          try {
            await updateRestaurantProfile(activeRestaurantId!, { kitchen_app_enabled: true });
            setKitchenEnabled(true);
            showFeedback('success', 'Kitchen Web App enabled.');
          } catch {
            showFeedback('error', 'Failed to enable Kitchen App.');
          } finally {
            setModalLoading(false);
            setConfirmModal(m => ({ ...m, open: false }));
          }
        },
      });
    } else {
      // Turning OFF
      setConfirmModal({
        open: true,
        title: 'Disable Kitchen Web App?',
        description:
          'Kitchen staff will be locked out of the Kitchen Web App. The Live Queue button will be hidden from all customers.',
        warning: 'Any kitchen staff currently logged in will see a "Disabled" screen immediately.',
        confirmLabel: 'Disable Kitchen App',
        confirmColor: '#EF4444',
        onConfirm: async () => {
          setModalLoading(true);
          try {
            await updateRestaurantProfile(activeRestaurantId!, { kitchen_app_enabled: false });
            setKitchenEnabled(false);
            showFeedback('success', 'Kitchen Web App disabled.');
          } catch {
            showFeedback('error', 'Failed to disable Kitchen App.');
          } finally {
            setModalLoading(false);
            setConfirmModal(m => ({ ...m, open: false }));
          }
        },
      });
    }
  };

  // ── Styles ───────────────────────────────────────────────────────────────

  const cardStyle: React.CSSProperties = {
    background: 'var(--tk-bg-surface, #fff)',
    borderRadius: 16,
    border: '1px solid var(--tk-border, #E2E8F0)',
    overflow: 'hidden',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  };

  const sectionHeaderStyle: React.CSSProperties = {
    padding: '16px 20px',
    borderBottom: '1px solid var(--tk-border, #E2E8F0)',
    background: 'var(--tk-bg-hover, #F7FAFC)',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  };

  const rowStyle: React.CSSProperties = {
    padding: '20px',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 16,
    flexWrap: 'wrap',
  };

  const badgeStyle = (enabled: boolean): React.CSSProperties => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
    padding: '3px 10px',
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 600,
    fontFamily: "'Outfit',sans-serif",
    background: enabled ? 'rgba(22,163,74,0.1)' : 'rgba(239,68,68,0.1)',
    color: enabled ? '#15803D' : '#B91C1C',
    border: `1px solid ${enabled ? 'rgba(22,163,74,0.2)' : 'rgba(239,68,68,0.2)'}`,
  });

  const credentialRowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 20px',
    borderTop: '1px solid var(--tk-border, #E2E8F0)',
    fontSize: 13,
    fontFamily: "'Outfit',sans-serif",
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: '#8B3A1E' }} />
        <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  return (
    <div
      style={{
        maxWidth: 720,
        margin: '0 auto',
        padding: '28px 20px 60px',
        fontFamily: "'Outfit', sans-serif",
      }}
    >
      <style>{`
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      {/* Page Header */}
      <div style={{ marginBottom: 28 }}>
        <h1
          style={{
            fontSize: 26,
            fontWeight: 800,
            color: 'var(--tk-text, #1A202C)',
            margin: 0,
            lineHeight: 1.2,
          }}
        >
          Feature Settings
        </h1>
        <p style={{ fontSize: 14, color: '#64748B', marginTop: 6, margin: '6px 0 0' }}>
          Control which features are active for your restaurant. Changes take effect immediately.
        </p>
      </div>

      {/* Feedback toast */}
      {feedback && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '12px 16px',
            borderRadius: 12,
            marginBottom: 20,
            fontSize: 14,
            fontWeight: 500,
            animation: 'fadeIn 0.3s ease',
            background: feedback.tone === 'success' ? 'rgba(22,163,74,0.1)' : 'rgba(239,68,68,0.1)',
            border: `1px solid ${feedback.tone === 'success' ? 'rgba(22,163,74,0.3)' : 'rgba(239,68,68,0.3)'}`,
            color: feedback.tone === 'success' ? '#15803D' : '#B91C1C',
          }}
        >
          {feedback.tone === 'success' ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
          {feedback.msg}
        </div>
      )}

      {/* ── Card 1: Online Payments ─────────────────────────────────────────── */}
      <div style={{ ...cardStyle, marginBottom: 20 }}>
        <div style={sectionHeaderStyle}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              background: 'linear-gradient(135deg,#8B3A1E,#6B2A15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CreditCard size={16} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--tk-text,#1A202C)' }}>
              Online Payments (Razorpay)
            </div>
            <div style={{ fontSize: 12, color: '#64748B' }}>
              Let customers pay via UPI, Cards, Net Banking through Razorpay
            </div>
          </div>
        </div>

        {/* Toggle Row */}
        <div style={rowStyle}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--tk-text,#1A202C)' }}>
                Enable Pay Online
              </span>
              <span style={badgeStyle(payOnline)}>
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: payOnline ? '#16A34A' : '#EF4444',
                    display: 'inline-block',
                  }}
                />
                {payOnline ? 'Active' : 'Inactive'}
              </span>
            </div>
            <p style={{ fontSize: 13, color: '#64748B', margin: 0, lineHeight: 1.5 }}>
              When enabled, the "Pay Online" button appears for customers at checkout.
              {!payOnline && !paySettings.razorpayKeyId && (
                <span style={{ color: '#F59E0B', display: 'block', marginTop: 4 }}>
                  ⚠ Razorpay credentials not set up yet.
                </span>
              )}
            </p>
          </div>
          <ToggleSwitch enabled={payOnline} onToggle={handlePayOnlineToggle} />
        </div>

        {/* Credentials Status */}
        <div style={credentialRowStyle}>
          <span style={{ color: '#64748B' }}>
            <Key size={12} style={{ display: 'inline', marginRight: 5 }} />
            Key ID
          </span>
          <span style={{ color: paySettings.razorpayKeyId ? '#15803D' : '#94A3B8', fontWeight: 500, fontSize: 13 }}>
            {paySettings.razorpayKeyId ? `${paySettings.razorpayKeyId.slice(0, 12)}•••` : 'Not set'}
          </span>
        </div>
        <div style={credentialRowStyle}>
          <span style={{ color: '#64748B' }}>
            <Lock size={12} style={{ display: 'inline', marginRight: 5 }} />
            Key Secret
          </span>
          <span style={{ color: paySettings.hasRazorpayKeySecret ? '#15803D' : '#94A3B8', fontWeight: 500, fontSize: 13 }}>
            {paySettings.hasRazorpayKeySecret ? '✓ Saved' : 'Not set'}
          </span>
        </div>
        <div style={credentialRowStyle}>
          <span style={{ color: '#64748B' }}>
            <Webhook size={12} style={{ display: 'inline', marginRight: 5 }} />
            Webhook Secret
          </span>
          <span style={{ color: paySettings.hasRazorpayWebhookSecret ? '#15803D' : '#94A3B8', fontWeight: 500, fontSize: 13 }}>
            {paySettings.hasRazorpayWebhookSecret ? '✓ Saved' : 'Not set'}
          </span>
        </div>

        {/* Update credentials button */}
        <div style={{ padding: '14px 20px', borderTop: '1px solid var(--tk-border,#E2E8F0)' }}>
          <button
            onClick={() => setShowPaymentSetup(true)}
            style={{
              padding: '9px 18px',
              borderRadius: 9,
              border: '1.5px solid #8B3A1E',
              background: 'transparent',
              color: '#8B3A1E',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: "'Outfit',sans-serif",
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Key size={13} />
            {paySettings.razorpayKeyId ? 'Update Razorpay Credentials' : 'Setup Razorpay'}
          </button>
        </div>
      </div>

      {/* ── Card 2: Kitchen Web App ─────────────────────────────────────────── */}
      <div style={cardStyle}>
        <div style={sectionHeaderStyle}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              background: 'linear-gradient(135deg,#1E40AF,#1E3A8A)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ChefHat size={16} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--tk-text,#1A202C)' }}>
              Kitchen Web App &amp; Live Queue
            </div>
            <div style={{ fontSize: 12, color: '#64748B' }}>
              Controls the kitchen display system and customer-facing live queue
            </div>
          </div>
        </div>

        {/* Toggle Row */}
        <div style={rowStyle}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--tk-text,#1A202C)' }}>
                Enable Kitchen App
              </span>
              <span style={badgeStyle(kitchenEnabled)}>
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: kitchenEnabled ? '#16A34A' : '#EF4444',
                    display: 'inline-block',
                  }}
                />
                {kitchenEnabled ? 'Active' : 'Inactive'}
              </span>
            </div>
            <p style={{ fontSize: 13, color: '#64748B', margin: 0, lineHeight: 1.5 }}>
              When enabled, kitchen staff can log in to the Kitchen Web App and customers see the Live Queue button.
            </p>
          </div>
          <ToggleSwitch enabled={kitchenEnabled} onToggle={handleKitchenToggle} />
        </div>

        {/* What's affected */}
        <div style={{ padding: '14px 20px', borderTop: '1px solid var(--tk-border,#E2E8F0)' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>
            What gets {kitchenEnabled ? 'disabled' : 'enabled'} when you toggle:
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              'Kitchen Web App login access for staff',
              'Live Queue button on customer storefront',
              'Live Queue link in hamburger menu',
              'Direct access to /live-queue page',
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#475569' }}>
                <div
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: kitchenEnabled ? '#EF4444' : '#16A34A',
                    flexShrink: 0,
                  }}
                />
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modals */}
      <ConfirmDialog
        modal={confirmModal}
        onClose={() => setConfirmModal(m => ({ ...m, open: false }))}
        loading={modalLoading}
      />

      <PaymentSetupModal
        open={showPaymentSetup}
        onClose={() => setShowPaymentSetup(false)}
        restaurantId={activeRestaurantId ?? ''}
        existingKeyId={paySettings.razorpayKeyId}
        onSaved={updated => {
          setPaySettings(updated);
          setPayOnline(true);
          showFeedback('success', 'Razorpay credentials saved and payments enabled!');
        }}
      />
    </div>
  );
};

export default FeatureSettingsPage;
