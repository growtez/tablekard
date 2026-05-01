import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    Bell,
    BuildingIcon,
    CreditCardIcon,
    Crosshair,
    Edit3,
    ExternalLink,
    ImageIcon,
    MailIcon,
    MapPinIcon,
    PhoneIcon,
    Save,
    Upload,
    UserCircleIcon,
    X
} from 'lucide-react';
import type { Restaurant } from '@restaurant-saas/types';
import Sidebar from '../../components/sidebar';
import { useAuth } from '../../context/AuthContext';
import {
    getRestaurantById,
    updateAdministratorProfile,
    updateRestaurantProfile
} from '../../services/supabaseService';
import { uploadProfileImage } from '../../services/storageService';
import './profile.css';

interface RestaurantFormState {
    name: string;
    contactEmail: string;
    contactPhone: string;
    contactAddress: string;
    logoUrl: string;
    primaryColor: string;
    secondaryColor: string;
    latitude: string;
    longitude: string;
    allowedRadius: string;
    openingDate: string;
    tagline: string;
    manifesto: string;
    operatingHoursWeekdays: string;
    operatingHoursWeekends: string;
    instagramUrl: string;
    facebookUrl: string;
    websiteUrl: string;
}

interface AdminFormState {
    name: string;
    email: string;
    avatarUrl: string;
}

interface FeedbackState {
    tone: 'success' | 'error' | 'info';
    message: string;
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const hexColorPattern = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

const getErrorMessage = (error: unknown, fallback: string): string => {
    if (error instanceof Error && error.message) {
        return error.message;
    }

    if (typeof error === 'object' && error !== null && 'message' in error) {
        const maybeMessage = (error as { message?: unknown }).message;
        if (typeof maybeMessage === 'string' && maybeMessage.trim()) {
            return maybeMessage;
        }
    }

    return fallback;
};

const emptyToNull = (value: string): string | null => {
    const normalized = value.trim();
    return normalized ? normalized : null;
};

const parseOptionalNumber = (value: string): number | null => {
    const normalized = value.trim();
    if (!normalized) {
        return null;
    }

    return Number(normalized);
};

const parseOptionalInteger = (value: string): number | null => {
    const normalized = value.trim();
    if (!normalized) {
        return null;
    }

    return Number.parseInt(normalized, 10);
};

const isValidUrl = (value: string): boolean => {
    try {
        const parsed = new URL(value);
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
        return false;
    }
};

const getInitials = (name?: string | null): string => {
    if (!name) return 'AD';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
};

const formatLabel = (value?: string | null): string => {
    if (!value) {
        return 'N/A';
    }

    return value
        .replace(/_/g, ' ')
        .toLowerCase()
        .replace(/\b\w/g, char => char.toUpperCase());
};

const createRestaurantFormState = (restaurant: Restaurant): RestaurantFormState => ({
    name: restaurant.name ?? '',
    contactEmail: restaurant.contact.email ?? '',
    contactPhone: restaurant.contact.phone ?? '',
    contactAddress: restaurant.contact.address ?? '',
    logoUrl: restaurant.branding?.logoUrl ?? '',
    primaryColor: restaurant.branding?.primaryColor ?? '',
    secondaryColor: restaurant.branding?.secondaryColor ?? '',
    latitude: restaurant.location?.latitude != null ? String(restaurant.location.latitude) : '',
    longitude: restaurant.location?.longitude != null ? String(restaurant.location.longitude) : '',
    allowedRadius: restaurant.location?.allowedRadius != null ? String(restaurant.location.allowedRadius) : '',
    openingDate: restaurant.openingDate ?? '',
    tagline: restaurant.tagline ?? '',
    manifesto: restaurant.manifesto ?? '',
    operatingHoursWeekdays: restaurant.operatingHoursWeekdays ?? '',
    operatingHoursWeekends: restaurant.operatingHoursWeekends ?? '',
    instagramUrl: restaurant.instagramUrl ?? '',
    facebookUrl: restaurant.facebookUrl ?? '',
    websiteUrl: restaurant.websiteUrl ?? ''
});

const createAdminFormState = (profile: {
    name?: string | null;
    email?: string | null;
    avatarUrl?: string | null;
} | null): AdminFormState => ({
    name: profile?.name ?? '',
    email: profile?.email ?? '',
    avatarUrl: profile?.avatarUrl ?? ''
});

const formatCoordinate = (value?: number | null): string => {
    if (value == null || Number.isNaN(value)) {
        return 'Not set';
    }

    return value.toFixed(6);
};

const validateRestaurantForm = (form: RestaurantFormState): string | null => {
    if (!form.name.trim()) return 'Restaurant name is required.';
    if (!form.contactEmail.trim() || !emailPattern.test(form.contactEmail.trim())) return 'A valid contact email is required.';
    if (form.logoUrl.trim() && !isValidUrl(form.logoUrl.trim())) return 'Logo URL must be a valid http or https URL.';
    if (form.primaryColor.trim() && !hexColorPattern.test(form.primaryColor.trim())) return 'Primary color must be a valid hex value like #1F2937.';
    if (form.secondaryColor.trim() && !hexColorPattern.test(form.secondaryColor.trim())) return 'Secondary color must be a valid hex value like #F59E0B.';

    const latitude = parseOptionalNumber(form.latitude);
    const longitude = parseOptionalNumber(form.longitude);
    const radius = parseOptionalInteger(form.allowedRadius);

    if (latitude != null && Number.isNaN(latitude)) return 'Latitude must be a valid number.';
    if (longitude != null && Number.isNaN(longitude)) return 'Longitude must be a valid number.';
    if ((latitude == null) !== (longitude == null)) return 'Latitude and longitude must be provided together.';
    if (latitude != null && (latitude < -90 || latitude > 90)) return 'Latitude must be between -90 and 90.';
    if (longitude != null && (longitude < -180 || longitude > 180)) return 'Longitude must be between -180 and 180.';
    if (radius != null && (Number.isNaN(radius) || radius <= 0)) return 'Access area radius must be a positive whole number.';

    return null;
};

const validateAdminForm = (form: AdminFormState): string | null => {
    if (!form.name.trim()) return 'Administrator name is required.';
    if (!form.email.trim() || !emailPattern.test(form.email.trim())) return 'Administrator email must be valid.';
    if (form.avatarUrl.trim() && !isValidUrl(form.avatarUrl.trim())) return 'Avatar URL must be a valid http or https URL.';
    return null;
};

const ProfilePage: React.FC = () => {
    const { userProfile, activeRestaurantId, memberships, refreshSessionData } = useAuth();
    const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
    const [restaurantForm, setRestaurantForm] = useState<RestaurantFormState | null>(null);
    const [adminForm, setAdminForm] = useState<AdminFormState>(createAdminFormState(userProfile));
    const [isLoading, setIsLoading] = useState(true);
    const [feedback, setFeedback] = useState<FeedbackState | null>(null);
    const [isRestaurantEditing, setIsRestaurantEditing] = useState(false);
    const [isAdminEditing, setIsAdminEditing] = useState(false);
    const [isRestaurantSaving, setIsRestaurantSaving] = useState(false);
    const [isAdminSaving, setIsAdminSaving] = useState(false);

    const activeMembership = memberships.find(membership => membership.restaurantId === activeRestaurantId);

    useEffect(() => {
        setAdminForm(createAdminFormState(userProfile));
    }, [userProfile]);

    useEffect(() => {
        const fetchRestaurantDetails = async () => {
            if (!activeRestaurantId) {
                setRestaurant(null);
                setRestaurantForm(null);
                setIsLoading(false);
                return;
            }

            try {
                setIsLoading(true);
                setFeedback(null);
                const data = await getRestaurantById(activeRestaurantId);
                setRestaurant(data);
                setRestaurantForm(data ? createRestaurantFormState(data) : null);
            } catch (error: unknown) {
                console.error('Error fetching restaurant context:', error);
                setFeedback({ tone: 'error', message: getErrorMessage(error, 'Failed to load restaurant details. Please try again.') });
            } finally {
                setIsLoading(false);
            }
        };

        void fetchRestaurantDetails();
    }, [activeRestaurantId]);

    const resetRestaurantForm = () => {
        if (restaurant) setRestaurantForm(createRestaurantFormState(restaurant));
    };

    const resetAdminForm = () => {
        setAdminForm(createAdminFormState(userProfile));
    };

    const handleRestaurantFieldChange = (field: keyof RestaurantFormState, value: string) => {
        setRestaurantForm(current => current ? { ...current, [field]: value } : current);
    };

    const handleAdminFieldChange = (field: keyof AdminFormState, value: string) => {
        setAdminForm(current => ({ ...current, [field]: value }));
    };

    const [isLocating, setIsLocating] = useState(false);

    const get24hTime = (text: string | undefined | null, type: 'open' | 'close') => {
        if (!text) return type === 'open' ? '10:00' : '22:00';
        const times = text.match(/(\d{1,2}:\d{2}\s*(?:AM|PM)?)/gi);
        if (times && times.length >= 2) {
            const timeStr = type === 'open' ? times[0] : times[1];
            const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
            if (!match) return type === 'open' ? '10:00' : '22:00';
            let [_, h, m, ampm] = match;
            let hours = parseInt(h, 10);
            if (ampm) {
                if (ampm.toUpperCase() === 'PM' && hours < 12) hours += 12;
                if (ampm.toUpperCase() === 'AM' && hours === 12) hours = 0;
            }
            return `${hours.toString().padStart(2, '0')}:${m}`;
        }
        return type === 'open' ? '10:00' : '22:00';
    };

    const handleTimeChange = (dayType: 'weekdays' | 'weekends', timeType: 'open' | 'close', val: string) => {
        if (!restaurantForm) return;
        const field = dayType === 'weekdays' ? 'operatingHoursWeekdays' : 'operatingHoursWeekends';
        const prefix = dayType === 'weekdays' ? 'Mon-Fri' : 'Sat-Sun';
        const currentText = restaurantForm[field];
        const currentOpen24 = get24hTime(currentText, 'open');
        const currentClose24 = get24hTime(currentText, 'close');
        
        const newOpen24 = timeType === 'open' ? val : currentOpen24;
        const newClose24 = timeType === 'close' ? val : currentClose24;
        
        const formatTime12h = (t: string) => {
            if (!t) return '';
            const [h, m] = t.split(':');
            let hours = parseInt(h, 10);
            const ampm = hours >= 12 ? 'PM' : 'AM';
            hours = hours % 12 || 12;
            return `${hours}:${m} ${ampm}`;
        };
        
        handleRestaurantFieldChange(field, `${prefix} ${formatTime12h(newOpen24)} - ${formatTime12h(newClose24)}`);
    };

    const mapInstanceRef = useRef<any>(null);
    const mapMarkerRef = useRef<any>(null);

    useEffect(() => {
        if (isRestaurantEditing) {
            const initMap = () => {
                const L = (window as any).L;
                if (!L) return;
                const mapEl = document.getElementById('profile-map');
                if (!mapEl) return;
                
                if (mapInstanceRef.current) return;
                
                const initialLat = parseFloat(restaurantForm?.latitude || '26.1445');
                const initialLng = parseFloat(restaurantForm?.longitude || '91.7362');
                
                // Fix for leaflet marker icon
                delete L.Icon.Default.prototype._getIconUrl;
                L.Icon.Default.mergeOptions({
                    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
                    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
                    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
                });
                
                const map = L.map('profile-map').setView([initialLat, initialLng], 13);
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '© OpenStreetMap'
                }).addTo(map);
                
                const marker = L.marker([initialLat, initialLng], { draggable: true }).addTo(map);
                
                marker.on('dragend', function () {
                    const position = marker.getLatLng();
                    setRestaurantForm(current => current ? {
                        ...current,
                        latitude: position.lat.toFixed(6),
                        longitude: position.lng.toFixed(6)
                    } : current);
                });
                
                map.on('click', function (event: any) {
                    const position = event.latlng;
                    marker.setLatLng(position);
                    map.setView(position);
                    setRestaurantForm(current => current ? {
                        ...current,
                        latitude: position.lat.toFixed(6),
                        longitude: position.lng.toFixed(6)
                    } : current);
                });
                
                mapInstanceRef.current = map;
                mapMarkerRef.current = marker;
            };

            if (!(window as any).L) {
                if (!document.getElementById('leaflet-css')) {
                    const link = document.createElement('link');
                    link.id = 'leaflet-css';
                    link.rel = 'stylesheet';
                    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
                    document.head.appendChild(link);
                }

                if (!document.getElementById('leaflet-script')) {
                    const script = document.createElement('script');
                    script.id = 'leaflet-script';
                    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
                    script.onload = initMap;
                    document.head.appendChild(script);
                }
            } else {
                setTimeout(initMap, 100);
            }
        } else {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
                mapMarkerRef.current = null;
            }
        }
    }, [isRestaurantEditing]);

    useEffect(() => {
        if (mapInstanceRef.current && mapMarkerRef.current && restaurantForm) {
            const lat = parseFloat(restaurantForm.latitude || '0');
            const lng = parseFloat(restaurantForm.longitude || '0');
            const currentPos = mapMarkerRef.current.getLatLng();
            if (Math.abs(currentPos.lat - lat) > 0.0001 || Math.abs(currentPos.lng - lng) > 0.0001) {
                mapMarkerRef.current.setLatLng([lat, lng]);
                mapInstanceRef.current.setView([lat, lng]);
            }
        }
    }, [restaurantForm?.latitude, restaurantForm?.longitude]);


    const handleUseMyLocation = () => {
        if (!navigator.geolocation) {
            setFeedback({ tone: 'error', message: 'Geolocation is not supported by your browser.' });
            return;
        }

        setIsLocating(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setRestaurantForm(current => current ? {
                    ...current,
                    latitude: position.coords.latitude.toFixed(6),
                    longitude: position.coords.longitude.toFixed(6)
                } : current);
                setIsLocating(false);
                setFeedback({ tone: 'success', message: 'Location coordinates filled from your device.' });
            },
            (error) => {
                setIsLocating(false);
                let message = 'Failed to get your location.';
                if (error.code === error.PERMISSION_DENIED) {
                    message = 'Location permission denied. Please allow location access in your browser settings.';
                } else if (error.code === error.POSITION_UNAVAILABLE) {
                    message = 'Location information is unavailable.';
                } else if (error.code === error.TIMEOUT) {
                    message = 'Location request timed out. Please try again.';
                }
                setFeedback({ tone: 'error', message });
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    };

    const [isUploadingLogo, setIsUploadingLogo] = useState(false);
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
    const logoInputRef = useRef<HTMLInputElement>(null);
    const avatarInputRef = useRef<HTMLInputElement>(null);

    const handleImageUpload = useCallback(async (
        file: File,
        folder: string,
        onSuccess: (url: string) => void,
        setUploading: (v: boolean) => void
    ) => {
        setUploading(true);
        setFeedback(null);
        try {
            const url = await uploadProfileImage(folder, file);
            onSuccess(url);
            setFeedback({ tone: 'success', message: 'Image uploaded successfully.' });
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : 'Upload failed.';
            setFeedback({ tone: 'error', message: msg });
        } finally {
            setUploading(false);
        }
    }, []);

    const handleLogoDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file && activeRestaurantId) {
            handleImageUpload(
                file,
                `logos/${activeRestaurantId}`,
                (url) => handleRestaurantFieldChange('logoUrl', url),
                setIsUploadingLogo
            );
        }
    }, [activeRestaurantId, handleImageUpload]);

    const handleLogoFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && activeRestaurantId) {
            handleImageUpload(
                file,
                `logos/${activeRestaurantId}`,
                (url) => handleRestaurantFieldChange('logoUrl', url),
                setIsUploadingLogo
            );
        }
        e.target.value = '';
    }, [activeRestaurantId, handleImageUpload]);

    const handleAvatarDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file && userProfile) {
            handleImageUpload(
                file,
                `avatars/${userProfile.id}`,
                (url) => handleAdminFieldChange('avatarUrl', url),
                setIsUploadingAvatar
            );
        }
    }, [userProfile, handleImageUpload]);

    const handleAvatarFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && userProfile) {
            handleImageUpload(
                file,
                `avatars/${userProfile.id}`,
                (url) => handleAdminFieldChange('avatarUrl', url),
                setIsUploadingAvatar
            );
        }
        e.target.value = '';
    }, [userProfile, handleImageUpload]);

    const startRestaurantEdit = () => { resetRestaurantForm(); setFeedback(null); setIsRestaurantEditing(true); };
    const cancelRestaurantEdit = () => { resetRestaurantForm(); setIsRestaurantEditing(false); };
    const startAdminEdit = () => { resetAdminForm(); setFeedback(null); setIsAdminEditing(true); };
    const cancelAdminEdit = () => { resetAdminForm(); setIsAdminEditing(false); };

    const handleRestaurantSave = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!activeRestaurantId || !restaurantForm) {
            return;
        }

        const validationError = validateRestaurantForm(restaurantForm);
        if (validationError) {
            setFeedback({ tone: 'error', message: validationError });
            return;
        }

        setIsRestaurantSaving(true);
        setFeedback(null);

        try {
            const updatedRestaurant = await updateRestaurantProfile(activeRestaurantId, {
                name: restaurantForm.name.trim(),
                contactEmail: restaurantForm.contactEmail.trim().toLowerCase(),
                contactPhone: emptyToNull(restaurantForm.contactPhone),
                contactAddress: emptyToNull(restaurantForm.contactAddress),
                logoUrl: emptyToNull(restaurantForm.logoUrl),
                primaryColor: emptyToNull(restaurantForm.primaryColor),
                secondaryColor: emptyToNull(restaurantForm.secondaryColor),
                latitude: parseOptionalNumber(restaurantForm.latitude),
                longitude: parseOptionalNumber(restaurantForm.longitude),
                allowedRadius: parseOptionalInteger(restaurantForm.allowedRadius),
                openingDate: emptyToNull(restaurantForm.openingDate),
                tagline: emptyToNull(restaurantForm.tagline),
                manifesto: emptyToNull(restaurantForm.manifesto),
                operatingHoursWeekdays: emptyToNull(restaurantForm.operatingHoursWeekdays),
                operatingHoursWeekends: emptyToNull(restaurantForm.operatingHoursWeekends),
                instagramUrl: emptyToNull(restaurantForm.instagramUrl),
                facebookUrl: emptyToNull(restaurantForm.facebookUrl),
                websiteUrl: emptyToNull(restaurantForm.websiteUrl)
            });

            setRestaurant(updatedRestaurant);
            setRestaurantForm(createRestaurantFormState(updatedRestaurant));
            setIsRestaurantEditing(false);
            setFeedback({
                tone: 'success',
                message: 'Restaurant information updated successfully.'
            });
        } catch (error: unknown) {
            setFeedback({
                tone: 'error',
                message: getErrorMessage(error, 'Failed to save restaurant information.')
            });
        } finally {
            setIsRestaurantSaving(false);
        }
    };

    const handleAdminSave = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!userProfile) {
            return;
        }

        const validationError = validateAdminForm(adminForm);
        if (validationError) {
            setFeedback({ tone: 'error', message: validationError });
            return;
        }

        setIsAdminSaving(true);
        setFeedback(null);

        try {
            const result = await updateAdministratorProfile(userProfile.id, {
                currentEmail: userProfile.email,
                email: adminForm.email,
                name: adminForm.name.trim(),
                avatarUrl: emptyToNull(adminForm.avatarUrl)
            });

            await refreshSessionData();
            setAdminForm(createAdminFormState(result.profile));
            setIsAdminEditing(false);
            setFeedback({
                tone: result.emailChangePending ? 'info' : 'success',
                message: result.emailChangePending
                    ? `Administrator details saved. Confirm the email change sent to ${result.pendingEmail}.`
                    : 'Administrator details updated successfully.'
            });
        } catch (error: unknown) {
            setFeedback({
                tone: 'error',
                message: getErrorMessage(error, 'Failed to save administrator details.')
            });
        } finally {
            setIsAdminSaving(false);
        }
    };

    function renderRestaurantEditor(): React.ReactNode {
        if (!restaurantForm) {
            return null;
        }

        return (
            <div className="profile-form-layout">
                <div className="profile-section">
                    <div className="profile-section-header">
                        <div>
                            <h3>Basic Details</h3>
                            <p>Core identity and contact information.</p>
                        </div>
                    </div>
                    <div className="profile-form-grid">
                    <label className="profile-field">
                        <span className="profile-field-label">Restaurant Name</span>
                        <input
                            className="profile-input"
                            type="text"
                            value={restaurantForm.name}
                            onChange={(event) => handleRestaurantFieldChange('name', event.target.value)}
                            placeholder="Restaurant name"
                            maxLength={120}
                            required
                        />
                    </label>

                    <label className="profile-field">
                        <span className="profile-field-label">Contact Email</span>
                        <input
                            className="profile-input"
                            type="email"
                            value={restaurantForm.contactEmail}
                            onChange={(event) => handleRestaurantFieldChange('contactEmail', event.target.value)}
                            placeholder="ops@restaurant.com"
                            required
                        />
                    </label>

                    <label className="profile-field">
                        <span className="profile-field-label">Contact Phone</span>
                        <input
                            className="profile-input"
                            type="tel"
                            value={restaurantForm.contactPhone}
                            onChange={(event) => handleRestaurantFieldChange('contactPhone', event.target.value)}
                            placeholder="+91 98765 43210"
                        />
                    </label>

                    <label className="profile-field profile-field-span-2">
                        <span className="profile-field-label">Address</span>
                        <textarea
                            className="profile-input profile-textarea"
                            value={restaurantForm.contactAddress}
                            onChange={(event) => handleRestaurantFieldChange('contactAddress', event.target.value)}
                            placeholder="Street, locality, city, state"
                            rows={3}
                        />
                    </label>
                    </div>
                </div>
                
                <div className="profile-section">
                    <div className="profile-section-header">
                        <div>
                            <h3>Location & Branding</h3>
                            <p>Where to find you and your visual identity.</p>
                        </div>
                    </div>
                    <div className="profile-form-grid">
                        <div className="profile-field profile-field-span-2">
                        <span className="profile-field-label">Logo</span>
                        <div
                            className={`profile-dropzone ${isUploadingLogo ? 'profile-dropzone-uploading' : ''}`}
                            onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('profile-dropzone-hover'); }}
                            onDragLeave={(e) => { e.currentTarget.classList.remove('profile-dropzone-hover'); }}
                            onDrop={(e) => { e.currentTarget.classList.remove('profile-dropzone-hover'); handleLogoDrop(e); }}
                            onClick={() => !isUploadingLogo && logoInputRef.current?.click()}
                        >
                            <input
                                ref={logoInputRef}
                                type="file"
                                accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif"
                                className="profile-dropzone-input"
                                onChange={handleLogoFileSelect}
                            />
                            {restaurantForm.logoUrl ? (
                                <div className="profile-dropzone-preview">
                                    <img
                                        src={restaurantForm.logoUrl}
                                        alt="Logo preview"
                                        className="profile-dropzone-thumb"
                                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                    />
                                    <span className="profile-dropzone-replace">
                                        <Upload size={14} />
                                        {isUploadingLogo ? 'Uploading…' : 'Drop or click to replace'}
                                    </span>
                                </div>
                            ) : (
                                <div className="profile-dropzone-empty">
                                    <ImageIcon size={28} strokeWidth={1.5} />
                                    <span>{isUploadingLogo ? 'Uploading…' : 'Drop image here or click to browse'}</span>
                                    <span className="profile-dropzone-hint">PNG, JPG, WebP, SVG • Max 2 MB</span>
                                </div>
                            )}
                        </div>
                        <input
                            className="profile-input"
                            type="url"
                            value={restaurantForm.logoUrl}
                            onChange={(event) => handleRestaurantFieldChange('logoUrl', event.target.value)}
                            placeholder="Or paste a URL: https://cdn.example.com/logo.png"
                        />
                    </div>

                    <label className="profile-field">
                        <span className="profile-field-label">Access Area Radius (meters)</span>
                        <input
                            className="profile-input"
                            type="number"
                            min="1"
                            step="1"
                            value={restaurantForm.allowedRadius}
                            onChange={(event) => handleRestaurantFieldChange('allowedRadius', event.target.value)}
                            placeholder="250"
                        />
                    </label>

                    <div className="profile-field profile-field-span-2">
                        <span className="profile-field-label">Location Coordinates</span>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <label className="profile-field" style={{ gap: '4px' }}>
                                <span className="profile-field-label" style={{ fontSize: '10px', color: '#718096' }}>Latitude</span>
                                <input
                                    className="profile-input"
                                    type="number"
                                    min="-90"
                                    max="90"
                                    step="0.000001"
                                    value={restaurantForm.latitude}
                                    onChange={(event) => handleRestaurantFieldChange('latitude', event.target.value)}
                                    placeholder="26.144516"
                                />
                            </label>
                            <label className="profile-field" style={{ gap: '4px' }}>
                                <span className="profile-field-label" style={{ fontSize: '10px', color: '#718096' }}>Longitude</span>
                                <input
                                    className="profile-input"
                                    type="number"
                                    min="-180"
                                    max="180"
                                    step="0.000001"
                                    value={restaurantForm.longitude}
                                    onChange={(event) => handleRestaurantFieldChange('longitude', event.target.value)}
                                    placeholder="91.736237"
                                />
                            </label>
                        </div>
                        
                        <div id="profile-map" style={{ height: '300px', width: '100%', borderRadius: '14px', marginTop: '12px', zIndex: 1, backgroundColor: '#E2E8F0', border: '1px solid #CBD5E0' }}></div>
                        
                        <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <button
                                type="button"
                                className="profile-locate-btn"
                                onClick={handleUseMyLocation}
                                disabled={isLocating}
                            >
                                <Crosshair size={16} className={isLocating ? 'profile-locate-spin' : ''} />
                                {isLocating ? 'Locating…' : 'Use My Current Location'}
                            </button>
                            <span className="profile-field-help">
                                Drag the pin or click on the map to set location accurately.
                            </span>
                        </div>
                    </div>

                    <label className="profile-field">
                        <span className="profile-field-label">Primary Color</span>
                        <div className="profile-color-field">
                            <input
                                className="profile-color-picker"
                                type="color"
                                value={hexColorPattern.test(restaurantForm.primaryColor) ? restaurantForm.primaryColor : '#4f755c'}
                                onChange={(event) => handleRestaurantFieldChange('primaryColor', event.target.value)}
                            />
                            <input
                                className="profile-input"
                                type="text"
                                value={restaurantForm.primaryColor}
                                onChange={(event) => handleRestaurantFieldChange('primaryColor', event.target.value)}
                                placeholder="#4F755C"
                            />
                        </div>
                    </label>

                    <label className="profile-field">
                        <span className="profile-field-label">Secondary Color</span>
                        <div className="profile-color-field">
                            <input
                                className="profile-color-picker"
                                type="color"
                                value={hexColorPattern.test(restaurantForm.secondaryColor) ? restaurantForm.secondaryColor : '#68d391'}
                                onChange={(event) => handleRestaurantFieldChange('secondaryColor', event.target.value)}
                            />
                            <input
                                className="profile-input"
                                type="text"
                                value={restaurantForm.secondaryColor}
                                onChange={(event) => handleRestaurantFieldChange('secondaryColor', event.target.value)}
                                placeholder="#68D391"
                            />
                        </div>
                    </label>
                    </div>
                </div>

                {/* Our Story & Additional Info */}
                <div className="profile-section">
                    <div className="profile-section-header">
                        <div>
                            <h3>Our Story & Socials</h3>
                            <p>Tell your customers about your restaurant.</p>
                        </div>
                    </div>
                    <div className="profile-form-grid">

                    <label className="profile-field">
                        <span className="profile-field-label">Opening Date</span>
                        <input
                            className="profile-input"
                            type="date"
                            value={restaurantForm.openingDate}
                            onChange={(event) => handleRestaurantFieldChange('openingDate', event.target.value)}
                        />
                    </label>

                    <label className="profile-field">
                        <span className="profile-field-label">Tagline</span>
                        <input
                            className="profile-input"
                            type="text"
                            value={restaurantForm.tagline}
                            onChange={(event) => handleRestaurantFieldChange('tagline', event.target.value)}
                            placeholder="A short catchy phrase"
                        />
                    </label>

                    <label className="profile-field profile-field-span-2">
                        <span className="profile-field-label">Manifesto / Our Story</span>
                        <textarea
                            className="profile-input profile-textarea"
                            value={restaurantForm.manifesto}
                            onChange={(event) => handleRestaurantFieldChange('manifesto', event.target.value)}
                            placeholder="Tell the story of your restaurant..."
                            rows={4}
                        />
                    </label>

                    <div className="profile-field">
                        <span className="profile-field-label">Operating Hours (Weekdays)</span>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <div className="profile-field" style={{ gap: '4px' }}>
                                <span style={{ fontSize: '10px', color: '#718096', textTransform: 'uppercase', fontWeight: 600 }}>Opening Time</span>
                                <input
                                    className="profile-input"
                                    type="time"
                                    value={get24hTime(restaurantForm.operatingHoursWeekdays, 'open')}
                                    onChange={(event) => handleTimeChange('weekdays', 'open', event.target.value)}
                                />
                            </div>
                            <div className="profile-field" style={{ gap: '4px' }}>
                                <span style={{ fontSize: '10px', color: '#718096', textTransform: 'uppercase', fontWeight: 600 }}>Closing Time</span>
                                <input
                                    className="profile-input"
                                    type="time"
                                    value={get24hTime(restaurantForm.operatingHoursWeekdays, 'close')}
                                    onChange={(event) => handleTimeChange('weekdays', 'close', event.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="profile-field">
                        <span className="profile-field-label">Operating Hours (Weekends)</span>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <div className="profile-field" style={{ gap: '4px' }}>
                                <span style={{ fontSize: '10px', color: '#718096', textTransform: 'uppercase', fontWeight: 600 }}>Opening Time</span>
                                <input
                                    className="profile-input"
                                    type="time"
                                    value={get24hTime(restaurantForm.operatingHoursWeekends, 'open')}
                                    onChange={(event) => handleTimeChange('weekends', 'open', event.target.value)}
                                />
                            </div>
                            <div className="profile-field" style={{ gap: '4px' }}>
                                <span style={{ fontSize: '10px', color: '#718096', textTransform: 'uppercase', fontWeight: 600 }}>Closing Time</span>
                                <input
                                    className="profile-input"
                                    type="time"
                                    value={get24hTime(restaurantForm.operatingHoursWeekends, 'close')}
                                    onChange={(event) => handleTimeChange('weekends', 'close', event.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <label className="profile-field">
                        <span className="profile-field-label">Instagram URL</span>
                        <input
                            className="profile-input"
                            type="url"
                            value={restaurantForm.instagramUrl}
                            onChange={(event) => handleRestaurantFieldChange('instagramUrl', event.target.value)}
                            placeholder="https://instagram.com/yourrestaurant"
                        />
                    </label>

                    <label className="profile-field">
                        <span className="profile-field-label">Facebook URL</span>
                        <input
                            className="profile-input"
                            type="url"
                            value={restaurantForm.facebookUrl}
                            onChange={(event) => handleRestaurantFieldChange('facebookUrl', event.target.value)}
                            placeholder="https://facebook.com/yourrestaurant"
                        />
                    </label>

                    <label className="profile-field profile-field-span-2">
                        <span className="profile-field-label">Website URL</span>
                        <input
                            className="profile-input"
                            type="url"
                            value={restaurantForm.websiteUrl}
                            onChange={(event) => handleRestaurantFieldChange('websiteUrl', event.target.value)}
                            placeholder="https://yourrestaurant.com"
                        />
                    </label>
                    </div>
                </div>
            </div>
        );
    }
    function renderRestaurantReadOnly(): React.ReactNode {
        if (!restaurant) {
            return (
                <div className="profile-empty-state">
                    No restaurant is assigned to this account.
                </div>
            );
        }

        return (
            <div className="profile-form-layout">
                <div className="profile-section">
                    <div className="profile-section-header">
                        <div>
                            <h3>Basic Details</h3>
                            <p>Core identity and contact information.</p>
                        </div>
                    </div>
                    <div className="profile-form-grid">
                        <div className="profile-info-item">
                            <span className="profile-info-label">Restaurant Name</span>
                            <span className="profile-info-value">{restaurant.name}</span>
                        </div>

                        <div className="profile-info-item">
                            <span className="profile-info-label">Status</span>
                            <span className={`status-badge ${String(restaurant.status || '').toLowerCase()}`}>
                                {formatLabel(String(restaurant.status || 'unknown'))}
                            </span>
                        </div>

                        <div className="profile-info-item">
                            <span className="profile-info-label">Contact Email</span>
                            <span className="profile-info-value profile-value-inline">
                                <MailIcon size={15} />
                                {restaurant.contact.email || 'N/A'}
                            </span>
                        </div>

                        <div className="profile-info-item">
                            <span className="profile-info-label">Contact Phone</span>
                            <span className="profile-info-value profile-value-inline">
                                <PhoneIcon size={15} />
                                {restaurant.contact.phone || 'N/A'}
                            </span>
                        </div>

                        <div className="profile-info-item profile-field-span-2">
                            <span className="profile-info-label">Address</span>
                            <span className="profile-info-value">{restaurant.contact.address || 'N/A'}</span>
                        </div>
                    </div>
                </div>

                <div className="profile-section">
                    <div className="profile-section-header">
                        <div>
                            <h3>Location & Branding</h3>
                            <p>Where to find you and your visual identity.</p>
                        </div>
                    </div>
                    <div className="profile-form-grid">

                <div className="profile-info-item">
                    <span className="profile-info-label">Location</span>
                    <span className="profile-info-value profile-value-inline">
                        <MapPinIcon size={15} />
                        {`${formatCoordinate(restaurant.location?.latitude)}, ${formatCoordinate(restaurant.location?.longitude)}`}
                    </span>
                </div>

                <div className="profile-info-item">
                    <span className="profile-info-label">Access Area Radius</span>
                    <span className="profile-info-value">
                        {restaurant.location?.allowedRadius != null
                            ? `${restaurant.location.allowedRadius} meters`
                            : 'Not set'}
                    </span>
                </div>

                <div className="profile-info-item">
                    <span className="profile-info-label">Brand Colors</span>
                    <div className="profile-swatch-list">
                        <span className="profile-swatch-chip">
                            <span
                                className="profile-color-swatch"
                                style={{ backgroundColor: restaurant.branding?.primaryColor || '#4f755c' }}
                            />
                            {restaurant.branding?.primaryColor || 'Not set'}
                        </span>
                        <span className="profile-swatch-chip">
                            <span
                                className="profile-color-swatch"
                                style={{ backgroundColor: restaurant.branding?.secondaryColor || '#68d391' }}
                            />
                            {restaurant.branding?.secondaryColor || 'Not set'}
                        </span>
                    </div>
                </div>

                <div className="profile-info-item profile-field-span-2">
                    <span className="profile-info-label">Logo</span>
                    {restaurant.branding?.logoUrl ? (
                        <div className="profile-logo-preview">
                            <img
                                src={restaurant.branding.logoUrl}
                                alt={`${restaurant.name} logo`}
                                className="profile-logo-img"
                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                            />
                            <a
                                href={restaurant.branding.logoUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="profile-link"
                            >
                                <span>{restaurant.branding.logoUrl}</span>
                                <ExternalLink size={14} />
                            </a>
                        </div>
                    ) : (
                        <span className="profile-info-value profile-muted">Not set</span>
                    )}
                </div>

                <div className="profile-info-item">
                    <span className="profile-info-label">Subscription</span>
                    <span className="profile-info-value profile-value-inline">
                        <CreditCardIcon size={15} />
                        {restaurant.subscriptionStatus ? 'Active' : 'Inactive'}
                        {restaurant.subscriptionType ? ` (${restaurant.subscriptionType})` : ''}
                    </span>
                </div>
                </div>
                </div>

                {/* Our Story & Socials (Read-Only) */}
                <div className="profile-section">
                    <div className="profile-section-header">
                        <div>
                            <h3>Our Story & Socials</h3>
                            <p>Tell your customers about your restaurant.</p>
                        </div>
                    </div>
                    <div className="profile-form-grid">

                <div className="profile-info-item">
                    <span className="profile-info-label">Opening Date</span>
                    <span className="profile-info-value">{restaurant.openingDate || 'Not set'}</span>
                </div>

                <div className="profile-info-item">
                    <span className="profile-info-label">Tagline</span>
                    <span className="profile-info-value">{restaurant.tagline || 'Not set'}</span>
                </div>

                <div className="profile-info-item">
                    <span className="profile-info-label">Manifesto</span>
                    <span className="profile-info-value">{restaurant.manifesto || 'Not set'}</span>
                </div>

                <div className="profile-info-item">
                    <span className="profile-info-label">Operating Hours (Weekdays)</span>
                    <span className="profile-info-value">{restaurant.operatingHoursWeekdays || 'Not set'}</span>
                </div>

                <div className="profile-info-item">
                    <span className="profile-info-label">Operating Hours (Weekends)</span>
                    <span className="profile-info-value">{restaurant.operatingHoursWeekends || 'Not set'}</span>
                </div>

                <div className="profile-info-item">
                    <span className="profile-info-label">Instagram</span>
                    <span className="profile-info-value">
                        {restaurant.instagramUrl ? (
                            <a href={restaurant.instagramUrl} target="_blank" rel="noopener noreferrer" className="profile-link">
                                {restaurant.instagramUrl} <ExternalLink size={14} />
                            </a>
                        ) : 'Not set'}
                    </span>
                </div>

                <div className="profile-info-item">
                    <span className="profile-info-label">Facebook</span>
                    <span className="profile-info-value">
                        {restaurant.facebookUrl ? (
                            <a href={restaurant.facebookUrl} target="_blank" rel="noopener noreferrer" className="profile-link">
                                {restaurant.facebookUrl} <ExternalLink size={14} />
                            </a>
                        ) : 'Not set'}
                    </span>
                </div>

                <div className="profile-info-item profile-field-span-2">
                    <span className="profile-info-label">Website</span>
                    <span className="profile-info-value">
                        {restaurant.websiteUrl ? (
                            <a href={restaurant.websiteUrl} target="_blank" rel="noopener noreferrer" className="profile-link">
                                {restaurant.websiteUrl} <ExternalLink size={14} />
                            </a>
                        ) : 'Not set'}
                    </span>
                </div>
                </div>
                </div>
            </div>
        );
    }
    function renderAdminEditor(): React.ReactNode {
        if (!userProfile) {
            return (
                <div className="profile-empty-state">
                    Administrator profile could not be loaded.
                </div>
            );
        }

        return (
            <div className="profile-form-layout">
                <div className="profile-section">
                    <div className="profile-section-header">
                        <div>
                            <h3>Personal Information</h3>
                            <p>Your personal details and profile picture.</p>
                        </div>
                    </div>
                    <div className="profile-form-grid">
                    <label className="profile-field">
                        <span className="profile-field-label">Full Name</span>
                        <input
                            className="profile-input"
                            type="text"
                            value={adminForm.name}
                            onChange={(event) => handleAdminFieldChange('name', event.target.value)}
                            placeholder="Administrator name"
                            maxLength={120}
                            required
                        />
                    </label>

                    <label className="profile-field">
                        <span className="profile-field-label">Email Address</span>
                        <input
                            className="profile-input"
                            type="email"
                            value={adminForm.email}
                            onChange={(event) => handleAdminFieldChange('email', event.target.value)}
                            placeholder="admin@restaurant.com"
                            required
                        />
                        <span className="profile-field-help">
                            Changing email may require confirmation before it becomes active.
                        </span>
                    </label>

                    <div className="profile-field profile-field-span-2">
                        <span className="profile-field-label">Avatar</span>
                        <div
                            className={`profile-dropzone ${isUploadingAvatar ? 'profile-dropzone-uploading' : ''}`}
                            onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('profile-dropzone-hover'); }}
                            onDragLeave={(e) => { e.currentTarget.classList.remove('profile-dropzone-hover'); }}
                            onDrop={(e) => { e.currentTarget.classList.remove('profile-dropzone-hover'); handleAvatarDrop(e); }}
                            onClick={() => !isUploadingAvatar && avatarInputRef.current?.click()}
                        >
                            <input
                                ref={avatarInputRef}
                                type="file"
                                accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif"
                                className="profile-dropzone-input"
                                onChange={handleAvatarFileSelect}
                            />
                            {adminForm.avatarUrl ? (
                                <div className="profile-dropzone-preview">
                                    <img
                                        src={adminForm.avatarUrl}
                                        alt="Avatar preview"
                                        className="profile-dropzone-thumb profile-dropzone-thumb-round"
                                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                    />
                                    <span className="profile-dropzone-replace">
                                        <Upload size={14} />
                                        {isUploadingAvatar ? 'Uploading…' : 'Drop or click to replace'}
                                    </span>
                                </div>
                            ) : (
                                <div className="profile-dropzone-empty">
                                    <ImageIcon size={28} strokeWidth={1.5} />
                                    <span>{isUploadingAvatar ? 'Uploading…' : 'Drop image here or click to browse'}</span>
                                    <span className="profile-dropzone-hint">PNG, JPG, WebP, SVG • Max 2 MB</span>
                                </div>
                            )}
                        </div>
                        <input
                            className="profile-input"
                            type="url"
                            value={adminForm.avatarUrl}
                            onChange={(event) => handleAdminFieldChange('avatarUrl', event.target.value)}
                            placeholder="Or paste a URL: https://cdn.example.com/avatar.png"
                        />
                    </div>
                    </div>
                </div>

                <div className="profile-summary-grid">
                    <div className="profile-summary-card">
                        <span className="profile-info-label">Global Role</span>
                        <span className="status-badge admin">
                            {formatLabel(userProfile.role)}
                        </span>
                    </div>
                    <div className="profile-summary-card">
                        <span className="profile-info-label">Restaurant Access Role</span>
                        <span
                            className={`status-badge ${String(activeMembership?.role || '').toLowerCase() === 'admin'
                                ? 'admin'
                                : 'active'
                                }`}
                        >
                            {formatLabel(activeMembership?.role || 'staff')}
                        </span>
                    </div>
                    <div className="profile-summary-card profile-summary-card-wide">
                        <span className="profile-info-label">Account ID</span>
                        <span className="profile-info-mono" title={userProfile.id}>
                            {userProfile.id}
                        </span>
                    </div>
                </div>
            </div>
        );
    }

    function renderAdminReadOnly(): React.ReactNode {
        if (!userProfile) {
            return (
                <div className="profile-empty-state">
                    Administrator profile could not be loaded.
                </div>
            );
        }

        return (
            <div className="profile-form-layout">
                <div className="profile-section">
                    <div className="profile-section-header">
                        <div>
                            <h3>Personal Information</h3>
                            <p>Your personal details and profile picture.</p>
                        </div>
                    </div>
                    <div className="profile-form-grid">
                        <div className="profile-info-item">
                            <span className="profile-info-label">Full Name</span>
                            <span className="profile-info-value">{userProfile.name || 'Admin User'}</span>
                        </div>

                        <div className="profile-info-item">
                            <span className="profile-info-label">Email Address</span>
                            <span className="profile-info-value">{userProfile.email || 'N/A'}</span>
                        </div>

                        <div className="profile-info-item profile-field-span-2">
                            <span className="profile-info-label">Avatar</span>
                            {userProfile.avatarUrl ? (
                                <div className="profile-logo-preview">
                                    <img
                                        src={userProfile.avatarUrl}
                                        alt={`${userProfile.name || 'Admin'} avatar`}
                                        className="profile-avatar-img"
                                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                    />
                                    <a
                                        href={userProfile.avatarUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="profile-link"
                                    >
                                        <span>{userProfile.avatarUrl}</span>
                                        <ExternalLink size={14} />
                                    </a>
                                </div>
                            ) : (
                                <span className="profile-info-value profile-muted">Not set</span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="profile-summary-grid">
                    <div className="profile-summary-card">
                        <span className="profile-info-label">Global Role</span>
                        <span className="status-badge admin">
                            {formatLabel(userProfile.role)}
                        </span>
                    </div>

                    {activeMembership && (
                        <div className="profile-summary-card">
                            <span className="profile-info-label">Restaurant Access Role</span>
                            <span
                                className={`status-badge ${String(activeMembership.role).toLowerCase() === 'admin'
                                    ? 'admin'
                                    : 'active'
                                    }`}
                            >
                                {formatLabel(activeMembership.role)}
                            </span>
                        </div>
                    )}

                    <div className="profile-summary-card profile-summary-card-wide">
                        <span className="profile-info-label">Account ID</span>
                        <span className="profile-info-mono" title={userProfile.id}>
                            {userProfile.id}
                        </span>
                    </div>
                </div>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="profile-container">
                <Sidebar />
                <div className="profile-main-content">
                    <div className="profile-loading">
                        <div className="profile-loading-spinner"></div>
                        <p>Loading profile information...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="profile-container">
            <Sidebar />

            <div className="profile-main-content">
                <div className="profile-header">
                    <div>
                        <h1 className="profile-page-title">Restaurant Profile</h1>
                        <p className="profile-page-subtitle">
                            Manage restaurant information, branding, access area,
                            and administrator details.
                        </p>
                    </div>
                    <div className="profile-header-right">
                        <div className="profile-icon-button">
                            <Bell size={20} color="#718096" />
                        </div>
                        {userProfile?.avatarUrl ? (
                            <img
                                src={userProfile.avatarUrl}
                                alt="Admin avatar"
                                className="order-user-avatar order-user-avatar-img"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                    (e.target as HTMLImageElement).parentElement?.querySelector('.order-user-avatar-fallback')?.classList.remove('hidden');
                                }}
                            />
                        ) : null}
                        <div className={`order-user-avatar order-user-avatar-fallback ${userProfile?.avatarUrl ? 'hidden' : ''}`}>
                            {getInitials(userProfile?.name)}
                        </div>
                    </div>
                </div>

                {feedback && (
                    <div className={`profile-banner profile-banner-${feedback.tone}`}>
                        <span className="profile-banner-dot" />
                        <span>{feedback.message}</span>
                    </div>
                )}

                <div className="profile-content-grid">
                    <form className="profile-card" onSubmit={handleRestaurantSave}>
                        <div className="profile-card-header">
                            <div className="profile-card-title">
                                <div className="profile-icon-wrapper">
                                    <BuildingIcon size={20} />
                                </div>
                                <div>
                                    <h2>Restaurant Information</h2>
                                    <p className="profile-card-subtitle">
                                        Core business, branding, and geofencing details.
                                    </p>
                                </div>
                            </div>

                            <div className="profile-card-actions">
                                {isRestaurantEditing ? (
                                    <>
                                        <button
                                            type="button"
                                            className="profile-secondary-action"
                                            onClick={cancelRestaurantEdit}
                                            disabled={isRestaurantSaving}
                                        >
                                            <X size={16} />
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="profile-primary-action"
                                            disabled={isRestaurantSaving || !restaurantForm}
                                        >
                                            <Save size={16} />
                                            {isRestaurantSaving ? 'Saving...' : 'Save'}
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        type="button"
                                        className="profile-secondary-action"
                                        onClick={startRestaurantEdit}
                                        disabled={!restaurant}
                                    >
                                        <Edit3 size={16} />
                                        Edit
                                    </button>
                                )}
                            </div>
                        </div>

                        {isRestaurantEditing ? renderRestaurantEditor() : renderRestaurantReadOnly()}
                    </form>

                    <form className="profile-card" onSubmit={handleAdminSave}>
                        <div className="profile-card-header">
                            <div className="profile-card-title">
                                <div className="profile-icon-wrapper">
                                    <UserCircleIcon size={20} />
                                </div>
                                <div>
                                    <h2>Administrator Details</h2>
                                    <p className="profile-card-subtitle">
                                        Manage the primary admin identity for this account.
                                    </p>
                                </div>
                            </div>

                            <div className="profile-card-actions">
                                {isAdminEditing ? (
                                    <>
                                        <button
                                            type="button"
                                            className="profile-secondary-action"
                                            onClick={cancelAdminEdit}
                                            disabled={isAdminSaving}
                                        >
                                            <X size={16} />
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="profile-primary-action"
                                            disabled={isAdminSaving || !userProfile}
                                        >
                                            <Save size={16} />
                                            {isAdminSaving ? 'Saving...' : 'Save'}
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        type="button"
                                        className="profile-secondary-action"
                                        onClick={startAdminEdit}
                                        disabled={!userProfile}
                                    >
                                        <Edit3 size={16} />
                                        Edit
                                    </button>
                                )}
                            </div>
                        </div>

                        {isAdminEditing ? renderAdminEditor() : renderAdminReadOnly()}
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
