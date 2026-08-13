import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { getRestaurantById, getRestaurantPaymentSettings, updateRestaurantProfile, updateRestaurantPaymentSettings } from "../services/supabaseService";
import { CreditCardIcon, Server, ShieldCheck, X, AlertTriangle, Key } from "lucide-react";

export default function FeatureSettingsPage() {
  const { activeRestaurantId } = useAuth();
  const [restaurant, setRestaurant] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [paymentSettings, setPaymentSettings] = useState({ razorpayKeyId: "", hasRazorpayKeySecret: false, hasRazorpayWebhookSecret: false });
  const [confirmModal, setConfirmModal] = useState<{ open: boolean; title: string; description: string; warning: string; confirmLabel: string; confirmColor: string; onConfirm: () => Promise<void> }>({
    open: false, title: "", description: "", warning: "", confirmLabel: "", confirmColor: "", onConfirm: async () => {}
  });
  const [showPaymentSetupModal, setShowPaymentSetupModal] = useState(false);
  const [paymentSetupForm, setPaymentSetupForm] = useState({ razorpayKeyId: "", razorpayKeySecret: "", razorpayWebhookSecret: "" });
  const [paymentSetupError, setPaymentSetupError] = useState<string | null>(null);
  const [paymentSetupSaving, setPaymentSetupSaving] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ tone: "success" | "error" | "info"; message: string } | null>(null);

  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  useEffect(() => {
    const fetchData = async () => {
      if (!activeRestaurantId) return;
      setIsLoading(true);
      try {
        const [restData, ps] = await Promise.all([
          getRestaurantById(activeRestaurantId),
          getRestaurantPaymentSettings(activeRestaurantId)
        ]);
        if (restData) setRestaurant(restData);
        if (ps) setPaymentSettings(ps as any);
      } catch (err) {
        console.error("Error fetching feature settings:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [activeRestaurantId]);

  const featureBadge = (on: boolean) => (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 10px', borderRadius: 20,
      fontSize: 12, fontWeight: 600, fontFamily: "'Outfit',sans-serif",
      background: on ? 'rgba(22,163,74,0.10)' : 'rgba(239,68,68,0.10)',
      color: on ? '#15803D' : '#B91C1C',
      border: `1px solid ${on ? 'rgba(22,163,74,0.22)' : 'rgba(239,68,68,0.22)'}`,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: on ? '#16A34A' : '#EF4444', display: 'inline-block' }} />
      {on ? 'Active' : 'Inactive'}
    </span>
  );

  const ToggleKnob = ({ on }: { on: boolean }) => (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => { }}
      style={{
        position: 'relative', display: 'inline-flex', alignItems: 'center',
        width: 52, height: 28, borderRadius: 9999, border: 'none', cursor: 'pointer',
        flexShrink: 0, transition: 'background-color 0.25s', padding: 0,
        backgroundColor: on ? '#8B3A1E' : '#CBD5E0',
      }}
    >
      <span style={{
        display: 'block', width: 22, height: 22, borderRadius: '50%', backgroundColor: '#fff',
        boxShadow: '0 1px 4px rgba(0,0,0,0.25)', transition: 'transform 0.25s',
        transform: `translateX(${on ? 27 : 3}px)`,
      }} />
    </button>
  );

  const triggerConfirm = (
    title: string, description: string, warning: string,
    confirmLabel: string, confirmColor: string,
    action: () => Promise<void>
  ) => {
    setConfirmModal({ open: true, title, description, warning, confirmLabel, confirmColor, onConfirm: action });
  };

  const handlePayOnlineFeatureToggle = () => {
    const on = restaurant?.pay_online === true;
    if (!on) {
      const hasAll = !!paymentSettings.razorpayKeyId && paymentSettings.hasRazorpayKeySecret;
      if (!hasAll) {
        setPaymentSetupForm({ razorpayKeyId: '', razorpayKeySecret: '', razorpayWebhookSecret: '' });
        setPaymentSetupError(null);
        setShowPaymentSetupModal(true);
        return;
      }
      triggerConfirm(
        'Enable Online Payments?',
        'Customers will be able to pay online via Razorpay. Make sure your Razorpay account is active.',
        'This allows real money transactions on your storefront.',
        'Enable Payments', '#16A34A',
        async () => {
          if (!activeRestaurantId) return;
          await updateRestaurantProfile(activeRestaurantId, { pay_online: true });
          const updated = await getRestaurantById(activeRestaurantId);
          if (updated) setRestaurant(updated);
          setFeedback({ tone: 'success', message: 'Online payments enabled.' });
        }
      );
    } else {
      triggerConfirm(
        'Disable Online Payments?',
        'The "Pay Online" button will be removed from your storefront. Customers can only pay at the counter.',
        'Ensure there are no in-progress payments before disabling.',
        'Disable Payments', '#EF4444',
        async () => {
          if (!activeRestaurantId) return;
          await updateRestaurantProfile(activeRestaurantId, { pay_online: false });
          const updated = await getRestaurantById(activeRestaurantId);
          if (updated) setRestaurant(updated);
          setFeedback({ tone: 'success', message: 'Online payments disabled.' });
        }
      );
    }
  };

  const handleKitchenFeatureToggle = () => {
    const on = restaurant?.kitchen_app_enabled !== false;
    if (!on) {
      triggerConfirm(
        'Enable Kitchen Web App?',
        'Kitchen staff will be able to log in. Customers will see the Live Queue button.',
        'Ensure kitchen staff accounts are set up before enabling.',
        'Enable Kitchen App', '#16A34A',
        async () => {
          if (!activeRestaurantId) return;
          await updateRestaurantProfile(activeRestaurantId, { kitchen_app_enabled: true });
          const updated = await getRestaurantById(activeRestaurantId);
          if (updated) setRestaurant(updated);
          setFeedback({ tone: 'success', message: 'Kitchen App enabled.' });
        }
      );
    } else {
      triggerConfirm(
        'Disable Kitchen Web App?',
        'Kitchen staff will be locked out. The Live Queue button will be hidden from all customers immediately.',
        'Any kitchen staff currently logged in will see a "Disabled" screen.',
        'Disable Kitchen App', '#EF4444',
        async () => {
          if (!activeRestaurantId) return;
          await updateRestaurantProfile(activeRestaurantId, { kitchen_app_enabled: false });
          const updated = await getRestaurantById(activeRestaurantId);
          if (updated) setRestaurant(updated);
          setFeedback({ tone: 'success', message: 'Kitchen App disabled.' });
        }
      );
    }
  };

  const payOn = restaurant?.pay_online === true;
  const kitchenOn = restaurant?.kitchen_app_enabled !== false;

  const cardCls = "border border-[#E2E8F0] rounded-[24px] shadow-[0_8px_30px_rgba(0,0,0,0.04)] overflow-hidden bg-white dark:bg-tk-bg-card dark:border-tk-border";
  const sectionHeaderCls = "flex items-center gap-3 px-5 py-4 border-b border-[#E2E8F0] dark:border-tk-border bg-[#F8FAFC] dark:bg-tk-bg-elevated";
  const rowCls = "flex items-start justify-between gap-4 px-5 py-5 flex-wrap";
  const credRowCls = "flex items-center justify-between px-5 py-3 border-t border-[#E2E8F0] dark:border-tk-border text-[13px] font-['Outfit',sans-serif]";

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="w-8 h-8 rounded-full border-4 border-[#E2E8F0] border-t-tk-burgundy animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#F8FAFC] dark:bg-tk-bg mx-auto w-full p-4 sm:p-6 lg:p-8 font-sans pb-24 md:pb-8">
      <div className="flex flex-col gap-2 mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#1A202C] dark:text-tk-text">Feature Settings</h1>
        <p className="text-[#64748B] dark:text-tk-text-secondary text-[14px] sm:text-[15px]">
          Manage your restaurant features, payments, and integrations.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Card: Online Payments */}
        <div className={cardCls}>
          <div className={sectionHeaderCls}>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: 'linear-gradient(135deg,#8B3A1E,#6B2A15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <CreditCardIcon size={16} color="#fff" />
            </div>
            <div>
              <div className="text-[15px] font-bold text-[#1A202C] font-['Outfit',sans-serif] dark:text-tk-text">Online Payments · Razorpay</div>
              <div className="text-[12px] text-[#64748B] font-['Outfit',sans-serif]">Let customers pay via UPI, Cards &amp; Net Banking</div>
            </div>
          </div>

          <div className={rowCls}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <span className="text-[15px] font-semibold text-[#1A202C] font-['Outfit',sans-serif] dark:text-tk-text">Enable Pay Online</span>
                {featureBadge(payOn)}
              </div>
              <p className="text-[13px] text-[#64748B] font-['Outfit',sans-serif]" style={{ margin: 0, lineHeight: 1.5 }}>
                When enabled, the "Pay Online" button appears at checkout.
                {!payOn && (!paymentSettings.razorpayKeyId || !paymentSettings.hasRazorpayKeySecret) && (
                  <span style={{ color: '#F59E0B', display: 'block', marginTop: 4 }}>⚠ Razorpay API Keys not configured yet.</span>
                )}
              </p>
            </div>
            <div onClick={handlePayOnlineFeatureToggle} style={{ cursor: 'pointer' }}>
              <ToggleKnob on={payOn} />
            </div>
          </div>

          <div className={credRowCls}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#475569' }}>
              <Key size={14} /> <span style={{ fontWeight: 600 }}>Key ID:</span>
            </div>
            <span style={{ color: paymentSettings.razorpayKeyId ? '#15803D' : '#94A3B8', fontWeight: 500 }}>
              {paymentSettings.razorpayKeyId ? paymentSettings.razorpayKeyId : 'Not set'}
            </span>
          </div>

          <div className={credRowCls}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#475569' }}>
              <ShieldCheck size={14} /> <span style={{ fontWeight: 600 }}>Key Secret:</span>
            </div>
            <span style={{ color: paymentSettings.hasRazorpayKeySecret ? '#15803D' : '#94A3B8', fontWeight: 500 }}>
              {paymentSettings.hasRazorpayKeySecret ? '••••••••' : 'Not set'}
            </span>
          </div>

          <div className={credRowCls}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#475569' }}>
              <ShieldCheck size={14} /> <span style={{ fontWeight: 600 }}>Webhook Secret:</span>
            </div>
            <span style={{ color: paymentSettings.hasRazorpayWebhookSecret ? '#15803D' : '#94A3B8', fontWeight: 500 }}>
              {paymentSettings.hasRazorpayWebhookSecret ? '••••••••' : 'Not set'}
            </span>
          </div>

          <div style={{ padding: '12px 20px', borderTop: '1px solid #E2E8F0', background: '#F8FAFC', borderBottomLeftRadius: 24, borderBottomRightRadius: 24 }} className="dark:border-tk-border dark:bg-tk-bg-elevated">
            <button
              onClick={() => { setPaymentSetupForm({ razorpayKeyId: paymentSettings.razorpayKeyId || '', razorpayKeySecret: '', razorpayWebhookSecret: '' }); setPaymentSetupError(null); setShowPaymentSetupModal(true); }}
              className="text-[13px] font-semibold text-[#8B3A1E] dark:text-[#E2A082]"
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: "'Outfit',sans-serif" }}
            >
              <CreditCardIcon size={13} />{paymentSettings.razorpayKeyId ? 'Update API Keys' : 'Configure Razorpay API'}
            </button>
          </div>
        </div>

        {/* Card: Kitchen App */}
        <div className={cardCls}>
          <div className={sectionHeaderCls}>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: 'linear-gradient(135deg,#1E293B,#0F172A)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Server size={16} color="#fff" />
            </div>
            <div>
              <div className="text-[15px] font-bold text-[#1A202C] font-['Outfit',sans-serif] dark:text-tk-text">Kitchen Web App</div>
              <div className="text-[12px] text-[#64748B] font-['Outfit',sans-serif]">Staff dashboard &amp; Live Queue</div>
            </div>
          </div>
          <div className={rowCls}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <span className="text-[15px] font-semibold text-[#1A202C] font-['Outfit',sans-serif] dark:text-tk-text">Enable Kitchen App</span>
                {featureBadge(kitchenOn)}
              </div>
              <p className="text-[13px] text-[#64748B] font-['Outfit',sans-serif]" style={{ margin: 0, lineHeight: 1.5 }}>
                Allows kitchen staff to view orders on a separate tablet. Enables the "Live Queue" feature for customers.
              </p>
            </div>
            <div onClick={handleKitchenFeatureToggle} style={{ cursor: 'pointer' }}>
              <ToggleKnob on={kitchenOn} />
            </div>
          </div>
        </div>
      </div>

      {showPaymentSetupModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(4px)' }} onClick={() => setShowPaymentSetupModal(false)} />
          <div style={{ position: 'relative', width: '100%', maxWidth: 440, background: '#fff', borderRadius: 24, boxShadow: '0 20px 40px rgba(0,0,0,0.1)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }} className="dark:bg-tk-bg-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid #E2E8F0' }} className="dark:border-tk-border">
              <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--tk-text,#1A202C)', margin: 0, fontFamily: "'Outfit',sans-serif" }}>Razorpay Configuration</h3>
              <button onClick={() => setShowPaymentSetupModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}><X size={18} /></button>
            </div>
            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {paymentSetupError && (
                <div style={{ padding: '12px 16px', background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 12, color: '#991B1B', fontSize: 13, fontFamily: "'Outfit',sans-serif" }}>
                  {paymentSetupError}
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--tk-text-secondary,#475569)', fontFamily: "'Outfit',sans-serif" }}>Key ID <span style={{ color: '#EF4444' }}>*</span></label>
                <input
                  type="text"
                  value={paymentSetupForm.razorpayKeyId}
                  onChange={e => setPaymentSetupForm({ ...paymentSetupForm, razorpayKeyId: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #E2E8F0', fontSize: 14, outline: 'none', fontFamily: "'Outfit',sans-serif", background: 'transparent', color: 'var(--tk-text,#1A202C)' }}
                  placeholder="rzp_live_..."
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--tk-text-secondary,#475569)', fontFamily: "'Outfit',sans-serif" }}>Key Secret {paymentSettings.hasRazorpayKeySecret && <span style={{ color: '#64748B', fontWeight: 400 }}>(Leave blank to keep current)</span>}</label>
                <input
                  type="password"
                  value={paymentSetupForm.razorpayKeySecret}
                  onChange={e => setPaymentSetupForm({ ...paymentSetupForm, razorpayKeySecret: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #E2E8F0', fontSize: 14, outline: 'none', fontFamily: "'Outfit',sans-serif", background: 'transparent', color: 'var(--tk-text,#1A202C)' }}
                  placeholder={paymentSettings.hasRazorpayKeySecret ? '••••••••••••••••' : 'Enter Key Secret'}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--tk-text-secondary,#475569)', fontFamily: "'Outfit',sans-serif" }}>Webhook Secret {paymentSettings.hasRazorpayWebhookSecret && <span style={{ color: '#64748B', fontWeight: 400 }}>(Leave blank to keep current)</span>}</label>
                <input
                  type="password"
                  value={paymentSetupForm.razorpayWebhookSecret}
                  onChange={e => setPaymentSetupForm({ ...paymentSetupForm, razorpayWebhookSecret: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #E2E8F0', fontSize: 14, outline: 'none', fontFamily: "'Outfit',sans-serif", background: 'transparent', color: 'var(--tk-text,#1A202C)' }}
                  placeholder={paymentSettings.hasRazorpayWebhookSecret ? '••••••••••••••••' : 'Used for payment verification'}
                />
              </div>
            </div>
            <div style={{ padding: '16px 24px', borderTop: '1px solid #E2E8F0', display: 'flex', gap: 12 }} className="dark:border-tk-border bg-[#F8FAFC] dark:bg-tk-bg-elevated">
              <button type="button" onClick={() => setShowPaymentSetupModal(false)} style={{ flex: 1, padding: '11px 16px', borderRadius: 10, border: '1.5px solid #E2E8F0', background: 'transparent', color: 'var(--tk-text,#1A202C)', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: "'Outfit',sans-serif" }} className="dark:border-tk-border">Cancel</button>
              <button
                type="button"
                disabled={paymentSetupSaving || !paymentSetupForm.razorpayKeyId.trim() || (!paymentSettings.hasRazorpayKeySecret && !paymentSetupForm.razorpayKeySecret.trim()) || (!paymentSettings.hasRazorpayWebhookSecret && !paymentSetupForm.razorpayWebhookSecret.trim())}
                onClick={async () => {
                  if (!activeRestaurantId) return;
                  setPaymentSetupSaving(true);
                  setPaymentSetupError(null);
                  try {
                    await updateRestaurantPaymentSettings(activeRestaurantId, {
                      razorpayKeyId: paymentSetupForm.razorpayKeyId,
                      razorpayKeySecret: paymentSetupForm.razorpayKeySecret || undefined,
                      razorpayWebhookSecret: paymentSetupForm.razorpayWebhookSecret || undefined,
                      onlinePaymentsEnabled: true
                    } as any);
                    const ps = await getRestaurantPaymentSettings(activeRestaurantId);
                    if (ps) {
                      setPaymentSettings(ps as any);
                    }
                    setShowPaymentSetupModal(false);
                    setFeedback({ tone: 'success', message: 'Payment settings saved successfully.' });
                  } catch (err: any) {
                    setPaymentSetupError(err.message || 'Failed to save settings.');
                  } finally {
                    setPaymentSetupSaving(false);
                  }
                }}
                style={{ flex: 1, padding: '11px 16px', borderRadius: 10, border: 'none', background: (!paymentSetupForm.razorpayKeyId.trim() || (!paymentSettings.hasRazorpayKeySecret && !paymentSetupForm.razorpayKeySecret.trim()) || (!paymentSettings.hasRazorpayWebhookSecret && !paymentSetupForm.razorpayWebhookSecret.trim())) ? '#CBD5E0' : 'linear-gradient(135deg,#8B3A1E,#6B2A15)', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: "'Outfit',sans-serif" }}
              >
                {paymentSetupSaving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmModal.open && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(4px)' }} onClick={() => setConfirmModal(m => ({ ...m, open: false }))} />
          <div style={{ position: 'relative', width: '100%', maxWidth: 400, background: 'var(--tk-bg-card,#fff)', borderRadius: 24, boxShadow: '0 20px 40px rgba(0,0,0,0.1)', padding: 24 }} className="dark:bg-tk-bg-card border dark:border-tk-border">
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--tk-text,#1A202C)', margin: '0 0 8px', fontFamily: "'Outfit',sans-serif" }}>{confirmModal.title}</h3>
              <button onClick={() => setConfirmModal(m => ({ ...m, open: false }))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}><X size={18} /></button>
            </div>
            <p style={{ fontSize: 14, color: '#64748B', lineHeight: 1.6, margin: '0 0 14px', fontFamily: "'Outfit',sans-serif" }}>{confirmModal.description}</p>
            {confirmModal.warning && (
              <div style={{ background: '#FFFBEB', color: '#B45309', padding: '10px 12px', borderRadius: 8, fontSize: 13, display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 20, fontFamily: "'Outfit',sans-serif" }}>
                <AlertTriangle size={13} style={{ flexShrink: 0, marginTop: 1 }} />{confirmModal.warning}
              </div>
            )}
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                type="button"
                onClick={() => setConfirmModal(m => ({ ...m, open: false }))}
                style={{ flex: 1, padding: '11px 16px', borderRadius: 10, border: '1.5px solid #E2E8F0', background: 'transparent', color: 'var(--tk-text,#1A202C)', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: "'Outfit',sans-serif" }}
                className="dark:border-tk-border"
              >Cancel</button>
              <button
                type="button"
                onClick={async () => {
                  setConfirmLoading(true);
                  try { await confirmModal.onConfirm(); setConfirmModal(m => ({ ...m, open: false })); }
                  catch (err) { console.error(err); }
                  finally { setConfirmLoading(false); }
                }}
                disabled={confirmLoading}
                style={{ flex: 1, padding: '11px 16px', borderRadius: 10, border: 'none', background: confirmModal.confirmColor, color: '#fff', fontSize: 14, fontWeight: 600, cursor: confirmLoading ? 'not-allowed' : 'pointer', opacity: confirmLoading ? 0.7 : 1, fontFamily: "'Outfit',sans-serif" }}
              >{confirmLoading ? 'Saving…' : confirmModal.confirmLabel}</button>
            </div>
          </div>
        </div>
      )}

      {feedback && (
        <div className="fixed top-6 right-6 z-[9999] px-4 py-3 rounded-[24px] flex items-center gap-3 shadow-xl animate-in fade-in slide-in-from-top-5 duration-300 font-['Outfit',sans-serif] bg-tk-burgundy text-white border border-white/10">
          <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: feedback.tone === 'success' ? '#4ADE80' : feedback.tone === 'error' ? '#EF4444' : '#3B82F6' }}>
            <span className="text-[14px] font-bold text-white">{feedback.tone === 'success' ? '✓' : '!'}</span>
          </div>
          <span className="text-[15px] font-medium whitespace-nowrap pr-3">{feedback.message}</span>
        </div>
      )}
    </div>
  );
}
