import React, { useState, useEffect, useRef } from 'react';
import { X, Upload, Image, Plus, Minus, Tag, ChevronDown } from 'lucide-react';
import type { MenuCategory } from '@restaurant-saas/types';
import './menu_dialog.css';

interface Variant {
  name: string;   // e.g. "Small", "Medium", "Large"
  price: number;
}

interface Addon {
  name: string;   // e.g. "Extra Cheese"
  price: number;
}

interface MenuDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: any) => void;
  item?: any | null;
  categories: MenuCategory[];
  mode: 'add' | 'edit';
}

const PRESET_TAGS = ['Spicy', 'Bestseller', 'New', 'Vegan', 'Gluten-Free', 'Chef\'s Special', 'Seasonal'];
const PRESET_ADDONS: Addon[] = [
  { name: 'Extra Cheese', price: 30 },
  { name: 'Extra Sauce', price: 15 },
  { name: 'Extra Bread', price: 20 },
  { name: 'Raita', price: 25 },
  { name: 'Salad', price: 30 },
];

const MenuDialog: React.FC<MenuDialogProps> = ({ isOpen, onClose, onSave, item, categories, mode }) => {
  const [formData, setFormData] = useState({
    name: '',
    short_description: '',
    long_description: '',
    price: '',
    discount_price: '',
    category_id: categories.length > 0 ? categories[0].id : '',
    image_url: null as string | null,
    is_available: true,
    is_veg: true,
    preparation_time: '',
    tags: [] as string[],
    variants: [] as Variant[],
    addons: [] as Addon[],
  });

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [newTag, setNewTag] = useState('');
  const [newVariant, setNewVariant] = useState<Variant>({ name: '', price: 0 });
  const [newAddon, setNewAddon] = useState<Addon>({ name: '', price: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (mode === 'edit' && item) {
      setFormData({
        name: item.name ?? '',
        short_description: item.short_description ?? '',
        long_description: item.long_description ?? '',
        price: item.price?.toString() ?? '',
        discount_price: item.discount_price?.toString() ?? '',
        category_id: item.category_id ?? item.categoryId ?? (categories[0]?.id ?? ''),
        image_url: item.image_url ?? null,
        is_available: item.is_available ?? item.available ?? true,
        is_veg: item.is_veg ?? item.isVeg ?? true,
        preparation_time: item.preparation_time?.toString() ?? '',
        tags: Array.isArray(item.tags) ? item.tags : [],
        variants: Array.isArray(item.variants) ? item.variants : [],
        addons: Array.isArray(item.addons) ? item.addons : [],
      });
      setImagePreview(item.image_url ?? null);
    } else {
      setFormData({
        name: '', short_description: '', long_description: '',
        price: '', discount_price: '',
        category_id: categories[0]?.id ?? '',
        image_url: null,
        is_available: true, is_veg: true,
        preparation_time: '',
        tags: [], variants: [], addons: []
      });
      setImagePreview(null);
    }
  }, [mode, item, isOpen, categories]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setImagePreview(result);
      setFormData(prev => ({ ...prev, image_url: result }));
    };
    reader.readAsDataURL(file);
  };

  const toggleTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.includes(tag) ? prev.tags.filter(t => t !== tag) : [...prev.tags, tag]
    }));
  };

  const addCustomTag = () => {
    const trimmed = newTag.trim();
    if (trimmed && !formData.tags.includes(trimmed)) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, trimmed] }));
    }
    setNewTag('');
  };

  const removeTag = (tag: string) => {
    setFormData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }));
  };

  const addVariant = () => {
    if (!newVariant.name) return;
    setFormData(prev => ({ ...prev, variants: [...prev.variants, { ...newVariant }] }));
    setNewVariant({ name: '', price: 0 });
  };

  const removeVariant = (idx: number) => {
    setFormData(prev => ({ ...prev, variants: prev.variants.filter((_, i) => i !== idx) }));
  };

  const toggleAddon = (addon: Addon) => {
    const exists = formData.addons.find(a => a.name === addon.name);
    if (exists) {
      setFormData(prev => ({ ...prev, addons: prev.addons.filter(a => a.name !== addon.name) }));
    } else {
      setFormData(prev => ({ ...prev, addons: [...prev.addons, addon] }));
    }
  };

  const addCustomAddon = () => {
    if (!newAddon.name.trim()) return;
    const exists = formData.addons.find(a => a.name === newAddon.name);
    if (!exists) {
      setFormData(prev => ({ ...prev, addons: [...prev.addons, { ...newAddon }] }));
    }
    setNewAddon({ name: '', price: 0 });
  };

  const removeAddon = (addonName: string) => {
    setFormData(prev => ({ ...prev, addons: prev.addons.filter(a => a.name !== addonName) }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.category_id) {
      alert('Please select a valid category or create one first.');
      return;
    }
    onSave({
      ...(item || {}),
      name: formData.name,
      short_description: formData.short_description || null,
      long_description: formData.long_description || null,
      price: parseFloat(formData.price) || 0,
      discount_price: formData.discount_price ? parseFloat(formData.discount_price) : null,
      category_id: formData.category_id,
      categoryId: formData.category_id, // keep backward compat
      image_url: formData.image_url,
      is_available: formData.is_available,
      is_veg: formData.is_veg,
      preparation_time: formData.preparation_time ? parseInt(formData.preparation_time) : null,
      tags: formData.tags,
      variants: formData.variants,
      addons: formData.addons,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="menu-dialog-overlay" onClick={onClose}>
      <div className="menu-dialog-container" onClick={(e) => e.stopPropagation()}>
        <div className="menu-dialog-header">
          <h2 className="menu-dialog-title">
            {mode === 'add' ? 'Add New Menu Item' : 'Edit Menu Item'}
          </h2>
          <button className="menu-dialog-close" onClick={onClose} type="button">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="menu-dialog-form">

          {/* Category */}
          <div className="menu-form-group">
            <label className="menu-form-label">Category *</label>
            <div className="menu-select-wrapper">
              <select
                name="category_id"
                value={formData.category_id}
                onChange={handleChange}
                className="menu-form-select"
                required
              >
                <option value="" disabled>Select a category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
              <ChevronDown size={16} className="menu-select-icon" />
            </div>
          </div>

          {/* Item Name */}
          <div className="menu-form-group">
            <label className="menu-form-label">Item Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="menu-form-input"
              placeholder="e.g. Butter Chicken"
              required
            />
          </div>

          {/* Short Description */}
          <div className="menu-form-group">
            <label className="menu-form-label">Short Description</label>
            <input
              type="text"
              name="short_description"
              value={formData.short_description}
              onChange={handleChange}
              className="menu-form-input"
              placeholder="One-liner for menus and lists"
              maxLength={100}
            />
          </div>

          {/* Long Description */}
          <div className="menu-form-group">
            <label className="menu-form-label">Long Description</label>
            <textarea
              name="long_description"
              value={formData.long_description}
              onChange={handleChange}
              className="menu-form-input menu-form-textarea"
              placeholder="Full description shown on item detail page"
              rows={3}
            />
          </div>

          {/* Price Row */}
          <div className="menu-two-col">
            <div className="menu-form-group">
              <label className="menu-form-label">Price (₹) *</label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                className="menu-form-input"
                placeholder="0.00"
                min="0"
                step="0.01"
                required
              />
            </div>
            <div className="menu-form-group">
              <label className="menu-form-label">Discounted Price (₹)</label>
              <input
                type="number"
                name="discount_price"
                value={formData.discount_price}
                onChange={handleChange}
                className="menu-form-input"
                placeholder="Leave blank if none"
                min="0"
                step="0.01"
              />
            </div>
          </div>

          {/* Image Upload */}
          <div className="menu-form-group">
            <label className="menu-form-label">Item Image</label>
            <div className="menu-image-upload-area" onClick={() => fileInputRef.current?.click()}>
              {imagePreview ? (
                <div className="menu-image-preview-wrap">
                  <img src={imagePreview} alt="preview" className="menu-image-preview" />
                  <div className="menu-image-overlay">
                    <Upload size={20} />
                    <span>Change Image</span>
                  </div>
                </div>
              ) : (
                <div className="menu-image-placeholder">
                  <Image size={32} color="#A0AEC0" />
                  <span>Click to upload image</span>
                  <small>PNG, JPG up to 2MB</small>
                </div>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageFile} />
          </div>

          {/* Preparation Time */}
          <div className="menu-form-group">
            <label className="menu-form-label">Preparation Time (minutes)</label>
            <input
              type="number"
              name="preparation_time"
              value={formData.preparation_time}
              onChange={handleChange}
              className="menu-form-input"
              placeholder="e.g. 20"
              min="1"
            />
          </div>

          {/* Toggles: Is Available & Is Veg */}
          <div className="menu-toggle-row-group">
            <div className="menu-toggle-row">
              <div>
                <div className="menu-toggle-label">Available</div>
                <div className="menu-toggle-desc">Show this item on the menu</div>
              </div>
              <label className="menu-toggle-switch">
                <input type="checkbox" name="is_available" checked={formData.is_available} onChange={handleChange} />
                <span className="menu-toggle-slider"></span>
              </label>
            </div>
            <div className="menu-toggle-row">
              <div>
                <div className="menu-toggle-label" style={{ color: formData.is_veg ? '#38A169' : '#E53E3E' }}>
                  {formData.is_veg ? '🟩 Vegetarian' : '🟥 Non-Vegetarian'}
                </div>
                <div className="menu-toggle-desc">Toggle food type</div>
              </div>
              <label className="menu-toggle-switch">
                <input type="checkbox" name="is_veg" checked={formData.is_veg} onChange={handleChange} />
                <span className="menu-toggle-slider" style={{ '--toggle-active-color': formData.is_veg ? '#38A169' : '#E53E3E' } as any}></span>
              </label>
            </div>
          </div>

          {/* Tags */}
          <div className="menu-form-group">
            <label className="menu-form-label"><Tag size={14} style={{ display: 'inline', marginRight: 4 }} />Tags</label>
            <div className="menu-tags-preset">
              {PRESET_TAGS.map(tag => (
                <button
                  key={tag}
                  type="button"
                  className={`menu-tag-chip ${formData.tags.includes(tag) ? 'selected' : ''}`}
                  onClick={() => toggleTag(tag)}
                >{tag}</button>
              ))}
            </div>
            <div className="menu-tag-add-row">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                className="menu-form-input"
                placeholder="Add custom tag..."
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomTag(); } }}
              />
              <button type="button" className="menu-tag-add-btn" onClick={addCustomTag}>
                <Plus size={16} />
              </button>
            </div>
            {formData.tags.length > 0 && (
              <div className="menu-tags-active">
                {formData.tags.map(tag => (
                  <span key={tag} className="menu-tag-active-chip">
                    {tag}
                    <button type="button" onClick={() => removeTag(tag)}><X size={12} /></button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Variants */}
          <div className="menu-form-group">
            <label className="menu-form-label">Variants (e.g. Small / Medium / Large)</label>
            {formData.variants.length > 0 && (
              <div className="menu-variants-list">
                {formData.variants.map((v, idx) => (
                  <div key={idx} className="menu-variant-row">
                    <span className="menu-variant-name">{v.name}</span>
                    <span className="menu-variant-price">₹{v.price}</span>
                    <button type="button" onClick={() => removeVariant(idx)} className="menu-variant-remove">
                      <Minus size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="menu-variant-add-row">
              <input
                type="text"
                value={newVariant.name}
                onChange={(e) => setNewVariant(prev => ({ ...prev, name: e.target.value }))}
                className="menu-form-input"
                placeholder="Variant name (e.g. Large)"
              />
              <input
                type="number"
                value={newVariant.price || ''}
                onChange={(e) => setNewVariant(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                className="menu-form-input menu-variant-price-input"
                placeholder="Price (₹)"
                min="0"
              />
              <button type="button" className="menu-tag-add-btn" onClick={addVariant}>
                <Plus size={16} />
              </button>
            </div>
          </div>

          {/* Addons */}
          <div className="menu-form-group">
            <label className="menu-form-label">Addons</label>
            <div className="menu-addons-list">
              {PRESET_ADDONS.map((addon) => {
                const selected = formData.addons.some(a => a.name === addon.name);
                return (
                  <label key={addon.name} className={`menu-addon-chip ${selected ? 'selected' : ''}`}>
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => toggleAddon(addon)}
                      style={{ display: 'none' }}
                    />
                    <span>{addon.name}</span>
                    <span className="menu-addon-price">+₹{addon.price}</span>
                  </label>
                );
              })}
            </div>
            
            {/* Custom Addon Input */}
            <div className="menu-variant-add-row" style={{ marginTop: '12px' }}>
              <input
                type="text"
                value={newAddon.name}
                onChange={(e) => setNewAddon(prev => ({ ...prev, name: e.target.value }))}
                className="menu-form-input"
                placeholder="Custom addon name"
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomAddon(); } }}
              />
              <input
                type="number"
                value={newAddon.price || ''}
                onChange={(e) => setNewAddon(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                className="menu-form-input menu-variant-price-input"
                placeholder="Price (₹)"
                min="0"
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomAddon(); } }}
              />
              <button type="button" className="menu-tag-add-btn" onClick={addCustomAddon}>
                <Plus size={16} />
              </button>
            </div>

            {/* Selected Addons List */}
            {formData.addons.length > 0 && (
              <div className="menu-variants-list" style={{ marginTop: '12px' }}>
                {formData.addons.map((addon, idx) => (
                  <div key={idx} className="menu-variant-row">
                    <span className="menu-variant-name">{addon.name}</span>
                    <span className="menu-variant-price">+₹{addon.price}</span>
                    <button type="button" onClick={() => removeAddon(addon.name)} className="menu-variant-remove">
                      <Minus size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="menu-dialog-actions">
            <button type="button" className="menu-btn-cancel" onClick={onClose}>Cancel</button>
            <button type="submit" className="menu-btn-save">
              {mode === 'add' ? 'Add Item' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MenuDialog;