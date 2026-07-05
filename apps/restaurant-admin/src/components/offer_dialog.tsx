import React, { useState, useEffect } from 'react';
import { X, Tag, IndianRupee, CalendarDays, ToggleLeft, ToggleRight } from 'lucide-react';
import type { MenuItem } from '@restaurant-saas/types';
// ─── Types ────────────────────────────────────────────────────────────────────

export interface OfferFormData {
  menu_item_id: string;
  title: string;
  discount_price: string;
  valid_until: string;
  is_active: boolean;
}

export interface OfferRecord {
  id: string;
  restaurant_id: string;
  menu_item_id: string;
  title: string;
  discount_price: number;
  valid_until: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface OfferDialogProps {
  isOpen: boolean;
  onClose: () => void;
  /** Called with the form payload; parent is responsible for the Supabase call */
  onSave: (data: OfferFormData) => Promise<void> | void;
  /** Pre-populated when editing an existing offer */
  offer?: OfferRecord | null;
  mode: 'add' | 'edit';
  /** List of menu items for the restaurant — passed in from the parent */
  menuItems: MenuItem[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const EMPTY_FORM: OfferFormData = {
  menu_item_id: '',
  title: '',
  discount_price: '',
  valid_until: '',
  is_active: true,
};

/** Format ISO/date string to YYYY-MM-DD for <input type="date"> */
const toDateInputValue = (iso: string | null | undefined): string => {
  if (!iso) return '';
  return iso.split('T')[0];
};

// ─── Component ────────────────────────────────────────────────────────────────

const OfferDialog: React.FC<OfferDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  offer,
  mode,
  menuItems,
}) => {
  const [formData, setFormData] = useState<OfferFormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  // Derived: the full MenuItem object for the currently selected menu_item_id
  const selectedItem = menuItems.find(m => m.id === formData.menu_item_id) ?? null;

  // ── Seed form on open / mode / offer change ────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;

    if (mode === 'edit' && offer) {
      setFormData({
        menu_item_id: offer.menu_item_id,
        title: offer.title,
        discount_price: offer.discount_price.toString(),
        valid_until: toDateInputValue(offer.valid_until),
        is_active: offer.is_active,
      });
    } else {
      setFormData(EMPTY_FORM);
    }
  }, [isOpen, mode, offer]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleMenuItemChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const itemId = e.target.value;
    const item = menuItems.find(m => m.id === itemId) ?? null;
    setFormData(prev => ({
      ...prev,
      menu_item_id: itemId,
      // Auto-suggest discounted price if not already set by user
      discount_price: prev.discount_price === '' && item
        ? item.discountPrice?.toString() ?? item.price.toString()
        : prev.discount_price,
    }));
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const toggleActive = () => {
    setFormData(prev => ({ ...prev, is_active: !prev.is_active }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.menu_item_id) return;
    setSaving(true);
    try {
      await onSave(formData);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-tk-bg-card rounded-[24px] p-6 md:p-8 w-[96%] md:w-full max-w-[680px] max-h-[90vh] overflow-y-auto shadow-2xl animate-in slide-in-from-bottom-8 duration-300 text-tk-text" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-[22px] font-bold text-tk-text m-0">
            {mode === 'add' ? 'Add New Offer' : 'Edit Offer'}
          </h2>
          <button className="bg-transparent border-none cursor-pointer p-2 rounded-lg flex items-center justify-center text-tk-text-secondary transition-all duration-200 hover:bg-tk-bg-hover hover:text-tk-text" onClick={onClose} type="button" aria-label="Close">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="text-[13px] font-semibold text-tk-text-secondary uppercase tracking-[0.04em] flex items-center" htmlFor="offer-menu-item">
              Menu Item
            </label>
            <div className="relative">
              <select
                id="offer-menu-item"
                name="menu_item_id"
                value={formData.menu_item_id}
                onChange={handleMenuItemChange}
                className="w-full p-3 px-4 border-2 border-tk-border rounded-xl text-sm text-tk-text font-sans bg-tk-bg-elevated appearance-none cursor-pointer transition-all duration-200 focus:outline-none focus:border-green-400 focus:shadow-[0_0_0_3px_rgba(104,211,145,0.15)] focus:bg-tk-bg-card"
                required
              >
                <option value="">— Select a menu item —</option>
                {menuItems.map(item => (
                  <option key={item.id} value={item.id}>
                    {item.isVeg ? '🟩' : '🟥'} {item.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {selectedItem && (
            <div className="flex flex-col md:flex-row gap-4 p-4 bg-gradient-to-br from-green-50 to-blue-50 border-[1.5px] border-green-200 rounded-2xl animate-in fade-in duration-250 dark:from-tk-bg-elevated dark:to-tk-bg-elevated dark:border-tk-border">
              {selectedItem.images && selectedItem.images.length > 0 && (
                <img
                  src={selectedItem.images[0].url}
                  alt={selectedItem.name}
                  className="w-full md:w-[72px] h-[140px] md:h-[72px] object-cover rounded-lg shrink-0 shadow-md"
                />
              )}
              <div className="flex flex-col gap-1 justify-center">
                <p className="text-[15px] font-bold text-tk-text m-0">{selectedItem.name}</p>
                {selectedItem.shortDescription && (
                  <p className="text-xs text-tk-text-secondary m-0 line-clamp-2">{selectedItem.shortDescription}</p>
                )}
                <div className="flex gap-2.5 items-center flex-wrap mt-1">
                  <span className="text-[13px] font-semibold text-[#37724e] flex items-center gap-[2px] dark:text-green-400">
                    <IndianRupee size={13} /> Original: ₹{selectedItem.price}
                  </span>
                  {selectedItem.serves && (
                    <span className="text-xs text-tk-text-secondary">
                      👥 Serves {selectedItem.serves}
                    </span>
                  )}
                  {selectedItem.isVeg !== undefined && (
                    <span className={`text-[11px] font-semibold py-0.5 px-2 rounded-full ${selectedItem.isVeg ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {selectedItem.isVeg ? 'Veg' : 'Non-Veg'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
          <div className="flex flex-col gap-2">
            <label className="text-[13px] font-semibold text-tk-text-secondary uppercase tracking-[0.04em] flex items-center" htmlFor="offer-title">
              <Tag size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />
              Offer Title
            </label>
            <input
              id="offer-title"
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full p-3 px-4 border-2 border-tk-border rounded-xl text-sm text-tk-text font-sans bg-tk-bg-elevated transition-all duration-200 focus:outline-none focus:border-green-400 focus:shadow-[0_0_0_3px_rgba(104,211,145,0.15)] focus:bg-tk-bg-card placeholder:text-tk-text-muted"
              placeholder="e.g., Flat 20% Off on Butter Chicken"
              required
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-[13px] font-semibold text-tk-text-secondary uppercase tracking-[0.04em] flex items-center" htmlFor="offer-discount-price">
                <IndianRupee size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />
                Discounted Price (₹)
              </label>
              <input
                id="offer-discount-price"
                type="number"
                name="discount_price"
                value={formData.discount_price}
                onChange={handleChange}
                className="w-full p-3 px-4 border-2 border-tk-border rounded-xl text-sm text-tk-text font-sans bg-tk-bg-elevated transition-all duration-200 focus:outline-none focus:border-green-400 focus:shadow-[0_0_0_3px_rgba(104,211,145,0.15)] focus:bg-tk-bg-card placeholder:text-tk-text-muted"
                placeholder="0.00"
                min="0"
                step="any"
                onWheel={(e) => e.currentTarget.blur()}
                required
              />
              {selectedItem && formData.discount_price !== '' && (
                <span className="text-xs text-[#37724e] font-semibold py-1 px-2.5 bg-[#f0faf4] rounded-full w-fit mt-1 dark:text-green-400 dark:bg-green-900/20">
                  Save ₹{Math.max(0, selectedItem.price - parseFloat(formData.discount_price || '0')).toFixed(2)}
                  {' '}
                  ({Math.max(0, Math.round((1 - parseFloat(formData.discount_price || '0') / selectedItem.price) * 100))}% off)
                </span>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[13px] font-semibold text-tk-text-secondary uppercase tracking-[0.04em] flex items-center" htmlFor="offer-valid-until">
                <CalendarDays size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />
                Valid Until
              </label>
              <input
                id="offer-valid-until"
                type="date"
                name="valid_until"
                value={formData.valid_until}
                onChange={handleChange}
                className="w-full p-3 px-4 border-2 border-tk-border rounded-xl text-sm text-tk-text font-sans bg-tk-bg-elevated transition-all duration-200 focus:outline-none focus:border-green-400 focus:shadow-[0_0_0_3px_rgba(104,211,145,0.15)] focus:bg-tk-bg-card placeholder:text-tk-text-muted"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-[13px] font-semibold text-tk-text-secondary uppercase tracking-[0.04em] flex items-center">Offer Status</label>
            <button
              type="button"
              className={`inline-flex items-center gap-2 py-2.5 px-5 rounded-full border-2 text-sm font-semibold cursor-pointer font-sans transition-all duration-250 w-fit ${formData.is_active ? 'bg-green-100 text-green-800 border-green-300 hover:bg-green-300' : 'bg-tk-bg-elevated text-tk-text-secondary border-tk-border hover:bg-tk-bg-hover'}`}
              onClick={toggleActive}
              aria-pressed={formData.is_active}
            >
              {formData.is_active
                ? <><ToggleRight size={22} /> Active</>
                : <><ToggleLeft size={22} /> Inactive</>
              }
            </button>
          </div>
          <div className="flex gap-3 mt-2">
            <button type="button" className="flex-1 py-[13px] px-5 border-none rounded-xl text-sm font-semibold cursor-pointer transition-all duration-200 font-sans bg-tk-bg-elevated text-tk-text-secondary hover:bg-tk-bg-hover hover:text-tk-text disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-tk-bg-elevated disabled:hover:text-tk-text-secondary" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="flex-1 py-[13px] px-5 border-none rounded-xl text-sm font-semibold cursor-pointer transition-all duration-200 font-sans bg-[#37724e] text-white hover:bg-[#2f6344] hover:-translate-y-0.5 hover:shadow-[0_6px_16px_rgba(55,114,78,0.3)] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none" disabled={saving || !formData.menu_item_id}>
              {saving ? 'Saving…' : mode === 'add' ? 'Add Offer' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OfferDialog;