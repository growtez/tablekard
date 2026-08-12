import React, { useState } from 'react';
import { ExternalLink, CreditCard, Mail as MailIcon, Phone as PhoneIcon, MapPin as MapPinIcon, Crosshair } from 'lucide-react';
import { supabase } from '../supabaseClient';
import './RestaurantDetailProfile.css';

const formatCoordinate = (value) => {
  if (value == null || Number.isNaN(value) || value === '') return "Not set";
  return Number(value).toFixed(6);
};

const get24hTime = (timeString, type) => {
  if (!timeString) return '';
  const parts = timeString.split(' - ');
  const time = type === 'open' ? parts[0] : parts[1];
  if (!time) return '';
  const [timeVal, modifier] = time.split(' ');
  if (!modifier) return timeVal;
  let [hours, minutes] = timeVal.split(':');
  if (hours === '12') hours = '00';
  if (modifier === 'PM') hours = (parseInt(hours, 10) + 12).toString();
  return `${hours.toString().padStart(2, '0')}:${minutes}`;
};

const handleTimeChange = (dayType, openClose, val, updateField, formData) => {
  const to12h = (t24) => {
    if (!t24) return '';
    let [h, m] = t24.split(':');
    let ampm = 'AM';
    h = parseInt(h, 10);
    if (h >= 12) {
      ampm = 'PM';
      if (h > 12) h -= 12;
    }
    if (h === 0) h = 12;
    return `${h.toString().padStart(2, '0')}:${m} ${ampm}`;
  };

  const field = dayType === 'weekdays' ? 'operating_hours_weekdays' : 'operating_hours_weekends';
  const current = formData[field] || '09:00 AM - 10:00 PM';
  const parts = current.split(' - ');
  let open = parts[0] || '09:00 AM';
  let close = parts[1] || '10:00 PM';
  
  if (openClose === 'open') {
    open = to12h(val);
  } else {
    close = to12h(val);
  }
  
  updateField(field, `${open} - ${close}`);
};

const Row = ({ label, children, plain }) => (
  <div className="grid grid-cols-[220px_1fr] sm:grid-cols-[260px_1fr] gap-2 py-1 items-center">
    <span className="text-[13px] text-text-muted font-semibold uppercase tracking-[0.5px] font-['Outfit',sans-serif]">
      {label}
    </span>
    {plain ? (
      <div className="text-[15px] text-text-main font-medium font-['Outfit',sans-serif] flex items-center w-full">
        {children}
      </div>
    ) : (
      <div className="text-[15px] text-text-main font-medium font-['Outfit',sans-serif] flex justify-start items-center w-full gap-2 min-h-[46px]">
        {children}
      </div>
    )}
  </div>
);

const SectionHeader = ({ title }) => (
  <div className="pt-4 pb-2 border-b border-border">
    <h3 className="text-[18px] font-bold text-text-main font-['Outfit',sans-serif] m-0 uppercase tracking-wide">
      {title}
    </h3>
  </div>
);

export default function RestaurantProfileView({
  restaurant,
  formData,
  updateField,
  saving,
  handleSave,
  handleCancel,
  editingCard,
  setEditingCard,
  activeTab
}) {
  const [slugAvailable, setSlugAvailable] = useState(null);
  const [checkingSlug, setCheckingSlug] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  const isEditingProfile = editingCard === 'general';

  const checkSlugAvailability = async (slugToCheck) => {
    if (!slugToCheck || slugToCheck === restaurant?.slug) {
      setSlugAvailable(null);
      return;
    }
    setCheckingSlug(true);
    try {
      const { data, error } = await supabase
        .from('restaurants')
        .select('id')
        .eq('slug', slugToCheck);
      
      if (!error) {
        setSlugAvailable(data.length === 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCheckingSlug(false);
    }
  };

  const handleSlugChange = (val) => {
    updateField('slug', val);
    const timer = setTimeout(() => checkSlugAvailability(val), 500);
    return () => clearTimeout(timer);
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        updateField('latitude', position.coords.latitude);
        updateField('longitude', position.coords.longitude);
        setIsLocating(false);
      },
      () => {
        alert("Unable to retrieve your location");
        setIsLocating(false);
      }
    );
  };

  if (!restaurant || activeTab !== 'general') return null;

  return (
    <div className="flex flex-col gap-0 w-full max-w-5xl animate-fade-in bg-surface p-6 rounded-2xl shadow-sm border border-border">
      
      <div className="flex items-center justify-between mb-6 border-b border-border pb-4">
        <div>
           <h2 className="text-xl font-bold m-0 text-text-main">General Information</h2>
           <p className="text-sm text-text-muted mt-1">Manage restaurant identity, contact, and operations.</p>
        </div>
        <div className="flex gap-2">
          {isEditingProfile ? (
            <>
              <button onClick={handleCancel} disabled={saving} className="px-4 py-2 bg-surface-hover text-text-muted font-bold rounded-xl border-none cursor-pointer hover:bg-border transition-colors">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-accent-primary text-black font-bold rounded-xl border-none cursor-pointer hover:shadow-md transition-all shadow-sm">
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </>
          ) : (
            <button onClick={() => {
                Object.keys(restaurant).forEach(key => updateField(key, restaurant[key]));
                setEditingCard('general');
            }} className="px-4 py-2 bg-accent-primary text-black font-bold rounded-xl border-none cursor-pointer hover:shadow-md transition-all shadow-sm">
              Edit Info
            </button>
          )}
        </div>
      </div>

      <SectionHeader title="Core Details" />
      <Row label="Restaurant Name">
        {isEditingProfile ? (
          <div className="flex items-center justify-between w-full gap-2">
            <input
              type="text"
              className="w-full border border-border rounded-xl bg-surface text-text-main px-3.5 py-1.5 text-[14px] font-['Outfit',sans-serif] focus:outline-none focus:border-accent-primary"
              value={formData.name || ''}
              onChange={(e) => updateField("name", e.target.value)}
              maxLength={120}
            />
          </div>
        ) : (
          <span>{restaurant.name}</span>
        )}
      </Row>

      <Row label="Tagline">
        {isEditingProfile ? (
          <div className="flex items-center justify-between w-full gap-2">
            <input
              type="text"
              className="w-full border border-border rounded-xl bg-surface text-text-main px-3.5 py-1.5 text-[14px] font-['Outfit',sans-serif] focus:outline-none focus:border-accent-primary"
              value={formData.tagline || ''}
              placeholder="A short catchy phrase"
              onChange={(e) => updateField("tagline", e.target.value)}
            />
          </div>
        ) : (
          <span>{restaurant.tagline || "Not set"}</span>
        )}
      </Row>

      <Row label="Manifesto">
        {isEditingProfile ? (
          <div className="flex items-start justify-between w-full gap-2">
            <textarea
              className="w-full border border-border rounded-xl bg-surface text-text-main px-3.5 py-2 text-[14px] font-['Outfit',sans-serif] focus:outline-none focus:border-accent-primary min-h-[60px]"
              value={formData.manifesto || ''}
              placeholder="Tell the story of your restaurant..."
              onChange={(e) => updateField("manifesto", e.target.value)}
              rows={3}
            />
          </div>
        ) : (
          <span>{restaurant.manifesto || "Not set"}</span>
        )}
      </Row>

      <Row label="Opening Date">
        {isEditingProfile ? (
          <div className="flex items-center justify-between w-full gap-2">
            <input
              type="date"
              className="w-full border border-border rounded-xl bg-surface text-text-main px-3.5 py-1.5 text-[14px] font-['Outfit',sans-serif] focus:outline-none focus:border-accent-primary"
              value={formData.opening_date || ''}
              onChange={(e) => updateField("opening_date", e.target.value)}
            />
          </div>
        ) : (
          <span>{restaurant.opening_date || "Not set"}</span>
        )}
      </Row>

      <Row label="Status">
        {isEditingProfile ? (
          <div className="flex items-center justify-between w-full gap-2">
            <select
                className="w-full border border-border rounded-xl bg-surface text-text-main px-3.5 py-1.5 text-[14px] font-['Outfit',sans-serif] focus:outline-none focus:border-accent-primary"
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
          </div>
        ) : (
          <span className="capitalize">{restaurant.status}</span>
        )}
      </Row>

      <Row label="Subscription Status" plain>
        <div className="flex items-center gap-3">
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[13px] font-semibold"
            style={{
              backgroundColor: restaurant.subscription_status ? "rgba(16, 185, 129, 0.15)" : "rgba(113, 113, 122, 0.2)",
              color: restaurant.subscription_status ? "#10b981" : "#71717a",
            }}
          >
            <CreditCard size={14} />
            {restaurant.subscription_status ? "Active" : "Inactive"}
            {restaurant.subscription_type ? ` (${restaurant.subscription_type})` : ""}
          </span>
        </div>
      </Row>

      <SectionHeader title="Contact Information" />
      <Row label="Email Address">
        {isEditingProfile ? (
          <div className="flex items-center justify-between w-full gap-2">
            <input
              type="email"
              className="w-full border border-border rounded-xl bg-surface text-text-main px-3.5 py-1.5 text-[14px] font-['Outfit',sans-serif] focus:outline-none focus:border-accent-primary"
              value={formData.contact_email || ''}
              placeholder="ops@restaurant.com"
              onChange={(e) => updateField("contact_email", e.target.value)}
            />
          </div>
        ) : (
          <span className="inline-flex items-center gap-2">
            <MailIcon size={15} />
            {restaurant.contact_email || "N/A"}
          </span>
        )}
      </Row>

      <Row label="Phone Number">
        {isEditingProfile ? (
          <div className="flex items-center justify-between w-full gap-2">
            <input
              type="tel"
              className="w-full border border-border rounded-xl bg-surface text-text-main px-3.5 py-1.5 text-[14px] font-['Outfit',sans-serif] focus:outline-none focus:border-accent-primary"
              value={formData.contact_phone || ''}
              placeholder="+91 98765 43210"
              onChange={(e) => updateField("contact_phone", e.target.value)}
            />
          </div>
        ) : (
          <span className="inline-flex items-center gap-2">
            <PhoneIcon size={15} />
            {restaurant.contact_phone || "N/A"}
          </span>
        )}
      </Row>

      <SectionHeader title="Location & Operations" />
      <Row label="Address">
        {isEditingProfile ? (
          <div className="flex items-start justify-between w-full gap-2">
            <textarea
              className="w-full border border-border rounded-xl bg-surface text-text-main px-3.5 py-2 text-[14px] font-['Outfit',sans-serif] focus:outline-none focus:border-accent-primary min-h-[60px]"
              value={formData.contact_address || ''}
              placeholder="Street, locality, city, state"
              onChange={(e) => updateField("contact_address", e.target.value)}
              rows={2}
            />
          </div>
        ) : (
          <span className="inline-flex items-center gap-2">
            <MapPinIcon size={15} />
            {restaurant.contact_address || "N/A"}
          </span>
        )}
      </Row>

      <Row label="Operating Hours (Weekdays)">
        {isEditingProfile ? (
          <div className="flex items-center justify-between w-full gap-2">
            <div className="flex items-center gap-2">
              <input
                type="time"
                className="border border-border rounded-xl bg-surface text-text-main px-3 py-1.5 text-[14px] font-['Outfit',sans-serif] focus:outline-none focus:border-accent-primary"
                value={get24hTime(formData.operating_hours_weekdays, "open")}
                onChange={(e) => handleTimeChange("weekdays", "open", e.target.value, updateField, formData)}
              />
              <span className="text-text-muted text-[13px]">to</span>
              <input
                type="time"
                className="border border-border rounded-xl bg-surface text-text-main px-3 py-1.5 text-[14px] font-['Outfit',sans-serif] focus:outline-none focus:border-accent-primary"
                value={get24hTime(formData.operating_hours_weekdays, "close")}
                onChange={(e) => handleTimeChange("weekdays", "close", e.target.value, updateField, formData)}
              />
            </div>
          </div>
        ) : (
          <span>{restaurant.operating_hours_weekdays || "Not set"}</span>
        )}
      </Row>

      <Row label="Operating Hours (Weekends)">
        {isEditingProfile ? (
          <div className="flex items-center justify-between w-full gap-2">
            <div className="flex items-center gap-2">
              <input
                type="time"
                className="border border-border rounded-xl bg-surface text-text-main px-3 py-1.5 text-[14px] font-['Outfit',sans-serif] focus:outline-none focus:border-accent-primary"
                value={get24hTime(formData.operating_hours_weekends, "open")}
                onChange={(e) => handleTimeChange("weekends", "open", e.target.value, updateField, formData)}
              />
              <span className="text-text-muted text-[13px]">to</span>
              <input
                type="time"
                className="border border-border rounded-xl bg-surface text-text-main px-3 py-1.5 text-[14px] font-['Outfit',sans-serif] focus:outline-none focus:border-accent-primary"
                value={get24hTime(formData.operating_hours_weekends, "close")}
                onChange={(e) => handleTimeChange("weekends", "close", e.target.value, updateField, formData)}
              />
            </div>
          </div>
        ) : (
          <span>{restaurant.operating_hours_weekends || "Not set"}</span>
        )}
      </Row>

      <Row label="Location Coordinates">
        <div className="flex w-full items-center flex-wrap gap-4">
          {isEditingProfile ? (
            <div className="flex flex-col w-full gap-3 py-1">
              <div className="flex items-center justify-between w-full gap-2">
                <div className="flex items-center gap-3 w-full flex-wrap">
                  <label className="flex items-center gap-1.5 text-[12px] text-text-muted font-semibold">
                    Lat:
                    <input
                      type="number"
                      min="-90"
                      max="90"
                      step="0.000001"
                      className="w-28 border border-border rounded-xl bg-surface text-text-main px-2.5 py-1 text-[13px] font-['Outfit',sans-serif] focus:outline-none focus:border-accent-primary"
                      value={formData.latitude || ''}
                      onChange={(e) => updateField("latitude", e.target.value)}
                    />
                  </label>
                  <label className="flex items-center gap-1.5 text-[12px] text-text-muted font-semibold">
                    Lng:
                    <input
                      type="number"
                      min="-180"
                      max="180"
                      step="0.000001"
                      className="w-28 border border-border rounded-xl bg-surface text-text-main px-2.5 py-1 text-[13px] font-['Outfit',sans-serif] focus:outline-none focus:border-accent-primary"
                      value={formData.longitude || ''}
                      onChange={(e) => updateField("longitude", e.target.value)}
                    />
                  </label>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 px-3 py-1 border border-dashed border-accent-primary rounded-xl bg-accent-primary/10 text-accent-primary text-[12px] font-semibold cursor-pointer shrink-0"
                    onClick={handleUseMyLocation}
                    disabled={isLocating}
                  >
                    <Crosshair size={14} />
                    {isLocating ? "Locating…" : "Current Location"}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <span className="inline-flex items-center gap-2">
              <MapPinIcon size={15} />
              {`${formatCoordinate(restaurant.latitude)}, ${formatCoordinate(restaurant.longitude)}`}
            </span>
          )}
        </div>
      </Row>

      <Row label="Access Area Radius">
        {isEditingProfile ? (
          <div className="flex items-center justify-between w-full gap-2">
            <div className="flex items-center gap-2 w-full">
              <input
                type="number"
                min="1"
                step="1"
                className="w-32 border border-border rounded-xl bg-surface text-text-main px-3.5 py-1.5 text-[14px] font-['Outfit',sans-serif] focus:outline-none focus:border-accent-primary"
                value={formData.allowed_radius || ''}
                placeholder="150"
                onChange={(e) => updateField("allowed_radius", e.target.value)}
              />
              <span className="text-[14px] text-text-muted">meters</span>
            </div>
          </div>
        ) : (
          <span>{restaurant.allowed_radius != null ? `${restaurant.allowed_radius} meters` : "Not set"}</span>
        )}
      </Row>

      <SectionHeader title="Web & Social Media" />
      <Row label="Restaurant Page URL">
        {isEditingProfile ? (
          <div className="flex items-center justify-between w-full gap-2">
            <div className="relative flex items-center w-full">
              <span className="px-3 py-1.5 bg-surface-hover border border-border border-r-0 rounded-l-xl text-text-muted text-[13px] font-['Outfit',sans-serif] select-none shrink-0">
                tablekard.com/
              </span>
              <input
                type="text"
                className={`w-full border rounded-r-xl bg-surface text-text-main px-3 py-1.5 text-[14px] font-['Outfit',sans-serif] focus:outline-none pr-[130px] ${slugAvailable === false ? "border-red-500 text-red-500" : "border-border focus:border-accent-primary"}`}
                value={formData.slug || ''}
                onChange={(e) => handleSlugChange(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                maxLength={60}
              />
              {checkingSlug ? (
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted text-[12px] font-medium bg-surface px-1 flex items-center gap-1.5">
                  Checking...
                </span>
              ) : formData.slug !== restaurant.slug ? (
                <>
                  {slugAvailable === true && formData.slug && (
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-emerald-500 text-[12px] font-medium bg-surface px-1">
                      ✓ Available
                    </span>
                  )}
                  {slugAvailable === false && formData.slug && (
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-red-500 text-[12px] font-medium bg-surface px-1">
                      ✕ Unavailable
                    </span>
                  )}
                </>
              ) : null}
            </div>
          </div>
        ) : (
          <a
            href={`https://tablekard.com/${restaurant.slug || restaurant.name?.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || ""}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 w-fit text-accent-primary text-[14px] font-medium no-underline break-all font-['Outfit',sans-serif] hover:underline"
          >
            tablekard.com/{restaurant.slug || restaurant.name?.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || ""} <ExternalLink size={14} />
          </a>
        )}
      </Row>

      <Row label="Website URL">
        {isEditingProfile ? (
          <div className="flex items-center justify-between w-full gap-2">
            <input
              type="url"
              className="w-full border border-border rounded-xl bg-surface text-text-main px-3.5 py-1.5 text-[14px] font-['Outfit',sans-serif] focus:outline-none focus:border-accent-primary"
              value={formData.website_url || ''}
              placeholder="https://yourrestaurant.com"
              onChange={(e) => updateField("website_url", e.target.value)}
            />
          </div>
        ) : (
          <span>{restaurant.website_url || "Not set"}</span>
        )}
      </Row>

      <Row label="Instagram URL">
        {isEditingProfile ? (
          <div className="flex items-center justify-between w-full gap-2">
            <input
              type="url"
              className="w-full border border-border rounded-xl bg-surface text-text-main px-3.5 py-1.5 text-[14px] font-['Outfit',sans-serif] focus:outline-none focus:border-accent-primary"
              value={formData.instagram_url || ''}
              placeholder="https://instagram.com/yourrestaurant"
              onChange={(e) => updateField("instagram_url", e.target.value)}
            />
          </div>
        ) : (
          <span>{restaurant.instagram_url || "Not set"}</span>
        )}
      </Row>

      <Row label="Facebook URL">
        {isEditingProfile ? (
          <div className="flex items-center justify-between w-full gap-2">
            <input
              type="url"
              className="w-full border border-border rounded-xl bg-surface text-text-main px-3.5 py-1.5 text-[14px] font-['Outfit',sans-serif] focus:outline-none focus:border-accent-primary"
              value={formData.facebook_url || ''}
              placeholder="https://facebook.com/yourrestaurant"
              onChange={(e) => updateField("facebook_url", e.target.value)}
            />
          </div>
        ) : (
          <span>{restaurant.facebook_url || "Not set"}</span>
        )}
      </Row>
    </div>
  );
}
