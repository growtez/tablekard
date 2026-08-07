import React, { useState, useEffect, useRef } from 'react';
import { X, ArrowUp, ArrowDown, Plus, Trash2, AlertCircle, Save, GripVertical, Layers, Info, FolderPlus, Loader2, Check, Search } from 'lucide-react';
import type { MenuCategory } from '@restaurant-saas/types';

interface ManageCategoriesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  categories: MenuCategory[];
  onSave: (updatedCategories: MenuCategory[]) => Promise<void>;
  onAddCategory: (name: string) => Promise<MenuCategory>;
  onDeleteCategory?: (categoryId: string) => Promise<void>;
}

const ManageCategoriesDialog: React.FC<ManageCategoriesDialogProps> = ({
  isOpen,
  onClose,
  categories,
  onSave,
  onAddCategory,
  onDeleteCategory,
}) => {
  const [localCategories, setLocalCategories] = useState<MenuCategory[]>([]);
  const [newCatName, setNewCatName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<{id: string, name: string} | null>(null);
  const addInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const sorted = [...categories].sort((a, b) => (a.order || 0) - (b.order || 0));
    setLocalCategories(sorted);
    setShowAddForm(false);
    setError(null);
    setSuccessMsg(null);
    setCategoryToDelete(null);
  }, [categories, isOpen]);

  useEffect(() => {
    if (showAddForm) {
      setTimeout(() => addInputRef.current?.focus(), 100);
    }
  }, [showAddForm]);

  const handleNameChange = (id: string, newName: string) => {
    setLocalCategories(prev =>
      prev.map(cat => cat.id === id ? { ...cat, name: newName } : cat)
    );
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    // Small timeout to allow the drag image to be generated before adding visual styles
    setTimeout(() => {
        // can add styles to dragged element if needed
    }, 0);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault(); // Necessary to allow dropping
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) {
       setDragOverIndex(null);
       setDraggedIndex(null);
       return;
    }

    const newList = [...localCategories];
    const draggedItem = newList[draggedIndex];
    newList.splice(draggedIndex, 1);
    newList.splice(dropIndex, 0, draggedItem);
    
    setLocalCategories(newList);
    setDragOverIndex(null);
    setDraggedIndex(null);
  };
  
  const handleDragEnd = () => {
    setDragOverIndex(null);
    setDraggedIndex(null);
  };

  const handleAddNew = async () => {
    if (!newCatName.trim()) return;
    
    // Check for duplicates
    const nameToCheck = newCatName.trim().toLowerCase();
    if (localCategories.some(c => c.name.toLowerCase() === nameToCheck)) {
      setError(`A category named "${newCatName.trim()}" already exists.`);
      return;
    }

    setIsAdding(true);
    setError(null);
    try {
      const newCat = await onAddCategory(newCatName.trim());
      setLocalCategories(prev => [...prev, newCat]);
      setNewCatName('');
      setShowAddForm(false);
      setSuccessMsg(`"${newCat.name}" added successfully!`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError('Failed to add category. Please try again.');
    } finally {
      setIsAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!onDeleteCategory) return;
    
    setIsSaving(true);
    setError(null);
    try {
      await onDeleteCategory(id);
      setLocalCategories(prev => prev.filter(c => c.id !== id));
      setCategoryToDelete(null);
    } catch (err: any) {
      setError('Failed to delete category.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    setError(null);
    try {
      const updatedList = localCategories.map((cat, index) => ({
        ...cat,
        order: index
      }));
      await onSave(updatedList);
      onClose();
    } catch (err: any) {
      setError('Failed to save categories.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-end z-[1000] animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-tk-bg-card w-full sm:w-[560px] max-w-[100vw] h-full shadow-2xl animate-in slide-in-from-right duration-300 text-tk-text border-l border-tk-border flex flex-col" onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className="p-6 pb-0 shrink-0">
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-tk-burgundy/10 flex items-center justify-center shrink-0">
                <Layers size={20} className="text-tk-burgundy" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-tk-text m-0">Manage Categories</h2>
                <p className="text-[13px] text-tk-text-secondary m-0 mt-0.5">Organize your menu sections</p>
              </div>
            </div>
            <button className="bg-transparent border-none cursor-pointer p-2 rounded-lg flex items-center justify-center text-tk-text-secondary transition-all duration-200 hover:bg-tk-bg-hover hover:text-tk-text" onClick={onClose} type="button">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="px-6 pt-5 shrink-0">
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-tk-text-muted" />
            <input
              type="text"
              placeholder="Search categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-tk-bg-elevated border border-tk-border rounded-xl text-sm text-tk-text focus:outline-none focus:border-tk-burgundy focus:shadow-[0_0_0_2px_rgba(139,58,30,0.1)] transition-all"
            />
          </div>
        </div>

        {/* Info Banner */}
        <div className="px-6 pt-4 pb-2 shrink-0">
          <div className="flex items-start gap-2.5 p-3 bg-tk-burgundy/[0.04] dark:bg-tk-burgundy/10 border border-tk-burgundy/20 rounded-xl">
            <Info size={16} className="text-tk-burgundy shrink-0 mt-0.5" />
            <p className="text-[12px] leading-relaxed text-tk-text-secondary m-0">
              <span className="font-semibold text-tk-text">Rename</span> categories by editing the text. <span className="font-semibold text-tk-text">Drag and drop</span> the handle (⋮⋮) to change the order customers see them. The category at the top appears first on your menu.
              {searchQuery.trim().length > 0 && <span className="block mt-1 text-tk-burgundy font-medium">Reordering is disabled while searching.</span>}
            </p>
          </div>
        </div>

        {/* Error / Success Messages */}
        {error && (
          <div className="mx-6 mt-3 flex items-center gap-2 px-4 py-3 bg-[#FFF5F5] dark:bg-red-500/10 border border-[#FEB2B2] dark:border-red-500/30 rounded-xl text-[#C53030] dark:text-red-400 text-[13px] shrink-0">
            <AlertCircle size={16} className="shrink-0" />
            {error}
          </div>
        )}
        {successMsg && (
          <div className="mx-6 mt-3 flex items-center gap-2 px-4 py-3 bg-[#F0FFF4] dark:bg-green-500/10 border border-[#9AE6B4] dark:border-green-500/30 rounded-xl text-[#276749] dark:text-green-400 text-[13px] shrink-0 animate-in fade-in duration-300">
            <Check size={16} className="shrink-0" />
            {successMsg}
          </div>
        )}

        {/* Categories List */}
        <div className="flex-1 overflow-y-auto px-6 py-4 tk-table-scroll">
          <div className="space-y-2">
            {localCategories.filter(cat => cat.name.toLowerCase().includes(searchQuery.toLowerCase())).map((cat) => {
              const idx = localCategories.findIndex(c => c.id === cat.id);
              const isSearching = searchQuery.trim().length > 0;
              return (
              <div 
                key={cat.id} 
                draggable={!isSearching}
                onDragStart={(e) => !isSearching && handleDragStart(e, idx)}
                onDragOver={(e) => !isSearching && handleDragOver(e, idx)}
                onDrop={(e) => !isSearching && handleDrop(e, idx)}
                onDragEnd={handleDragEnd}
                className={`flex items-center gap-2.5 p-2.5 bg-tk-bg-elevated border rounded-xl group transition-all duration-200 
                  ${draggedIndex === idx ? 'opacity-50 scale-[0.98] border-tk-burgundy bg-tk-burgundy/5' : 'opacity-100'}
                  ${dragOverIndex === idx && draggedIndex !== idx ? (draggedIndex !== null && idx < draggedIndex ? 'border-t-2 border-t-tk-burgundy/60 -translate-y-1' : 'border-b-2 border-b-tk-burgundy/60 translate-y-1') : 'border-tk-border hover:border-tk-burgundy/40 hover:shadow-sm'}
                `}
              >
                {/* Drag Handle */}
                <div className={`p-1 transition-colors shrink-0 flex items-center justify-center ${isSearching ? 'text-tk-border cursor-not-allowed' : 'cursor-grab active:cursor-grabbing text-tk-text-muted hover:text-tk-burgundy'}`}>
                  <GripVertical size={16} />
                </div>

                {/* Position Badge */}
                <div className="w-6 h-6 rounded-lg bg-tk-bg-hover flex items-center justify-center shrink-0">
                  <span className="text-[11px] font-bold text-tk-text-muted">{idx + 1}</span>
                </div>
                
                {/* Editable Name */}
                <div className="flex-1 min-w-0 ml-1">
                  <input
                    type="text"
                    value={cat.name}
                    onChange={(e) => handleNameChange(cat.id, e.target.value)}
                    className="w-full p-2 px-3 bg-transparent border border-transparent rounded-lg text-sm font-medium text-tk-text focus:outline-none focus:bg-tk-bg-card focus:border-tk-burgundy focus:shadow-[0_0_0_2px_rgba(139,58,30,0.08)] transition-all hover:bg-tk-bg-card/60"
                    placeholder="Category name"
                  />
                </div>

                {/* Delete */}
                {onDeleteCategory && (
                  <button 
                    type="button"
                    onClick={() => setCategoryToDelete({id: cat.id, name: cat.name})}
                    className="p-1.5 border-none bg-transparent cursor-pointer text-tk-text-muted hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all shrink-0 opacity-0 group-hover:opacity-100 focus:opacity-100 flex items-center justify-center"
                    title="Delete category"
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            )})}
          </div>

          {/* Empty State */}
          {localCategories.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 px-6 border-2 border-dashed border-tk-border rounded-2xl mt-2">
              <div className="w-14 h-14 rounded-2xl bg-tk-burgundy/10 flex items-center justify-center mb-4">
                <Layers size={24} className="text-tk-burgundy" />
              </div>
              <h3 className="text-base font-semibold text-tk-text m-0 mb-1">No categories yet</h3>
              <p className="text-[13px] text-tk-text-muted m-0 text-center max-w-[260px]">
                Categories help organize your menu. Add your first category below to get started!
              </p>
            </div>
          )}
        </div>

        {/* Bottom Section */}
        <div className="shrink-0 px-6 pb-6 pt-3 border-t border-tk-border bg-tk-bg-card">
          {/* Add New Category */}
          {!showAddForm ? (
            <button 
              type="button"
              onClick={() => setShowAddForm(true)}
              className="w-full mb-4 py-3 px-4 bg-transparent border-2 border-dashed border-tk-border rounded-xl text-sm font-medium text-tk-text-secondary cursor-pointer hover:border-tk-burgundy/40 hover:text-tk-burgundy hover:bg-tk-burgundy/[0.03] transition-all flex items-center justify-center gap-2 group"
            >
              <Plus size={16} className="group-hover:scale-110 transition-transform" />
              Add New Category
            </button>
          ) : (
            <div className="mb-4 p-3.5 bg-tk-burgundy/[0.04] dark:bg-tk-burgundy/10 border-2 border-tk-burgundy/30 rounded-xl animate-in slide-in-from-bottom-2 duration-200">
              <div className="flex items-center gap-2 mb-2.5">
                <FolderPlus size={15} className="text-tk-burgundy shrink-0" />
                <span className="text-[13px] font-semibold text-tk-burgundy">New Category</span>
              </div>
              <div className="flex gap-2">
                <input
                  ref={addInputRef}
                  type="text"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="e.g. Starters, Main Course, Desserts..."
                  className="flex-1 p-2.5 px-3 bg-tk-bg-card border-2 border-tk-border rounded-lg text-sm text-tk-text font-sans focus:outline-none focus:border-tk-burgundy focus:shadow-[0_0_0_2px_rgba(139,58,30,0.1)] transition-all placeholder:text-tk-text-muted"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') { e.preventDefault(); handleAddNew(); }
                    if (e.key === 'Escape') { setShowAddForm(false); setNewCatName(''); }
                  }}
                  disabled={isAdding}
                />
                <button 
                  type="button"
                  onClick={handleAddNew}
                  disabled={!newCatName.trim() || isAdding}
                  className="px-3.5 py-2.5 bg-tk-burgundy text-white border-none rounded-lg text-[13px] font-semibold cursor-pointer hover:bg-[#6B2A15] disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1.5 shrink-0"
                >
                  {isAdding ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                  {isAdding ? 'Adding...' : 'Add'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowAddForm(false); setNewCatName(''); }}
                  className="p-2.5 bg-transparent border border-tk-border rounded-lg cursor-pointer text-tk-text-muted hover:bg-tk-bg-hover hover:text-tk-text transition-all flex items-center justify-center shrink-0"
                >
                  <X size={15} />
                </button>
              </div>
            </div>
          )}

          {/* Save / Cancel */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="flex-1 py-3 px-4 bg-transparent border-2 border-tk-border rounded-xl text-tk-text-secondary text-sm font-semibold cursor-pointer hover:bg-tk-bg-elevated hover:text-tk-text transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveAll}
              disabled={isSaving || localCategories.length === 0}
              className="flex-1 py-3 px-4 bg-tk-text text-tk-bg-surface border-none rounded-xl text-sm font-semibold cursor-pointer hover:bg-tk-text/90 shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {categoryToDelete && (
        <div className="fixed inset-0 bg-black/60 z-[1010] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-tk-bg-card w-full max-w-sm rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-500/10 flex items-center justify-center mb-4 mx-auto">
                <Trash2 size={24} className="text-red-600 dark:text-red-500" />
              </div>
              <h3 className="text-xl font-semibold text-center text-tk-text mb-2">Delete Category?</h3>
              <p className="text-center text-sm text-tk-text-secondary mb-6 leading-relaxed">
                Are you sure you want to delete <span className="font-semibold text-tk-text">"{categoryToDelete.name}"</span>? 
                <br />
                <span className="text-[13px] opacity-80 inline-block mt-2">Note: Menu items inside this category will not be deleted.</span>
              </p>
              
              <div className="flex gap-3">
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => setCategoryToDelete(null)}
                  className="flex-1 py-2.5 px-4 bg-transparent border-2 border-tk-border rounded-xl text-tk-text-secondary text-sm font-semibold cursor-pointer hover:bg-tk-bg-elevated hover:text-tk-text transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => handleDelete(categoryToDelete.id)}
                  className="flex-1 py-2.5 px-4 bg-red-600 text-white border-none rounded-xl text-sm font-semibold cursor-pointer hover:bg-red-700 shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                  {isSaving ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageCategoriesDialog;
