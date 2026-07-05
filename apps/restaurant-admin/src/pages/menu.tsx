import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, Edit3, Trash2, Layers, Loader2, TrendingUp, AlertCircle, List, LayoutGrid, MoreVertical, ArrowUpDown, ChevronDown } from 'lucide-react';
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
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'price_high' | 'price_low' | 'a_z'>('newest');
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const sortDropdownRef = useRef<HTMLDivElement>(null);
  
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target as Node)) {
        setIsSortDropdownOpen(false);
      }
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target as Node)) {
        setIsCategoryDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);


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

  let filteredMenuItems = selectedCategoryId === 'all'
    ? menuItems
    : menuItems.filter(item => item.categoryId === selectedCategoryId);

  if (searchTerm) {
    const lower = searchTerm.toLowerCase();
    filteredMenuItems = filteredMenuItems.filter(item => 
      item.name.toLowerCase().includes(lower) || 
      (item.shortDescription && item.shortDescription.toLowerCase().includes(lower))
    );
  }

  filteredMenuItems = filteredMenuItems.sort((a, b) => {
    if (sortBy === 'a_z') return a.name.localeCompare(b.name);
    if (sortBy === 'price_high') return b.price - a.price;
    if (sortBy === 'price_low') return a.price - b.price;
    if (sortBy === 'oldest') return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
    // Default newest
    return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
  });

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

  const getCategoryCount = (catId: string) => {
    if (catId === 'all') return menuItems.length;
    return menuItems.filter(item => item.categoryId === catId).length;
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
      <style>{`
        .tk-table-scroll {
          scrollbar-width: thin;
          scrollbar-color: rgba(113, 128, 150, 0.35) transparent;
        }
        .tk-table-scroll::-webkit-scrollbar { width: 8px; height: 8px; }
        .tk-table-scroll::-webkit-scrollbar-track { background: transparent; }
        .tk-table-scroll::-webkit-scrollbar-thumb {
          background-color: rgba(113, 128, 150, 0.32);
          border-radius: 999px; border: 2px solid transparent; background-clip: padding-box;
        }
        .tk-table-scroll::-webkit-scrollbar-thumb:hover { background-color: rgba(113, 128, 150, 0.55); }
        .tk-table-scroll::-webkit-scrollbar-corner { background: transparent; }
      `}</style>
      {/* Header - Tightened spacing */}
      <div className="flex justify-between items-center mb-4 max-md:flex-col max-md:items-start max-md:gap-3">
        <h1 className="text-[20px] sm:text-[22px] font-semibold text-tk-text max-md:ml-16">Menu Management</h1>
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

      {/* Header and Tabs */}
      <div className="flex justify-between items-center mb-4 max-md:flex-col max-md:items-stretch max-md:gap-3">
        {/* Tab Navigation */}
        <div className="flex gap-1 bg-[#F7FAFC] dark:bg-tk-bg-elevated p-1 rounded-xl w-fit max-md:w-full max-md:justify-center">
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

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 max-md:w-full">
           {isSaving && (
             <div className="flex items-center animate-spin mr-2">
               <Loader2 size={16} className="text-tk-text-secondary" />
             </div>
           )}
           {activeTab === 'menu-items' && (
             <>
               <button className="flex items-center justify-center gap-1.5 px-4 py-2 bg-[#E2E8F0] dark:bg-tk-bg-hover text-tk-text border-none rounded-lg text-[13px] sm:text-sm font-medium cursor-pointer transition-all duration-200 hover:bg-[#CBD5E0] dark:hover:bg-tk-border font-['Outfit'] max-md:flex-1" onClick={handleAddCategory}>
                 <Layers size={14} />
                 New Category
               </button>
               <button className="flex items-center justify-center gap-1.5 px-4 py-2 bg-tk-burgundy text-white border-none rounded-lg text-[13px] sm:text-sm font-medium cursor-pointer transition-all duration-200 hover:bg-tk-burgundy/90 hover:-translate-y-[1px] font-['Outfit'] shadow-sm max-md:flex-1" onClick={handleAddMenuItem}>
                 <Plus size={14} />
                 Add New Item
               </button>
             </>
           )}
           {activeTab === 'offers' && (
             <button className="flex items-center justify-center gap-1.5 px-4 py-2 bg-tk-burgundy text-white border-none rounded-lg text-[13px] sm:text-sm font-medium cursor-pointer transition-all duration-200 hover:bg-tk-burgundy/90 hover:-translate-y-[1px] font-['Outfit'] shadow-sm max-md:flex-1 w-full sm:w-auto" onClick={handleAddOffer}>
               <Plus size={14} />
               Add New Offer
             </button>
           )}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'menu-items' && (
        <div className="animate-[fadeIn_0.2s_ease-in-out]">

          {/* Tabs & Controls */}
          <div className="sticky top-0 z-50 py-2 bg-tk-bg-card shadow-sm border-b border-tk-border flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-2 w-full xl:w-auto flex-1 pb-1 pl-12 md:pl-0">
              <div className="relative" ref={categoryDropdownRef}>
                <button
                  onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                  className="flex items-center justify-between gap-2 px-4 py-2 bg-tk-bg-surface border border-tk-border rounded-xl shadow-sm text-sm font-semibold text-tk-text hover:bg-tk-bg-hover transition-colors min-w-[200px]"
                >
                  <span>
                    {selectedCategoryId === 'all' ? 'All Categories' : getCategoryName(selectedCategoryId)}
                    <span className="ml-1.5 opacity-60 font-medium">({getCategoryCount(selectedCategoryId)})</span>
                  </span>
                  <ChevronDown size={16} className={`transition-transform duration-200 text-tk-text-secondary ${isCategoryDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {isCategoryDropdownOpen && (
                  <div className="absolute left-0 top-full mt-2 w-full min-w-[240px] bg-tk-bg-surface border border-tk-border rounded-xl shadow-lg z-50 py-1 overflow-hidden animate-[fadeIn_0.15s_ease-out] max-h-[300px] overflow-y-auto tk-table-scroll">
                    <button
                      onClick={() => { setSelectedCategoryId('all'); setIsCategoryDropdownOpen(false); }}
                      className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors flex justify-between items-center ${selectedCategoryId === 'all' ? 'bg-tk-burgundy/10 text-tk-burgundy' : 'text-tk-text hover:bg-tk-bg-hover'}`}
                    >
                      <span>All Categories</span>
                      <span className="text-xs opacity-60">{getCategoryCount('all')}</span>
                    </button>
                    {categories.map((category) => (
                      <button
                        key={category.id}
                        onClick={() => { setSelectedCategoryId(category.id); setIsCategoryDropdownOpen(false); }}
                        className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors flex justify-between items-center ${selectedCategoryId === category.id ? 'bg-tk-burgundy/10 text-tk-burgundy' : 'text-tk-text hover:bg-tk-bg-hover'}`}
                      >
                        <span className="truncate pr-2">{category.name}</span>
                        <span className="text-xs opacity-60 shrink-0">{getCategoryCount(category.id)}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              {selectedCategoryId !== 'all' && (
                <button
                  className="flex items-center gap-1.5 px-3 py-2 bg-tk-bg-surface text-tk-text-secondary border border-tk-border rounded-xl text-[13px] font-medium cursor-pointer transition-all duration-200 hover:bg-tk-bg-hover hover:text-tk-text shadow-sm"
                  onClick={() => {
                    const cat = categories.find(c => c.id === selectedCategoryId);
                    if (cat) handleEditCategory(cat);
                  }}
                  title="Edit Selected Category"
                >
                  <Edit3 size={14} />
                  <span className="hidden sm:inline">Edit Category</span>
                </button>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pb-2 w-full xl:w-auto xl:ml-4">
              <div className="flex bg-tk-bg-surface border border-tk-border rounded-full p-0.5 shrink-0 self-start sm:self-auto">
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-1.5 sm:p-1.5 rounded-full transition-colors flex items-center justify-center ${viewMode === 'table' ? 'bg-tk-burgundy/10 text-tk-burgundy shadow-sm' : 'text-tk-text-secondary hover:text-tk-text'}`}
                  title="Table View"
                >
                  <List size={16} />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 sm:p-1.5 rounded-full transition-colors flex items-center justify-center ${viewMode === 'grid' ? 'bg-tk-burgundy/10 text-tk-burgundy shadow-sm' : 'text-tk-text-secondary hover:text-tk-text'}`}
                  title="Grid View"
                >
                  <LayoutGrid size={16} />
                </button>
              </div>

              <div className="relative w-full sm:w-auto" ref={sortDropdownRef}>
                <button
                  onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
                  className="flex justify-between sm:justify-start items-center gap-1.5 px-4 py-2 sm:px-3 sm:py-1.5 rounded-full border border-tk-border bg-tk-bg-surface hover:bg-tk-bg-hover text-tk-text-secondary hover:text-tk-text text-[13px] sm:text-[12px] font-semibold transition-colors whitespace-nowrap h-[36px] sm:h-[32px] w-full shrink-0"
                >
                  <div className="flex items-center gap-1.5">
                    <ArrowUpDown size={13} />
                    <span className="opacity-70 font-medium">Sort by:</span>
                    {sortBy === 'newest' && 'Newest First'}
                    {sortBy === 'oldest' && 'Oldest First'}
                    {sortBy === 'price_high' && 'High to Low'}
                    {sortBy === 'price_low' && 'Low to High'}
                    {sortBy === 'a_z' && 'A to Z'}
                  </div>
                  <ChevronDown size={14} className="sm:hidden" />
                </button>

                {isSortDropdownOpen && (
                  <div className="absolute left-0 sm:left-auto sm:right-0 top-full mt-2 w-full sm:w-[180px] bg-tk-bg-surface border border-tk-border rounded-xl shadow-lg z-50 py-1 overflow-hidden animate-[fadeIn_0.15s_ease-out]">
                    {[
                      { value: 'newest', label: 'Newest First' },
                      { value: 'oldest', label: 'Oldest First' },
                      { value: 'price_high', label: 'Price: High to Low' },
                      { value: 'price_low', label: 'Price: Low to High' },
                      { value: 'a_z', label: 'Name: A to Z' }
                    ].map(option => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setSortBy(option.value as any);
                          setIsSortDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-3 sm:py-2 text-[14px] sm:text-[13px] font-medium transition-colors ${sortBy === option.value
                          ? 'bg-tk-burgundy/10 text-tk-burgundy'
                          : 'text-tk-text hover:bg-tk-bg-hover'
                          }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 bg-tk-bg-surface px-4 py-1.5 rounded-full shadow-sm border border-tk-border w-full sm:w-[220px]">
                <Search size={16} className="text-tk-text-secondary shrink-0" />
                <input
                  type="text"
                  placeholder="Search items..."
                  className="border-none outline-none text-[13px] text-tk-text bg-transparent w-full placeholder:text-tk-text-muted h-[24px]"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>

          {loading ? (
            <div className="py-8 text-center text-tk-text-secondary text-sm">Loading menu...</div>
          ) : filteredMenuItems.length === 0 ? (
            <div className="py-8 text-center text-tk-text-secondary text-sm">No menu items found. Add one to get started!</div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-5">
              {filteredMenuItems.slice(0, visibleItemCount).map((item) => (
                <div key={item.id} className="bg-white dark:bg-tk-bg-card rounded-[16px] shadow-sm border border-tk-border p-3 flex flex-col gap-3 transition-all duration-300 hover:shadow-md hover:border-[#E55A28]/30 h-full">
                  
                  {/* Top Image */}
                  <div className="w-full aspect-[16/9] rounded-[12px] bg-[#f5f5f5] dark:bg-tk-bg-surface overflow-hidden relative shadow-sm border-[2px] border-white dark:border-tk-bg-card shrink-0">
                    {(item.images && item.images.length > 0) ? (
                      <img src={item.images[0].url} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[48px]">🍽️</div>
                    )}
                  </div>
                  
                  {/* Content & Actions */}
                  <div className="flex-1 flex flex-col justify-between min-w-0">
                    <div>
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex flex-col gap-1.5 min-w-0 flex-1">
                          {/* Veg / Non-veg Tag */}
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center border-[1.5px] ${item.isVeg ? 'border-[#38A169] bg-[#F0FFF4]' : 'border-[#E55A28] bg-[#FFF0E6]'}`}>
                              {item.isVeg ? (
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#38A169]"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>
                              ) : (
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#E55A28]"><path d="M15.5 11 12 14.5l-5 5a2.12 2.12 0 1 1-3-3l5-5L12.5 8"/><path d="m8.5 15.5 3.5 3.5"/><path d="m12 12 3.5 3.5"/><path d="M15.5 11A2.5 2.5 0 0 0 18 9.5a2.5 2.5 0 0 0-2.5-2.5A2.5 2.5 0 0 0 13 4.5 2.5 2.5 0 0 0 10.5 7"/></svg>
                              )}
                            </div>
                            <div className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase ${item.isVeg ? 'bg-[#F0FFF4] text-[#38A169]' : 'bg-[#FFF0E6] text-[#E55A28]'}`}>
                              {item.isVeg ? 'Veg' : 'Non-Veg'}
                            </div>
                          </div>
                          
                          {/* Category Breadcrumb */}
                          <div className="text-[11px] font-bold text-tk-text-secondary">
                            Menu / <span className="text-[#E55A28]">{getCategoryName(item.categoryId)}</span>
                          </div>
                          
                          {/* Title */}
                          <h3 className="text-[15px] sm:text-[17px] font-extrabold text-[#111] dark:text-tk-text leading-[1.2] mb-0.5 tracking-tight line-clamp-2">
                            {item.name}
                          </h3>
                        </div>

                        <div className="flex flex-col items-end shrink-0 gap-1 mt-1">
                          {/* Rating */}
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-medium text-tk-text-secondary">(128)</span>
                            <div className="flex items-center gap-0.5 bg-[#FFF0E6] px-1.5 py-0.5 rounded font-bold text-[11px] text-[#111] dark:text-tk-text">
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="#F6AD55" stroke="#ED8936" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                              <span className="ml-[1px]">4.6</span>
                            </div>
                          </div>

                          {/* Price */}
                          <div className="flex flex-col items-end mt-1">
                            <div className="text-[18px] sm:text-[20px] font-extrabold text-[#111] dark:text-tk-text leading-none tracking-tighter">
                              ₹{item.discountPrice && item.discountPrice < item.price ? item.discountPrice : item.price}
                            </div>
                            {item.discountPrice && item.discountPrice < item.price && (
                              <div className="text-[12px] text-tk-text-secondary font-semibold line-through decoration-tk-text-secondary/60 mt-[2px]">
                                ₹{item.price}
                              </div>
                            )}
                            {(!item.discountPrice || item.discountPrice >= item.price) && (
                               <div className="text-[12px] text-tk-text-secondary font-semibold line-through decoration-tk-text-secondary/60 mt-[2px]">
                                 ₹{Math.floor(item.price * 1.25)}
                               </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Description */}
                      <p className="text-[11px] sm:text-[12px] font-medium text-[#666] dark:text-tk-text-secondary line-clamp-2 mt-2 leading-snug">
                        {item.shortDescription || `${item.name} with chef's special touch`}
                      </p>
                    </div>

                    {/* Admin Actions */}
                    <div className="flex items-center justify-between gap-3 mt-3 pt-3 border-t border-tk-border border-dashed w-full">
                      <label className="relative flex items-center gap-2 cursor-pointer bg-tk-bg-surface px-2 py-1.5 rounded-lg border border-tk-border shadow-sm group hover:border-tk-border-hover transition-all">
                        <span className={`text-[9px] sm:text-[10px] font-extrabold transition-colors ${item.available ? 'text-[#E55A28]' : 'text-tk-text-secondary'}`}>
                          {item.available ? 'In Stock' : 'Out'}
                        </span>
                        <div className="relative flex items-center">
                          <input type="checkbox" checked={item.available} onChange={() => toggleStock(item)} className="sr-only peer" />
                          <div className="w-[24px] h-3.5 bg-[#CBD5E0] dark:bg-tk-bg-elevated peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-2.5 after:w-2.5 after:transition-all peer-checked:bg-[#E55A28] shadow-inner"></div>
                        </div>
                      </label>
                      
                      <div className="flex gap-1.5 shrink-0">
                        <button className="flex items-center justify-center gap-1 px-2.5 py-1.5 bg-tk-bg-surface text-tk-text-secondary border border-tk-border rounded-lg text-[10px] font-bold cursor-pointer transition-all duration-200 hover:bg-tk-bg-hover hover:text-tk-text shadow-sm" onClick={() => handleEditMenuItem(item)}>
                          <Edit3 size={12} />
                          Edit
                        </button>
                        <button className="flex items-center justify-center px-2 py-1.5 border border-[#FC8181] rounded-lg bg-[#FEF2F2] text-[#E53E3E] text-[10px] font-bold cursor-pointer transition-all duration-200 hover:bg-[#FED7D7] shadow-sm" onClick={() => handleDeleteMenuItem(item.id)}>
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="w-full pb-8">
              <div className="overflow-x-auto tk-table-scroll [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                <table className="w-full text-left border-collapse table-fixed min-w-[900px]">
                  <thead>
                    <tr>
                      <th className="sticky top-0 z-40 bg-tk-bg-card py-3 px-4 border-b-0 shadow-[inset_0_-2px_0_0_var(--tk-border)] text-sm font-semibold text-tk-text-secondary whitespace-nowrap border-b-2 border-tk-border w-[35%] shadow-sm">
                        Menu Item
                      </th>
                      <th className="sticky top-0 z-40 bg-tk-bg-card py-3 px-4 border-b-0 shadow-[inset_0_-2px_0_0_var(--tk-border)] text-sm font-semibold text-tk-text-secondary whitespace-nowrap border-b-2 border-tk-border w-[20%] shadow-sm">
                        Category
                      </th>
                      <th className="sticky top-0 z-40 bg-tk-bg-card py-3 px-4 border-b-0 shadow-[inset_0_-2px_0_0_var(--tk-border)] text-sm font-semibold text-tk-text-secondary whitespace-nowrap border-b-2 border-tk-border w-[15%] shadow-sm">
                        Price
                      </th>
                      <th className="sticky top-0 z-40 bg-tk-bg-card py-3 px-4 border-b-0 shadow-[inset_0_-2px_0_0_var(--tk-border)] text-sm font-semibold text-tk-text-secondary whitespace-nowrap border-b-2 border-tk-border w-[15%] shadow-sm">
                        Status
                      </th>
                      <th className="sticky top-0 z-40 bg-tk-bg-card py-3 px-4 border-b-0 shadow-[inset_0_-2px_0_0_var(--tk-border)] text-sm font-semibold text-tk-text-secondary whitespace-nowrap border-b-2 border-tk-border text-center w-[15%] shadow-sm">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMenuItems.slice(0, visibleItemCount).map((item) => {
                      const categoryName = getCategoryName(item.categoryId);
                      let catIcon = '🍽️';
                      const lower = categoryName.toLowerCase();
                      if (lower.includes('pizza')) catIcon = '🍕';
                      else if (lower.includes('burger')) catIcon = '🍔';
                      else if (lower.includes('dessert') || lower.includes('cake') || lower.includes('sweet')) catIcon = '🍰';
                      else if (lower.includes('beverage') || lower.includes('drink')) catIcon = '🥤';
                      else if (lower.includes('main')) catIcon = '🍜';
                      else if (lower.includes('starter') || lower.includes('appetizer')) catIcon = '🥟';
                      
                      return (
                        <tr key={item.id} className="border-b border-tk-border last:border-b-0 hover:bg-tk-burgundy/5 transition-colors group bg-tk-bg-card">
                          <td className="py-3 px-4">
                            <div className="flex items-start gap-4">
                              <div className="w-14 h-14 rounded-xl bg-[#FFF5E6] flex items-center justify-center text-[24px] shadow-sm overflow-hidden shrink-0">
                                {(item.images && item.images.length > 0) ? (
                                  <img src={item.images[0].url} alt={item.name} className="w-full h-full object-cover" />
                                ) : '🍽️'}
                              </div>
                              <div className="flex flex-col justify-center">
                                <div className="font-semibold text-[15px] text-tk-text flex items-center gap-2">
                                  {item.name}
                                </div>
                                <div className="text-[12px] text-tk-text-secondary mt-1 max-w-[200px] line-clamp-2">
                                  {item.shortDescription || `${item.isVeg ? 'Veg' : 'Non-veg'} ${categoryName}`}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2 text-[14px] font-medium text-tk-burgundy">
                              <span>{catIcon}</span>
                              <span>{categoryName}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-[15px] font-semibold text-tk-text">
                            ₹{item.price}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex px-2.5 py-0.5 rounded text-[11px] font-bold ${item.available ? 'bg-[#C6F6D5] text-[#22543D]' : 'bg-[#FEF2F2] text-[#E53E3E]'}`}>
                              {item.available ? 'Available' : 'Out of Stock'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center justify-center gap-2">
                              <button 
                                className="w-9 h-9 rounded-xl border border-tk-border flex items-center justify-center text-tk-text-secondary hover:bg-tk-bg-surface hover:text-tk-text transition-all bg-tk-bg-card shadow-sm hover:shadow"
                                onClick={() => handleEditMenuItem(item)}
                                title="Edit"
                              >
                                <Edit3 size={16} />
                              </button>
                              <div className="relative group">
                                <button 
                                  className="w-9 h-9 rounded-xl border border-tk-border flex items-center justify-center text-tk-text-secondary hover:bg-tk-bg-surface hover:text-tk-text transition-all bg-tk-bg-card shadow-sm hover:shadow"
                                >
                                  <MoreVertical size={16} />
                                </button>
                                <div className="absolute right-0 mt-2 w-40 bg-tk-bg-card border border-tk-border rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.1)] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-[100] flex flex-col p-1.5">
                                  <button 
                                    className="text-left px-3 py-2 text-[13px] font-medium text-tk-text hover:bg-tk-bg-hover rounded-lg w-full transition-colors"
                                    onClick={() => toggleStock(item)}
                                  >
                                    {item.available ? 'Mark Out of Stock' : 'Mark Available'}
                                  </button>
                                  <button 
                                    className="text-left px-3 py-2 text-[13px] font-medium text-[#E53E3E] hover:bg-[#FEF2F2] rounded-lg w-full transition-colors mt-0.5"
                                    onClick={() => handleDeleteMenuItem(item.id)}
                                  >
                                    Delete Item
                                  </button>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
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