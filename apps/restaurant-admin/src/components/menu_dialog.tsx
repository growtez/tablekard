import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { MenuCategory, MenuItem } from '@restaurant-saas/types';
import './menu_dialog.css';

interface MenuDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: any) => void;
  item?: MenuItem | null;
  categories: MenuCategory[];
  mode: 'add' | 'edit';
}

const MenuDialog: React.FC<MenuDialogProps> = ({ isOpen, onClose, onSave, item, categories, mode }) => {
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    image: '🍽️',
    categoryId: categories.length > 0 ? categories[0].id : '',
    description: '',
    available: true,
    isVeg: true
  });

  useEffect(() => {
    if (mode === 'edit' && item) {
      setFormData({
        name: item.name,
        price: item.price.toString(),
        image: item.image ?? '🍽️',
        categoryId: item.categoryId,
        description: item.description ?? '',
        available: item.available,
        isVeg: item.isVeg
      });
    } else {
      setFormData({
        name: '',
        price: '',
        image: '🍽️',
        categoryId: categories.length > 0 ? categories[0].id : '',
        description: '',
        available: true,
        isVeg: true
      });
    }
  }, [mode, item, isOpen, categories]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.categoryId) {
      alert("Please select a valid category or create one first.");
      return;
    }
    onSave({
      ...(item || {}),
      name: formData.name,
      price: parseFloat(formData.price),
      image: formData.image,
      categoryId: formData.categoryId,
      description: formData.description || null,
      available: formData.available,
      isVeg: formData.isVeg
    });
    onClose();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  if (!isOpen) return null;

  const emojis = ['🍽️', '🍗', '🧀', '🥘', '🍚', '🍮', '🫓', '🍕', '🍔', '🍟', '🌮', '🍜', '🍱', '🥗', '🍖', '🥩'];

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
          <div className="menu-form-group">
            <label className="menu-form-label">Item Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="menu-form-input"
              placeholder="Enter item name"
              required
            />
          </div>

          <div className="menu-form-group">
            <label className="menu-form-label">Category</label>
            <select
              name="categoryId"
              value={formData.categoryId}
              onChange={handleChange}
              className="menu-form-select"
              required
            >
              <option value="" disabled>Select a category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div className="menu-form-group">
            <label className="menu-form-label">Description</label>
            <input
              type="text"
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="menu-form-input"
              placeholder="Enter item description"
              required
            />
          </div>

          <div className="menu-form-group">
            <label className="menu-form-label">Price (₹)</label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              className="menu-form-input"
              placeholder="Enter price"
              min="0"
              step="0.01"
              required
            />
          </div>

          <div className="menu-form-group">
            <label className="menu-form-label">Icon</label>
            <div className="menu-emoji-grid">
              {emojis.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  className={`menu-emoji-button ${formData.image === emoji ? 'selected' : ''}`}
                  onClick={() => setFormData(prev => ({ ...prev, image: emoji }))}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div className="menu-form-group" style={{ display: 'flex', gap: '24px', flexDirection: 'row' }}>
            <label className="menu-form-checkbox-label">
              <input
                type="checkbox"
                name="available"
                checked={formData.available}
                onChange={handleChange}
                className="menu-form-checkbox"
              />
              <span>Available</span>
            </label>
            <label className="menu-form-checkbox-label">
              <input
                type="checkbox"
                name="isVeg"
                checked={formData.isVeg}
                onChange={handleChange}
                className="menu-form-checkbox"
              />
              <span style={{ color: formData.isVeg ? '#38A169' : '#E53E3E', fontWeight: 'bold' }}>
                {formData.isVeg ? '🟩 Veg' : '🟥 Non-Veg'}
              </span>
            </label>
          </div>

          <div className="menu-dialog-actions">
            <button type="button" className="menu-btn-cancel" onClick={onClose}>
              Cancel
            </button>
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