import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, Edit3, Trash2, Layers, Loader2, TrendingUp, Package, AlertCircle } from 'lucide-react';
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


const Menu: React.FC = () => {
  const { activeRestaurantId, activeRestaurantName } = useAuth();

  const [activeTab, setActiveTab] = useState('menu-items');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

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

  const [visibleItemCount, setVisibleItemCount] = useState(20);
  const [visibleOfferCount, setVisibleOfferCount] = useState(20);
  const loadMoreItemsRef = useRef<HTMLDivElement>(null);
  const loadMoreOffersRef = useRef<HTMLDivElement>(null);

  // Reset item count on category change
  useEffect(() => {
    setVisibleItemCount(20);
  }, [selectedCategoryId]);

  useEffect(() => {
    if (!loadMoreItemsRef.current) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && visibleItemCount < filteredMenuItems.length) {
        setVisibleItemCount(prev => prev + 20);
      }
    }, { rootMargin: '200px' });
    observer.observe(loadMoreItemsRef.current);
    return () => observer.disconnect();
  }, [visibleItemCount, filteredMenuItems.length]);

  useEffect(() => {
    if (!loadMoreOffersRef.current) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && visibleOfferCount < offers.length) {
        setVisibleOfferCount(prev => prev + 20);
      }
    }, { rootMargin: '200px' });
    observer.observe(loadMoreOffersRef.current);
    return () => observer.disconnect();
  }, [visibleOfferCount, offers.length]);

  const getCategoryName = (catId: string) => {
    const cat = categories.find(c => c.id === catId);
    return cat ? cat.name : 'Unknown';
  };

  // --- ITEM HANDLERS ---
  const toggleStock = async (item: MenuItem) => {
    setIsSaving(true);
    try {
      await toggleMenuItemAvailability(item.id, !item.available);
      if (activeRestaurantId) invalidateMenu(activeRestaurantId);
      showToast('Availability updated', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to update availability', 'error');
    } finally {
      setIsSaving(false);
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
    setIsSaving(true);
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
      showToast(dialogMode === 'add' ? 'Menu item added successfully' : 'Menu item updated successfully', 'success');
    } catch (err) {
      console.error('Failed to save menu item', err);
      showToast('Failed to save menu item', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteMenuItem = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this menu item?')) return;
    setIsSaving(true);
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
      showToast('Menu item deleted successfully', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to delete menu item', 'error');
    } finally {
      setIsSaving(false);
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
    setIsSaving(true);
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
      showToast(dialogMode === 'add' ? 'Category added successfully' : 'Category updated successfully', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to save category', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    setIsSaving(true);
    try {
      await deleteMenuCategory(id);
      if (activeRestaurantId) invalidateMenu(activeRestaurantId);
      if (selectedCategoryId === id) setSelectedCategoryId('all');
      showToast('Category deleted successfully', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to delete category', 'error');
    } finally {
      setIsSaving(false);
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
    <>
      {/* Header - Tightened spacing */}
      <div className="flex justify-between items-center mb-4 max-md:flex-col max-md:items-start max-md:gap-3">
        <h1 className="text-[20px] sm:text-[22px] font-semibold text-tk-text max-md:ml-16">Menu Management</h1>
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="flex items-center gap-2 bg-tk-bg-surface px-4 py-1.5 rounded-full shadow-sm border border-tk-border w-full sm:w-[280px]">
            <Search size={16} className="text-tk-text-secondary" />
            <input
              type="text"
              placeholder="Search menu items..."
              className="border-none outline-none text-[14px] text-tk-text bg-transparent w-full placeholder:text-tk-text-muted h-[24px]"
            />
          </div>
        </div>
      </div>

      {/* Stats Cards - Matches Order page density */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-[850px] w-full pt-1 mb-5">
        <div className="bg-tk-bg-card p-3 sm:p-2.5 rounded-[10px] border-[1.5px] border-tk-border shadow-sm flex flex-col justify-between transition-all hover:shadow-md">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-[11px] sm:text-xs text-tk-text-secondary font-medium">Active Menu Items</h3>
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-tk-burgundy-bg flex items-center justify-center text-tk-burgundy">
              <Layers size={14} />
            </div>
          </div>
          <div className="flex justify-between items-end">
            <div className="text-[16px] sm:text-[20px] font-bold text-tk-text">{loading ? '...' : activeItems}</div>
            <div className="flex items-center text-[10px] sm:text-[11px] font-medium text-tk-text-secondary">
              <span>Currently available</span>
            </div>
          </div>
        </div>

        <div className="bg-tk-bg-card p-3 sm:p-2.5 rounded-[10px] border-[1.5px] border-tk-border shadow-sm flex flex-col justify-between transition-all hover:shadow-md">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-[11px] sm:text-xs text-tk-text-secondary font-medium">Out of Stock Items</h3>
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-tk-burgundy-bg flex items-center justify-center text-tk-burgundy">
              <AlertCircle size={14} />
            </div>
          </div>
          <div className="flex justify-between items-end">
            <div className="text-[16px] sm:text-[20px] font-bold text-tk-text">{loading ? '...' : outOfStockItems}</div>
            <div className="flex items-center text-[10px] sm:text-[11px] font-medium text-tk-text-secondary">
              <span>Need restocking</span>
            </div>
          </div>
        </div>

        <div className="bg-tk-bg-card p-3 sm:p-2.5 rounded-[10px] border-[1.5px] border-tk-border shadow-sm flex flex-col justify-between transition-all hover:shadow-md sm:col-span-1 col-span-2">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-[11px] sm:text-xs text-tk-text-secondary font-medium">Top Selling Items</h3>
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-tk-burgundy-bg flex items-center justify-center text-tk-burgundy">
              <TrendingUp size={14} />
            </div>
          </div>
          <div className="flex justify-between items-end">
            <div className="text-[14px] sm:text-[16px] font-bold text-tk-text truncate pr-2">{loading ? '...' : topSellingItem}</div>
            <div className="flex items-center text-[10px] sm:text-[11px] font-medium text-tk-text-secondary whitespace-nowrap">
              <span>This Week</span>
            </div>
          </div>
        </div>
      </div>

      <hr className="border-tk-border mb-4 transition-all duration-300" />

      {/* Tab Navigation - Tighter padding and margins */}
      <div className="flex gap-1 mb-4 bg-[#F7FAFC] dark:bg-tk-bg-elevated p-1 rounded-xl w-fit max-md:w-full max-md:justify-center">
        <button
          className={`px-4 py-2 border-none bg-transparent rounded-lg text-sm font-semibold text-tk-text-secondary cursor-pointer transition-all duration-200 hover:text-[#4A5568] hover:bg-white/60 dark:hover:text-tk-text font-['Outfit'] ${activeTab === 'menu-items' ? '!bg-tk-bg-card !text-tk-text shadow-sm' : ''}`}
          onClick={() => setActiveTab('menu-items')}
        >
          Menu Items
        </button>
        <button
          className={`px-4 py-2 border-none bg-transparent rounded-lg text-sm font-semibold text-tk-text-secondary cursor-pointer transition-all duration-200 hover:text-[#4A5568] hover:bg-white/60 dark:hover:text-tk-text font-['Outfit'] ${activeTab === 'offers' ? '!bg-tk-bg-card !text-tk-text shadow-sm' : ''}`}
          onClick={() => setActiveTab('offers')}
        >
          Offers
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'menu-items' && (
        <div className="animate-[fadeIn_0.2s_ease-in-out]">
          <div className="flex justify-between items-center mb-4 max-md:flex-col max-md:items-start max-md:gap-3">
            <h2 className="text-[16px] sm:text-[18px] font-semibold text-tk-text">Menu Items & Categories</h2>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {isSaving && (
                <div style={{ display: 'flex', alignItems: 'center', animation: 'spin 1s linear infinite' }}>
                  <Loader2 size={16} color="#718096" />
                </div>
              )}
              <button className="flex items-center gap-1.5 px-4 py-2 bg-[#E2E8F0] dark:bg-tk-bg-hover text-tk-text border-none rounded-lg text-[13px] sm:text-sm font-medium cursor-pointer transition-all duration-200 hover:bg-[#CBD5E0] dark:hover:bg-tk-border font-['Outfit']" onClick={handleAddCategory}>
                <Layers size={14} />
                New Category
              </button>
              <button className="flex items-center gap-1.5 px-4 py-2 bg-tk-burgundy text-white border-none rounded-lg text-[13px] sm:text-sm font-medium cursor-pointer transition-all duration-200 hover:bg-tk-burgundy/90 hover:-translate-y-[1px] font-['Outfit'] shadow-sm" onClick={handleAddMenuItem}>
                <Plus size={14} />
                Add New Item
              </button>
            </div>
          </div>

          {/* Category Filter - Slimmer buttons */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 mb-4 max-md:justify-center hide-scrollbar">
            <button
              className={`px-4 py-1.5 border border-[#E2E8F0] dark:border-tk-border bg-tk-bg-card rounded-lg text-[13px] font-medium text-tk-text-secondary cursor-pointer transition-all duration-200 hover:border-[#CBD5E0] hover:bg-[#F7FAFC] dark:hover:bg-tk-bg-hover dark:hover:border-tk-border dark:hover:text-tk-text font-['Outfit'] ${selectedCategoryId === 'all' ? '!bg-tk-burgundy !text-white !border-tk-burgundy' : ''}`}
              onClick={() => setSelectedCategoryId('all')}
            >
              All
            </button>
            {categories.map((category) => (
              <div key={category.id} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <button
                  className={`px-4 py-1.5 border border-[#E2E8F0] dark:border-tk-border bg-tk-bg-card rounded-lg text-[13px] font-medium text-tk-text-secondary cursor-pointer transition-all duration-200 hover:border-[#CBD5E0] hover:bg-[#F7FAFC] dark:hover:bg-tk-bg-hover dark:hover:border-tk-border dark:hover:text-tk-text font-['Outfit'] whitespace-nowrap ${selectedCategoryId === category.id ? '!bg-tk-burgundy !text-white !border-tk-burgundy' : ''}`}
                  onClick={() => setSelectedCategoryId(category.id)}
                >
                  {category.name}
                </button>
                {selectedCategoryId === category.id && (
                  <button
                    className="bg-transparent border-none cursor-pointer text-tk-text-secondary p-1 hover:text-tk-text"
                    onClick={(e) => { e.stopPropagation(); handleEditCategory(category); }}
                    title="Edit Category"
                  >
                    <Edit3 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>

          {loading ? (
            <div className="py-8 text-center text-tk-text-secondary text-sm">Loading menu...</div>
          ) : filteredMenuItems.length === 0 ? (
            <div className="py-8 text-center text-tk-text-secondary text-sm">No menu items found. Add one to get started!</div>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4 max-sm:grid-cols-1">
              {filteredMenuItems.slice(0, visibleItemCount).map((item) => (
                <div key={item.id} className="bg-tk-bg-card p-4 sm:p-5 rounded-[16px] shadow-sm border border-tk-border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-tk-burgundy/30">
                  <div className="w-16 h-16 rounded-xl bg-[#FFF5E6] flex items-center justify-center text-[28px] mb-3 shadow-sm overflow-hidden">
                    {(item.images && item.images.length > 0) ? (
                      <img src={item.images[0].url} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : '🍽️'}
                  </div>
                  <div className="mb-4">
                    <h3 className="text-[15px] sm:text-[16px] font-semibold text-tk-text mb-1 leading-tight">
                      <span style={{ fontSize: '11px', marginRight: '6px' }}>
                        {item.isVeg ? '🟩' : '🟥'}
                      </span>
                      {item.name}
                    </h3>
                    <p className="text-[12px] text-tk-text-secondary mb-2">{getCategoryName(item.categoryId)}</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div className="text-[18px] font-bold text-tk-burgundy">₹{item.price}</div>
                      <div className="text-[11px] text-tk-text-secondary bg-tk-bg-hover px-2 py-0.5 rounded-full">👥 Serves {item.serves}</div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2.5">
                      <label className="relative inline-block w-9 h-5">
                        <input
                          type="checkbox"
                          checked={item.available}
                          onChange={() => toggleStock(item)}
                          className="peer sr-only"
                        />
                        <span className="absolute cursor-pointer inset-0 bg-[#CBD5E0] dark:bg-tk-bg-elevated border border-transparent dark:border-tk-border transition-all duration-300 rounded-full before:absolute before:content-[''] before:h-[14px] before:w-[14px] before:left-[3px] before:bottom-[2px] before:bg-white before:transition-all before:duration-300 before:rounded-full before:shadow-sm peer-checked:bg-tk-burgundy peer-checked:border-tk-burgundy peer-checked:before:translate-x-[16px]"></span>
                      </label>
                      <span className={`text-[11px] font-medium ${item.available ? 'text-[#22543D]' : 'text-[#E53E3E]'}`}>
                        {item.available ? 'In Stock' : 'Out of Stock'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                      <button className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-tk-bg-hover text-tk-text-secondary border-none rounded-lg text-[12px] font-semibold cursor-pointer transition-all duration-200 hover:bg-tk-border hover:text-tk-text font-['Outfit']" onClick={() => handleEditMenuItem(item)}>
                        <Edit3 size={14} />
                        Edit
                      </button>
                      <button className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 border border-[#FC8181] rounded-lg bg-[#FEF2F2] text-[#E53E3E] text-[12px] font-semibold cursor-pointer transition-all duration-200 hover:bg-[#FED7D7]" onClick={() => handleDeleteMenuItem(item.id)}>
                        <Trash2 size={14} />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {visibleItemCount < filteredMenuItems.length && (
            <div ref={loadMoreItemsRef} style={{ textAlign: 'center', padding: '16px', color: '#718096', fontSize: '12px', fontFamily: "'Outfit', sans-serif" }}>
              Loading more items...
            </div>
          )}
        </div>
      )}

      {activeTab === 'offers' && (
        <div className="animate-[fadeIn_0.2s_ease-in-out]">
          <div className="flex justify-between items-center mb-4 max-md:flex-col max-md:items-start max-md:gap-3">
            <h2 className="text-[16px] sm:text-[18px] font-semibold text-tk-text">Offers & Promotions</h2>
            <button className="flex items-center gap-1.5 px-4 py-2 bg-tk-burgundy text-white border-none rounded-lg text-[13px] sm:text-sm font-medium cursor-pointer transition-all duration-200 hover:bg-tk-burgundy/90 hover:-translate-y-[1px] font-['Outfit'] shadow-sm" onClick={handleAddOffer}>
              <Plus size={14} />
              Add New Offer
            </button>
          </div>

          {loadingOffers ? (
            <div className="py-8 text-center text-tk-text-secondary text-sm">Loading offers...</div>
          ) : offers.length === 0 ? (
            <div className="py-8 text-center text-tk-text-secondary text-sm">No offers yet. Click "Add New Offer" to create one!</div>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4 max-sm:grid-cols-1">
              {offers.slice(0, visibleOfferCount).map((offer) => {
                const linkedItem = menuItems.find(m => m.id === offer.menu_item_id);
                const originalPrice = linkedItem?.price;
                return (
                  <div key={offer.id} className="bg-tk-bg-card p-4 sm:p-5 rounded-[16px] shadow-sm border border-tk-border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-tk-burgundy/30">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-[15px] sm:text-[16px] font-semibold text-tk-text leading-tight">{offer.title}</h3>
                      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase ${offer.is_active ? 'bg-[#C6F6D5] text-[#22543D]' : 'bg-[#FED7D7] text-[#C53030]'}`}>
                        {offer.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="mb-3">
                      <div className="text-[13px] font-medium text-tk-text mb-1.5 bg-tk-bg-hover inline-block px-2 py-0.5 rounded-md">
                        {linkedItem ? `${linkedItem.isVeg ? '🟩' : '🟥'} ${linkedItem.name}` : '—'}
                      </div>
                      <div className="flex items-center gap-2">
                        {originalPrice !== undefined && (
                          <span className="text-[13px] text-tk-text-muted line-through">₹{originalPrice}</span>
                        )}
                        <span className="text-[16px] font-bold text-[#38A169]">₹{offer.discount_price}</span>
                      </div>
                    </div>
                    {offer.valid_until && (
                      <div className="text-[11px] text-tk-text-secondary mb-4 flex items-center gap-1">
                        🕒 Valid until: {new Date(offer.valid_until).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </div>
                    )}
                    <div className="flex items-center justify-between gap-3 mt-auto pt-2 border-t border-tk-border">
                      <div className="flex items-center">
                        <label className="relative inline-block w-9 h-5">
                          <input
                            type="checkbox"
                            checked={offer.is_active}
                            onChange={() => toggleOffer(offer)}
                            className="peer sr-only"
                          />
                          <span className="absolute cursor-pointer inset-0 bg-[#CBD5E0] dark:bg-tk-bg-elevated border border-transparent dark:border-tk-border transition-all duration-300 rounded-full before:absolute before:content-[''] before:h-[14px] before:w-[14px] before:left-[3px] before:bottom-[2px] before:bg-white before:transition-all before:duration-300 before:rounded-full before:shadow-sm peer-checked:bg-tk-burgundy peer-checked:border-tk-burgundy peer-checked:before:translate-x-[16px]"></span>
                        </label>
                      </div>
                      <div className="flex gap-2 w-full justify-end">
                        <button className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-tk-bg-hover text-tk-text-secondary border-none rounded-lg text-[12px] font-semibold cursor-pointer transition-all duration-200 hover:bg-tk-border hover:text-tk-text font-['Outfit']" onClick={() => handleEditOffer(offer)}>
                          <Edit3 size={14} />
                          Edit
                        </button>
                        <button className="flex items-center justify-center gap-1.5 px-3 py-1.5 border border-[#FC8181] rounded-lg bg-[#FEF2F2] text-[#E53E3E] text-[12px] font-semibold cursor-pointer transition-all duration-200 hover:bg-[#FED7D7] font-['Outfit']" onClick={() => handleDeleteOffer(offer.id)}>
                          <Trash2 size={14} />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {visibleOfferCount < offers.length && (
            <div ref={loadMoreOffersRef} style={{ textAlign: 'center', padding: '16px', color: '#718096', fontSize: '12px', fontFamily: "'Outfit', sans-serif" }}>
              Loading more offers...
            </div>
          )}
        </div>
      )}
      {/* Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed',
          top: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: toast.type === 'success' ? '#48BB78' : '#F56565',
          color: 'white',
          padding: '12px 24px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 10000,
          fontSize: '14px',
          fontWeight: 500,
          pointerEvents: 'none',
          transition: 'all 0.3s ease'
        }}>
          {toast.message}
        </div>
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>

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
    </>
  );
};

export default Menu;