import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from '../supabaseClient'
import { X, Layers } from 'lucide-react'

export default function QuickAddCategoryDrawer({ isOpen, onClose, restaurantId, onSuccess }) {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [formData, setFormData] = useState({ name: '', active: true })

    useEffect(() => {
        if (!isOpen) {
            setFormData({ name: '', active: true })
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
                width: '400px',
                background: 'var(--surface-color)',
                boxShadow: '-4px 0 24px rgba(0,0,0,0.15)',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                zIndex: 10000
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '10px', borderRadius: '12px' }}>
                            <Layers size={20} color="#10b981" />
                        </div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Add Category</h2>
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

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
                    <div className="form-group-modern">
                        <input
                            type="text"
                            placeholder="Category Name (e.g. Starters)"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                        <label>Category Name</label>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 0' }}>
                        <input
                            type="checkbox"
                            id="categoryActive"
                            checked={formData.active}
                            onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                            style={{ width: '18px', height: '18px' }}
                        />
                        <label htmlFor="categoryActive" style={{ margin: 0, color: 'var(--text-color)', fontSize: '0.95rem' }}>Active</label>
                    </div>

                    <div style={{ marginTop: 'auto', display: 'flex', gap: '12px' }}>
                        <button type="button" onClick={onClose} className="btn-secondary" style={{ flex: 1, padding: '12px' }}>
                            Cancel
                        </button>
                        <button type="submit" className="btn-primary" disabled={loading} style={{ flex: 1, padding: '12px' }}>
                            {loading ? 'Saving...' : 'Save Category'}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    )
}
