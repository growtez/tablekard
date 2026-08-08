import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@restaurant-saas/supabase';
import { useAuth } from '../context/AuthContext';
import { uploadProfileImage } from '../services/storageService';
import { Image, Plus, Trash2, Eye, EyeOff, X, Upload, ArrowUp, ArrowDown } from 'lucide-react';

interface Banner {
  id: string;
  restaurant_id: string;
  image_url: string;
  title: string | null;
  subtitle: string | null;
  link_url: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

interface BannerForm {
  image_url: string;
  title: string;
  subtitle: string;
  link_url: string;
  is_active: boolean;
}

const defaultForm: BannerForm = {
  image_url: '',
  title: '',
  subtitle: '',
  link_url: '',
  is_active: true,
};

export default function BannersPage() {
  const { activeRestaurantId } = useAuth();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<BannerForm>(defaultForm);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchBanners = async () => {
    if (!activeRestaurantId) return;
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from('home_banners')
      .select('*')
      .eq('restaurant_id', activeRestaurantId)
      .order('sort_order', { ascending: true });
    if (!error) setBanners(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchBanners();
  }, [activeRestaurantId]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const url = await uploadProfileImage(`banners/${activeRestaurantId}`, file);
      setForm(prev => ({ ...prev, image_url: url }));
    } catch (err: any) {
      setError(err.message || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!form.image_url) { setError('Please upload a banner image.'); return; }
    setSaving(true);
    setError(null);
    try {
      const maxOrder = banners.length > 0 ? Math.max(...banners.map(b => b.sort_order)) + 1 : 0;
      const { error } = await (supabase as any).from('home_banners').insert({
        restaurant_id: activeRestaurantId,
        image_url: form.image_url,
        title: form.title || null,
        subtitle: form.subtitle || null,
        link_url: form.link_url || null,
        is_active: form.is_active,
        sort_order: maxOrder,
      });
      if (error) throw error;
      setSuccess('Banner added successfully!');
      setForm(defaultForm);
      setShowForm(false);
      fetchBanners();
    } catch (err: any) {
      setError(err.message || 'Failed to save banner');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (banner: Banner) => {
    const { error } = await (supabase as any)
      .from('home_banners')
      .update({ is_active: !banner.is_active })
      .eq('id', banner.id);
    if (!error) fetchBanners();
  };

  const deleteBanner = async (id: string) => {
    if (!window.confirm('Delete this banner?')) return;
    const { error } = await (supabase as any).from('home_banners').delete().eq('id', id);
    if (!error) {
      setSuccess('Banner deleted.');
      fetchBanners();
    }
  };

  const moveOrder = async (banner: Banner, direction: 'up' | 'down') => {
    const idx = banners.findIndex(b => b.id === banner.id);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= banners.length) return;
    const other = banners[swapIdx];
    await (supabase as any).from('home_banners').update({ sort_order: other.sort_order }).eq('id', banner.id);
    await (supabase as any).from('home_banners').update({ sort_order: banner.sort_order }).eq('id', other.id);
    fetchBanners();
  };

  useEffect(() => {
    if (success) { const t = setTimeout(() => setSuccess(null), 3000); return () => clearTimeout(t); }
  }, [success]);

  return (
    <div className="max-w-3xl mx-auto font-sans">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[18px] sm:text-[22px] font-bold text-tk-text whitespace-nowrap">Home<span className="hidden sm:inline"> Banners</span></h1>
          <p className="text-[13px] text-tk-text-secondary mt-0.5">Manage the banner slider on your customer home page.</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setForm(defaultForm); setError(null); }}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-tk-burgundy text-white rounded-xl text-[13px] font-semibold shadow-[0_4px_12px_rgba(139,58,30,0.25)] hover:-translate-y-px transition-all duration-200"
        >
          <Plus size={16} />
          Add Banner
        </button>
      </div>

      {/* Toast */}
      {success && (
        <div className="mb-4 px-4 py-3 bg-green-50 border border-green-200 text-green-700 text-[13px] font-medium rounded-xl">
          {success}
        </div>
      )}

      {/* Add Banner Form */}
      {showForm && (
        <div className="mb-6 bg-tk-bg-card border border-tk-border rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[15px] font-semibold text-tk-text">New Banner</h3>
            <button onClick={() => setShowForm(false)} className="p-1 text-tk-text-secondary hover:text-tk-text"><X size={18} /></button>
          </div>

          {/* Image Upload */}
          <div className="mb-4">
            <label className="block text-[12px] font-semibold text-tk-text-secondary uppercase tracking-wide mb-2">Banner Image *</label>
            {form.image_url ? (
              <div className="relative w-full h-36 rounded-xl overflow-hidden border border-tk-border bg-tk-bg">
                <img src={form.image_url} alt="Preview" className="w-full h-full object-cover" />
                <button
                  onClick={() => setForm(prev => ({ ...prev, image_url: '' }))}
                  className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white hover:bg-black/70"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-full h-36 border-2 border-dashed border-tk-border rounded-xl flex flex-col items-center justify-center gap-2 text-tk-text-secondary hover:border-tk-burgundy hover:text-tk-burgundy transition-colors"
              >
                {uploading ? (
                  <div className="w-6 h-6 border-2 border-tk-burgundy border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Upload size={22} />
                    <span className="text-[13px] font-medium">Click to upload image</span>
                    <span className="text-[11px]">PNG, JPG, WebP — max 2MB</span>
                  </>
                )}
              </button>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          </div>

          {/* Fields */}
          <div className="grid grid-cols-1 gap-3 mb-4">
            {[
              { key: 'title', label: 'Title (optional)', placeholder: 'e.g. Weekend Special Offer' },
              { key: 'subtitle', label: 'Subtitle (optional)', placeholder: 'e.g. Get 20% off on all orders' },
              { key: 'link_url', label: 'Link URL (optional)', placeholder: 'https://...' },
            ].map(({ key, label, placeholder }) => (
              <div key={key}>
                <label className="block text-[12px] font-semibold text-tk-text-secondary uppercase tracking-wide mb-1">{label}</label>
                <input
                  type="text"
                  placeholder={placeholder}
                  value={(form as any)[key]}
                  onChange={e => setForm(prev => ({ ...prev, [key]: e.target.value }))}
                  className="w-full px-3 py-2.5 text-[13px] bg-tk-bg border border-tk-border rounded-xl text-tk-text outline-none focus:border-tk-burgundy transition-colors"
                />
              </div>
            ))}
          </div>

          {/* Active toggle */}
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => setForm(prev => ({ ...prev, is_active: !prev.is_active }))}
              className={`w-11 h-6 rounded-full transition-colors ${form.is_active ? 'bg-tk-burgundy' : 'bg-tk-border'}`}
            >
              <div className={`w-5 h-5 rounded-full bg-white shadow-sm transform transition-transform mx-0.5 ${form.is_active ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
            <span className="text-[13px] text-tk-text">Active (visible to customers)</span>
          </div>

          {error && <p className="text-red-500 text-[12px] mb-3">{error}</p>}

          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 text-[13px] text-tk-text-secondary hover:text-tk-text bg-tk-bg border border-tk-border rounded-xl">Cancel</button>
            <button
              onClick={handleSave}
              disabled={saving || uploading}
              className="px-5 py-2 text-[13px] font-semibold text-white bg-tk-burgundy rounded-xl shadow-[0_4px_12px_rgba(139,58,30,0.2)] hover:-translate-y-px transition-all disabled:opacity-60"
            >
              {saving ? 'Saving...' : 'Save Banner'}
            </button>
          </div>
        </div>
      )}

      {/* Banner List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-tk-bg-card border border-tk-border rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : banners.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-tk-bg-card border border-tk-border rounded-2xl">
          <div className="w-12 h-12 rounded-2xl bg-tk-burgundy-bg flex items-center justify-center mb-3">
            <Image size={22} className="text-tk-burgundy" />
          </div>
          <h3 className="text-[15px] font-semibold text-tk-text">No banners yet</h3>
          <p className="text-[13px] text-tk-text-secondary mt-1 max-w-xs">Add banners to display a dynamic image slider on your customer home page.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {banners.map((banner, idx) => (
            <div
              key={banner.id}
              className={`flex gap-3 items-center bg-tk-bg-card border rounded-2xl p-3 transition-all ${banner.is_active ? 'border-tk-border' : 'border-tk-border opacity-60'}`}
            >
              {/* Thumbnail */}
              <div className="w-20 h-14 rounded-xl overflow-hidden border border-tk-border flex-shrink-0 bg-tk-bg">
                <img src={banner.image_url} alt={banner.title || 'Banner'} className="w-full h-full object-cover" />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-semibold text-tk-text truncate">{banner.title || <span className="text-tk-text-secondary italic">No title</span>}</div>
                {banner.subtitle && <div className="text-[12px] text-tk-text-secondary truncate mt-0.5">{banner.subtitle}</div>}
                <div className={`inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${banner.is_active ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${banner.is_active ? 'bg-green-500' : 'bg-gray-400'}`} />
                  {banner.is_active ? 'Active' : 'Hidden'}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={() => moveOrder(banner, 'up')} disabled={idx === 0} className="p-1.5 text-tk-text-secondary hover:text-tk-text disabled:opacity-30 rounded-lg hover:bg-tk-bg-hover transition-colors"><ArrowUp size={15} /></button>
                <button onClick={() => moveOrder(banner, 'down')} disabled={idx === banners.length - 1} className="p-1.5 text-tk-text-secondary hover:text-tk-text disabled:opacity-30 rounded-lg hover:bg-tk-bg-hover transition-colors"><ArrowDown size={15} /></button>
                <button onClick={() => toggleActive(banner)} className="p-1.5 text-tk-text-secondary hover:text-tk-burgundy rounded-lg hover:bg-tk-burgundy-bg transition-colors" title={banner.is_active ? 'Hide' : 'Show'}>
                  {banner.is_active ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
                <button onClick={() => deleteBanner(banner.id)} className="p-1.5 text-tk-text-secondary hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"><Trash2 size={15} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Note */}
      {banners.length > 0 && (
        <p className="text-[12px] text-tk-text-secondary mt-4 text-center">
          Changes appear on the customer home page in real-time.
        </p>
      )}
    </div>
  );
}
