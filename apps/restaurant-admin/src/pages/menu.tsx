import React, { useState, useEffect, useCallback } from 'react';
import { Search, Bell, Plus, Edit3, Trash2, Layers } from 'lucide-react';
import Sidebar from '../components/sidebar';
import MenuDialog from '../components/menu_dialog';
import CategoryDialog from '../components/category_dialog';
import OfferDialog from '../components/offer_dialog';
import { useAuth } from '../context/AuthContext';
import {
  getMenuItems,
  getMenuCategories,
  addMenuItem,
  updateMenuItem,
  deleteMenuItem,
  toggleMenuItemAvailability,
  addMenuCategory,
  updateMenuCategory,
  deleteMenuCategory
} from '../services/supabaseService';
import { useTabVisibilityRefetch } from '../hooks/useTabVisibilityRefetch';
import type { MenuItem, MenuCategory } from '@restaurant-saas/types';
import './menu.css';

const Menu: React.FC = () => {
  const { activeRestaurantId } = useAuth();

  const [activeTab, setActiveTab] = useState('menu-items');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true); // first-time flag

  // Offers (mock data for now)
  const [offers, setOffers] = useState([
    {
      id: 1,
      title: 'Flat 20% Off',
      description: 'On all Main Course items',
      dishName: 'All Main Course',
      originalPrice: 420,
      discountedPrice: 336,
      isActive: true,
      validUntil: '2025-10-15'
    },
    {
      id: 2,
      title: 'Buy 1 Get 1 Free',
      description: 'On Gulab Jamun',
      dishName: 'Gulab Jamun',
      originalPrice: 120,
      discountedPrice: 120,
      isActive: true,
      validUntil: '2025-10-10'
    },
    {
      id: 3,
      title: 'Weekend Special',
      description: '15% off on Biryani',
      dishName: 'Biryani',
      originalPrice: 380,
      discountedPrice: 323,
      isActive: false,
      validUntil: '2025-10-08'
    }
  ]);

  const [menuDialogOpen, setMenuDialogOpen] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [offerDialogOpen, setOfferDialogOpen] = useState(false);

  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItem | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<MenuCategory | null>(null);
  const [selectedOffer, setSelectedOffer] = useState<any>(null);
  const [dialogMode, setDialogMode] = useState<'add' | 'edit'>('add');

  const fetchMenuData = useCallback(async () => {
    if (!activeRestaurantId) return;
    // only show full‑page loading on first request
    if (initialLoad) setLoading(true);
    try {
      const [fetchedCategories, fetchedItems] = await Promise.all([
        getMenuCategories(activeRestaurantId),
        getMenuItems(activeRestaurantId)
      ]);
      setCategories(fetchedCategories);
      setMenuItems(fetchedItems);
    } catch (err) {
      console.error('Failed to fetch menu data:', err);
      alert('Failed to load menu data. Please try again.');
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  }, [activeRestaurantId, initialLoad]);

  const { refetch: refetchMenu, refetching } = useTabVisibilityRefetch(fetchMenuData, {
    enabled: !!activeRestaurantId,
    autoRefreshInterval: 30000,
    refetchOnMount: true,
  });

  useEffect(() => {
    if (activeRestaurantId) {
      refetchMenu(true);
    }
  }, [activeRestaurantId, refetchMenu]);

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
      setMenuItems(items => items.map(i => i.id === item.id ? { ...i, available: !i.available } : i));
      await toggleMenuItemAvailability(item.id, !item.available);
    } catch (err) {
      console.error(err);
      setMenuItems(items => items.map(i => i.id === item.id ? { ...i, available: item.available } : i));
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
      if (dialogMode === 'add') {
        const newItem = await addMenuItem(activeRestaurantId, {
          name: itemData.name,
          price: itemData.price,
          category_id: itemData.categoryId,
          description: itemData.description,
          image_url: itemData.image,
          is_available: itemData.available,
          is_veg: itemData.isVeg
        });
        setMenuItems([...menuItems, newItem]);
      } else {
        await updateMenuItem(itemData.id, {
          name: itemData.name,
          price: itemData.price,
          category_id: itemData.categoryId,
          description: itemData.description,
          image_url: itemData.image,
          is_available: itemData.available,
          is_veg: itemData.isVeg
        });
        setMenuItems(items => items.map(i => i.id === itemData.id ? ({ ...i, ...itemData }) : i));
      }
    } catch (err) {
      console.error(err);
      alert('Failed to save menu item');
    }
  };

  const handleDeleteMenuItem = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this menu item?')) return;
    try {
      await deleteMenuItem(id);
      setMenuItems(items => items.filter(i => i.id !== id));
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
        const newCat = await addMenuCategory(activeRestaurantId, {
          name: catData.name!,
          description: catData.description || undefined,
          sort_order: catData.order,
          active: catData.active
        });
        setCategories([...categories, newCat].sort((a, b) => a.order - b.order));
      } else {
        await updateMenuCategory(catData.id!, {
          name: catData.name,
          description: catData.description || null,
          sort_order: catData.order,
          active: catData.active
        });
        setCategories(cats => cats.map(c => c.id === catData.id ? { ...c, ...catData } as MenuCategory : c).sort((a, b) => a.order - b.order));
      }
    } catch (err) {
      console.error(err);
      alert('Failed to save category');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      await deleteMenuCategory(id);
      setCategories(cats => cats.filter(c => c.id !== id));
      if (selectedCategoryId === id) setSelectedCategoryId('all');
    } catch (err) {
      console.error(err);
      alert('Failed to delete category');
    }
  };


  // --- OFFER HANDLERS ---
  const toggleOffer = (id: number) => {
    setOffers(offs => offs.map(off => off.id === id ? { ...off, isActive: !off.isActive } : off));
  };
  const handleAddOffer = () => { setDialogMode('add'); setSelectedOffer(null); setOfferDialogOpen(true); };
  const handleEditOffer = (offer: any) => { setDialogMode('edit'); setSelectedOffer(offer); setOfferDialogOpen(true); };
  const handleSaveOffer = (offer: any) => {
    if (dialogMode === 'add') {
      const newOffer = { ...offer, id: Math.max(...offers.map(o => o.id), 0) + 1 };
      setOffers([...offers, newOffer]);
    } else {
      setOffers(offs => offs.map(o => o.id === offer.id ? offer : o));
    }
  };
  const handleDeleteOffer = (id: number) => {
    if (window.confirm('Delete this offer?')) {
      setOffers(offers.filter(offer => offer.id !== id));
    }
  };

  // --- STATS ---
  const activeItems = menuItems.filter(item => item.available).length;
  const outOfStockItems = menuItems.filter(item => !item.available).length;
  // TODO: Fetch real top selling when analytics are active.
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
            <div className="stats-number">{loading && !refetching ? '...' : activeItems}</div>
            <div className="stats-subtitle">Currently available</div>
          </div>

          <div className="stats-card">
            <div className="card-top-bar card-top-bar-red"></div>
            <h3 className="card-title">Out of Stock Items</h3>
            <div className="stats-number">{loading && !refetching ? '...' : outOfStockItems}</div>
            <div className="stats-subtitle">Need restocking</div>
          </div>

          <div className="stats-card">
            <div className="card-top-bar card-top-bar-blue"></div>
            <h3 className="card-title">Top Selling Items (This Week)</h3>
            <div className="top-selling-item">
              <span className="top-selling-name">{loading && !refetching ? '...' : topSellingItem}</span>
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

            {loading && !refetching ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#718096' }}>Loading menu...</div>
            ) : filteredMenuItems.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#718096' }}>No menu items found. Add one to get started!</div>
            ) : (
              <div className="menu-grid">
                {filteredMenuItems.map((item) => (
                  <div key={item.id} className="menu-card">
                    <div className="menu-image">{item.image ?? '🍽️'}</div>
                    <div className="menu-info">
                      <h3 className="menu-name">
                        <span style={{ fontSize: '12px', marginRight: '6px' }}>
                          {item.isVeg ? '🟩' : '🟥'}
                        </span>
                        {item.name}
                      </h3>
                      <p className="menu-category">{getCategoryName(item.categoryId)}</p>
                      <div className="menu-price">₹{item.price}</div>
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

            <div className="offers-grid">
              {offers.map((offer) => (
                <div key={offer.id} className="offer-card">
                  <div className="offer-header">
                    <h3 className="offer-title">{offer.title}</h3>
                    <span className={`offer-status ${offer.isActive ? 'active' : 'inactive'}`}>
                      {offer.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="offer-description">{offer.description}</p>
                  <div className="offer-details">
                    <div className="offer-dish">{offer.dishName}</div>
                    <div className="offer-pricing">
                      <span className="original-price">₹{offer.originalPrice}</span>
                      <span className="discounted-price">₹{offer.discountedPrice}</span>
                    </div>
                  </div>
                  <div className="offer-validity">Valid until: {offer.validUntil}</div>
                  <div className="offer-actions">
                    <div className="offer-toggle">
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={offer.isActive}
                          onChange={() => toggleOffer(offer.id)}
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
              ))}
            </div>
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
        offer={selectedOffer}
        mode={dialogMode}
      />
    </div>
  );
};

export default Menu;