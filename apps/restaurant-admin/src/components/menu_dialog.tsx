import React, { useState, useEffect, useRef } from 'react';
import { X, Plus, Minus, Tag, ChevronDown, Upload, Trash2, Maximize2, Edit2, ChevronLeft, ChevronRight, Crop } from 'lucide-react';
import type { MenuCategory } from '@restaurant-saas/types';
import ImageCropper from './ImageCropper';

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

  const [cropQueue, setCropQueue] = useState<{ url: string, file?: File, index?: number }[]>([]);
  const [currentCrop, setCurrentCrop] = useState<{ url: string, file?: File, index?: number } | null>(null);

  useEffect(() => {
    if (cropQueue.length > 0 && !currentCrop) {
      setCurrentCrop(cropQueue[0]);
    }
  }, [cropQueue, currentCrop]);

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
    } else if (mode === 'add' && !item) {
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
  }, [mode, item]);

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

    const newCropQueue = files.map(file => ({
      url: URL.createObjectURL(file),
      file
    }));
    
    setCropQueue(prev => [...prev, ...newCropQueue]);
    
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCropComplete = (croppedBlob: Blob) => {
    const croppedFile = new File([croppedBlob], currentCrop?.file?.name || 'cropped-image.jpg', { type: 'image/jpeg' });
    const croppedUrl = URL.createObjectURL(croppedBlob);

    setFormData(prev => {
      const updatedImages = [...prev.images];
      if (currentCrop?.index !== undefined) {
        // Update existing image
        updatedImages[currentCrop.index] = {
          ...updatedImages[currentCrop.index],
          file: croppedFile,
          url: croppedUrl
        };
      } else {
        // Add new image
        const maxOrder = prev.images.reduce((max, img) => (!img.isDeleted && img.sortOrder > max ? img.sortOrder : max), 0);
        updatedImages.push({
          file: croppedFile,
          url: croppedUrl,
          sortOrder: maxOrder + 1
        });
      }
      return { ...prev, images: updatedImages };
    });

    setCropQueue(prev => prev.slice(1));
    setCurrentCrop(null);
  };

  const handleCropCancel = () => {
    setCropQueue(prev => prev.slice(1));
    setCurrentCrop(null);
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
    if (mode === 'add') {
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
      setNewTag('');
      setNewVariant({ name: '', price: 0 });
      setNewAddon({ name: '', price: 0 });
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex justify-end z-[1000] animate-in fade-in duration-200" onClick={onClose}>
        <div className="bg-tk-bg-card p-6 md:p-8 w-full sm:w-[500px] max-w-[100vw] h-full overflow-y-auto shadow-2xl animate-in slide-in-from-right duration-300 text-tk-text border-l border-tk-border" onClick={(e) => e.stopPropagation()}>
          <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-tk-text m-0">
            {mode === 'add' ? 'Add New Menu Item' : 'Edit Menu Item'}
          </h2>
          <button className="bg-transparent border-none cursor-pointer p-2 rounded-lg flex items-center justify-center text-tk-text-secondary transition-all duration-200 hover:bg-tk-bg-hover hover:text-tk-text" onClick={onClose} type="button">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">

          {/* Category */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-tk-text-secondary">Category *</label>
            <div className="relative">
              <select
                name="category_id"
                value={formData.category_id}
                onChange={handleChange}
                className="w-full p-3 px-4 border-2 border-tk-border bg-tk-bg-elevated rounded-xl text-sm text-tk-text font-sans appearance-none transition-all duration-200 focus:outline-none focus:border-green-400 focus:shadow-[0_0_0_3px_rgba(104,211,145,0.1)]"
                required
              >
                <option value="" disabled>Select a category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
              <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-tk-text-secondary" />
            </div>
          </div>

          {/* Item Name */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-tk-text-secondary">Item Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="p-3 px-4 border-2 border-tk-border bg-tk-bg-elevated rounded-xl text-sm text-tk-text font-sans transition-all duration-200 w-full box-border focus:outline-none focus:border-green-400 focus:shadow-[0_0_0_3px_rgba(104,211,145,0.1)] placeholder:text-tk-text-muted"
              placeholder="e.g. Butter Chicken"
              required
            />
          </div>

          {/* Short Description */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-tk-text-secondary">Short Description</label>
            <input
              type="text"
              name="short_description"
              value={formData.short_description}
              onChange={handleChange}
              className="p-3 px-4 border-2 border-tk-border bg-tk-bg-elevated rounded-xl text-sm text-tk-text font-sans transition-all duration-200 w-full box-border focus:outline-none focus:border-green-400 focus:shadow-[0_0_0_3px_rgba(104,211,145,0.1)] placeholder:text-tk-text-muted"
              placeholder="One-liner for menus and lists"
              maxLength={100}
            />
          </div>

          {/* Long Description */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-tk-text-secondary">Long Description</label>
            <textarea
              name="long_description"
              value={formData.long_description}
              onChange={handleChange}
              className="p-3 px-4 border-2 border-tk-border bg-tk-bg-elevated rounded-xl text-sm text-tk-text font-sans transition-all duration-200 w-full box-border focus:outline-none focus:border-green-400 focus:shadow-[0_0_0_3px_rgba(104,211,145,0.1)] placeholder:text-tk-text-muted resize-y min-h-[80px]"
              placeholder="Full description shown on item detail page"
              rows={3}
            />
          </div>

          {/* Price Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-tk-text-secondary">Price (₹) *</label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                className="p-3 px-4 border-2 border-tk-border bg-tk-bg-elevated rounded-xl text-sm text-tk-text font-sans transition-all duration-200 w-full box-border focus:outline-none focus:border-green-400 focus:shadow-[0_0_0_3px_rgba(104,211,145,0.1)] placeholder:text-tk-text-muted"
                placeholder="0.00"
                min="0"
                step="any"
                onWheel={(e) => e.currentTarget.blur()}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-tk-text-secondary">Discounted Price (₹)</label>
              <input
                type="number"
                name="discount_price"
                value={formData.discount_price}
                onChange={handleChange}
                className="p-3 px-4 border-2 border-tk-border bg-tk-bg-elevated rounded-xl text-sm text-tk-text font-sans transition-all duration-200 w-full box-border focus:outline-none focus:border-green-400 focus:shadow-[0_0_0_3px_rgba(104,211,145,0.1)] placeholder:text-tk-text-muted"
                placeholder="Leave blank if none"
                min="0"
                step="any"
                onWheel={(e) => e.currentTarget.blur()}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-tk-text-secondary">Item Images</label>
            <div className="flex gap-3 overflow-x-auto p-1 mb-3 min-h-[90px] items-center scrollbar-thin scrollbar-thumb-slate-300">
              {formData.images.filter(img => !img.isDeleted).map((img, idx) => {
                const originalIndex = formData.images.findIndex(i => i.url === img.url);
                return (
                <div key={img.id || img.url || originalIndex} className="relative w-[80px] h-[80px] rounded-xl overflow-hidden border border-tk-border shrink-0 shadow-sm transition-transform duration-200 hover:scale-105 group" onClick={() => openGallery(idx)}>
                  <img src={img.url} alt={`Preview ${idx}`} className="w-full h-full object-cover block" />
                  <button 
                    type="button" 
                    onClick={(e) => { e.stopPropagation(); handleRemoveImage(img.url); }}
                    className="absolute top-1 right-1 bg-red-600/90 text-white border-none rounded-full w-5 h-5 flex items-center justify-center cursor-pointer transition-all duration-200 shadow-sm hover:bg-red-600 hover:scale-110 z-10"
                  >
                    <X size={12} />
                  </button>
                  <button 
                    type="button" 
                    onClick={(e) => { e.stopPropagation(); setCurrentCrop({ url: img.url, index: originalIndex }); }}
                    title="Crop Image"
                    className="absolute top-1.5 left-1.5 bg-white/90 text-gray-800 border-none rounded p-1 cursor-pointer flex items-center justify-center shadow-sm z-10"
                  >
                    <Crop size={14} />
                  </button>
                  {idx === 0 && <div className="absolute bottom-0 left-0 right-0 bg-[#37724e]/90 text-white text-[10px] font-semibold text-center py-0.5 uppercase tracking-wide">Primary</div>}
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white opacity-0 transition-opacity duration-200 cursor-pointer group-hover:opacity-100">
                    <Maximize2 size={16} />
                  </div>
                </div>
                );
              })}
              
              <div 
                className="w-[80px] h-[80px] border-2 border-dashed border-tk-border rounded-xl flex flex-col items-center justify-center gap-1 text-tk-text-secondary cursor-pointer transition-all duration-200 shrink-0 bg-tk-bg-elevated hover:border-[#37724e] hover:bg-green-50 hover:text-[#37724e] dark:hover:bg-tk-bg-hover" 
                onClick={() => fileInputRef.current?.click()}
              >
                <Plus size={20} />
                <span className="text-[10px] font-medium">Add</span>
              </div>

              {formData.images.filter(img => !img.isDeleted).length > 0 && (
                <button 
                  type="button"
                  className="flex items-center justify-center gap-2 p-3 px-4 bg-tk-bg-elevated border-2 border-tk-border rounded-xl text-tk-text-secondary text-[13px] font-medium cursor-pointer transition-all duration-200 h-[80px] shrink-0 hover:bg-tk-bg-hover hover:text-tk-text"
                  onClick={() => openGallery(0)}
                >
                  <Edit2 size={16} />
                  <span className="text-xs">Edit Gallery</span>
                </button>
              )}
            </div>
            <input ref={fileInputRef} type="file" multiple accept="image/*" style={{ display: 'none' }} onChange={handleImageFiles} />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-tk-text-secondary">Serves (number of people)</label>
            <input
              type="number"
              name="serves"
              value={formData.serves}
              onChange={handleChange}
              className="p-3 px-4 border-2 border-tk-border bg-tk-bg-elevated rounded-xl text-sm text-tk-text font-sans transition-all duration-200 w-full box-border focus:outline-none focus:border-green-400 focus:shadow-[0_0_0_3px_rgba(104,211,145,0.1)] placeholder:text-tk-text-muted"
              placeholder="e.g. 2"
              min="1"
              onWheel={(e) => e.currentTarget.blur()}
            />
          </div>

          {/* AR 3D Model Upload */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-tk-text-secondary">AR 3D Model (.glb)</label>
            <div className="flex flex-col gap-2">
              {(arModelFile || (existingModelUrl && !removeModel)) ? (
                <div className="flex items-center justify-between py-2.5 px-3.5 rounded-xl bg-green-50 border border-green-200 dark:bg-tk-bg-elevated dark:border-tk-border">
                  <span className="text-[13px] font-medium text-tk-text">
                    {arModelFile ? arModelFile.name : '3D Model uploaded ✓'}
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => arModelInputRef.current?.click()}
                      className="flex items-center gap-1 py-1 px-2.5 rounded-lg bg-gray-100 border border-gray-200 text-gray-700 text-xs cursor-pointer hover:bg-gray-200 dark:bg-tk-bg-hover dark:border-tk-border dark:text-tk-text"
                    >
                      <Upload size={12} /> Replace
                    </button>
                    <button
                      type="button"
                      onClick={() => { setArModelFile(null); setRemoveModel(true); }}
                      className="flex items-center gap-1 py-1 px-2.5 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs cursor-pointer hover:bg-red-100 dark:bg-red-900/20 dark:border-red-900/50 dark:text-red-400"
                    >
                      <Trash2 size={12} /> Remove
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => arModelInputRef.current?.click()}
                  className="flex items-center justify-center gap-2 p-4 rounded-xl border-2 border-dashed border-tk-border text-tk-text-secondary cursor-pointer text-sm transition-all duration-150 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-tk-bg-hover dark:hover:text-tk-text"
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
          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-center bg-tk-bg-elevated rounded-xl py-3.5 px-4 border border-tk-border">
              <div>
                <div className="text-sm font-semibold text-tk-text">Available</div>
                <div className="text-xs text-tk-text-secondary mt-0.5">Show this item on the menu</div>
              </div>
              <label className="relative inline-block w-11 h-6 shrink-0">
                <input type="checkbox" name="is_available" checked={formData.is_available} onChange={handleChange} className="peer opacity-0 w-0 h-0" />
                <span className="absolute cursor-pointer inset-0 bg-slate-300 rounded-full transition-all duration-300 peer-checked:bg-[#37724e] before:absolute before:content-[''] before:h-[18px] before:w-[18px] before:left-[3px] before:bottom-[3px] before:bg-white before:rounded-full before:transition-all before:duration-300 before:shadow-[0_1px_3px_rgba(0,0,0,0.2)] peer-checked:before:translate-x-[20px]"></span>
              </label>
            </div>
            <div className="flex justify-between items-center bg-tk-bg-elevated rounded-xl py-3.5 px-4 border border-tk-border">
              <div>
                <div className="text-sm font-semibold text-tk-text" style={{ color: formData.is_veg ? '#38A169' : '#E53E3E' }}>
                  {formData.is_veg ? '🟩 Vegetarian' : '🟥 Non-Vegetarian'}
                </div>
                <div className="text-xs text-tk-text-secondary mt-0.5">Toggle food type</div>
              </div>
              <label className="relative inline-block w-11 h-6 shrink-0">
                <input type="checkbox" name="is_veg" checked={formData.is_veg} onChange={handleChange} className="peer opacity-0 w-0 h-0" />
                <span className="absolute cursor-pointer inset-0 bg-slate-300 rounded-full transition-all duration-300 before:absolute before:content-[''] before:h-[18px] before:w-[18px] before:left-[3px] before:bottom-[3px] before:bg-white before:rounded-full before:transition-all before:duration-300 before:shadow-[0_1px_3px_rgba(0,0,0,0.2)] peer-checked:before:translate-x-[20px]" style={{ backgroundColor: formData.is_veg ? '#38A169' : '#E53E3E' }}></span>
              </label>
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-tk-text-secondary"><Tag size={14} style={{ display: 'inline', marginRight: 4 }} />Tags</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {PRESET_TAGS.map(tag => (
                <button
                  key={tag}
                  type="button"
                  className={`px-3.5 py-1.5 rounded-full border-[1.5px] border-tk-border bg-tk-bg-elevated text-[13px] text-tk-text-secondary cursor-pointer transition-all duration-200 font-sans hover:border-[#37724e]/50 dark:hover:border-green-400 ${formData.tags.includes(tag) ? 'bg-[#31274e] border-[#37724e] text-white font-semibold dark:bg-green-900/20 dark:text-green-400 dark:border-green-400' : ''}`}
                  onClick={() => toggleTag(tag)}
                >{tag}</button>
              ))}
            </div>
            <div className="flex gap-2 items-center">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                className="p-3 px-4 border-2 border-tk-border bg-tk-bg-elevated rounded-xl text-sm text-tk-text font-sans transition-all duration-200 w-full box-border focus:outline-none focus:border-green-400 focus:shadow-[0_0_0_3px_rgba(104,211,145,0.1)] placeholder:text-tk-text-muted"
                placeholder="Add custom tag..."
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomTag(); } }}
              />
              <button type="button" className="flex items-center justify-center p-3 bg-[#37724e] text-white border-none rounded-xl cursor-pointer shrink-0 transition-colors duration-200 hover:bg-[#2f5e40]" onClick={addCustomTag}>
                <Plus size={16} />
              </button>
            </div>
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {formData.tags.map(tag => (
                  <span key={tag} className="flex items-center gap-1.5 px-2.5 py-1 bg-[#37724e] text-white dark:bg-green-900/20 dark:text-green-400 rounded-full text-xs font-semibold border border-[#37724e] dark:border-green-800">
                    {tag}
                    <button type="button" onClick={() => removeTag(tag)} className="bg-transparent border-none cursor-pointer p-0 text-white/70 hover:text-red-200 dark:text-green-400/70 dark:hover:text-red-400 flex items-center transition-colors"><X size={12} /></button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Variants */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-tk-text-secondary">Variants (e.g. Small / Medium / Large)</label>
            {formData.variants.length > 0 && (
              <div className="flex flex-col gap-1.5 mb-2.5">
                {formData.variants.map((v, idx) => (
                  <div key={idx} className="flex items-center gap-3 bg-tk-bg-elevated rounded-xl p-2.5 px-3.5 border border-tk-border">
                    <span className="flex-1 text-sm font-medium text-tk-text">{v.name}</span>
                    <span className="text-[13px] font-semibold text-[#37724e] dark:text-green-400">₹{v.price}</span>
                    <button type="button" onClick={() => removeVariant(idx)} className="bg-transparent border-none cursor-pointer text-red-500 p-1 rounded-md flex items-center transition-colors duration-200 hover:bg-red-500/10">
                      <Minus size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2 items-center">
              <input
                type="text"
                value={newVariant.name}
                onChange={(e) => setNewVariant(prev => ({ ...prev, name: e.target.value }))}
                className="p-3 px-4 border-2 border-tk-border bg-tk-bg-elevated rounded-xl text-sm text-tk-text font-sans transition-all duration-200 w-full box-border focus:outline-none focus:border-green-400 focus:shadow-[0_0_0_3px_rgba(104,211,145,0.1)] placeholder:text-tk-text-muted"
                placeholder="Variant name (e.g. Large)"
              />
              <input
                type="number"
                value={newVariant.price || ''}
                onChange={(e) => setNewVariant(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                className="p-3 px-4 border-2 border-tk-border bg-tk-bg-elevated rounded-xl text-sm text-tk-text font-sans transition-all duration-200 w-full box-border focus:outline-none focus:border-green-400 focus:shadow-[0_0_0_3px_rgba(104,211,145,0.1)] placeholder:text-tk-text-muted max-w-[110px]"
                placeholder="Price (₹)"
                min="0"
                step="any"
                onWheel={(e) => e.currentTarget.blur()}
              />
              <button type="button" className="flex items-center justify-center p-3 bg-[#37724e] text-white border-none rounded-xl cursor-pointer shrink-0 transition-colors duration-200 hover:bg-[#2f5e40]" onClick={addVariant}>
                <Plus size={16} />
              </button>
            </div>
          </div>

          {/* Addons */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-tk-text-secondary">Addons</label>
            <div className="flex flex-wrap gap-2">
              {PRESET_ADDONS.map((addon) => {
                const selected = formData.addons.some(a => a.name === addon.name);
                return (
                  <label key={addon.name} className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border-[1.5px] border-tk-border bg-tk-bg-elevated text-[13px] cursor-pointer transition-all duration-200 select-none hover:border-[#37724e]/50 dark:hover:border-green-400 ${selected ? 'bg-[#37724e] border-[#37724e] dark:bg-green-900/20 dark:border-green-400' : 'text-tk-text-secondary'}`}>
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => toggleAddon(addon)}
                      style={{ display: 'none' }}
                    />
                    <span className={selected ? 'text-white font-semibold dark:text-green-400' : 'text-tk-text'}>{addon.name}</span>
                    <span className={`text-xs font-medium ${selected ? 'text-white/80 dark:text-green-400/80' : 'text-tk-text-secondary'}`}>+₹{addon.price}</span>
                  </label>
                );
              })}
            </div>
            
            {/* Custom Addon Input */}
            <div className="flex gap-2 items-center" style={{ marginTop: '12px' }}>
              <input
                type="text"
                value={newAddon.name}
                onChange={(e) => setNewAddon(prev => ({ ...prev, name: e.target.value }))}
                className="p-3 px-4 border-2 border-tk-border bg-tk-bg-elevated rounded-xl text-sm text-tk-text font-sans transition-all duration-200 w-full box-border focus:outline-none focus:border-green-400 focus:shadow-[0_0_0_3px_rgba(104,211,145,0.1)] placeholder:text-tk-text-muted"
                placeholder="Custom addon name"
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomAddon(); } }}
              />
              <input
                type="number"
                value={newAddon.price || ''}
                onChange={(e) => setNewAddon(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                className="p-3 px-4 border-2 border-tk-border bg-tk-bg-elevated rounded-xl text-sm text-tk-text font-sans transition-all duration-200 w-full box-border focus:outline-none focus:border-green-400 focus:shadow-[0_0_0_3px_rgba(104,211,145,0.1)] placeholder:text-tk-text-muted max-w-[110px]"
                placeholder="Price (₹)"
                min="0"
                step="any"
                onWheel={(e) => e.currentTarget.blur()}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomAddon(); } }}
              />
              <button type="button" className="flex items-center justify-center p-3 bg-[#37724e] text-white border-none rounded-xl cursor-pointer shrink-0 transition-colors duration-200 hover:bg-[#2f5e40]" onClick={addCustomAddon}>
                <Plus size={16} />
              </button>
            </div>

            {/* Selected Addons List */}
            {formData.addons.length > 0 && (
              <div className="flex flex-col gap-1.5 mb-2.5" style={{ marginTop: '12px' }}>
                {formData.addons.map((addon, idx) => (
                  <div key={idx} className="flex items-center gap-3 bg-tk-bg-elevated rounded-xl p-2.5 px-3.5 border border-tk-border">
                    <span className="flex-1 text-sm font-medium text-tk-text">{addon.name}</span>
                    <span className="text-[13px] font-semibold text-[#37724e] dark:text-green-400">+₹{addon.price}</span>
                    <button type="button" onClick={() => removeAddon(addon.name)} className="bg-transparent border-none cursor-pointer text-red-500 p-1 rounded-md flex items-center transition-colors duration-200 hover:bg-red-500/10">
                      <Minus size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3 mt-3">
            <button type="button" className="flex-1 py-3 px-5 border-none rounded-xl text-sm font-medium cursor-pointer transition-all duration-200 font-sans bg-tk-bg-elevated text-tk-text-secondary flex items-center justify-center hover:bg-tk-bg-hover" onClick={onClose}>Cancel</button>
            <button type="submit" className="flex-1 py-3 px-5 border-none rounded-xl text-sm font-medium cursor-pointer transition-all duration-200 font-sans bg-[#37724e] text-white flex items-center justify-center hover:bg-[#4f755c] hover:-translate-y-0.5">
              {mode === 'add' ? 'Add Item' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
      </div>

      {currentCrop && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100000 }}>
          <ImageCropper
            image={currentCrop.url}
            onCropComplete={handleCropComplete}
            onCancel={handleCropCancel}
            aspect={1}
          />
        </div>
      )}

      {/* Gallery Editor Overlay */}
      {isGalleryOpen && (
        <div className="fixed inset-0 bg-black/95 z-[2000] flex items-center justify-center backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setIsGalleryOpen(false)}>
          <div className="w-[90%] h-[90%] flex flex-col relative max-w-[1200px]" onClick={(e) => e.stopPropagation()}>
            <button className="absolute -top-10 right-0 bg-transparent border-none text-white cursor-pointer p-2 transition-transform duration-200 hover:scale-110" onClick={() => setIsGalleryOpen(false)}>
              <X size={24} />
            </button>

            <div className="flex-1 flex items-center justify-center relative gap-5">
              {(() => {
                const visibleImages = formData.images.filter(img => !img.isDeleted);
                const currentImg = visibleImages[currentGalleryIndex];
                if (!currentImg) return null;

                return (
                  <>
                    <button 
                      className="bg-white/10 border-none text-white w-[60px] h-[60px] rounded-full flex items-center justify-center cursor-pointer transition-all duration-200 hover:bg-white/20 hover:scale-110 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:bg-white/10" 
                      disabled={currentGalleryIndex === 0}
                      onClick={() => setCurrentGalleryIndex(prev => prev - 1)}
                    >
                      <ChevronLeft size={32} />
                    </button>
                    
                    <div className="relative max-w-[80%] max-h-[80vh] flex flex-col items-center gap-6">
                      <img src={currentImg.url} alt="Gallery view" className="max-w-full max-h-[calc(80vh-80px)] object-contain rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.5)]" />
                      <div className="flex gap-4">
                        <button 
                          type="button"
                          className="flex items-center gap-2 p-3 px-6 rounded-xl border-none font-semibold cursor-pointer transition-transform duration-200 hover:-translate-y-0.5 shadow-[0_4px_12px_rgba(0,0,0,0.15)] bg-white text-gray-900 hover:bg-gray-50"
                          onClick={() => {
                            const originalIndex = formData.images.findIndex(i => i.url === currentImg.url);
                            setCurrentCrop({ url: currentImg.url, index: originalIndex });
                            setIsGalleryOpen(false);
                          }}
                        >
                          <Crop size={18} />
                          Crop Image
                        </button>
                        <button 
                          type="button"
                          className="flex items-center gap-2 p-3 px-6 rounded-xl border-none font-semibold cursor-pointer transition-transform duration-200 hover:-translate-y-0.5 shadow-[0_4px_12px_rgba(0,0,0,0.15)] bg-red-500 text-white hover:bg-red-600"
                          onClick={() => handleRemoveImage(currentImg.url)}
                        >
                          <Trash2 size={18} />
                          Delete Image
                        </button>
                        <button 
                          type="button"
                          className="flex items-center gap-2 p-3 px-6 rounded-xl border-none font-semibold cursor-pointer transition-transform duration-200 hover:-translate-y-0.5 shadow-[0_4px_12px_rgba(0,0,0,0.15)] bg-[#37724e] text-white hover:bg-[#2f6344]"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <Plus size={18} />
                          Add More
                        </button>
                      </div>
                    </div>

                    <button 
                      className="bg-white/10 border-none text-white w-[60px] h-[60px] rounded-full flex items-center justify-center cursor-pointer transition-all duration-200 hover:bg-white/20 hover:scale-110 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:bg-white/10" 
                      disabled={currentGalleryIndex === visibleImages.length - 1}
                      onClick={() => setCurrentGalleryIndex(prev => prev + 1)}
                    >
                      <ChevronRight size={32} />
                    </button>
                  </>
                );
              })()}
            </div>

            <div className="h-[100px] flex gap-3 items-center justify-center mt-5 px-5 overflow-x-auto scrollbar-none">
              {formData.images.filter(img => !img.isDeleted).map((img, idx) => (
                <div 
                  key={img.id || img.url || idx}
                  className={`w-[80px] h-[80px] rounded-xl overflow-hidden cursor-pointer opacity-50 transition-all duration-200 border-[3px] border-transparent hover:opacity-100 shrink-0 ${idx === currentGalleryIndex ? 'opacity-100 border-white scale-110' : ''}`}
                  onClick={() => setCurrentGalleryIndex(idx)}
                >
                  <img src={img.url} alt="Thumbnail" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MenuDialog;