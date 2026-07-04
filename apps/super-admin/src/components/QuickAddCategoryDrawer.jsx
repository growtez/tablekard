import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from '../supabaseClient'
import { X, Layers } from 'lucide-react'

export default function QuickAddCategoryDrawer({ isOpen, onClose, restaurantId, onSuccess }) {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [formData, setFormData] = useState({ name: '', description: '', sort_order: 0, active: true })

    useEffect(() => {
        if (!isOpen) {
            setFormData({ name: '', description: '', sort_order: 0, active: true })
            setError(null)
        }
    }, [isOpen])

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!formData.name.trim()) {
            setError("Category name is required")
            return
        }

        setLoading(true)
        setError(null)

        try {
            const { error: insertError } = await supabase
                .from('menu_categories')
                .insert({
                    restaurant_id: restaurantId,
                    name: formData.name.trim(),
                    description: formData.description.trim() || null,
                    order: parseInt(formData.sort_order) || 0,
                    active: formData.active
                })

            if (insertError) throw insertError

            onSuccess?.()
            onClose()
        } catch (err) {
            console.error(err)
            setError(err.message || "Failed to create category")
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen) return null

    return createPortal(
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9999]" onClick={onClose}>
            <div onClick={e => e.stopPropagation()} className="fixed right-0 top-0 bottom-0 w-full max-w-[400px] bg-bg shadow-2xl p-6 flex flex-col z-[10000]">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                        <div className="bg-emerald-500/10 p-2.5 rounded-xl">
                            <Layers size={20} className="text-emerald-500" />
                        </div>
                        <h2 className="text-lg font-bold text-text-main m-0">Add Category</h2>
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

                <form onSubmit={handleSubmit} className="flex-1 flex flex-col gap-5">
                    <div className="relative">
                        <input
                            type="text"
                            id="categoryName"
                            placeholder="Category Name (e.g. Starters)"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                            className="peer w-full bg-surface-hover border border-border rounded-xl px-4 h-12 text-sm text-text-main focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-all placeholder:text-transparent focus:placeholder:text-text-muted/50"
                        />
                        <label htmlFor="categoryName" className="absolute left-3 px-1.5 transition-all duration-200 z-10 pointer-events-none -top-2.5 text-[10px] bg-bg font-bold uppercase tracking-wider text-text-muted peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:bg-transparent peer-placeholder-shown:font-normal peer-placeholder-shown:normal-case peer-placeholder-shown:tracking-normal peer-focus:-top-2.5 peer-focus:text-[10px] peer-focus:bg-bg peer-focus:font-bold peer-focus:uppercase peer-focus:tracking-wider peer-focus:text-accent-primary">Category Name</label>
                    </div>

                    <div className="relative">
                        <textarea
                            id="categoryDescription"
                            placeholder="Description (Optional)"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="peer w-full bg-surface-hover border border-border rounded-xl px-4 py-3 min-h-[80px] text-sm text-text-main focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-all placeholder:text-transparent focus:placeholder:text-text-muted/50 resize-none"
                        />
                        <label htmlFor="categoryDescription" className="absolute left-3 px-1.5 transition-all duration-200 z-10 pointer-events-none -top-2.5 text-[10px] bg-bg font-bold uppercase tracking-wider text-text-muted peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:bg-transparent peer-placeholder-shown:font-normal peer-placeholder-shown:normal-case peer-placeholder-shown:tracking-normal peer-focus:-top-2.5 peer-focus:text-[10px] peer-focus:bg-bg peer-focus:font-bold peer-focus:uppercase peer-focus:tracking-wider peer-focus:text-accent-primary">Description</label>
                    </div>

                    <div className="relative">
                        <input
                            type="number"
                            id="categorySortOrder"
                            placeholder="Sort Order"
                            value={formData.sort_order}
                            onChange={(e) => setFormData({ ...formData, sort_order: e.target.value })}
                            className="peer w-full bg-surface-hover border border-border rounded-xl px-4 h-12 text-sm text-text-main focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-all placeholder:text-transparent focus:placeholder:text-text-muted/50"
                        />
                        <label htmlFor="categorySortOrder" className="absolute left-3 px-1.5 transition-all duration-200 z-10 pointer-events-none -top-2.5 text-[10px] bg-bg font-bold uppercase tracking-wider text-text-muted peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:bg-transparent peer-placeholder-shown:font-normal peer-placeholder-shown:normal-case peer-placeholder-shown:tracking-normal peer-focus:-top-2.5 peer-focus:text-[10px] peer-focus:bg-bg peer-focus:font-bold peer-focus:uppercase peer-focus:tracking-wider peer-focus:text-accent-primary">Sort Order</label>
                    </div>

                    <div className="flex items-center gap-3 py-1">
                        <input
                            type="checkbox"
                            id="categoryActive"
                            checked={formData.active}
                            onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                            className="w-4 h-4 rounded border-border text-accent-primary focus:ring-accent-primary accent-accent-primary cursor-pointer"
                        />
                        <label htmlFor="categoryActive" className="text-sm font-medium text-text-main cursor-pointer select-none">Active</label>
                    </div>

                    <div className="mt-auto flex gap-3">
                        <button type="button" onClick={onClose} className="flex-1 h-12 flex items-center justify-center rounded-xl bg-surface-hover hover:bg-border text-text-main font-semibold transition-colors border-none cursor-pointer">
                            Cancel
                        </button>
                        <button type="submit" className="flex-1 h-12 flex items-center justify-center bg-accent-primary text-white font-bold rounded-xl shadow-[0_4px_20px_rgba(5,150,105,0.15)] hover:shadow-[0_6px_25px_rgba(5,150,105,0.25)] transition-all border-none cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed" disabled={loading}>
                            {loading ? 'Saving...' : 'Save Category'}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    )
}
