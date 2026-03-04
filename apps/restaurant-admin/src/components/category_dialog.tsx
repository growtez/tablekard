import React, { useState, useEffect } from 'react';
import { X, Trash2 } from 'lucide-react';
import type { MenuCategory } from '@restaurant-saas/types';
import './category_dialog.css';

interface CategoryDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (category: Partial<MenuCategory>) => void;
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
        active: true
    });

    useEffect(() => {
        if (mode === 'edit' && category) {
            setFormData({
                name: category.name,
                description: category.description ?? '',
                sort_order: category.order ?? 0,
                active: category.active ?? true
            });
        } else {
            setFormData({
                name: '',
                description: '',
                sort_order: 0,
                active: true
            });
        }
    }, [mode, category, isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            id: category?.id,
            name: formData.name,
            description: formData.description || null,
            order: formData.sort_order,
            active: formData.active
        });
        onClose();
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : (type === 'number' ? parseInt(value) || 0 : value)
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
                    <div className="category-form-group">
                        <label className="category-form-label">Category Name</label>
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

                    <div className="category-form-group">
                        <label className="category-form-label">Description (Optional)</label>
                        <input
                            type="text"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            className="category-form-input"
                            placeholder="Brief description of the category"
                        />
                    </div>

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
                        <small style={{ color: '#718096', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                            Lower numbers appear first in the menu.
                        </small>
                    </div>

                    <div className="category-form-group">
                        <label className="category-form-checkbox-label">
                            <input
                                type="checkbox"
                                name="active"
                                checked={formData.active}
                                onChange={handleChange}
                                className="category-form-checkbox"
                            />
                            <span>Active (Visible on Menu)</span>
                        </label>
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
