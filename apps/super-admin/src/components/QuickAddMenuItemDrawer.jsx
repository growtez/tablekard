import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from '../supabaseClient'
import { X, Utensils } from 'lucide-react'

export default function QuickAddMenuItemDrawer({ isOpen, onClose, restaurantId, categories = [], onSuccess, onAddCategory }) {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [formData, setFormData] = useState({
        name: '',
        price: '',
        categoryId: '',
        short_description: '',
        is_veg: false,
        is_available: true
    })

    useEffect(() => {
        if (!isOpen) {
            setFormData({
                name: '',
                price: '',
                categoryId: '',
                short_description: '',
                is_veg: false,
                is_available: true
            })
            setError(null)
        } else if (categories.length > 0 && !formData.categoryId) {
            setFormData(prev => ({ ...prev, categoryId: categories[0].id }))
        }
    }, [isOpen, categories])

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!formData.name.trim() || !formData.price || !formData.categoryId) {
            setError("Name, Price, and Category are required.")
            return
        }

        setLoading(true)
        setError(null)

        try {
            const { error: insertError } = await supabase
                .from('menu_items')
                .insert({
                    restaurant_id: restaurantId,
                    name: formData.name.trim(),
                    price: parseFloat(formData.price),
                    category_id: formData.categoryId,
                    short_description: formData.short_description.trim() || null,
                    is_veg: formData.is_veg,
                    is_available: formData.is_available
                })

            if (insertError) throw insertError

            onSuccess?.()
            onClose()
        } catch (err) {
            console.error(err)
            setError(err.message || "Failed to create menu item")
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen) return null

    return createPortal(
        <div
            onClick={onClose}
            style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0, 0, 0, 0.4)',
                backdropFilter: 'blur(4px)',
                zIndex: 9999
            }}
        >
            <div onClick={e => e.stopPropagation()} style={{
                position: 'fixed',
                right: 0,
                top: 0,
                bottom: 0,
                width: '450px',
                background: 'var(--surface-color)',
                boxShadow: '-4px 0 24px rgba(0,0,0,0.15)',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                zIndex: 10000,
                overflowY: 'auto'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '10px', borderRadius: '12px' }}>
                            <Utensils size={20} color="#3b82f6" />
                        </div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Add Menu Item</h2>
                    </div>
                    <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', opacity: 0.6 }}>
                        <X size={20} />
                    </button>
                </div>

                {error && (
                    <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '8px', marginBottom: '16px', fontSize: '0.9rem' }}>
                        {error}
                    </div>
                )}

                {categories.length === 0 ? (
                    <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                        <p>You must create a category first before adding menu items.</p>
                        <button 
                            type="button" 
                            className="btn-primary" 
                            onClick={() => {
                                onClose();
                                onAddCategory?.();
                            }}
                        >
                            Add Category
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>
                        <div className="form-group-modern">
                            <input
                                type="text"
                                placeholder="Item Name (e.g. Butter Chicken)"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                            <label>Item Name</label>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div className="form-group-modern">
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    placeholder="Price (e.g. 299)"
                                    value={formData.price}
                                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                    required
                                />
                                <label>Price (₹)</label>
                            </div>
                            <div>
                                <select
                                    value={formData.categoryId}
                                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '12px 16px',
                                        background: 'var(--surface-hover)',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: '12px',
                                        fontSize: '0.95rem',
                                        color: 'var(--text-color)',
                                        height: '48px'
                                    }}
                                >
                                    <option value="" disabled>Select Category</option>
                                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                        </div>

                        <div>
                            <textarea
                                placeholder="Short Description (optional)"
                                value={formData.short_description}
                                onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
                                style={{
                                    width: '100%',
                                    padding: '12px 16px',
                                    background: 'var(--surface-hover)',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '12px',
                                    fontSize: '0.95rem',
                                    minHeight: '80px',
                                    resize: 'vertical',
                                    color: 'var(--text-color)',
                                    boxSizing: 'border-box'
                                }}
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={formData.is_veg}
                                    onChange={(e) => setFormData({ ...formData, is_veg: e.target.checked })}
                                    style={{ width: '18px', height: '18px' }}
                                />
                                <span>Vegetarian</span>
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={formData.is_available}
                                    onChange={(e) => setFormData({ ...formData, is_available: e.target.checked })}
                                    style={{ width: '18px', height: '18px' }}
                                />
                                <span>In Stock</span>
                            </label>
                        </div>

                        <div style={{ marginTop: 'auto', display: 'flex', gap: '12px' }}>
                            <button type="button" onClick={onClose} className="btn-secondary" style={{ flex: 1, padding: '12px' }}>
                                Cancel
                            </button>
                            <button type="submit" className="btn-primary" disabled={loading} style={{ flex: 1, padding: '12px' }}>
                                {loading ? 'Saving...' : 'Save Menu Item'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>,
        document.body
    )
}
