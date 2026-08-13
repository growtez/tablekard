import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from '../supabaseClient'
import { X, Utensils, Plus, Minus, Tag, Crop, Trash2 } from 'lucide-react'
import ImageCropper from './ImageCropper'

const PRESET_TAGS = ['Spicy', 'Bestseller', 'New', 'Vegan', 'Gluten-Free', "Chef's Special", 'Seasonal']
const PRESET_ADDONS = [
  { name: 'Extra Cheese', price: 30 },
  { name: 'Extra Sauce', price: 15 },
  { name: 'Extra Bread', price: 20 },
]

export default function QuickAddMenuItemDrawer({ isOpen, onClose, restaurantId, categories = [], onSuccess, onAddCategory }) {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const fileInputRef = useRef(null)

    const [formData, setFormData] = useState({
        name: '',
        price: '',
        categoryId: '',
        short_description: '',
        long_description: '',
        is_veg: false,
        is_available: true,
        serves: 1,
        preparation_time: '',
        tags: [],
        variants: [],
        addons: []
    })

    const [imageFile, setImageFile] = useState(null)
    const [imagePreview, setImagePreview] = useState(null)
    const [isCropping, setIsCropping] = useState(false)
    const [cropSource, setCropSource] = useState(null)

    const [newTag, setNewTag] = useState('')
    const [newVariant, setNewVariant] = useState({ name: '', price: '' })
    const [newAddon, setNewAddon] = useState({ name: '', price: '' })

    useEffect(() => {
        if (!isOpen) {
            setFormData({
                name: '',
                price: '',
                categoryId: '',
                short_description: '',
                long_description: '',
                is_veg: false,
                is_available: true,
                serves: 1,
                preparation_time: '',
                tags: [],
                variants: [],
                addons: []
            })
            setImageFile(null)
            setImagePreview(null)
            setIsCropping(false)
            setCropSource(null)
            setNewTag('')
            setNewVariant({ name: '', price: '' })
            setNewAddon({ name: '', price: '' })
            setError(null)
        } else if (categories.length > 0 && !formData.categoryId) {
            setFormData(prev => ({ ...prev, categoryId: categories[0].id }))
        }
    }, [isOpen, categories])

    const handleImageFile = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setCropSource(URL.createObjectURL(file));
        setIsCropping(true);
        e.target.value = '';
    }

    const handleCropComplete = (croppedBlob) => {
        const file = new File([croppedBlob], 'cropped-image.jpg', { type: 'image/jpeg' });
        setImageFile(file);
        setImagePreview(URL.createObjectURL(croppedBlob));
        setIsCropping(false);
        setCropSource(null);
    }

    const handleCropCancel = () => {
        setIsCropping(false);
        setCropSource(null);
    }

    const removeImage = () => {
        setImageFile(null);
        setImagePreview(null);
    }

    const toggleTag = (tag) => {
        setFormData(prev => ({
            ...prev,
            tags: prev.tags.includes(tag) ? prev.tags.filter(t => t !== tag) : [...prev.tags, tag]
        }))
    }
    const addCustomTag = () => {
        const trimmed = newTag.trim()
        if (trimmed && !formData.tags.includes(trimmed)) {
            setFormData(prev => ({ ...prev, tags: [...prev.tags, trimmed] }))
        }
        setNewTag('')
    }
    const removeTag = (tag) => {
        setFormData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }))
    }

    const addVariant = () => {
        if (!newVariant.name) return;
        setFormData(prev => ({ ...prev, variants: [...prev.variants, { name: newVariant.name, price: parseFloat(newVariant.price) || 0 }] }))
        setNewVariant({ name: '', price: '' })
    }
    const removeVariant = (idx) => {
        setFormData(prev => ({ ...prev, variants: prev.variants.filter((_, i) => i !== idx) }))
    }

    const toggleAddon = (addon) => {
        const exists = formData.addons.find(a => a.name === addon.name);
        if (exists) {
            setFormData(prev => ({ ...prev, addons: prev.addons.filter(a => a.name !== addon.name) }))
        } else {
            setFormData(prev => ({ ...prev, addons: [...prev.addons, { ...addon }] }))
        }
    }
    const addCustomAddon = () => {
        if (!newAddon.name) return;
        const exists = formData.addons.find(a => a.name === newAddon.name);
        if (!exists) {
            setFormData(prev => ({ ...prev, addons: [...prev.addons, { name: newAddon.name, price: parseFloat(newAddon.price) || 0 }] }))
        }
        setNewAddon({ name: '', price: '' })
    }
    const removeAddon = (addonName) => {
        setFormData(prev => ({ ...prev, addons: prev.addons.filter(a => a.name !== addonName) }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!formData.name.trim() || !formData.price || !formData.categoryId) {
            setError("Name, Price, and Category are required.")
            return
        }

        setLoading(true)
        setError(null)

        try {
            let uploadedImageUrl = null;
            if (imageFile) {
                const ext = imageFile.name.split('.').pop() || 'jpg';
                const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${ext}`;
                const filePath = `menu_items/superadmin-${restaurantId}/${fileName}`;
                
                const { error: uploadError } = await supabase.storage
                    .from('menu-images')
                    .upload(filePath, imageFile, { cacheControl: '3600', upsert: false });

                if (uploadError) throw uploadError;

                const { data } = supabase.storage
                    .from('menu-images')
                    .getPublicUrl(filePath);
                    
                uploadedImageUrl = data.publicUrl;
            }

            const { error: insertError } = await supabase
                .from('menu_items')
                .insert({
                    restaurant_id: restaurantId,
                    name: formData.name.trim(),
                    price: parseFloat(formData.price),
                    category_id: formData.categoryId,
                    short_description: formData.short_description.trim() || null,
                    long_description: formData.long_description.trim() || null,
                    is_veg: formData.is_veg,
                    is_available: formData.is_available,
                    serves: parseInt(formData.serves) || 1,
                    preparation_time: formData.preparation_time ? parseInt(formData.preparation_time) : null,
                    tags: formData.tags,
                    variants: formData.variants,
                    addons: formData.addons,
                    images: uploadedImageUrl ? [{ url: uploadedImageUrl, sortOrder: 1 }] : []
                })

            if (insertError) throw insertError

            onSuccess?.()
            onClose()
        } catch (err) {
            console.error(err)
            setError(err.message || "Failed to create menu item")
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen) return null

    return createPortal(
        <>
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9999]" onClick={onClose}>
                <div onClick={e => e.stopPropagation()} className="fixed right-0 top-0 bottom-0 w-full max-w-[650px] bg-bg shadow-2xl p-6 flex flex-col z-[10000] overflow-y-auto">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-3">
                            <div className="bg-blue-500/10 p-2.5 rounded-xl">
                                <Utensils size={20} className="text-blue-500" />
                            </div>
                            <h2 className="text-lg font-bold text-text-main m-0">Add Menu Item</h2>
                        </div>
                        <button onClick={onClose} className="w-8 h-8 rounded-full bg-surface-hover flex items-center justify-center text-text-muted hover:bg-border hover:text-text-main transition-colors border-none cursor-pointer">
                            <X size={20} />
                        </button>
                    </div>

                    {error && (
                        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-4">
                            {error}
                        </div>
                    )}

                    {categories.length === 0 ? (
                        <div className="p-6 text-center text-text-muted flex flex-col items-center gap-4 my-auto">
                            <p className="text-sm">You must create a category first before adding menu items.</p>
                            <button 
                                type="button" 
                                className="h-12 px-6 flex items-center justify-center bg-accent-primary text-white font-bold rounded-xl shadow-[0_4px_20px_rgba(5,150,105,0.15)] hover:shadow-[0_6px_25px_rgba(5,150,105,0.25)] transition-all border-none cursor-pointer" 
                                onClick={() => {
                                    onClose();
                                    onAddCategory?.();
                                }}
                            >
                                Add Category
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="flex-1 flex flex-col gap-5">
                            <div className="relative">
                                <select
                                    id="itemCategory"
                                    value={formData.categoryId}
                                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                                    className="peer w-full bg-surface-hover border border-border rounded-xl px-4 h-12 text-sm text-text-main focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-all appearance-none cursor-pointer"
                                >
                                    <option value="" disabled>Select Category</option>
                                    {categories.map(c => <option key={c.id} value={c.id} className="bg-surface text-text-main">{c.name}</option>)}
                                </select>
                                <label htmlFor="itemCategory" className="absolute left-3 px-1.5 transition-all duration-200 z-10 pointer-events-none -top-2.5 text-[10px] bg-bg font-bold uppercase tracking-wider text-text-muted peer-focus:-top-2.5 peer-focus:text-[10px] peer-focus:bg-bg peer-focus:font-bold peer-focus:uppercase peer-focus:tracking-wider peer-focus:text-accent-primary">Category</label>
                            </div>

                            <div className="relative">
                                <input
                                    type="text"
                                    id="itemName"
                                    placeholder="Item Name (e.g. Butter Chicken)"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                    className="peer w-full bg-surface-hover border border-border rounded-xl px-4 h-12 text-sm text-text-main focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-all placeholder:text-transparent focus:placeholder:text-text-muted/50"
                                />
                                <label htmlFor="itemName" className="absolute left-3 px-1.5 transition-all duration-200 z-10 pointer-events-none -top-2.5 text-[10px] bg-bg font-bold uppercase tracking-wider text-text-muted peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:bg-transparent peer-placeholder-shown:font-normal peer-placeholder-shown:normal-case peer-placeholder-shown:tracking-normal peer-focus:-top-2.5 peer-focus:text-[10px] peer-focus:bg-bg peer-focus:font-bold peer-focus:uppercase peer-focus:tracking-wider peer-focus:text-accent-primary">Item Name</label>
                            </div>

                            <div className="relative">
                                <input
                                    type="number"
                                    id="itemPrice"
                                    min="0"
                                    step="0.01"
                                    placeholder="Price (e.g. 299)"
                                    value={formData.price}
                                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                    required
                                    className="peer w-full bg-surface-hover border border-border rounded-xl px-4 h-12 text-sm text-text-main focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-all placeholder:text-transparent focus:placeholder:text-text-muted/50"
                                />
                                <label htmlFor="itemPrice" className="absolute left-3 px-1.5 transition-all duration-200 z-10 pointer-events-none -top-2.5 text-[10px] bg-bg font-bold uppercase tracking-wider text-text-muted peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:bg-transparent peer-placeholder-shown:font-normal peer-placeholder-shown:normal-case peer-placeholder-shown:tracking-normal peer-focus:-top-2.5 peer-focus:text-[10px] peer-focus:bg-bg peer-focus:font-bold peer-focus:uppercase peer-focus:tracking-wider peer-focus:text-accent-primary">Price (₹)</label>
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-bold text-text-muted px-1">Variants</label>
                                {formData.variants.length > 0 && (
                                    <div className="flex flex-col gap-2 mb-2">
                                        {formData.variants.map((v, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-3 bg-surface-hover border border-border rounded-xl">
                                                <span className="text-sm font-medium text-text-main">{v.name}</span>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-sm font-bold text-accent-primary">₹{v.price}</span>
                                                    <button type="button" onClick={() => removeVariant(idx)} className="text-text-muted hover:text-red-500 cursor-pointer border-none bg-transparent flex items-center p-1">
                                                        <Minus size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newVariant.name}
                                        onChange={(e) => setNewVariant(prev => ({ ...prev, name: e.target.value }))}
                                        className="flex-[2] bg-surface-hover border border-border rounded-xl px-4 h-10 text-sm text-text-main focus:outline-none focus:border-accent-primary"
                                        placeholder="Variant name"
                                    />
                                    <input
                                        type="number"
                                        value={newVariant.price}
                                        onChange={(e) => setNewVariant(prev => ({ ...prev, price: e.target.value }))}
                                        className="flex-1 bg-surface-hover border border-border rounded-xl px-4 h-10 text-sm text-text-main focus:outline-none focus:border-accent-primary"
                                        placeholder="Price (₹)"
                                        min="0"
                                        step="0.01"
                                    />
                                    <button type="button" onClick={addVariant} className="h-10 px-4 bg-surface border border-border rounded-xl flex items-center justify-center gap-1.5 text-text-main hover:bg-surface-hover cursor-pointer font-medium text-sm whitespace-nowrap">
                                        <Plus size={16} />
                                        {/* <span>Add Variant</span> */}
                                    </button>
                                </div>
                            </div>

                            <div className="relative">
                                <textarea
                                    id="itemDesc"
                                    placeholder="Short Description (optional)"
                                    value={formData.short_description}
                                    onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
                                    className="peer w-full bg-surface-hover border border-border rounded-xl px-4 py-3 min-h-[80px] text-sm text-text-main focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-all placeholder:text-transparent focus:placeholder:text-text-muted/50 resize-y"
                                />
                                <label htmlFor="itemDesc" className="absolute left-3 px-1.5 transition-all duration-200 z-10 pointer-events-none -top-2.5 text-[10px] bg-bg font-bold uppercase tracking-wider text-text-muted peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:bg-transparent peer-placeholder-shown:font-normal peer-placeholder-shown:normal-case peer-placeholder-shown:tracking-normal peer-focus:-top-2.5 peer-focus:text-[10px] peer-focus:bg-bg peer-focus:font-bold peer-focus:uppercase peer-focus:tracking-wider peer-focus:text-accent-primary">Short Description</label>
                            </div>

                            <div className="relative">
                                <textarea
                                    id="itemLongDesc"
                                    placeholder="Long Description (optional)"
                                    value={formData.long_description}
                                    onChange={(e) => setFormData({ ...formData, long_description: e.target.value })}
                                    className="peer w-full bg-surface-hover border border-border rounded-xl px-4 py-3 min-h-[80px] text-sm text-text-main focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-all placeholder:text-transparent focus:placeholder:text-text-muted/50 resize-y"
                                />
                                <label htmlFor="itemLongDesc" className="absolute left-3 px-1.5 transition-all duration-200 z-10 pointer-events-none -top-2.5 text-[10px] bg-bg font-bold uppercase tracking-wider text-text-muted peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:bg-transparent peer-placeholder-shown:font-normal peer-placeholder-shown:normal-case peer-placeholder-shown:tracking-normal peer-focus:-top-2.5 peer-focus:text-[10px] peer-focus:bg-bg peer-focus:font-bold peer-focus:uppercase peer-focus:tracking-wider peer-focus:text-accent-primary">Long Description</label>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="relative">
                                    <input
                                        type="number"
                                        id="itemServes"
                                        min="1"
                                        placeholder="Serves (e.g. 2)"
                                        value={formData.serves}
                                        onChange={(e) => setFormData({ ...formData, serves: e.target.value })}
                                        className="peer w-full bg-surface-hover border border-border rounded-xl px-4 h-12 text-sm text-text-main focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-all placeholder:text-transparent focus:placeholder:text-text-muted/50"
                                    />
                                    <label htmlFor="itemServes" className="absolute left-3 px-1.5 transition-all duration-200 z-10 pointer-events-none -top-2.5 text-[10px] bg-bg font-bold uppercase tracking-wider text-text-muted peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:bg-transparent peer-placeholder-shown:font-normal peer-placeholder-shown:normal-case peer-placeholder-shown:tracking-normal peer-focus:-top-2.5 peer-focus:text-[10px] peer-focus:bg-bg peer-focus:font-bold peer-focus:uppercase peer-focus:tracking-wider peer-focus:text-accent-primary">Serves</label>
                                </div>
                                <div className="relative">
                                    <input
                                        type="number"
                                        id="itemPrepTime"
                                        min="0"
                                        placeholder="Prep Time (mins)"
                                        value={formData.preparation_time}
                                        onChange={(e) => setFormData({ ...formData, preparation_time: e.target.value })}
                                        className="peer w-full bg-surface-hover border border-border rounded-xl px-4 h-12 text-sm text-text-main focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-all placeholder:text-transparent focus:placeholder:text-text-muted/50"
                                    />
                                    <label htmlFor="itemPrepTime" className="absolute left-3 px-1.5 transition-all duration-200 z-10 pointer-events-none -top-2.5 text-[10px] bg-bg font-bold uppercase tracking-wider text-text-muted peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:bg-transparent peer-placeholder-shown:font-normal peer-placeholder-shown:normal-case peer-placeholder-shown:tracking-normal peer-focus:-top-2.5 peer-focus:text-[10px] peer-focus:bg-bg peer-focus:font-bold peer-focus:uppercase peer-focus:tracking-wider peer-focus:text-accent-primary">Prep Time (mins)</label>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-bold text-text-muted px-1">Tags</label>
                                <div className="flex flex-wrap gap-2">
                                    {PRESET_TAGS.map(tag => (
                                        <button
                                            key={tag}
                                            type="button"
                                            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors cursor-pointer ${formData.tags.includes(tag) ? 'bg-accent-primary text-white border-accent-primary' : 'bg-surface-hover border-border text-text-main hover:border-accent-primary/50'}`}
                                            onClick={() => toggleTag(tag)}
                                        >
                                            {tag}
                                        </button>
                                    ))}
                                </div>
                                <div className="flex gap-2 mt-2">
                                    <input
                                        type="text"
                                        value={newTag}
                                        onChange={(e) => setNewTag(e.target.value)}
                                        className="flex-1 bg-surface-hover border border-border rounded-xl px-4 h-10 text-sm text-text-main focus:outline-none focus:border-accent-primary"
                                        placeholder="Add custom tag..."
                                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomTag(); } }}
                                    />
                                    <button type="button" onClick={addCustomTag} className="h-10 px-4 bg-surface border border-border rounded-xl flex items-center justify-center gap-1.5 text-text-main hover:bg-surface-hover cursor-pointer font-medium text-sm whitespace-nowrap">
                                        <Plus size={16} />
                                        {/* <span>Add Tag</span> */}
                                    </button>
                                </div>
                                {formData.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-2 p-3 bg-surface-hover rounded-xl border border-border">
                                        {formData.tags.map(tag => (
                                            <span key={tag} className="flex items-center gap-1.5 bg-bg px-2.5 py-1 rounded-full text-xs font-medium text-text-main border border-border">
                                                {tag}
                                                <button type="button" onClick={() => removeTag(tag)} className="text-text-muted hover:text-red-500 cursor-pointer border-none bg-transparent flex items-center">
                                                    <X size={12} />
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-bold text-text-muted px-1">Addons</label>
                                <div className="flex flex-wrap gap-2">
                                    {PRESET_ADDONS.map(addon => {
                                        const selected = formData.addons.some(a => a.name === addon.name);
                                        return (
                                            <button
                                                key={addon.name}
                                                type="button"
                                                className={`px-3 py-1.5 rounded-xl text-xs font-medium border flex items-center gap-2 transition-colors cursor-pointer ${selected ? 'bg-accent-primary/10 text-accent-primary border-accent-primary/30' : 'bg-surface-hover border-border text-text-main hover:border-accent-primary/50'}`}
                                                onClick={() => toggleAddon(addon)}
                                            >
                                                <span>{addon.name}</span>
                                                <span className="opacity-70 font-bold">+₹{addon.price}</span>
                                            </button>
                                        )
                                    })}
                                </div>
                                <div className="flex gap-2 mt-2">
                                    <input
                                        type="text"
                                        value={newAddon.name}
                                        onChange={(e) => setNewAddon(prev => ({ ...prev, name: e.target.value }))}
                                        className="flex-[2] bg-surface-hover border border-border rounded-xl px-4 h-10 text-sm text-text-main focus:outline-none focus:border-accent-primary"
                                        placeholder="Custom addon name"
                                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomAddon(); } }}
                                    />
                                    <input
                                        type="number"
                                        value={newAddon.price}
                                        onChange={(e) => setNewAddon(prev => ({ ...prev, price: e.target.value }))}
                                        className="flex-1 bg-surface-hover border border-border rounded-xl px-4 h-10 text-sm text-text-main focus:outline-none focus:border-accent-primary"
                                        placeholder="Price (₹)"
                                        min="0"
                                        step="0.01"
                                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomAddon(); } }}
                                    />
                                    <button type="button" onClick={addCustomAddon} className="h-10 px-4 bg-surface border border-border rounded-xl flex items-center justify-center gap-1.5 text-text-main hover:bg-surface-hover cursor-pointer font-medium text-sm whitespace-nowrap">
                                        <Plus size={16} />
                                        {/* <span>Add Addon</span> */}
                                    </button>
                                </div>
                                {formData.addons.length > 0 && (
                                    <div className="flex flex-col gap-2 mt-2">
                                        {formData.addons.map((addon, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-3 bg-surface-hover border border-border rounded-xl">
                                                <span className="text-sm font-medium text-text-main">{addon.name}</span>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-sm font-bold text-accent-primary">+₹{addon.price}</span>
                                                    <button type="button" onClick={() => removeAddon(addon.name)} className="text-text-muted hover:text-red-500 cursor-pointer border-none bg-transparent flex items-center p-1">
                                                        <Minus size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-bold text-text-muted px-1">Item Image</label>
                                {imagePreview ? (
                                    <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-border group bg-surface-hover">
                                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button type="button" onClick={() => fileInputRef.current?.click()} className="h-10 px-4 rounded-xl bg-white text-black font-bold text-sm cursor-pointer border-none">
                                                Change
                                            </button>
                                            <button type="button" onClick={removeImage} className="w-10 h-10 rounded-xl bg-red-500 text-white flex items-center justify-center cursor-pointer border-none">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div 
                                        onClick={() => fileInputRef.current?.click()} 
                                        className="w-full aspect-video rounded-xl border-2 border-dashed border-border bg-surface-hover flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-accent-primary hover:bg-accent-primary/5 transition-all text-text-muted hover:text-accent-primary"
                                    >
                                        <Plus size={32} />
                                        <span className="text-sm font-medium">Click to upload image</span>
                                    </div>
                                )}
                                <input 
                                    ref={fileInputRef} 
                                    type="file" 
                                    accept="image/*" 
                                    style={{ display: 'none' }} 
                                    onChange={handleImageFile} 
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex items-center gap-3 py-1">
                                    <input
                                        type="checkbox"
                                        id="itemVeg"
                                        checked={formData.is_veg}
                                        onChange={(e) => setFormData({ ...formData, is_veg: e.target.checked })}
                                        className="w-4 h-4 rounded border-border text-accent-primary focus:ring-accent-primary accent-accent-primary cursor-pointer"
                                    />
                                    <label htmlFor="itemVeg" className="text-sm font-medium text-text-main cursor-pointer select-none">Vegetarian</label>
                                </div>
                                <div className="flex items-center gap-3 py-1">
                                    <input
                                        type="checkbox"
                                        id="itemAvailable"
                                        checked={formData.is_available}
                                        onChange={(e) => setFormData({ ...formData, is_available: e.target.checked })}
                                        className="w-4 h-4 rounded border-border text-accent-primary focus:ring-accent-primary accent-accent-primary cursor-pointer"
                                    />
                                    <label htmlFor="itemAvailable" className="text-sm font-medium text-text-main cursor-pointer select-none">In Stock</label>
                                </div>
                            </div>

                            <div className="mt-auto flex gap-3 pt-4">
                                <button type="button" onClick={onClose} className="flex-1 h-12 flex items-center justify-center rounded-xl bg-surface-hover hover:bg-border text-text-main font-semibold transition-colors border-none cursor-pointer">
                                    Cancel
                                </button>
                                <button type="submit" className="flex-1 h-12 flex items-center justify-center bg-accent-primary text-white font-bold rounded-xl shadow-[0_4px_20px_rgba(5,150,105,0.15)] hover:shadow-[0_6px_25px_rgba(5,150,105,0.25)] transition-all border-none cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed" disabled={loading}>
                                    {loading ? 'Saving...' : 'Save Menu Item'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>

            {isCropping && cropSource && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100000 }}>
                    <ImageCropper
                        image={cropSource}
                        onCropComplete={handleCropComplete}
                        onCancel={handleCropCancel}
                        aspect={1}
                    />
                </div>
            )}
        </>,
        document.body
    )
}
