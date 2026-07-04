import React, { useState, useRef } from 'react';
import { ExternalLink, Edit3, Save, X, Upload, ImageIcon } from 'lucide-react';
import ImageCropper from './ImageCropper';
import { uploadProfileImage } from '../storageService';
import './RestaurantDetailProfile.css';  

export default function RestaurantProfileView({
  restaurant,
  formData,
  updateField,
  saving,
  handleSave,
  handleCancel,
  editingCard,
  setEditingCard,
  activeTab,
  admins = []
}) {
  const [cropModalConfig, setCropModalConfig] = useState({ isOpen: false, type: null, image: null });
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  const coverInputRef = useRef(null);

  const handleFileChange = (e, type) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = () => {
        setCropModalConfig({
          isOpen: true,
          type,
          image: reader.result
        });
      };
      reader.readAsDataURL(e.target.files[0]);
    }
    e.target.value = '';
  };

  const handleCropComplete = async (croppedImageBlob) => {
    setIsUploading(true);
    const { type } = cropModalConfig;
    setCropModalConfig({ isOpen: false, type: null, image: null });

    try {
      const folder = type + 's/' + restaurant.id;
      const file = new File([croppedImageBlob], type + '.jpg', { type: 'image/jpeg' });
      const url = await uploadProfileImage(folder, file);

      if (type === 'logo') {
        updateField('logo_url', url);
      } else if (type === 'cover') {
        updateField('cover_image_url', url);
      }
    } catch (error) {
      console.error('Failed to upload image', error);
      alert('Failed to upload image: ' + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const renderActions = (section) => (
    <div className="profile-card-actions">
      {editingCard === section ? (
        <>
          <button
            type="button"
            className="profile-secondary-action"
            onClick={handleCancel}
            disabled={saving || isUploading}
          >
            <X size={16} /> Cancel
          </button>
          <button
            type="button"
            className="profile-primary-action"
            onClick={handleSave}
            disabled={saving || isUploading}
          >
            {saving ? "Saving..." : <><Save size={16} /> Save</>}
          </button>
        </>
      ) : (
        <button
          type="button"
          className="profile-secondary-action"
          onClick={() => {
             // Reset form data to restaurant
             Object.keys(restaurant).forEach(key => updateField(key, restaurant[key]));
             setEditingCard(section);
          }}
          disabled={editingCard !== null && editingCard !== section}
        >
          <Edit3 size={16} /> Edit
        </button>
      )}
    </div>
  );

  const formatLabel = (status) => status.charAt(0).toUpperCase() + status.slice(1);

  return (
    <div className="profile-form-layout" style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' }}>
      
      {activeTab === 'general' && (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <div className="profile-section">
          <div className="profile-section-header">
            <div>
              <h3>Core Identity</h3>
              <p>Essential details about the restaurant.</p>
            </div>
            {renderActions('core')}
          </div>
          {editingCard === 'core' ? (
            <div className="profile-form-grid">
              <label className="profile-field">
                <span className="profile-field-label">Restaurant Name</span>
                <input
                  className="profile-input"
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => updateField('name', e.target.value)}
                />
              </label>

              <label className="profile-field">
                <span className="profile-field-label">Slug</span>
                <div style={{ display: 'flex', alignItems: 'stretch' }}>
                  <input
                    className="profile-input"
                    style={{ borderTopRightRadius: 0, borderBottomRightRadius: 0, flex: 1 }}
                    type="text"
                    value={formData.slug || ''}
                    onChange={(e) => updateField('slug', e.target.value)}
                  />
                  <span style={{ display: 'flex', alignItems: 'center', padding: '0 12px', background: 'var(--color-surface-hover, #EDF2F7)', border: '1px solid var(--color-border, #E2E8F0)', borderLeft: 'none', borderTopRightRadius: '8px', borderBottomRightRadius: '8px', fontSize: '14px', color: 'var(--color-text-muted, #4A5568)' }}>
                    .tablekard.com
                  </span>
                </div>
              </label>

              <label className="profile-field">
                <span className="profile-field-label">Tagline</span>
                <input
                  className="profile-input"
                  type="text"
                  value={formData.tagline || ''}
                  onChange={(e) => updateField('tagline', e.target.value)}
                />
              </label>

              <label className="profile-field">
                <span className="profile-field-label">Status</span>
                <select
                  className="profile-input"
                  value={formData.status || 'pending'}
                  onChange={(e) => updateField('status', e.target.value)}
                >
                  <optgroup label="── Onboarding ──">
                    <option value="pending">Pending — Awaiting Review</option>
                    <option value="approved">Approved — Ready to Subscribe</option>
                    <option value="rejected">Rejected</option>
                  </optgroup>
                  <optgroup label="── Subscription ──">
                    <option value="active">Active — Subscribed &amp; Operational</option>
                    <option value="suspended">Suspended — Service Halted</option>
                  </optgroup>
                </select>
              </label>
            </div>
          ) : (
            <div className="profile-form-grid">
              <div className="profile-info-item">
                <span className="profile-info-label">Restaurant Name</span>
                <span className="profile-info-value">{restaurant.name}</span>
              </div>
              <div className="profile-info-item">
                <span className="profile-info-label">Slug</span>
                <span className="profile-info-value">
                  {restaurant.slug ? (
                    <a href={`https://${restaurant.slug}.tablekard.com`} target="_blank" rel="noopener noreferrer" className="profile-link" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      {restaurant.slug}.tablekard.com <ExternalLink size={14} />
                    </a>
                  ) : "Not set"}
                </span>
              </div>
              <div className="profile-info-item">
                <span className="profile-info-label">Tagline</span>
                <span className="profile-info-value">{restaurant.tagline || "Not set"}</span>
              </div>
              <div className="profile-info-item">
                <span className="profile-info-label">Status</span>
                <span className={`status-badge ${(restaurant.status || '').toLowerCase()}`}>
                  {formatLabel(restaurant.status || 'unknown')}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="profile-section">
          <div className="profile-section-header">
            <div>
              <h3>Contact & Operating Hours</h3>
              <p>How customers can reach you and when you're open.</p>
            </div>
            {renderActions('contact')}
          </div>
          {editingCard === 'contact' ? (
            <div className="profile-form-grid">
              <div className="profile-field-span-2" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-muted, #718096)', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--color-border, #EDF2F7)', paddingBottom: '8px', marginBottom: '8px' }}>Contact</div>
              <label className="profile-field">
                <span className="profile-field-label">Email Address</span>
                <input className="profile-input" type="email" value={formData.contact_email || ''} onChange={(e) => updateField('contact_email', e.target.value)} />
              </label>
              <label className="profile-field">
                <span className="profile-field-label">Phone Number</span>
                <input className="profile-input" type="tel" value={formData.contact_phone || ''} onChange={(e) => updateField('contact_phone', e.target.value)} />
              </label>
              <label className="profile-field profile-field-span-2">
                <span className="profile-field-label">Physical Address</span>
                <textarea className="profile-input profile-textarea" value={formData.contact_address || ''} onChange={(e) => updateField('contact_address', e.target.value)} rows={2} />
              </label>
              <div className="profile-field-span-2" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-muted, #718096)', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--color-border, #EDF2F7)', paddingBottom: '8px', marginBottom: '8px', marginTop: '8px' }}>Operating Hours</div>
              <label className="profile-field">
                <span className="profile-field-label">Weekdays</span>
                <input className="profile-input" type="text" value={formData.operating_hours_weekdays || ''} onChange={(e) => updateField('operating_hours_weekdays', e.target.value)} placeholder="e.g., 9:00 AM - 10:00 PM" />
              </label>
              <label className="profile-field">
                <span className="profile-field-label">Weekends</span>
                <input className="profile-input" type="text" value={formData.operating_hours_weekends || ''} onChange={(e) => updateField('operating_hours_weekends', e.target.value)} placeholder="e.g., 10:00 AM - 11:00 PM" />
              </label>
            </div>
          ) : (
            <div className="profile-form-grid">
              <div className="profile-field-span-2" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-muted, #718096)', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--color-border, #EDF2F7)', paddingBottom: '8px', marginBottom: '8px' }}>Contact</div>
              <div className="profile-info-item">
                <span className="profile-info-label">Email Address</span>
                <span className="profile-info-value">{restaurant.contact_email ? <a href={`mailto:${restaurant.contact_email}`} className="profile-link">{restaurant.contact_email}</a> : "Not set"}</span>
              </div>
              <div className="profile-info-item">
                <span className="profile-info-label">Phone Number</span>
                <span className="profile-info-value">{restaurant.contact_phone ? <a href={`tel:${restaurant.contact_phone}`} className="profile-link">{restaurant.contact_phone}</a> : "Not set"}</span>
              </div>
              <div className="profile-info-item profile-field-span-2">
                <span className="profile-info-label">Physical Address</span>
                <span className="profile-info-value">{restaurant.contact_address || "Not set"}</span>
              </div>
              <div className="profile-field-span-2" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-muted, #718096)', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--color-border, #EDF2F7)', paddingBottom: '8px', marginBottom: '8px', marginTop: '8px' }}>Operating Hours</div>
              <div className="profile-info-item">
                <span className="profile-info-label">Weekdays</span>
                <span className="profile-info-value">{restaurant.operating_hours_weekdays || "Not set"}</span>
              </div>
              <div className="profile-info-item">
                <span className="profile-info-label">Weekends</span>
                <span className="profile-info-value">{restaurant.operating_hours_weekends || "Not set"}</span>
              </div>
            </div>
          )}
        </div>
      </div>
      )}

      {activeTab === 'branding' && (
      <div className="profile-section">
        <div className="profile-section-header">
          <div>
            <h3>Visual Identity & Links</h3>
            <p>Manage your restaurant's logo, cover, and social presence.</p>
          </div>
          {renderActions('branding')}
        </div>
        {editingCard === 'branding' ? (
          <div className="profile-form-grid">
            <div className="profile-field-span-2">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                <div className="profile-info-item">
                  <span className="profile-info-label">Logo</span>
                  <div className="image-upload-container">
                    {formData.logo_url ? (
                      <div className="image-preview-container">
                        <img src={formData.logo_url} alt="Logo preview" className="image-preview" style={{ width: '120px', height: '120px', objectFit: 'cover' }} />
                        <div className="image-preview-overlay">
                          <button type="button" onClick={() => fileInputRef.current?.click()} className="image-overlay-btn"><Edit3 size={16} /> Change</button>
                        </div>
                      </div>
                    ) : (
                      <button type="button" onClick={() => fileInputRef.current?.click()} className="image-upload-btn" style={{ width: '120px', height: '120px' }}>
                        <Upload size={24} /> <span>Upload Logo</span>
                      </button>
                    )}
                    <input type="file" accept="image/*" ref={fileInputRef} onChange={(e) => handleFileChange(e, 'logo')} style={{ display: 'none' }} />
                  </div>
                </div>

                <div className="profile-info-item">
                  <span className="profile-info-label">Cover Image</span>
                  <div className="image-upload-container">
                    {formData.cover_image_url ? (
                      <div className="image-preview-container">
                        <img src={formData.cover_image_url} alt="Cover preview" className="image-preview" style={{ width: '100%', height: '120px', objectFit: 'cover' }} />
                        <div className="image-preview-overlay">
                          <button type="button" onClick={() => coverInputRef.current?.click()} className="image-overlay-btn"><Edit3 size={16} /> Change</button>
                        </div>
                      </div>
                    ) : (
                      <button type="button" onClick={() => coverInputRef.current?.click()} className="image-upload-btn" style={{ height: '120px' }}>
                        <ImageIcon size={24} /> <span>Upload Cover</span>
                      </button>
                    )}
                    <input type="file" accept="image/*" ref={coverInputRef} onChange={(e) => handleFileChange(e, 'cover')} style={{ display: 'none' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="profile-form-grid">
            <div className="profile-field-span-2">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                <div className="profile-info-item">
                  <span className="profile-info-label">Logo</span>
                  {restaurant.logo_url ? (
                    <div className="image-preview-container">
                      <img src={restaurant.logo_url} alt="Logo" className="image-preview" style={{ width: '120px', height: '120px', objectFit: 'cover' }} />
                    </div>
                  ) : <div className="image-preview-container" style={{ width: '120px', height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-surface-hover, #F7FAFC)' }}><span style={{ color: 'var(--color-text-muted, #A0AEC0)', fontSize: '14px' }}>No logo</span></div>}
                </div>
                <div className="profile-info-item">
                  <span className="profile-info-label">Cover Image</span>
                  {restaurant.cover_image_url ? (
                    <div className="image-preview-container">
                      <img src={restaurant.cover_image_url} alt="Cover" className="image-preview" style={{ width: '100%', height: '120px', objectFit: 'cover' }} />
                    </div>
                  ) : <div className="image-preview-container" style={{ width: '100%', height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-surface-hover, #F7FAFC)' }}><span style={{ color: 'var(--color-text-muted, #A0AEC0)', fontSize: '14px' }}>No cover image</span></div>}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      )}

      {activeTab === 'story' && (
      <div className="profile-section">
        <div className="profile-section-header">
          <div>
            <h3>Our Story & Socials</h3>
            <p>Tell your customers about your restaurant.</p>
          </div>
          {renderActions('story')}
        </div>
        {editingCard === 'story' ? (
          <div className="profile-form-grid">
            <label className="profile-field">
              <span className="profile-field-label">Opening Date</span>
              <input className="profile-input" type="date" value={formData.opening_date || ''} onChange={(e) => updateField('opening_date', e.target.value)} />
            </label>
            <label className="profile-field profile-field-span-2">
              <span className="profile-field-label">Manifesto</span>
              <textarea className="profile-input profile-textarea" value={formData.manifesto || ''} onChange={(e) => updateField('manifesto', e.target.value)} rows={6} placeholder="Share your restaurant's story..." />
            </label>
            <label className="profile-field">
              <span className="profile-field-label">Instagram</span>
              <input className="profile-input" type="url" value={formData.instagram_url || ''} onChange={(e) => updateField('instagram_url', e.target.value)} placeholder="https://instagram.com/..." />
            </label>
            <label className="profile-field">
              <span className="profile-field-label">Facebook</span>
              <input className="profile-input" type="url" value={formData.facebook_url || ''} onChange={(e) => updateField('facebook_url', e.target.value)} placeholder="https://facebook.com/..." />
            </label>
            <label className="profile-field">
              <span className="profile-field-label">Website</span>
              <input className="profile-input" type="url" value={formData.website_url || ''} onChange={(e) => updateField('website_url', e.target.value)} placeholder="https://..." />
            </label>
          </div>
        ) : (
          <div className="profile-form-grid">
            <div className="profile-info-item">
              <span className="profile-info-label">Opening Date</span>
              <span className="profile-info-value">{restaurant.opening_date || "Not set"}</span>
            </div>
            <div className="profile-info-item profile-field-span-2">
              <span className="profile-info-label">Manifesto</span>
              <span className="profile-info-value" style={{ lineHeight: '1.6' }}>{restaurant.manifesto || "Not set"}</span>
            </div>
            <div className="profile-info-item">
              <span className="profile-info-label">Instagram</span>
              <span className="profile-info-value">{restaurant.instagram_url ? <a href={restaurant.instagram_url} target="_blank" rel="noopener noreferrer" className="profile-link">{restaurant.instagram_url} <ExternalLink size={14} /></a> : "Not set"}</span>
            </div>
            <div className="profile-info-item">
              <span className="profile-info-label">Facebook</span>
              <span className="profile-info-value">{restaurant.facebook_url ? <a href={restaurant.facebook_url} target="_blank" rel="noopener noreferrer" className="profile-link">{restaurant.facebook_url} <ExternalLink size={14} /></a> : "Not set"}</span>
            </div>
            <div className="profile-info-item">
              <span className="profile-info-label">Website</span>
              <span className="profile-info-value">{restaurant.website_url ? <a href={restaurant.website_url} target="_blank" rel="noopener noreferrer" className="profile-link">{restaurant.website_url} <ExternalLink size={14} /></a> : "Not set"}</span>
            </div>
          </div>
        )}
      </div>
      )}

      {activeTab === 'general' && (
      <div className="profile-section">
        <div className="profile-section-header">
          <div>
            <h3>System Meta</h3>
            <p>Internal read-only metrics.</p>
          </div>
        </div>
        <div className="profile-form-grid">
          <div className="profile-info-item">
            <span className="profile-info-label">Onboarded Date</span>
            <span className="profile-info-value">{new Date(restaurant.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          </div>
          <div className="profile-info-item">
            <span className="profile-info-label">Opening Date</span>
            <span className="profile-info-value">{restaurant.opening_date || '—'}</span>
          </div>
          <div className="profile-info-item">
            <span className="profile-info-label">Last Update</span>
            <span className="profile-info-value">{new Date(restaurant.updated_at).toLocaleString()}</span>
          </div>
        </div>
      </div>
      )}

      {activeTab === 'admin' && (
        <div className="profile-section">
          <div className="profile-section-header">
            <div>
              <h3>Admin Profile</h3>
              <p>Primary administrators for this restaurant.</p>
            </div>
          </div>
          <div className="profile-form-grid">
            {admins && admins.length > 0 ? (
              admins.map((admin, idx) => (
                <div key={admin.id} className="profile-info-item profile-field-span-2">
                  <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                    {admin.avatar_url ? (
                      <img src={admin.avatar_url} alt={admin.name} style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'var(--color-surface, #F7FAFC)', border: '1px solid var(--color-border, #E2E8F0)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-main, #2D3748)', fontSize: '20px', fontWeight: 'bold' }}>
                        {(admin.name || admin.email || '?').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px' }}>
                      <div className="profile-info-item">
                        <span className="profile-info-label">Full Name</span>
                        <span className="profile-info-value">{admin.name || 'Unnamed Admin'}</span>
                      </div>
                      <div className="profile-info-item">
                        <span className="profile-info-label">Email Address</span>
                        <span className="profile-info-value">{admin.email ? <a href={`mailto:${admin.email}`} className="profile-link">{admin.email}</a> : 'N/A'}</span>
                      </div>
                      <div className="profile-info-item">
                        <span className="profile-info-label">Account ID</span>
                        <span className="profile-info-value" style={{ fontFamily: 'monospace', fontSize: '13px' }}>{admin.id}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="profile-info-item profile-field-span-2" style={{ textAlign: 'center', padding: '32px' }}>
                <span className="profile-info-value" style={{ color: 'var(--text-muted)' }}>No administrators found for this restaurant.</span>
              </div>
            )}
          </div>
        </div>
      )}

      {cropModalConfig.isOpen && (
        <ImageCropper
          image={cropModalConfig.image}
          aspect={cropModalConfig.type === 'logo' ? 1 : 21/9}
          circular={cropModalConfig.type === 'logo'}
          onCancel={() => setCropModalConfig({ isOpen: false, type: null, image: null })}
          onCropComplete={handleCropComplete}
        />
      )}
    </div>
  );
}
