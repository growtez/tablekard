import React, { useState, useEffect, useRef } from 'react';
import { X, Trash2, Upload, Image } from 'lucide-react';
import type { MenuCategory } from '@restaurant-saas/types';
import './category_dialog.css';

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
        } else {
            setFormData({ name: '', description: '', sort_order: 0, active: true, image_url: null });
            setImagePreview(null);
        }
    }, [mode, category, isOpen]);

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
        <div className="category-dialog-overlay" onClick={onClose}>
            <div className="category-dialog-container" onClick={(e) => e.stopPropagation()}>
                <div className="category-dialog-header">
                    <h2 className="category-dialog-title">
                        {mode === 'add' ? 'Add New Category' : 'Edit Category'}
                    </h2>
                    <button className="category-dialog-close" onClick={onClose} type="button">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="category-dialog-form">
                    {/* Category Name */}
                    <div className="category-form-group">
                        <label className="category-form-label">Category Name *</label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className="category-form-input"
                            placeholder="e.g. Starters"
                            required
                        />
                    </div>

                    {/* Description */}
                    <div className="category-form-group">
                        <label className="category-form-label">Description (Optional)</label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            className="category-form-input category-form-textarea"
                            placeholder="Brief description of this category"
                            rows={2}
                        />
                    </div>

                    {/* Image Upload */}
                    <div className="category-form-group">
                        <label className="category-form-label">Category Image (Optional)</label>
                        <div
                            className="category-image-upload-area"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            {imagePreview ? (
                                <div className="category-image-preview-wrap">
                                    <img src={imagePreview} alt="preview" className="category-image-preview" />
                                    <div className="category-image-overlay">
                                        <Upload size={20} />
                                        <span>Change Image</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="category-image-placeholder">
                                    <Image size={32} color="#A0AEC0" />
                                    <span>Click to upload image</span>
                                    <small>PNG, JPG up to 2MB</small>
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
                    <div className="category-form-group">
                        <label className="category-form-label">Sort Order</label>
                        <input
                            type="number"
                            name="sort_order"
                            value={formData.sort_order}
                            onChange={handleChange}
                            className="category-form-input"
                            min="0"
                            placeholder="0"
                        />
                        <small className="category-form-hint">Lower numbers appear first in the menu.</small>
                    </div>

                    {/* Active Toggle */}
                    <div className="category-form-group">
                        <div className="category-toggle-row">
                            <div>
                                <div className="category-toggle-label">Active</div>
                                <div className="category-toggle-desc">Make this category visible on the menu</div>
                            </div>
                            <label className="category-toggle-switch">
                                <input
                                    type="checkbox"
                                    name="active"
                                    checked={formData.active}
                                    onChange={handleChange}
                                />
                                <span className="category-toggle-slider"></span>
                            </label>
                        </div>
                    </div>

                    <div className="category-dialog-actions">
                        {mode === 'edit' && onDelete && (
                            <div className="dialog-actions-left" style={{ flexGrow: 1 }}>
                                <button
                                    type="button"
                                    className="category-btn-delete"
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
                        <button type="button" className="category-btn-cancel" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="category-btn-save">
                            {mode === 'add' ? 'Add Category' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CategoryDialog;
