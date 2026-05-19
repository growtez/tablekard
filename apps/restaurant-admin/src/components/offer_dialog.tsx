import React, { useState, useEffect } from 'react';
import { X, Tag, IndianRupee, CalendarDays, ToggleLeft, ToggleRight } from 'lucide-react';
import type { MenuItem } from '@restaurant-saas/types';
import './offer_dialog.css';

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
    <div className="offer-dialog-overlay" onClick={onClose}>
      <div className="offer-dialog-container" onClick={e => e.stopPropagation()}>

        {/* ── Header ── */}
        <div className="offer-dialog-header">
          <h2 className="offer-dialog-title">
            {mode === 'add' ? 'Add New Offer' : 'Edit Offer'}
          </h2>
          <button className="offer-dialog-close" onClick={onClose} type="button" aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="offer-dialog-form">

          {/* ── 1. Menu Item selector (first column) ── */}
          <div className="offer-form-group">
            <label className="offer-form-label" htmlFor="offer-menu-item">
              Menu Item
            </label>
            <div className="offer-select-wrapper">
              <select
                id="offer-menu-item"
                name="menu_item_id"
                value={formData.menu_item_id}
                onChange={handleMenuItemChange}
                className="offer-form-select"
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

          {/* ── 2. Auto-filled read-only details ── */}
          {selectedItem && (
            <div className="offer-item-preview">
              {selectedItem.images && selectedItem.images.length > 0 && (
                <img
                  src={selectedItem.images[0].url}
                  alt={selectedItem.name}
                  className="offer-item-preview-img"
                />
              )}
              <div className="offer-item-preview-details">
                <p className="offer-item-preview-name">{selectedItem.name}</p>
                {selectedItem.shortDescription && (
                  <p className="offer-item-preview-desc">{selectedItem.shortDescription}</p>
                )}
                <div className="offer-item-preview-meta">
                  <span className="offer-item-preview-price">
                    <IndianRupee size={13} /> Original: ₹{selectedItem.price}
                  </span>
                  {selectedItem.serves && (
                    <span className="offer-item-preview-serves">
                      👥 Serves {selectedItem.serves}
                    </span>
                  )}
                  {selectedItem.isVeg !== undefined && (
                    <span className={`offer-item-preview-veg ${selectedItem.isVeg ? 'veg' : 'nonveg'}`}>
                      {selectedItem.isVeg ? 'Veg' : 'Non-Veg'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── 3. Offer Title ── */}
          <div className="offer-form-group">
            <label className="offer-form-label" htmlFor="offer-title">
              <Tag size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />
              Offer Title
            </label>
            <input
              id="offer-title"
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="offer-form-input"
              placeholder="e.g., Flat 20% Off on Butter Chicken"
              required
            />
          </div>

          {/* ── 4. Discounted Price + Valid Until (side-by-side) ── */}
          <div className="offer-form-row">
            <div className="offer-form-group">
              <label className="offer-form-label" htmlFor="offer-discount-price">
                <IndianRupee size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />
                Discounted Price (₹)
              </label>
              <input
                id="offer-discount-price"
                type="number"
                name="discount_price"
                value={formData.discount_price}
                onChange={handleChange}
                className="offer-form-input"
                placeholder="0.00"
                min="0"
                step="any"
                onWheel={(e) => e.currentTarget.blur()}
                required
              />
              {selectedItem && formData.discount_price !== '' && (
                <span className="offer-discount-hint">
                  Save ₹{Math.max(0, selectedItem.price - parseFloat(formData.discount_price || '0')).toFixed(2)}
                  {' '}
                  ({Math.max(0, Math.round((1 - parseFloat(formData.discount_price || '0') / selectedItem.price) * 100))}% off)
                </span>
              )}
            </div>

            <div className="offer-form-group">
              <label className="offer-form-label" htmlFor="offer-valid-until">
                <CalendarDays size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />
                Valid Until
              </label>
              <input
                id="offer-valid-until"
                type="date"
                name="valid_until"
                value={formData.valid_until}
                onChange={handleChange}
                className="offer-form-input"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>

          {/* ── 5. Active toggle ── */}
          <div className="offer-form-group">
            <label className="offer-form-label">Offer Status</label>
            <button
              type="button"
              className={`offer-toggle-btn ${formData.is_active ? 'active' : 'inactive'}`}
              onClick={toggleActive}
              aria-pressed={formData.is_active}
            >
              {formData.is_active
                ? <><ToggleRight size={22} /> Active</>
                : <><ToggleLeft size={22} /> Inactive</>
              }
            </button>
          </div>

          {/* ── Actions ── */}
          <div className="offer-dialog-actions">
            <button type="button" className="offer-btn-cancel" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="offer-btn-save" disabled={saving || !formData.menu_item_id}>
              {saving ? 'Saving…' : mode === 'add' ? 'Add Offer' : 'Save Changes'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default OfferDialog;