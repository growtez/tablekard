import React, { useState } from 'react';
import { Search, Bell, Plus, Edit3, Trash2, Layers } from 'lucide-react';
import Sidebar from '../components/sidebar';
import MenuDialog from '../components/menu_dialog';
import CategoryDialog from '../components/category_dialog';
import OfferDialog from '../components/offer_dialog';
// import type { OfferRecord } from '../components/offer_dialog';
import type { OfferFormData } from '../components/offer_dialog';
import { useAuth } from '../context/AuthContext';
import {
  addMenuItem,
  updateMenuItem,
  deleteMenuItem,
  toggleMenuItemAvailability,
  addMenuCategory,
  updateMenuCategory,
  deleteMenuCategory,
  addOffer,
  updateOffer,
  deleteOffer,
  toggleOfferActive,
} from '../services/supabaseService';
import type { OfferRow } from '../services/supabaseService';
import { useMenuItems, useMenuCategories, useOffers, useInvalidateQueries } from '../hooks/useSupabaseQuery';
import type { MenuItem, MenuCategory } from '@restaurant-saas/types';
import './menu.css';

const Menu: React.FC = () => {
  const { activeRestaurantId, activeRestaurantName } = useAuth();

  const [activeTab, setActiveTab] = useState('menu-items');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');

  // React Query: cached, auto-retries, refetches on tab focus
  const { data: menuItems = [], isLoading: loadingItems } = useMenuItems(activeRestaurantId);
  const { data: categories = [], isLoading: loadingCategories } = useMenuCategories(activeRestaurantId);
  const { data: offers = [], isLoading: loadingOffers } = useOffers(activeRestaurantId);
  const loading = loadingItems || loadingCategories;
  const { invalidateMenu, invalidateOffers } = useInvalidateQueries();

  const [menuDialogOpen, setMenuDialogOpen] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [offerDialogOpen, setOfferDialogOpen] = useState(false);

  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItem | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<MenuCategory | null>(null);
  const [selectedOffer, setSelectedOffer] = useState<OfferRow | null>(null);
  const [dialogMode, setDialogMode] = useState<'add' | 'edit'>('add');

  const filteredMenuItems = selectedCategoryId === 'all'
    ? menuItems
    : menuItems.filter(item => item.categoryId === selectedCategoryId);

  const getCategoryName = (catId: string) => {
    const cat = categories.find(c => c.id === catId);
    return cat ? cat.name : 'Unknown';
  };

  // --- ITEM HANDLERS ---
  const toggleStock = async (item: MenuItem) => {
    try {
      await toggleMenuItemAvailability(item.id, !item.available);
      if (activeRestaurantId) invalidateMenu(activeRestaurantId);
    } catch (err) {
      console.error(err);
      alert('Failed to update availability');
    }
  };

  const handleAddMenuItem = () => {
    setDialogMode('add');
    setSelectedMenuItem(null);
    setMenuDialogOpen(true);
  };

  const handleEditMenuItem = (item: MenuItem) => {
    setDialogMode('edit');
    setSelectedMenuItem(item);
    setMenuDialogOpen(true);
  };

  const handleSaveMenuItem = async (itemData: any) => {
    if (!activeRestaurantId) return;
    try {
      // 1. Process images (Upload new ones)
      const processedImages = [];
      if (itemData.images && itemData.images.length > 0) {
        for (const img of itemData.images) {
           if (img.isDeleted) {
               processedImages.push(img); // Pass it down to update logic to delete
               if (img.url) {
                 const { deleteMenuItemImageFromStorage } = await import('../services/storageService');
                 await deleteMenuItemImageFromStorage(img.url).catch(console.error);
               }
           } else if (img.file) {
               // Upload new file
               const { uploadMenuItemImage } = await import('../services/storageService');
               const url = await uploadMenuItemImage(activeRestaurantId, activeRestaurantName, img.file);
               processedImages.push({ url, sortOrder: img.sortOrder });
           } else {
               // Existing image
               processedImages.push({ id: img.id, url: img.url, sortOrder: img.sortOrder });
           }
        }
      }

      const activeImages = processedImages.filter(img => !img.isDeleted);

      // 2. Process AR model upload
      let modelUrl: string | null | undefined = undefined; // undefined = no change
      if (itemData.arModelFile) {
        // New file uploaded — delete old one first if it exists
        if (itemData.existingModelUrl) {
          const { deleteARModel } = await import('../services/storageService');
          await deleteARModel(itemData.existingModelUrl).catch(console.error);
        }
        const { uploadARModel } = await import('../services/storageService');
        modelUrl = await uploadARModel(activeRestaurantId, itemData.arModelFile);
      } else if (itemData.removeModel) {
        // Explicit removal
        if (itemData.existingModelUrl) {
          const { deleteARModel } = await import('../services/storageService');
          await deleteARModel(itemData.existingModelUrl).catch(console.error);
        }
        modelUrl = null;
      }

      if (dialogMode === 'add') {
        await addMenuItem(activeRestaurantId, {
          name: itemData.name,
          price: itemData.price,
          category_id: itemData.categoryId,
          short_description: itemData.short_description,
          long_description: itemData.long_description,
          discount_price: itemData.discount_price,
          is_available: itemData.is_available,
          is_veg: itemData.is_veg,
          preparation_time: itemData.preparation_time,
          serves: itemData.serves,
          tags: itemData.tags,
          variants: itemData.variants,
          addons: itemData.addons,
          model_url: modelUrl ?? null,
          menu_item_images: activeImages
        });
      } else {
        const updatePayload: any = {
          name: itemData.name,
          price: itemData.price,
          category_id: itemData.categoryId,
          short_description: itemData.short_description,
          long_description: itemData.long_description,
          discount_price: itemData.discount_price,
          is_available: itemData.is_available,
          is_veg: itemData.is_veg,
          preparation_time: itemData.preparation_time,
          serves: itemData.serves,
          tags: itemData.tags,
          variants: itemData.variants,
          addons: itemData.addons
        };
        if (modelUrl !== undefined) {
          updatePayload.model_url = modelUrl;
        }
        await updateMenuItem(itemData.id, updatePayload, processedImages);
      }
      invalidateMenu(activeRestaurantId);
    } catch (err) {
      console.error('Failed to save menu item', err);
      alert('Failed to save menu item');
    }
  };

  const handleDeleteMenuItem = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this menu item?')) return;
    try {
      const itemToDelete = menuItems.find(i => i.id === id);
      if (itemToDelete) {
        // Delete associated images from storage
        if (itemToDelete.images && itemToDelete.images.length > 0) {
          const { deleteMenuItemImageFromStorage } = await import('../services/storageService');
          for (const img of itemToDelete.images) {
            await deleteMenuItemImageFromStorage(img.url).catch(console.error);
          }
        }
        // Delete associated AR model from storage
        if (itemToDelete.modelUrl) {
          const { deleteARModel } = await import('../services/storageService');
          await deleteARModel(itemToDelete.modelUrl).catch(console.error);
        }
      }

      await deleteMenuItem(id);
      if (activeRestaurantId) invalidateMenu(activeRestaurantId);
    } catch (err) {
      console.error(err);
      alert('Failed to delete menu item');
    }
  };

  // --- CATEGORY HANDLERS ---
  const handleAddCategory = () => {
    setDialogMode('add');
    setSelectedCategory(null);
    setCategoryDialogOpen(true);
  };

  const handleEditCategory = (category: MenuCategory) => {
    setDialogMode('edit');
    setSelectedCategory(category);
    setCategoryDialogOpen(true);
  };

  const handleSaveCategory = async (catData: Partial<MenuCategory>) => {
    if (!activeRestaurantId) return;
    try {
      if (dialogMode === 'add') {
        await addMenuCategory(activeRestaurantId, {
          name: catData.name!,
          description: catData.description || undefined,
          sort_order: catData.order,
          active: catData.active
        });
      } else {
        await updateMenuCategory(catData.id!, {
          name: catData.name,
          description: catData.description || null,
          sort_order: catData.order,
          active: catData.active
        });
      }
      invalidateMenu(activeRestaurantId);
    } catch (err) {
      console.error(err);
      alert('Failed to save category');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      await deleteMenuCategory(id);
      if (activeRestaurantId) invalidateMenu(activeRestaurantId);
      if (selectedCategoryId === id) setSelectedCategoryId('all');
    } catch (err) {
      console.error(err);
      alert('Failed to delete category');
    }
  };


  // --- OFFER HANDLERS ---
  const toggleOffer = async (offer: OfferRow) => {
    if (!activeRestaurantId) return;
    try {
      await toggleOfferActive(offer.id, !offer.is_active);
      invalidateOffers(activeRestaurantId);
    } catch (err) {
      console.error(err);
      alert('Failed to toggle offer status');
    }
  };

  const handleAddOffer = () => { setDialogMode('add'); setSelectedOffer(null); setOfferDialogOpen(true); };
  const handleEditOffer = (offer: OfferRow) => { setDialogMode('edit'); setSelectedOffer(offer); setOfferDialogOpen(true); };

  const handleSaveOffer = async (formData: OfferFormData) => {
    if (!activeRestaurantId) return;
    const payload = {
      menu_item_id: formData.menu_item_id,
      title: formData.title,
      discount_price: parseFloat(formData.discount_price),
      valid_until: formData.valid_until ? new Date(formData.valid_until).toISOString() : null,
      is_active: formData.is_active,
    };
    try {
      if (dialogMode === 'add') {
        await addOffer(activeRestaurantId, payload);
      } else if (selectedOffer) {
        await updateOffer(selectedOffer.id, payload);
      }
      invalidateOffers(activeRestaurantId);
    } catch (err) {
      console.error(err);
      alert('Failed to save offer');
      throw err; // let dialog keep open
    }
  };

  const handleDeleteOffer = async (id: string) => {
    if (!window.confirm('Delete this offer?')) return;
    try {
      await deleteOffer(id);
      if (activeRestaurantId) invalidateOffers(activeRestaurantId);
    } catch (err) {
      console.error(err);
      alert('Failed to delete offer');
    }
  };

  // --- STATS ---
  const activeItems = menuItems.filter(item => item.available).length;
  const outOfStockItems = menuItems.filter(item => !item.available).length;
  const topSellingItem = menuItems.length > 0 ? menuItems[0].name : '-';

  return (
    <div className="menu-container">
      <Sidebar />

      <div className="main-content">
        {/* Header */}
        <div className="header">
          <h1 className="page-title">Menu Management</h1>
          <div className="header-right">
            <div className="search-bar">
              <Search size={18} color="#718096" />
              <input
                type="text"
                placeholder="Search menu items..."
                className="search-input"
              />
            </div>
            <div className="icon-button">
              <Bell size={20} color="#718096" />
            </div>
            <div className="user-avatar">👨‍💼</div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stats-card">
            <div className="card-top-bar card-top-bar-green"></div>
            <h3 className="card-title">Active Menu Items</h3>
            <div className="stats-number">{loading ? '...' : activeItems}</div>
            <div className="stats-subtitle">Currently available</div>
          </div>

          <div className="stats-card">
            <div className="card-top-bar card-top-bar-red"></div>
            <h3 className="card-title">Out of Stock Items</h3>
            <div className="stats-number">{loading ? '...' : outOfStockItems}</div>
            <div className="stats-subtitle">Need restocking</div>
          </div>

          <div className="stats-card">
            <div className="card-top-bar card-top-bar-blue"></div>
            <h3 className="card-title">Top Selling Items (This Week)</h3>
            <div className="top-selling-item">
              <span className="top-selling-name">{loading ? '...' : topSellingItem}</span>
            </div>
            <div className="stats-subtitle">Calculated dynamically</div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="tab-navigation">
          <button
            className={`tab-button ${activeTab === 'menu-items' ? 'active' : ''}`}
            onClick={() => setActiveTab('menu-items')}
          >
            Menu Items
          </button>
          <button
            className={`tab-button ${activeTab === 'offers' ? 'active' : ''}`}
            onClick={() => setActiveTab('offers')}
          >
            Offers
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'menu-items' && (
          <div className="tab-content">
            <div className="content-header">
              <h2 className="content-title">Menu Items & Categories</h2>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button className="add-button" onClick={handleAddCategory} style={{ backgroundColor: '#E2E8F0', color: '#1A202C' }}>
                  <Layers size={16} />
                  New Category
                </button>
                <button className="add-button" onClick={handleAddMenuItem}>
                  <Plus size={16} />
                  Add New Item
                </button>
              </div>
            </div>

            {/* Category Filter */}
            <div className="category-filter" style={{ display: 'flex', alignItems: 'center', gap: '12px', overflowX: 'auto', paddingBottom: '8px' }}>
              <button
                className={`category-button ${selectedCategoryId === 'all' ? 'active' : ''}`}
                onClick={() => setSelectedCategoryId('all')}
              >
                All
              </button>
              {categories.map((category) => (
                <div key={category.id} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <button
                    className={`category-button ${selectedCategoryId === category.id ? 'active' : ''}`}
                    onClick={() => setSelectedCategoryId(category.id)}
                  >
                    {category.name}
                  </button>
                  {selectedCategoryId === category.id && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleEditCategory(category); }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#718096', padding: '4px' }}
                      title="Edit Category"
                    >
                      <Edit3 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {loading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#718096' }}>Loading menu...</div>
            ) : filteredMenuItems.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#718096' }}>No menu items found. Add one to get started!</div>
            ) : (
              <div className="menu-grid">
                {filteredMenuItems.map((item) => (
                  <div key={item.id} className="menu-card">
                    <div className="menu-image">
                       {(item.images && item.images.length > 0) ? (
                         <img src={item.images[0].url} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                       ) : '🍽️'}
                    </div>
                    <div className="menu-info">
                      <h3 className="menu-name">
                        <span style={{ fontSize: '12px', marginRight: '6px' }}>
                          {item.isVeg ? '🟩' : '🟥'}
                        </span>
                        {item.name}
                      </h3>
                      <p className="menu-category">{getCategoryName(item.categoryId)}</p>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div className="menu-price">₹{item.price}</div>
                        <div style={{ fontSize: '12px', color: '#718096' }}>👥 Serves {item.serves}</div>
                      </div>
                    </div>
                    <div className="menu-actions" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '12px' }}>
                      <div className="stock-toggle">
                        <label className="toggle-switch">
                          <input
                            type="checkbox"
                            checked={item.available}
                            onChange={() => toggleStock(item)}
                          />
                          <span className="toggle-slider"></span>
                        </label>
                        <span className={`stock-status ${item.available ? 'in-stock' : 'out-of-stock'}`}>
                          {item.available ? 'In Stock' : 'Out of Stock'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                        <button className="edit-button" style={{ flex: 1 }} onClick={() => handleEditMenuItem(item)}>
                          <Edit3 size={16} />
                          Edit
                        </button>
                        <button className="delete-button" style={{
                          flex: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          padding: '8px 12px',
                          border: '1px solid #FC8181',
                          borderRadius: '8px',
                          backgroundColor: 'transparent',
                          color: '#E53E3E',
                          cursor: 'pointer'
                        }} onClick={() => handleDeleteMenuItem(item.id)}>
                          <Trash2 size={16} />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'offers' && (
          <div className="tab-content">
            <div className="content-header">
              <h2 className="content-title">Offers & Promotions</h2>
              <button className="add-button" onClick={handleAddOffer}>
                <Plus size={16} />
                Add New Offer
              </button>
            </div>

            {loadingOffers ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#718096' }}>Loading offers...</div>
            ) : offers.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#718096' }}>No offers yet. Click "Add New Offer" to create one!</div>
            ) : (
            <div className="offers-grid">
              {offers.map((offer) => {
                const linkedItem = menuItems.find(m => m.id === offer.menu_item_id);
                const originalPrice = linkedItem?.price;
                return (
                <div key={offer.id} className="offer-card">
                  <div className="offer-header">
                    <h3 className="offer-title">{offer.title}</h3>
                    <span className={`offer-status ${offer.is_active ? 'active' : 'inactive'}`}>
                      {offer.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="offer-details">
                    <div className="offer-dish">
                      {linkedItem ? `${linkedItem.isVeg ? '🟩' : '🟥'} ${linkedItem.name}` : '—'}
                    </div>
                    <div className="offer-pricing">
                      {originalPrice !== undefined && (
                        <span className="original-price">₹{originalPrice}</span>
                      )}
                      <span className="discounted-price">₹{offer.discount_price}</span>
                    </div>
                  </div>
                  {offer.valid_until && (
                    <div className="offer-validity">Valid until: {new Date(offer.valid_until).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                  )}
                  <div className="offer-actions">
                    <div className="offer-toggle">
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={offer.is_active}
                          onChange={() => toggleOffer(offer)}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>
                    <button className="edit-button" onClick={() => handleEditOffer(offer)}>
                      <Edit3 size={16} />
                      Edit
                    </button>
                    <button className="delete-button" onClick={() => handleDeleteOffer(offer.id)}>
                      <Trash2 size={16} />
                      Delete
                    </button>
                  </div>
                </div>
                );
              })}
            </div>
            )}
          </div>
        )}
      </div>

      {/* Dialogs */}
      <MenuDialog
        isOpen={menuDialogOpen}
        onClose={() => setMenuDialogOpen(false)}
        onSave={handleSaveMenuItem}
        item={selectedMenuItem}
        categories={categories}
        mode={dialogMode}
      />

      <CategoryDialog
        isOpen={categoryDialogOpen}
        onClose={() => setCategoryDialogOpen(false)}
        onSave={handleSaveCategory}
        onDelete={dialogMode === 'edit' ? handleDeleteCategory : undefined}
        category={selectedCategory}
        mode={dialogMode}
      />

      <OfferDialog
        isOpen={offerDialogOpen}
        onClose={() => setOfferDialogOpen(false)}
        onSave={handleSaveOffer}
        offer={selectedOffer as any}
        mode={dialogMode}
        menuItems={menuItems}
      />
    </div>
  );
};

export default Menu;