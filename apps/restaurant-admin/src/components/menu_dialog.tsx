import React, { useState, useEffect, useRef } from 'react';
import { X, Plus, Minus, Tag, ChevronDown, Upload, Trash2, Maximize2, Edit2, ChevronLeft, ChevronRight } from 'lucide-react';
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
    images: [] as { id?: string, file?: File, url: string, sortOrder: number, isDeleted?: boolean }[],
    is_available: true,
    is_veg: true,
    preparation_time: '',
    serves: '1',
    tags: [] as string[],
    variants: [] as Variant[],
    addons: [] as Addon[],
  });

  const [newTag, setNewTag] = useState('');
  const [newVariant, setNewVariant] = useState<Variant>({ name: '', price: 0 });
  const [newAddon, setNewAddon] = useState<Addon>({ name: '', price: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const arModelInputRef = useRef<HTMLInputElement>(null);
  const [arModelFile, setArModelFile] = useState<File | null>(null);
  const [existingModelUrl, setExistingModelUrl] = useState<string | null>(null);
  const [removeModel, setRemoveModel] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [currentGalleryIndex, setCurrentGalleryIndex] = useState(0);

  useEffect(() => {
    if (mode === 'edit' && item) {
      setFormData({
        name: item.name ?? '',
        short_description: item.shortDescription ?? '',
        long_description: item.longDescription ?? '',
        price: item.price?.toString() ?? '',
        discount_price: item.discountPrice?.toString() ?? '',
        category_id: item.category_id ?? item.categoryId ?? (categories[0]?.id ?? ''),
        images: item.images ? item.images.map((img: any) => ({ 
          id: img.id, 
          url: img.url, 
          sortOrder: img.sortOrder || 0 
        })) : [],
        is_available: item.available ?? item.is_available ?? true,
        is_veg: item.isVeg ?? item.is_veg ?? true,
        preparation_time: (item.preparationTime ?? item.preparation_time)?.toString() ?? '',
        serves: item.serves?.toString() ?? '1',
        tags: Array.isArray(item.tags) ? item.tags : [],
        variants: Array.isArray(item.variants) ? item.variants : [],
        addons: Array.isArray(item.addons) ? item.addons : [],
      });
      setExistingModelUrl(item?.modelUrl || null);
      setArModelFile(null);
      setRemoveModel(false);
    } else {
      setFormData({
        name: '', short_description: '', long_description: '',
        price: '', discount_price: '',
        category_id: categories[0]?.id ?? '',
        images: [],
        is_available: true, is_veg: true,
        preparation_time: '',
        serves: '1',
        tags: [], variants: [], addons: []
      });
      setExistingModelUrl(null);
      setArModelFile(null);
      setRemoveModel(false);
    }
  }, [mode, item, isOpen, categories]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleImageFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setFormData(prev => {
      // Find the max sort order among non-deleted images
      const maxOrder = prev.images.reduce((max, img) => (!img.isDeleted && img.sortOrder > max ? img.sortOrder : max), 0);
      
      const newImages = files.map((file, index) => {
        return {
          file,
          url: URL.createObjectURL(file), // Provide immediate preview
          sortOrder: maxOrder + index + 1
        };
      });
      return { ...prev, images: [...prev.images, ...newImages] };
    });
    
    // reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveImage = (urlToRemove: string) => {
    setFormData(prev => {
      const updatedImages = prev.images.map(img => img.url === urlToRemove ? { ...img, isDeleted: true } : img);
      
      // If we are in gallery mode, adjust index if needed
      if (isGalleryOpen) {
        const visibleImagesCount = updatedImages.filter(img => !img.isDeleted).length;
        if (visibleImagesCount === 0) {
          setIsGalleryOpen(false);
        } else if (currentGalleryIndex >= visibleImagesCount) {
          setCurrentGalleryIndex(Math.max(0, visibleImagesCount - 1));
        }
      }
      
      return {
        ...prev,
        images: updatedImages
      };
    });
  };

  const openGallery = (index: number) => {
    setCurrentGalleryIndex(index);
    setIsGalleryOpen(true);
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
      images: formData.images,
      is_available: formData.is_available,
      is_veg: formData.is_veg,
      preparation_time: formData.preparation_time ? parseInt(formData.preparation_time) : null,
      serves: formData.serves ? parseInt(formData.serves) : 1,
      tags: formData.tags,
      variants: formData.variants,
      addons: formData.addons,
      arModelFile: arModelFile,
      existingModelUrl: existingModelUrl,
      removeModel: removeModel,
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

          <div className="menu-form-group">
            <label className="menu-form-label">Item Images</label>
            <div className="menu-image-previews-container">
              {formData.images.filter(img => !img.isDeleted).map((img, idx) => (
                <div key={img.id || img.url || idx} className="menu-image-preview-card" onClick={() => openGallery(idx)}>
                  <img src={img.url} alt={`Preview ${idx}`} className="menu-image-preview-img" />
                  <button 
                    type="button" 
                    onClick={(e) => { e.stopPropagation(); handleRemoveImage(img.url); }}
                    className="menu-image-remove-btn"
                  >
                    <X size={12} />
                  </button>
                  {idx === 0 && <div className="menu-image-primary-badge">Primary</div>}
                  <div className="menu-image-card-overlay">
                    <Maximize2 size={16} />
                  </div>
                </div>
              ))}
              
              <div 
                className="menu-image-add-trigger" 
                onClick={() => fileInputRef.current?.click()}
              >
                <Plus size={20} />
                <span>Add</span>
              </div>

              {formData.images.filter(img => !img.isDeleted).length > 0 && (
                <button 
                  type="button"
                  className="menu-image-edit-btn"
                  onClick={() => openGallery(0)}
                >
                  <Edit2 size={16} />
                  <span>Edit Gallery</span>
                </button>
              )}
            </div>
            <input ref={fileInputRef} type="file" multiple accept="image/*" style={{ display: 'none' }} onChange={handleImageFiles} />
          </div>

          <div className="menu-form-group">
            <label className="menu-form-label">Serves (number of people)</label>
            <input
              type="number"
              name="serves"
              value={formData.serves}
              onChange={handleChange}
              className="menu-form-input"
              placeholder="e.g. 2"
              min="1"
            />
          </div>

          {/* AR 3D Model Upload */}
          <div className="menu-form-group">
            <label className="menu-form-label">AR 3D Model (.glb)</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {(arModelFile || (existingModelUrl && !removeModel)) ? (
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 14px', borderRadius: '10px',
                  background: '#F0FFF4', border: '1px solid #C6F6D5'
                }}>
                  <span style={{ fontSize: '13px', color: '#2D3748', fontWeight: 500 }}>
                    {arModelFile ? arModelFile.name : '3D Model uploaded ✓'}
                  </span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => arModelInputRef.current?.click()}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '4px',
                        padding: '4px 10px', borderRadius: '6px',
                        background: '#EDF2F7', border: '1px solid #E2E8F0',
                        color: '#4A5568', fontSize: '12px', cursor: 'pointer'
                      }}
                    >
                      <Upload size={12} /> Replace
                    </button>
                    <button
                      type="button"
                      onClick={() => { setArModelFile(null); setRemoveModel(true); }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '4px',
                        padding: '4px 10px', borderRadius: '6px',
                        background: '#FFF5F5', border: '1px solid #FED7D7',
                        color: '#E53E3E', fontSize: '12px', cursor: 'pointer'
                      }}
                    >
                      <Trash2 size={12} /> Remove
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => arModelInputRef.current?.click()}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    gap: '8px', padding: '16px', borderRadius: '10px',
                    border: '2px dashed #CBD5E0', color: '#718096',
                    cursor: 'pointer', fontSize: '14px', transition: 'all 0.15s'
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#4A90D9'; (e.currentTarget as HTMLElement).style.color = '#4A90D9'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#CBD5E0'; (e.currentTarget as HTMLElement).style.color = '#718096'; }}
                >
                  <Upload size={18} />
                  <span>Upload .glb model for AR view</span>
                </div>
              )}
              <input
                ref={arModelInputRef}
                type="file"
                accept=".glb,.gltf"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setArModelFile(file);
                    setRemoveModel(false);
                  }
                  if (arModelInputRef.current) arModelInputRef.current.value = '';
                }}
              />
            </div>
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

      {/* Gallery Editor Overlay */}
      {isGalleryOpen && (
        <div className="gallery-overlay" onClick={() => setIsGalleryOpen(false)}>
          <div className="gallery-container" onClick={(e) => e.stopPropagation()}>
            <button className="gallery-close" onClick={() => setIsGalleryOpen(false)}>
              <X size={24} />
            </button>

            <div className="gallery-main">
              {(() => {
                const visibleImages = formData.images.filter(img => !img.isDeleted);
                const currentImg = visibleImages[currentGalleryIndex];
                if (!currentImg) return null;

                return (
                  <>
                    <button 
                      className="gallery-nav gallery-prev" 
                      disabled={currentGalleryIndex === 0}
                      onClick={() => setCurrentGalleryIndex(prev => prev - 1)}
                    >
                      <ChevronLeft size={32} />
                    </button>
                    
                    <div className="gallery-image-wrapper">
                      <img src={currentImg.url} alt="Gallery view" className="gallery-image" />
                      <div className="gallery-image-actions">
                        <button 
                          type="button"
                          className="gallery-action-btn delete"
                          onClick={() => handleRemoveImage(currentImg.url)}
                        >
                          <Trash2 size={18} />
                          Delete Image
                        </button>
                        <button 
                          type="button"
                          className="gallery-action-btn add"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <Plus size={18} />
                          Add More
                        </button>
                      </div>
                    </div>

                    <button 
                      className="gallery-nav gallery-next" 
                      disabled={currentGalleryIndex === visibleImages.length - 1}
                      onClick={() => setCurrentGalleryIndex(prev => prev + 1)}
                    >
                      <ChevronRight size={32} />
                    </button>
                  </>
                );
              })()}
            </div>

            <div className="gallery-thumbnails">
              {formData.images.filter(img => !img.isDeleted).map((img, idx) => (
                <div 
                  key={img.id || img.url || idx}
                  className={`gallery-thumb ${idx === currentGalleryIndex ? 'active' : ''}`}
                  onClick={() => setCurrentGalleryIndex(idx)}
                >
                  <img src={img.url} alt="Thumbnail" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuDialog;