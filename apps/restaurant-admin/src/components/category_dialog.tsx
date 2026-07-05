import React, { useState, useEffect, useRef } from 'react';
import { X, Trash2, Upload, Image } from 'lucide-react';
import type { MenuCategory } from '@restaurant-saas/types';
interface CategoryDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (category: Partial<MenuCategory> & { image_url?: string | null }) => void;
    onDelete?: (categoryId: string) => void;
    category?: MenuCategory | null;
    mode: 'add' | 'edit';
}

const CategoryDialog: React.FC<CategoryDialogProps> = ({
    isOpen,
    onClose,
    onSave,
    onDelete,
    category,
    mode
}) => {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        sort_order: 0,
        active: true,
        image_url: '' as string | null
    });
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (mode === 'edit' && category) {
            setFormData({
                name: category.name,
                description: category.description ?? '',
                sort_order: category.order ?? 0,
                active: category.active ?? true,
                image_url: (category as any).image_url ?? null
            });
            setImagePreview((category as any).image_url ?? null);
        } else if (mode === 'add' && !category) {
            setFormData({ name: '', description: '', sort_order: 0, active: true, image_url: null });
            setImagePreview(null);
        }
    }, [mode, category]);

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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            id: category?.id,
            name: formData.name,
            description: formData.description || null,
            order: formData.sort_order,
            active: formData.active,
            image_url: formData.image_url || null
        });
        if (mode === 'add') {
            setFormData({ name: '', description: '', sort_order: 0, active: true, image_url: null });
            setImagePreview(null);
        }
        onClose();
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox'
                ? (e.target as HTMLInputElement).checked
                : type === 'number'
                    ? parseInt(value) || 0
                    : value
        }));
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex justify-end z-[1000] animate-in fade-in duration-200" onClick={onClose}>
            <div className="bg-tk-bg-card p-6 md:p-8 w-full max-w-[500px] h-full overflow-y-auto shadow-2xl text-tk-text animate-in slide-in-from-right duration-300 border-l border-tk-border" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-semibold text-tk-text m-0">
                        {mode === 'add' ? 'Add New Category' : 'Edit Category'}
                    </h2>
                    <button className="bg-transparent border-none cursor-pointer p-2 rounded-lg flex items-center justify-center text-tk-text-secondary transition-all duration-200 hover:bg-tk-bg-hover hover:text-tk-text" onClick={onClose} type="button">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                    {/* Category Name */}
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-tk-text-secondary">Category Name *</label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className="p-3 px-4 border-2 border-tk-border rounded-xl bg-tk-bg-elevated text-sm text-tk-text font-sans transition-all duration-200 w-full box-border focus:outline-none focus:border-green-400 focus:shadow-[0_0_0_3px_rgba(104,211,145,0.1)] placeholder:text-tk-text-muted"
                            placeholder="e.g. Starters"
                            required
                        />
                    </div>

                    {/* Description */}
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-tk-text-secondary">Description (Optional)</label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            className="p-3 px-4 border-2 border-tk-border rounded-xl bg-tk-bg-elevated text-sm text-tk-text font-sans transition-all duration-200 w-full box-border focus:outline-none focus:border-green-400 focus:shadow-[0_0_0_3px_rgba(104,211,145,0.1)] placeholder:text-tk-text-muted resize-y min-h-[72px]"
                            placeholder="Brief description of this category"
                            rows={2}
                        />
                    </div>

                    {/* Image Upload */}
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-tk-text-secondary">Category Image (Optional)</label>
                        <div
                            className="border-2 border-dashed border-tk-border rounded-xl cursor-pointer overflow-hidden transition-colors duration-200 min-h-[120px] flex items-center justify-center hover:border-green-400 hover:bg-green-50 dark:hover:bg-tk-bg-hover"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            {imagePreview ? (
                                <div className="relative w-full h-[140px] group">
                                    <img src={imagePreview} alt="preview" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/40 text-white flex flex-col items-center justify-center gap-2 opacity-0 transition-opacity duration-200 text-sm group-hover:opacity-100">
                                        <Upload size={20} />
                                        <span>Change Image</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-2 p-6 text-tk-text-muted text-sm">
                                    <Image size={32} className="text-tk-text-muted" />
                                    <span>Click to upload image</span>
                                    <small className="text-[11px]">PNG, JPG up to 2MB</small>
                                </div>
                            )}
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={handleImageFile}
                        />
                    </div>

                    {/* Sort Order */}
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-tk-text-secondary">Sort Order</label>
                        <input
                            type="number"
                            name="sort_order"
                            value={formData.sort_order}
                            onChange={handleChange}
                            className="p-3 px-4 border-2 border-tk-border rounded-xl bg-tk-bg-elevated text-sm text-tk-text font-sans transition-all duration-200 w-full box-border focus:outline-none focus:border-green-400 focus:shadow-[0_0_0_3px_rgba(104,211,145,0.1)] placeholder:text-tk-text-muted"
                            min="0"
                            placeholder="0"
                        />
                        <small className="text-tk-text-secondary text-xs mt-0.5 block">Lower numbers appear first in the menu.</small>
                    </div>

                    {/* Active Toggle */}
                    <div className="flex flex-col gap-2">
                        <div className="flex justify-between items-center bg-tk-bg-elevated rounded-xl py-3.5 px-4 border border-tk-border">
                            <div>
                                <div className="text-sm font-semibold text-tk-text">Active</div>
                                <div className="text-xs text-tk-text-secondary mt-0.5">Make this category visible on the menu</div>
                            </div>
                            <label className="relative inline-block w-[44px] h-[24px] shrink-0">
                                <input
                                    type="checkbox"
                                    name="active"
                                    checked={formData.active}
                                    onChange={handleChange}
                                    className="peer opacity-0 w-0 h-0"
                                />
                                <span className="absolute cursor-pointer inset-0 bg-slate-300 rounded-full transition-all duration-300 peer-checked:bg-[#37724e] before:absolute before:content-[''] before:h-[18px] before:w-[18px] before:left-[3px] before:bottom-[3px] before:bg-white before:rounded-full before:transition-all before:duration-300 before:shadow-[0_1px_3px_rgba(0,0,0,0.2)] peer-checked:before:translate-x-[20px]"></span>
                            </label>
                        </div>
                    </div>

                    <div className="flex gap-3 mt-3">
                        {mode === 'edit' && onDelete && (
                            <div className="flex-1">
                                <button
                                    type="button"
                                    className="w-full py-3 px-5 border border-red-400 bg-transparent text-red-500 rounded-xl text-sm font-medium cursor-pointer transition-all duration-200 flex items-center justify-center gap-2 hover:bg-red-50 dark:hover:bg-red-900/20"
                                    onClick={() => {
                                        if (window.confirm('Delete this category? Menu items assigned to it will lose their category.')) {
                                            onDelete(category!.id);
                                        }
                                    }}
                                >
                                    <Trash2 size={16} />
                                    Delete
                                </button>
                            </div>
                        )}
                        <button type="button" className="flex-1 py-3 px-5 border-none rounded-xl text-sm font-medium cursor-pointer transition-all duration-200 flex items-center justify-center bg-tk-bg-elevated text-tk-text-secondary hover:bg-tk-bg-hover hover:text-tk-text" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="flex-1 py-3 px-5 border-none rounded-xl text-sm font-medium cursor-pointer transition-all duration-200 flex items-center justify-center bg-[#37724e] text-white hover:bg-[#4f755c] hover:-translate-y-[2px]">
                            {mode === 'add' ? 'Add Category' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CategoryDialog;
