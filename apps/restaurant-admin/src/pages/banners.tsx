import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@restaurant-saas/supabase';
import { useAuth } from '../context/AuthContext';
import { uploadProfileImage, deleteMenuItemImageFromStorage } from '../services/storageService';
import { getMenuItems } from '../services/supabaseService';
import type { MenuItem } from '@restaurant-saas/types';
import { Image, Plus, Trash2, Eye, EyeOff, X, Upload, AlertTriangle, Pencil, Link, Utensils, Tag, Compass, GripVertical } from 'lucide-react';
import ImageCropper from '../components/ImageCropper';

interface Banner {
  id: string;
  restaurant_id: string;
  image_url: string;
  link_url: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

interface BannerForm {
  image_url: string;
  link_url: string;
  is_active: boolean;
}

const defaultForm: BannerForm = {
  image_url: '',
  link_url: '',
  is_active: true,
};

export default function BannersPage() {
  const { activeRestaurantId } = useAuth();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [form, setForm] = useState<BannerForm>(defaultForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [rawImageSrc, setRawImageSrc] = useState<string | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [croppedBlob, setCroppedBlob] = useState<Blob | null>(null);
  const [deleteConfirmBanner, setDeleteConfirmBanner] = useState<Banner | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Link Destination Selector States
  const [destinationType, setDestinationType] = useState<'none' | 'menu' | 'offers' | 'item' | 'custom'>('none');
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [customUrl, setCustomUrl] = useState<string>('');

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

  const fetchMenuItemsList = async () => {
    if (!activeRestaurantId) return;
    try {
      const items = await getMenuItems(activeRestaurantId);
      setMenuItems(items || []);
    } catch (err) {
      console.error('Failed to fetch menu items:', err);
    }
  };

  useEffect(() => {
    fetchBanners();
    fetchMenuItemsList();
  }, [activeRestaurantId]);

  const parseLinkUrl = (url: string | null) => {
    if (!url) {
      setDestinationType('none');
      setSelectedItemId('');
      setCustomUrl('');
    } else if (url === '/menu') {
      setDestinationType('menu');
      setSelectedItemId('');
      setCustomUrl('');
    } else if (url === '/offers' || url === '/discounts') {
      setDestinationType('offers');
      setSelectedItemId('');
      setCustomUrl('');
    } else if (url.startsWith('item:')) {
      setDestinationType('item');
      setSelectedItemId(url.replace('item:', ''));
      setCustomUrl('');
    } else {
      setDestinationType('custom');
      setSelectedItemId('');
      setCustomUrl(url);
    }
  };

  const getDestinationLabel = (linkUrl: string | null) => {
    if (!linkUrl) return { label: 'None', isUrl: false };
    if (linkUrl === '/menu') return { label: 'Menu Page', isUrl: false };
    if (linkUrl === '/offers' || linkUrl === '/discounts') return { label: 'Offers / Discounts', isUrl: false };
    if (linkUrl.startsWith('item:')) {
      const itemId = linkUrl.replace('item:', '');
      const item = menuItems.find(m => m.id === itemId);
      return { label: item ? `Item: ${item.name}` : `Item: ${itemId.slice(0, 8)}...`, isUrl: false };
    }
    return { label: linkUrl, isUrl: true };
  };

  const handleEditClick = (banner: Banner) => {
    setEditingBanner(banner);
    setForm({
      image_url: banner.image_url,
      link_url: banner.link_url || '',
      is_active: banner.is_active,
    });
    parseLinkUrl(banner.link_url);
    setRawImageSrc(banner.image_url);
    setCroppedBlob(null);
    setError(null);
    setShowForm(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Reset file input so the same file can be selected again
    e.target.value = '';
    
    setError(null);
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setRawImageSrc(result);
      setCropImageSrc(result);
      setShowCropper(true);
    };
    reader.onerror = () => {
      setError("Failed to read image file");
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = (blob: Blob) => {
    setShowCropper(false);
    setCropImageSrc(null);
    setCroppedBlob(blob);
    const previewUrl = URL.createObjectURL(blob);
    setForm(prev => ({ ...prev, image_url: previewUrl }));
  };

  const handleSave = async () => {
    if (!form.image_url) { setError('Please upload a banner image.'); return; }
    setSaving(true);
    setError(null);
    try {
      let finalUrl = form.image_url;
      if (croppedBlob) {
        const file = new File([croppedBlob], `banner_${Date.now()}.jpg`, { type: 'image/jpeg' });
        finalUrl = await uploadProfileImage(`banners/${activeRestaurantId}`, file);
        if (editingBanner?.image_url && editingBanner.image_url !== finalUrl) {
          await deleteMenuItemImageFromStorage(editingBanner.image_url);
        }
      }

      if (editingBanner) {
        const { error } = await (supabase as any)
          .from('home_banners')
          .update({
            image_url: finalUrl,
            link_url: form.link_url || null,
            is_active: form.is_active,
          })
          .eq('id', editingBanner.id);
        if (error) throw error;
      } else {
        const maxOrder = banners.length > 0 ? Math.max(...banners.map(b => b.sort_order)) + 1 : 0;
        const { error } = await (supabase as any).from('home_banners').insert({
          restaurant_id: activeRestaurantId,
          image_url: finalUrl,
          link_url: form.link_url || null,
          is_active: form.is_active,
          sort_order: maxOrder,
        });
        if (error) throw error;
      }

      setForm(defaultForm);
      setCroppedBlob(null);
      setRawImageSrc(null);
      setEditingBanner(null);
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

  const handleDeleteClick = (banner: Banner) => {
    setDeleteConfirmBanner(banner);
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmBanner) return;
    setDeleting(true);
    try {
      if (deleteConfirmBanner.image_url) {
        await deleteMenuItemImageFromStorage(deleteConfirmBanner.image_url);
      }
      const { error } = await (supabase as any).from('home_banners').delete().eq('id', deleteConfirmBanner.id);
      if (error) throw error;
      setDeleteConfirmBanner(null);
      fetchBanners();
    } catch (err: any) {
      setError(err.message || 'Failed to delete banner');
    } finally {
      setDeleting(false);
    }
  };

  // Drag and Drop Reordering States
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIdx(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', `${index}`);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === index) return;
    setDragOverIdx(index);
  };

  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === dropIndex) return;

    const newBanners = [...banners];
    const [draggedItem] = newBanners.splice(draggedIdx, 1);
    newBanners.splice(dropIndex, 0, draggedItem);

    const updatedBanners = newBanners.map((b, idx) => ({ ...b, sort_order: idx }));
    setBanners(updatedBanners);
    setDraggedIdx(null);
    setDragOverIdx(null);

    try {
      for (const b of updatedBanners) {
        await (supabase as any)
          .from('home_banners')
          .update({ sort_order: b.sort_order })
          .eq('id', b.id);
      }
    } catch (err) {
      console.error('Failed to update banner order:', err);
      fetchBanners();
    }
  };

  const handleDragEnd = () => {
    setDraggedIdx(null);
    setDragOverIdx(null);
  };

  useEffect(() => {
    if (success) { const t = setTimeout(() => setSuccess(null), 3000); return () => clearTimeout(t); }
  }, [success]);

  return (
    <div className="flex flex-col gap-4 mb-8">
      {/* Header Row: Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E2E8F0] dark:border-tk-border">
        <div>
          <h1 className="text-3xl font-extrabold text-[#1A202C] font-['Outfit',sans-serif] dark:text-white mb-1.5 tracking-tight">
            Home Banners
          </h1>
          <p className="text-[14px] text-[#64748B] font-['Outfit',sans-serif] dark:text-tk-text-secondary">
            Manage the banner slider on your customer home page.
          </p>
        </div>
        
        <div className="flex items-center gap-4 shrink-0">
          <button
            onClick={() => { setEditingBanner(null); setShowForm(true); setForm(defaultForm); setCroppedBlob(null); setRawImageSrc(null); setError(null); }}
            className="relative inline-flex items-center justify-center gap-2 h-11 px-6 border-none rounded-xl font-['Outfit',sans-serif] text-[14px] font-bold cursor-pointer overflow-hidden transition-all duration-300 z-10 bg-[linear-gradient(135deg,var(--tk-burgundy),#6B2A15)] text-white shadow-[0_8px_18px_rgba(139,58,30,0.2)] hover:shadow-[0_12px_24px_rgba(139,58,30,0.3)] hover:-translate-y-px before:absolute before:inset-0 before:w-full before:h-full before:bg-[linear-gradient(135deg,#6B2A15,var(--tk-burgundy))] before:-z-10 before:-translate-x-full before:transition-transform before:duration-300 hover:before:translate-x-0 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
          >
            <Plus size={18} strokeWidth={2.5} /> Add Banner
          </button>
        </div>
      </div>

      {/* Toast */}
      {success && (
        <div
          className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[9999] px-4 py-3 rounded-[24px] flex items-center gap-3 shadow-[0_10px_30px_rgba(0,0,0,0.3)] animate-in fade-in slide-in-from-bottom-5 duration-300 font-['Outfit',sans-serif]"
          style={{
            backgroundColor: "#0F172A",
            color: "#FFFFFF",
          }}
        >
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 bg-[#4ADE80]"
          >
            <div className="w-2.5 h-2.5 border-2 border-b-0 border-r-0 border-white transform -rotate-45 -translate-y-[1px]" />
          </div>
          <span className="text-[15px] font-medium whitespace-nowrap pr-3">
            {success}
          </span>
        </div>
      )}

      {/* Add / Edit Banner Form */}
      {showForm && (
        <div className="mb-8 bg-white border border-[#E2E8F0] rounded-[24px] p-6 sm:p-8 shadow-sm dark:bg-tk-bg-card dark:border-tk-border">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-[18px] font-bold text-[#1A202C] font-['Outfit',sans-serif] dark:text-tk-text m-0">{editingBanner ? 'Edit Banner' : 'New Banner'}</h3>
            <button onClick={() => { setShowForm(false); setEditingBanner(null); setCroppedBlob(null); setRawImageSrc(null); }} className="bg-transparent border-none cursor-pointer text-[#94A3B8] hover:text-[#475569] transition-colors p-1" type="button"><X size={20} /></button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Image Upload */}
            <div className="md:col-span-2">
              <label className="flex flex-col gap-2">
                <span className="text-[12px] font-semibold text-[#4A5568] uppercase tracking-[0.5px] font-['Outfit',sans-serif] dark:text-tk-text-secondary">Banner Image *</span>
                {form.image_url ? (
                  <div
                    onClick={() => {
                      if (rawImageSrc) {
                        setCropImageSrc(rawImageSrc);
                        setShowCropper(true);
                      } else {
                        fileInputRef.current?.click();
                      }
                    }}
                    className="group relative w-full aspect-[21/9] rounded-[16px] overflow-hidden border border-[#CBD5E0] bg-[#F8FAFC] dark:bg-tk-bg-surface dark:border-tk-border cursor-pointer"
                  >
                    <img src={form.image_url} alt="Preview" className="w-full h-full object-cover group-hover:opacity-90 transition-opacity" />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[13px] font-bold font-['Outfit',sans-serif] pointer-events-none">
                      Click to edit crop
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setForm(prev => ({ ...prev, image_url: '' }));
                        setCroppedBlob(null);
                        setRawImageSrc(null);
                      }}
                      className="absolute top-3 right-3 p-2 bg-black/60 backdrop-blur-sm rounded-full text-white hover:bg-black/80 transition-colors cursor-pointer border-none z-10"
                      title="Remove image"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full aspect-[21/9] border-2 border-dashed border-[#CBD5E0] rounded-[16px] flex flex-col items-center justify-center gap-2 text-[#64748B] hover:border-tk-burgundy hover:text-tk-burgundy hover:bg-[#FFF5F5] dark:hover:bg-[rgba(199,91,58,0.05)] transition-all cursor-pointer bg-[#F8FAFC] dark:bg-tk-bg-surface dark:border-tk-border"
                  >
                    <div className="w-12 h-12 rounded-full bg-[#EDF2F7] dark:bg-tk-bg-elevated flex items-center justify-center mb-2">
                      <Upload size={24} className="text-[#A0AEC0] dark:text-tk-text-secondary" />
                    </div>
                    <span className="text-[14px] font-bold font-['Outfit',sans-serif]">Click to upload image</span>
                    <span className="text-[12px] font-['Outfit',sans-serif]">PNG, JPG, WebP — max 2MB (21:9 aspect ratio recommended)</span>
                  </button>
                )}
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              </label>
            </div>

            <div className="flex flex-col gap-3 md:col-span-2">
              <span className="text-[12px] font-semibold text-[#4A5568] uppercase tracking-[0.5px] font-['Outfit',sans-serif] dark:text-tk-text-secondary">Click Target Destination (optional)</span>
              
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {[
                  { type: 'none', label: 'No Link', icon: Link },
                  { type: 'menu', label: 'Menu Page', icon: Compass },
                  { type: 'offers', label: 'Offers / Discounts', icon: Tag },
                  { type: 'item', label: 'Specific Item', icon: Utensils },
                  { type: 'custom', label: 'Custom URL', icon: Link },
                ].map(({ type, label, icon: Icon }) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => {
                      const newType = type as any;
                      setDestinationType(newType);
                      if (newType === 'none') setForm(prev => ({ ...prev, link_url: '' }));
                      else if (newType === 'menu') setForm(prev => ({ ...prev, link_url: '/menu' }));
                      else if (newType === 'offers') setForm(prev => ({ ...prev, link_url: '/offers' }));
                      else if (newType === 'item') setForm(prev => ({ ...prev, link_url: selectedItemId ? `item:${selectedItemId}` : '' }));
                      else if (newType === 'custom') setForm(prev => ({ ...prev, link_url: customUrl }));
                    }}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border text-[12px] font-bold font-['Outfit',sans-serif] cursor-pointer transition-all gap-1.5 ${destinationType === type ? 'bg-[#FFF5F5] dark:bg-[rgba(199,91,58,0.15)] border-tk-burgundy text-tk-burgundy shadow-sm' : 'bg-white dark:bg-tk-bg-surface border-[#CBD5E0] dark:border-tk-border text-[#4A5568] dark:text-tk-text-secondary hover:border-tk-burgundy/50'}`}
                  >
                    <Icon size={16} />
                    <span>{label}</span>
                  </button>
                ))}
              </div>

              {destinationType === 'item' && (
                <div className="flex flex-col gap-1.5 mt-2 animate-in fade-in duration-200">
                  <span className="text-[12px] font-medium text-[#64748B] dark:text-tk-text-secondary">Select Food Item:</span>
                  <select
                    value={selectedItemId}
                    onChange={(e) => {
                      const itemId = e.target.value;
                      setSelectedItemId(itemId);
                      setForm(prev => ({ ...prev, link_url: itemId ? `item:${itemId}` : '' }));
                    }}
                    className="w-full border border-[#CBD5E0] rounded-xl bg-white text-[#1A202C] px-3.5 py-3 text-[14px] font-['Outfit',sans-serif] box-border transition-all duration-200 focus:outline-none focus:border-tk-burgundy focus:ring-4 focus:ring-[rgba(139,58,30,0.12)] dark:bg-tk-bg-surface dark:border-tk-border dark:text-tk-text"
                  >
                    <option value="">-- Choose a Food Item --</option>
                    {menuItems.map(item => (
                      <option key={item.id} value={item.id}>
                        {item.name} — ₹{item.price}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {destinationType === 'custom' && (
                <div className="flex flex-col gap-1.5 mt-2 animate-in fade-in duration-200">
                  <span className="text-[12px] font-medium text-[#64748B] dark:text-tk-text-secondary">Enter Custom URL:</span>
                  <input
                    type="text"
                    placeholder="https://..."
                    value={customUrl}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCustomUrl(val);
                      setForm(prev => ({ ...prev, link_url: val }));
                    }}
                    className="w-full border border-[#CBD5E0] rounded-xl bg-white text-[#1A202C] px-3.5 py-3 text-[14px] font-['Outfit',sans-serif] box-border transition-all duration-200 focus:outline-none focus:border-tk-burgundy focus:ring-4 focus:ring-[rgba(139,58,30,0.12)] dark:bg-tk-bg-surface dark:border-tk-border dark:text-tk-text"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Active toggle */}
          <div className="flex items-center gap-3 mt-6 p-4 rounded-xl bg-[#F8FAFC] dark:bg-tk-bg-surface border border-[#E2E8F0] dark:border-tk-border cursor-pointer" onClick={() => setForm(prev => ({ ...prev, is_active: !prev.is_active }))}>
            <button
              type="button"
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${form.is_active ? 'bg-tk-burgundy' : 'bg-[#CBD5E0] dark:bg-[#4A5568]'}`}
            >
              <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${form.is_active ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
            <div className="flex flex-col">
              <span className="text-[14px] font-bold text-[#1A202C] font-['Outfit',sans-serif] dark:text-tk-text">Active</span>
              <span className="text-[12px] text-[#64748B] font-['Outfit',sans-serif] dark:text-tk-text-secondary">Visible to customers on the home page</span>
            </div>
          </div>

          {error && <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-xl text-[13px] font-medium font-['Outfit',sans-serif] flex items-center gap-2"><div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center shrink-0">!</div>{error}</div>}

          <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-[#E2E8F0] dark:border-tk-border">
            <button type="button" onClick={() => { setShowForm(false); setEditingBanner(null); setCroppedBlob(null); setRawImageSrc(null); }} className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 border-none rounded-xl font-['Outfit',sans-serif] text-[14px] font-semibold cursor-pointer transition-all duration-200 bg-[#EDF2F7] text-[#2D3748] hover:bg-[#E2E8F0] dark:bg-tk-bg-elevated dark:text-tk-text dark:hover:bg-tk-bg-hover">Cancel</button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 min-h-[44px] px-6 border-none rounded-xl font-['Outfit',sans-serif] text-[14px] font-semibold cursor-pointer transition-all duration-200 bg-[linear-gradient(135deg,var(--tk-burgundy),#6B2A15)] text-white shadow-[0_8px_18px_rgba(139,58,30,0.2)] hover:shadow-[0_12px_24px_rgba(139,58,30,0.3)] hover:-translate-y-px disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
            >
              {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
              {saving ? 'Saving...' : editingBanner ? 'Update Banner' : 'Save Banner'}
            </button>
          </div>
        </div>
      )}

      {/* Banner List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white border border-[#E2E8F0] rounded-[24px] overflow-hidden shadow-sm dark:bg-tk-bg-card dark:border-tk-border animate-pulse">
              <div className="w-full aspect-[21/9] bg-[#F1F5F9] dark:bg-tk-bg-surface" />
              <div className="p-5">
                <div className="h-5 bg-[#F1F5F9] dark:bg-tk-bg-surface rounded-md w-3/4 mb-3" />
                <div className="h-4 bg-[#F1F5F9] dark:bg-tk-bg-surface rounded-md w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : banners.length === 0 && !showForm ? (
        <div className="flex flex-col items-center justify-center py-20 px-6 text-center bg-white border border-[#E2E8F0] rounded-[24px] shadow-sm dark:bg-tk-bg-card dark:border-tk-border">
          <div className="w-16 h-16 rounded-[20px] bg-[#FFF5F5] dark:bg-[rgba(199,91,58,0.1)] flex items-center justify-center mb-5">
            <Image size={28} className="text-tk-burgundy" strokeWidth={2} />
          </div>
          <h3 className="text-[20px] font-extrabold text-[#1A202C] font-['Outfit',sans-serif] dark:text-tk-text mb-2">No banners yet</h3>
          <p className="text-[14px] text-[#64748B] font-['Outfit',sans-serif] dark:text-tk-text-secondary max-w-sm leading-relaxed mb-6">
            Add banners to display a dynamic image slider on your customer home page. Banners are a great way to highlight specials.
          </p>
          <button
            onClick={() => { setEditingBanner(null); setShowForm(true); setForm(defaultForm); setCroppedBlob(null); setRawImageSrc(null); setError(null); }}
            className="inline-flex items-center justify-center gap-2 h-11 px-6 border-none rounded-xl font-['Outfit',sans-serif] text-[14px] font-bold cursor-pointer transition-all duration-200 bg-[linear-gradient(135deg,var(--tk-burgundy),#6B2A15)] text-white shadow-[0_8px_18px_rgba(139,58,30,0.2)] hover:shadow-[0_12px_24px_rgba(139,58,30,0.3)] hover:-translate-y-px"
          >
            <Plus size={18} strokeWidth={2.5} /> Add First Banner
          </button>
        </div>
      ) : (
        <>
          {banners.length > 0 && (
            <div className="flex items-start sm:items-center justify-between gap-3 mb-6 p-4 rounded-[18px] bg-gradient-to-r from-[#FFF5F5] to-[#FAFAFA] dark:from-[rgba(199,91,58,0.12)] dark:to-tk-bg-card border border-tk-burgundy/20 shadow-sm font-['Outfit',sans-serif]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-tk-burgundy/10 text-tk-burgundy flex items-center justify-center shrink-0">
                  <GripVertical size={20} />
                </div>
                <div>
                  <h4 className="text-[14px] font-bold text-[#1A202C] dark:text-tk-text m-0">How to reorder banners:</h4>
                  <p className="text-[13px] text-[#64748B] dark:text-tk-text-secondary m-0 mt-0.5">
                    Click & hold any banner card, then drag it to your desired position to update the customer slider order.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {banners.map((banner, idx) => (
              <div
                key={banner.id}
                draggable
                onDragStart={(e) => handleDragStart(e, idx)}
                onDragOver={(e) => handleDragOver(e, idx)}
                onDrop={(e) => handleDrop(e, idx)}
                onDragEnd={handleDragEnd}
                onClick={() => handleEditClick(banner)}
                className={`group relative flex flex-col bg-white border rounded-[24px] overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 dark:bg-tk-bg-card cursor-grab active:cursor-grabbing ${draggedIdx === idx ? 'opacity-40 scale-95 border-dashed border-tk-burgundy' : ''} ${dragOverIdx === idx ? 'border-2 border-tk-burgundy shadow-lg' : banner.is_active ? 'border-[#E2E8F0] dark:border-tk-border hover:border-tk-burgundy/30' : 'border-[#E2E8F0] dark:border-tk-border opacity-70 grayscale-[20%]'}`}
              >
                {/* Actions Overlay */}
                <div className="absolute top-3 right-3 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10 bg-black/60 backdrop-blur-md rounded-xl p-1.5 shadow-lg">
                  <div className="p-1.5 text-white/80 hover:text-white cursor-grab active:cursor-grabbing" title="Drag to reorder">
                    <GripVertical size={16} />
                  </div>
                  <div className="w-px h-4 bg-white/30" />
                  <button onClick={(e) => { e.stopPropagation(); handleEditClick(banner); }} className="p-2 text-white rounded-lg hover:bg-white/20 transition-colors cursor-pointer border-none bg-transparent" title="Edit"><Pencil size={16} /></button>
                  <button onClick={(e) => { e.stopPropagation(); toggleActive(banner); }} className="p-2 text-white rounded-lg hover:bg-white/20 transition-colors cursor-pointer border-none bg-transparent" title={banner.is_active ? 'Hide' : 'Show'}>
                    {banner.is_active ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); handleDeleteClick(banner); }} className="p-2 text-[#FFA8A8] rounded-lg hover:bg-red-500/30 transition-colors cursor-pointer border-none bg-transparent" title="Delete"><Trash2 size={16} /></button>
                </div>

                {/* Status Badge */}
                <div className="absolute top-4 left-4 z-10">
                  <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider backdrop-blur-md shadow-sm border ${banner.is_active ? 'bg-white/90 text-[#059669] border-[#059669]/20' : 'bg-black/60 text-white border-white/20'}`}>
                    <span className={`w-2 h-2 rounded-full ${banner.is_active ? 'bg-[#10B981]' : 'bg-[#94A3B8]'}`} />
                    {banner.is_active ? 'Active' : 'Hidden'}
                  </div>
                </div>

                {/* Thumbnail */}
                <div className={`w-full aspect-[21/9] bg-[#F8FAFC] dark:bg-tk-bg-surface overflow-hidden relative`}>
                  <img src={banner.image_url} alt="Banner" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  {!banner.is_active && <div className="absolute inset-0 bg-black/10 mix-blend-multiply" />}
                </div>

                {/* Info */}
                <div className="p-5 flex flex-col flex-1">
                  <div className="mt-auto pt-1">
                    {(() => {
                      const dest = getDestinationLabel(banner.link_url);
                      return (
                        <>
                          <div className="text-[12px] font-semibold text-[#94A3B8] font-['Outfit',sans-serif] uppercase tracking-wide mb-1">
                            {dest.isUrl ? 'Link URL' : 'Target Destination'}
                          </div>
                          {dest.isUrl ? (
                            <a href={banner.link_url!} target="_blank" rel="noopener noreferrer" className="text-[13px] text-tk-burgundy font-semibold truncate block hover:underline font-['Outfit',sans-serif]">
                              {dest.label}
                            </a>
                          ) : (
                            <span className="text-[13px] text-[#1A202C] dark:text-tk-text font-semibold truncate block font-['Outfit',sans-serif]">
                              {dest.label}
                            </span>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
            ))}
          </div>

        </>
      )}

      {showCropper && cropImageSrc && (
        <ImageCropper
          image={cropImageSrc}
          onCropComplete={handleCropComplete}
          onCancel={() => {
            setShowCropper(false);
            setCropImageSrc(null);
          }}
          aspect={21 / 9}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmBanner && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-[1000] backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={() => !deleting && setDeleteConfirmBanner(null)}
        >
          <div
            className="bg-white dark:bg-tk-bg-card border border-[#E2E8F0] dark:border-tk-border rounded-[24px] p-6 max-w-md w-full shadow-2xl space-y-4 font-['Outfit',sans-serif]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#E2E8F0] dark:border-tk-border pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                  <AlertTriangle size={20} />
                </div>
                <h3 className="text-[18px] font-bold text-[#1A202C] dark:text-tk-text m-0">Delete Banner</h3>
              </div>
              <button
                type="button"
                onClick={() => !deleting && setDeleteConfirmBanner(null)}
                className="bg-transparent border-none text-[#94A3B8] hover:text-[#475569] dark:hover:text-tk-text cursor-pointer p-1 rounded-lg transition-colors"
                disabled={deleting}
              >
                <X size={20} />
              </button>
            </div>

            <p className="text-[14px] text-[#4A5568] dark:text-tk-text-secondary leading-relaxed m-0">
              Are you sure you want to delete this banner? This action cannot be undone.
            </p>

            <div className="flex justify-end gap-3 pt-4 border-t border-[#E2E8F0] dark:border-tk-border">
              <button
                type="button"
                onClick={() => setDeleteConfirmBanner(null)}
                disabled={deleting}
                className="inline-flex items-center justify-center min-h-[42px] px-5 border-none rounded-xl font-['Outfit',sans-serif] text-[14px] font-semibold cursor-pointer transition-all bg-[#EDF2F7] text-[#2D3748] hover:bg-[#E2E8F0] dark:bg-tk-bg-elevated dark:text-tk-text dark:hover:bg-tk-bg-hover disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="inline-flex items-center justify-center gap-2 min-h-[42px] px-5 border-none rounded-xl font-['Outfit',sans-serif] text-[14px] font-semibold cursor-pointer transition-all bg-red-600 text-white hover:bg-red-700 shadow-md disabled:opacity-60"
              >
                {deleting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Trash2 size={16} />}
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
