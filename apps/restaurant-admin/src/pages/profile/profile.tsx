import React, { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  
  CreditCardIcon,
  Crosshair,
  Edit3,
  ExternalLink,
  
  LogOut,
  MailIcon,
  MapPinIcon,
  PhoneIcon,
  Save,
  
  Check,
  X,
  
} from "lucide-react";
import type { Restaurant } from "@restaurant-saas/types";
import { useAuth } from "../../context/AuthContext";
import {
  getRestaurantById,
    updateAdministratorProfile,
  updateRestaurantProfile,
} from "../../services/supabaseService";
import { supabase } from '@restaurant-saas/supabase';


interface RestaurantFormState {
  name: string;
  slug: string;
  contactEmail: string;
  contactPhone: string;
  contactAddress: string;
  logoUrl: string;
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
  payOnline: boolean;
  kitchenAppEnabled: boolean;
}

interface AdminFormState {
  name: string;
  email: string;
}



const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error === "object" && error !== null && "message" in error) {
    const maybeMessage = (error as { message?: unknown }).message;
    if (typeof maybeMessage === "string" && maybeMessage.trim()) {
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
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
};



const formatLabel = (value?: string | null): string => {
  if (!value) {
    return "N/A";
  }

  return value
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const createRestaurantFormState = (
  restaurant: Restaurant,
): RestaurantFormState => ({
  name: restaurant.name ?? "",
  slug: restaurant.slug || (restaurant.name ? restaurant.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : ""),
  contactEmail: restaurant.contact.email ?? "",
  contactPhone: restaurant.contact.phone ?? "",
  contactAddress: restaurant.contact.address ?? "",
  logoUrl: restaurant.branding?.logoUrl ?? "",
  latitude:
    restaurant.location?.latitude != null
      ? String(restaurant.location.latitude)
      : "",
  longitude:
    restaurant.location?.longitude != null
      ? String(restaurant.location.longitude)
      : "",
  allowedRadius:
    restaurant.location?.allowedRadius != null
      ? String(restaurant.location.allowedRadius)
      : "150",
  openingDate: restaurant.openingDate ?? "",
  tagline: restaurant.tagline ?? "",
  manifesto: restaurant.manifesto ?? "",
  operatingHoursWeekdays:
    restaurant.operatingHoursWeekdays || "10:00 AM - 10:00 PM",
  operatingHoursWeekends:
    restaurant.operatingHoursWeekends || "10:00 AM - 10:00 PM",
  instagramUrl: restaurant.instagramUrl ?? "",
  facebookUrl: restaurant.facebookUrl ?? "",
  websiteUrl: restaurant.websiteUrl ?? "",
  payOnline: (restaurant as any).pay_online ?? true,
  kitchenAppEnabled: (restaurant as any).kitchen_app_enabled ?? true,
});

const createAdminFormState = (
  profile: {
    name?: string | null;
    email?: string | null;
    avatarUrl?: string | null;
  } | null,
): AdminFormState => ({
  name: profile?.name ?? "",
  email: profile?.email ?? "",
});

const formatCoordinate = (value?: number | null): string => {
  if (value == null || Number.isNaN(value)) {
    return "Not set";
  }

  return value.toFixed(6);
};

const validateRestaurantForm = (form: RestaurantFormState): string | null => {
  if (!form.name.trim()) return "Restaurant name is required.";
  if (!form.slug.trim()) return "Restaurant slug is required.";
  if (!/^[a-z0-9-]+$/.test(form.slug.trim())) return "Slug can only contain lowercase letters, numbers, and hyphens.";
  if (!form.contactEmail.trim() || !emailPattern.test(form.contactEmail.trim()))
    return "A valid contact email is required.";
  if (form.logoUrl.trim() && !isValidUrl(form.logoUrl.trim()))
    return "Logo URL must be a valid http or https URL.";

  const latitude = parseOptionalNumber(form.latitude);
  const longitude = parseOptionalNumber(form.longitude);
  const radius = parseOptionalInteger(form.allowedRadius);

  if (latitude != null && Number.isNaN(latitude))
    return "Latitude must be a valid number.";
  if (longitude != null && Number.isNaN(longitude))
    return "Longitude must be a valid number.";
  if ((latitude == null) !== (longitude == null))
    return "Latitude and longitude must be provided together.";
  if (latitude != null && (latitude < -90 || latitude > 90))
    return "Latitude must be between -90 and 90.";
  if (longitude != null && (longitude < -180 || longitude > 180))
    return "Longitude must be between -180 and 180.";
  if (radius != null && (Number.isNaN(radius) || radius <= 0))
    return "Access area radius must be a positive whole number.";

  return null;
};

const validateAdminForm = (form: AdminFormState): string | null => {
  if (!form.name.trim()) return "Administrator name is required.";
  if (!form.email.trim() || !emailPattern.test(form.email.trim()))
    return "Administrator email must be valid.";
  return null;
};

const ProfilePage: React.FC = () => {
  const {
    userProfile,
    activeRestaurantId,
    refreshSessionData,
    signOut,
  } = useAuth();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [restaurantForm, setRestaurantForm] =
    useState<RestaurantFormState | null>(null);
  const [adminForm, setAdminForm] = useState<AdminFormState>(
    createAdminFormState(userProfile),
  );
  const [isLoading, setIsLoading] = useState(true);
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [checkingSlug, setCheckingSlug] = useState(false);
  const [feedback, setFeedback] = useState<{
    tone: "success" | "error" | "info";
    message: string;
  } | null>(null);

  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => {
        setFeedback(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  const [activeEditModal, setActiveEditModal] = useState<"core" | "contact" | "branding" | "story" | "admin" | null>(null);
  const isRestaurantEditing = activeEditModal !== null && activeEditModal !== "admin";
  const [isRestaurantSaving, setIsRestaurantSaving] = useState(false);
  const [isAdminSaving, setIsAdminSaving] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  
  // Confirm modal state
            
  // Payment settings state
  



  useEffect(() => {
    if (!isRestaurantEditing || !restaurantForm?.slug) {
      setSlugAvailable(null);
      return;
    }

    if (restaurant && restaurantForm.slug === restaurant.slug) {
      setSlugAvailable(true);
      return;
    }

    const checkSlug = async () => {
      setCheckingSlug(true);
      try {
        let query = supabase
          .from("restaurants")
          .select("id")
          .eq("slug", restaurantForm.slug);

        if (restaurant?.id) {
          query = query.neq("id", restaurant.id);
        }

        const { data, error } = await query;

        if (!error) {
          setSlugAvailable(data.length === 0);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setCheckingSlug(false);
      }
    };

    const timer = setTimeout(checkSlug, 500);
    return () => clearTimeout(timer);
  }, [restaurantForm?.slug, isRestaurantEditing, restaurant]);

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
        console.error("Error fetching restaurant context:", error);
        setFeedback({
          tone: "error",
          message: getErrorMessage(
            error,
            "Failed to load restaurant details. Please try again.",
          ),
        });
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

  const handleRestaurantFieldChange = (
    field: keyof RestaurantFormState,
    value: string,
  ) => {
    setRestaurantForm((current) =>
      current ? { ...current, [field]: value } : current,
    );
  };

  const handleAdminFieldChange = (
    field: keyof AdminFormState,
    value: string,
  ) => {
    setAdminForm((current) => ({ ...current, [field]: value }));
  };

  const [isLocating, setIsLocating] = useState(false);

  const get24hTime = (
    text: string | undefined | null,
    type: "open" | "close",
  ) => {
    if (!text) return type === "open" ? "10:00" : "22:00";
    const times = text.match(/(\d{1,2}:\d{2}\s*(?:AM|PM)?)/gi);
    if (times && times.length >= 2) {
      const timeStr = type === "open" ? times[0] : times[1];
      const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
      if (!match) return type === "open" ? "10:00" : "22:00";
      let [_, h, m, ampm] = match;
      let hours = parseInt(h, 10);
      if (ampm) {
        if (ampm.toUpperCase() === "PM" && hours < 12) hours += 12;
        if (ampm.toUpperCase() === "AM" && hours === 12) hours = 0;
      }
      return `${hours.toString().padStart(2, "0")}:${m}`;
    }
    return type === "open" ? "10:00" : "22:00";
  };

  const handleTimeChange = (
    dayType: "weekdays" | "weekends",
    timeType: "open" | "close",
    val: string,
  ) => {
    if (!restaurantForm) return;
    const field =
      dayType === "weekdays"
        ? "operatingHoursWeekdays"
        : "operatingHoursWeekends";
    const currentText = restaurantForm[field];
    const currentOpen24 = get24hTime(currentText, "open");
    const currentClose24 = get24hTime(currentText, "close");

    const newOpen24 = timeType === "open" ? val : currentOpen24;
    const newClose24 = timeType === "close" ? val : currentClose24;

    const formatTime12h = (t: string) => {
      if (!t) return "";
      const [h, m] = t.split(":");
      let hours = parseInt(h, 10);
      const ampm = hours >= 12 ? "PM" : "AM";
      hours = hours % 12 || 12;
      return `${hours}:${m} ${ampm}`;
    };

    handleRestaurantFieldChange(
      field,
      `${formatTime12h(newOpen24)} - ${formatTime12h(newClose24)}`,
    );
  };

  const mapInstanceRef = useRef<any>(null);
  const mapMarkerRef = useRef<any>(null);

  useEffect(() => {
    if (isRestaurantEditing) {
      const initMap = () => {
        const L = (window as any).L;
        if (!L) return;
        const mapEl = document.getElementById("profile-map");
        if (!mapEl) return;

        if (mapInstanceRef.current) return;

        const initialLat = parseFloat(restaurantForm?.latitude || "26.1445");
        const initialLng = parseFloat(restaurantForm?.longitude || "91.7362");

        // Fix for leaflet marker icon
        delete L.Icon.Default.prototype._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl:
            "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
          iconUrl:
            "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
          shadowUrl:
            "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
        });

        const map = L.map("profile-map").setView([initialLat, initialLng], 13);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "© OpenStreetMap",
        }).addTo(map);

        const marker = L.marker([initialLat, initialLng], {
          draggable: true,
        }).addTo(map);

        marker.on("dragend", function () {
          const position = marker.getLatLng();
          setRestaurantForm((current) =>
            current
              ? {
                ...current,
                latitude: position.lat.toFixed(6),
                longitude: position.lng.toFixed(6),
              }
              : current,
          );
        });

        map.on("click", function (event: any) {
          const position = event.latlng;
          marker.setLatLng(position);
          map.setView(position);
          setRestaurantForm((current) =>
            current
              ? {
                ...current,
                latitude: position.lat.toFixed(6),
                longitude: position.lng.toFixed(6),
              }
              : current,
          );
        });

        mapInstanceRef.current = map;
        mapMarkerRef.current = marker;
      };

      if (!(window as any).L) {
        if (!document.getElementById("leaflet-css")) {
          const link = document.createElement("link");
          link.id = "leaflet-css";
          link.rel = "stylesheet";
          link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
          document.head.appendChild(link);
        }

        if (!document.getElementById("leaflet-script")) {
          const script = document.createElement("script");
          script.id = "leaflet-script";
          script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
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
      const lat = parseFloat(restaurantForm.latitude || "0");
      const lng = parseFloat(restaurantForm.longitude || "0");
      const currentPos = mapMarkerRef.current.getLatLng();
      if (
        Math.abs(currentPos.lat - lat) > 0.0001 ||
        Math.abs(currentPos.lng - lng) > 0.0001
      ) {
        mapMarkerRef.current.setLatLng([lat, lng]);
        mapInstanceRef.current.setView([lat, lng]);
      }
    }
  }, [restaurantForm?.latitude, restaurantForm?.longitude]);

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setFeedback({
        tone: "error",
        message: "Geolocation is not supported by your browser.",
      });
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setRestaurantForm((current) =>
          current
            ? {
              ...current,
              latitude: position.coords.latitude.toFixed(6),
              longitude: position.coords.longitude.toFixed(6),
            }
            : current,
        );
        setIsLocating(false);
        setFeedback({
          tone: "success",
          message: "Location coordinates filled from your device.",
        });
      },
      (error) => {
        setIsLocating(false);
        let message = "Failed to get your location.";
        if (error.code === error.PERMISSION_DENIED) {
          message =
            "Location permission denied. Please allow location access in your browser settings.";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          message = "Location information is unavailable.";
        } else if (error.code === error.TIMEOUT) {
          message = "Location request timed out. Please try again.";
        }
        setFeedback({ tone: "error", message });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  };


  const startRestaurantEdit = (section: 'core' | 'contact' | 'branding' | 'story') => {
    resetRestaurantForm();
    setFeedback(null);
    setActiveEditModal(section);
  };
  const cancelRestaurantEdit = () => {
    setActiveEditModal(null);
    resetRestaurantForm();
  };
  const startAdminEdit = () => {
    resetAdminForm();
    setFeedback(null);
    setActiveEditModal("admin");
  };
  const cancelAdminEdit = () => {
    resetAdminForm();
    setActiveEditModal(null);
  };

  const handleRestaurantSave = async () => {
    if (!activeRestaurantId || !restaurantForm) {
      return;
    }

    const validationError = validateRestaurantForm(restaurantForm);
    if (validationError) {
      setFeedback({ tone: "error", message: validationError });
      return;
    }

    if (slugAvailable === false) {
      setFeedback({ tone: "error", message: "Custom slug is not available. Please choose another." });
      return;
    }

    setIsRestaurantSaving(true);
    setFeedback(null);

    try {
      const updatedRestaurant = await updateRestaurantProfile(
        activeRestaurantId,
        {
          name: restaurantForm.name.trim(),
          slug: restaurantForm.slug.trim().toLowerCase(),
          contactEmail: restaurantForm.contactEmail.trim().toLowerCase(),
          contactPhone: emptyToNull(restaurantForm.contactPhone),
          contactAddress: emptyToNull(restaurantForm.contactAddress),
          logoUrl: emptyToNull(restaurantForm.logoUrl),
          latitude: parseOptionalNumber(restaurantForm.latitude),
          longitude: parseOptionalNumber(restaurantForm.longitude),
          allowedRadius: parseOptionalInteger(restaurantForm.allowedRadius),
          openingDate: emptyToNull(restaurantForm.openingDate),
          tagline: emptyToNull(restaurantForm.tagline),
          manifesto: emptyToNull(restaurantForm.manifesto),
          operatingHoursWeekdays: emptyToNull(
            restaurantForm.operatingHoursWeekdays,
          ),
          operatingHoursWeekends: emptyToNull(
            restaurantForm.operatingHoursWeekends,
          ),
          instagramUrl: emptyToNull(restaurantForm.instagramUrl),
          facebookUrl: emptyToNull(restaurantForm.facebookUrl),
          websiteUrl: emptyToNull(restaurantForm.websiteUrl),
          pay_online: restaurantForm.payOnline,
          kitchen_app_enabled: restaurantForm.kitchenAppEnabled,
        },
      );

      setRestaurant(updatedRestaurant);
      setRestaurantForm(createRestaurantFormState(updatedRestaurant));
      setActiveEditModal(null);
      setFeedback({
        tone: "success",
        message: "Restaurant information updated successfully.",
      });
    } catch (error: unknown) {
      setFeedback({
        tone: "error",
        message: getErrorMessage(
          error,
          "Failed to save restaurant information.",
        ),
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
      setFeedback({ tone: "error", message: validationError });
      return;
    }

    setIsAdminSaving(true);
    setFeedback(null);

    try {
      const result = await updateAdministratorProfile(userProfile.id, {
        currentEmail: userProfile.email,
        email: adminForm.email,
        name: adminForm.name.trim(),
      });

      await refreshSessionData();
      setAdminForm(createAdminFormState(result.profile));
      setActiveEditModal(null);
      setFeedback({
        tone: result.emailChangePending ? "info" : "success",
        message: result.emailChangePending
          ? `Administrator details saved. Confirm the email change sent to ${result.pendingEmail}.`
          : "Administrator details updated successfully.",
      });
    } catch (error: unknown) {
      setFeedback({
        tone: "error",
        message: getErrorMessage(
          error,
          "Failed to save administrator details.",
        ),
      });
    } finally {
      setIsAdminSaving(false);
    }
  };

  const handleLogout = async () => {
    setShowLogoutConfirm(false);
    try {
      await signOut();
    } catch (error: unknown) {
      console.error("Logout error:", error);
      setFeedback({
        tone: "error",
        message: getErrorMessage(
          error,
          "Failed to sign out. Please try again.",
        ),
      });
    }
  };

  const renderRestaurantActions = (section: 'core' | 'contact' | 'branding' | 'story') => (
    <div className="flex items-center gap-2.5">
      <button
        type="button"
        className="inline-flex items-center justify-center gap-2 min-h-[40px] px-4 border border-[#CBD5E0] rounded-xl font-['Outfit',sans-serif] text-[13px] font-semibold cursor-pointer transition-all duration-200 bg-transparent text-[#4A5568] hover:bg-[#F8FAFC] hover:text-[#1A202C] hover:-translate-y-px disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none dark:border-tk-border dark:text-tk-text dark:hover:bg-tk-bg-elevated"
        onClick={() => startRestaurantEdit(section)}
        disabled={!restaurant}
      >
        <Edit3 size={16} /> Edit
      </button>
    </div>
  );

  const renderAdminActions = () => (
    <div className="flex items-center gap-2.5">
      <button
        type="button"
        className="inline-flex items-center justify-center gap-2 min-h-[40px] px-4 border-none rounded-xl font-['Outfit',sans-serif] text-[13px] font-semibold cursor-pointer transition-all duration-200 bg-[#EDF2F7] text-[#2D3748] hover:-translate-y-px disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none dark:bg-tk-bg-elevated dark:text-tk-text dark:hover:bg-tk-bg-hover"
        onClick={startAdminEdit}
        disabled={!userProfile}
      >
        <Edit3 size={16} /> Edit
      </button>
    </div>
  );

  function renderRestaurantProfileContent(): React.ReactNode {
    if (!restaurant) {
      return (
        <div className="border border-dashed border-[#CBD5E0] rounded-2xl p-[18px] text-[#4A5568] bg-[#F8FAFC] text-[14px] font-['Outfit',sans-serif] dark:bg-tk-bg-surface dark:border-tk-border dark:text-tk-text-secondary">
          No restaurant is assigned to this account.
        </div>
      );
    }

    if (!restaurantForm) {
      return null;
    }

    const Row = ({ label, children }: { label: string, children: React.ReactNode }) => (
      <div className="grid grid-cols-[30%_1fr] gap-4 py-5 border-b border-[#E2E8F0] dark:border-tk-border items-center">
        <span className="text-[13px] text-[#4A5568] font-semibold uppercase tracking-[0.5px] font-['Outfit',sans-serif] dark:text-tk-text-secondary">
          {label}
        </span>
        <div className="text-[16px] text-[#1A202C] font-medium font-['Outfit',sans-serif] dark:text-tk-text flex justify-between items-center w-full">
          {children}
        </div>
      </div>
    );

    return (
      <div className="flex flex-col gap-0 w-full max-w-5xl">
        {/* Core Identity */}
        <Row label="Restaurant Name">
          <span>{restaurant?.name}</span>
          {renderRestaurantActions("core")}
        </Row>
        <Row label="Restaurant Page URL">
          <a
            href={`https://tablekard.com/${restaurant?.slug || restaurant?.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || ''}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 w-fit text-[#2B6CB0] text-[14px] font-medium no-underline break-all font-['Outfit',sans-serif] hover:underline dark:text-[#90CDF4]"
          >
            tablekard.com/{restaurant?.slug || restaurant?.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || ''} <ExternalLink size={14} />
          </a>
        </Row>
        <Row label="Tagline">{restaurant?.tagline || "Not set"}</Row>
        <Row label="Subscription Status">
          <span className="inline-flex items-center gap-2">
            <CreditCardIcon size={15} style={{ color: restaurant?.subscriptionStatus ? "#48BB78" : "#A0AEC0" }} />
            {restaurant?.subscriptionStatus ? "Active" : "Inactive"}
            {restaurant?.subscriptionType ? ` (${restaurant.subscriptionType})` : ""}
          </span>
        </Row>

        {/* Contact Information */}
        <Row label="Email Address">
          <span className="inline-flex items-center gap-2">
            <MailIcon size={15} />{restaurant?.contact.email || "N/A"}
          </span>
          {renderRestaurantActions("contact")}
        </Row>
        <Row label="Phone Number">
          <span className="inline-flex items-center gap-2">
            <PhoneIcon size={15} />{restaurant?.contact.phone || "N/A"}
          </span>
        </Row>
        <Row label="Address">
          <span className="inline-flex items-center gap-2">
            <MapPinIcon size={15} />{restaurant?.contact.address || "N/A"}
          </span>
        </Row>

        {/* Operating Hours */}
        <Row label="Operating Hours (Weekdays)">{restaurant?.operatingHoursWeekdays || "Not set"}</Row>
        <Row label="Operating Hours (Weekends)">{restaurant?.operatingHoursWeekends || "Not set"}</Row>
        
        {/* Location */}
        <Row label="Location Coordinates">
          <span className="inline-flex items-center gap-2">
            <MapPinIcon size={15} />
            {restaurant ? `${formatCoordinate(restaurant.location?.latitude)}, ${formatCoordinate(restaurant.location?.longitude)}` : "N/A"}
          </span>
          {renderRestaurantActions("branding")}
        </Row>
        <Row label="Access Area Radius">
          {restaurant?.location?.allowedRadius != null ? `${restaurant.location.allowedRadius} meters` : "Not set"}
        </Row>

        {/* Story */}
        <Row label="Opening Date">
          <span>{restaurant?.openingDate || "Not set"}</span>
          {renderRestaurantActions("story")}
        </Row>
        <Row label="Manifesto">{restaurant?.manifesto || "Not set"}</Row>

      </div>
    );
  }
  function renderAdminReadOnly(): React.ReactNode {
    if (!userProfile) {
      return (
        <div className="border border-dashed border-[#CBD5E0] rounded-2xl p-[18px] text-[#4A5568] bg-[#F8FAFC] text-[14px] font-['Outfit',sans-serif] dark:bg-tk-bg-surface dark:border-tk-border dark:text-tk-text-secondary">
          Administrator profile could not be loaded.
        </div>
      );
    }

    const Row = ({ label, children }: { label: string, children: React.ReactNode }) => (
      <div className="grid grid-cols-[30%_1fr] gap-4 py-5 border-b border-[#E2E8F0] dark:border-tk-border items-center">
        <span className="text-[13px] text-[#4A5568] font-semibold uppercase tracking-[0.5px] font-['Outfit',sans-serif] dark:text-tk-text-secondary">
          {label}
        </span>
        <div className="text-[16px] text-[#1A202C] font-medium font-['Outfit',sans-serif] dark:text-tk-text flex justify-between items-center w-full">
          {children}
        </div>
      </div>
    );

    return (
      <div className="flex flex-col gap-0 w-full max-w-5xl">
        <Row label="Admin Full Name">
          <span>{userProfile?.name || "Admin User"}</span>
          {renderAdminActions()}
        </Row>
        <Row label="Admin Email Address">
          {userProfile?.email || "N/A"}
        </Row>
        <Row label="Global Role">
          <span className="inline-flex items-center px-3.5 py-1.5 rounded-xl text-[12px] font-semibold capitalize w-fit font-['Outfit',sans-serif] bg-[#D6BCFA] text-[#44337A] dark:bg-[rgba(214,188,250,0.15)] dark:text-[#D6BCFA]">
            {formatLabel(userProfile?.role)}
          </span>
        </Row>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center min-h-[calc(100vh-80px)]">
        <div className="flex flex-col items-center justify-center h-full text-[#4A5568] font-['Outfit',sans-serif] dark:text-tk-text-secondary">
          <div className="w-10 h-10 border-3 border-[#E2E8F0] border-t-tk-burgundy rounded-full animate-spin mb-4"></div>
          <p>Loading profile information...</p>
        </div>
      </div>
    );
  }


  const renderEditModal = () => {
    if (!activeEditModal) return null;

    let title = "";
    let description = "";
    let content = null;
    let onSave: any = () => { };
    let onCancel = () => { };
    let isSaving = false;

    if (activeEditModal === "admin") {
      title = "Edit Admin Profile";
      description = "Update your personal details.";
      content = (
        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-2">
            <span className="text-[12px] font-semibold text-[#4A5568] uppercase tracking-[0.5px] font-['Outfit',sans-serif] dark:text-tk-text-secondary">Full Name</span>
            <input
              className="w-full border border-[#CBD5E0] rounded-xl bg-white text-[#1A202C] px-3.5 py-3 text-[14px] font-['Outfit',sans-serif] box-border transition-all duration-200 focus:outline-none focus:border-tk-burgundy focus:ring-4 focus:ring-[rgba(139,58,30,0.12)] dark:bg-tk-bg-surface dark:border-tk-border dark:text-tk-text"
              type="text"
              value={adminForm.name}
              onChange={(event) =>
                handleAdminFieldChange("name", event.target.value)
              }
              placeholder="Administrator name"
              maxLength={120}
              required
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-[12px] font-semibold text-[#4A5568] uppercase tracking-[0.5px] font-['Outfit',sans-serif] dark:text-tk-text-secondary">Email Address</span>
            <input
              className="w-full border border-[#CBD5E0] rounded-xl bg-white text-[#1A202C] px-3.5 py-3 text-[14px] font-['Outfit',sans-serif] box-border transition-all duration-200 focus:outline-none focus:border-tk-burgundy focus:ring-4 focus:ring-[rgba(139,58,30,0.12)] dark:bg-tk-bg-surface dark:border-tk-border dark:text-tk-text"
              type="email"
              value={adminForm.email}
              onChange={(event) =>
                handleAdminFieldChange("email", event.target.value)
              }
              placeholder="admin@restaurant.com"
              required
            />
            <span className="text-[#4A5568] text-[12px] leading-relaxed font-['Outfit',sans-serif] dark:text-tk-text-secondary">
              Changing email may require confirmation before it becomes
              active.
            </span>
          </label>

        </div>
      );
      onSave = (e: any) => {
        if (e && e.preventDefault) e.preventDefault();
        handleAdminSave(e);
      };
      onCancel = cancelAdminEdit;
      isSaving = isAdminSaving;
    } else {
      if (!restaurantForm) return null;
      onSave = () => handleRestaurantSave();
      onCancel = cancelRestaurantEdit;
      isSaving = isRestaurantSaving;

      if (activeEditModal === "core") {
        title = "Edit Core Identity";
        description = "Essential details about the restaurant.";
        content = (
          <div className="flex flex-col gap-4">
            <label className="flex flex-col gap-2">
              <span className="text-[12px] font-semibold text-[#4A5568] uppercase tracking-[0.5px] font-['Outfit',sans-serif] dark:text-tk-text-secondary">Restaurant Name</span>
              <input
                className="w-full border border-[#CBD5E0] rounded-xl bg-white text-[#1A202C] px-3.5 py-3 text-[14px] font-['Outfit',sans-serif] box-border transition-all duration-200 focus:outline-none focus:border-tk-burgundy focus:ring-4 focus:ring-[rgba(139,58,30,0.12)] dark:bg-tk-bg-surface dark:border-tk-border dark:text-tk-text"
                type="text"
                value={restaurantForm.name}
                onChange={(event) =>
                  handleRestaurantFieldChange("name", event.target.value)
                }
                placeholder="Restaurant name"
                maxLength={120}
                required
              />
            </label>
            <div className="flex flex-col gap-1.5 relative">
              <label className="flex flex-col gap-2 relative">
                <span className="text-[12px] font-semibold text-[#4A5568] uppercase tracking-[0.5px] font-['Outfit',sans-serif] dark:text-tk-text-secondary">Restaurant Page URL</span>
                <div className="relative flex items-center">
                  <div className="absolute left-0 top-0 bottom-0 flex items-center justify-center px-3.5 bg-[#EDF2F7] border border-[#CBD5E0] border-r-0 rounded-l-xl z-10 select-none text-[#4A5568] text-[14px] font-['Outfit',sans-serif] dark:bg-tk-bg-surface dark:border-tk-border dark:text-tk-text-secondary">
                    tablekard.com/
                  </div>
                  <input
                    className={`w-full border rounded-xl bg-white text-[#1A202C] py-3 text-[14px] font-['Outfit',sans-serif] box-border transition-all duration-200 focus:outline-none dark:bg-tk-bg-surface dark:text-tk-text pr-10 ${slugAvailable === false ? 'border-red-500 focus:border-red-500 focus:ring-4 focus:ring-red-500/20' : 'border-[#CBD5E0] focus:border-tk-burgundy focus:ring-4 focus:ring-[rgba(139,58,30,0.12)] dark:border-tk-border'}`}
                    style={{ paddingLeft: '135px' }}
                    type="text"
                    value={restaurantForm.slug}
                    onChange={(event) =>
                      handleRestaurantFieldChange("slug", event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))
                    }
                    placeholder="my-restaurant"
                    maxLength={60}
                    required
                  />
                  {checkingSlug && (
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-[#CBD5E0] border-t-tk-burgundy rounded-full animate-spin z-10"></div>
                  )}
                </div>
              </label>
              {slugAvailable === false && (
                <span className="text-[12px] text-red-500 font-medium mt-0.5">Not available, please choose another</span>
              )}
            </div>

            <label className="flex flex-col gap-2">
              <span className="text-[12px] font-semibold text-[#4A5568] uppercase tracking-[0.5px] font-['Outfit',sans-serif] dark:text-tk-text-secondary">Tagline</span>
              <input
                className="w-full border border-[#CBD5E0] rounded-xl bg-white text-[#1A202C] px-3.5 py-3 text-[14px] font-['Outfit',sans-serif] box-border transition-all duration-200 focus:outline-none focus:border-tk-burgundy focus:ring-4 focus:ring-[rgba(139,58,30,0.12)] dark:bg-tk-bg-surface dark:border-tk-border dark:text-tk-text"
                type="text"
                value={restaurantForm.tagline}
                onChange={(event) =>
                  handleRestaurantFieldChange("tagline", event.target.value)
                }
                placeholder="A short catchy phrase"
              />
            </label>

            <div className="flex flex-col gap-1.5">
              <span className="text-[13px] text-[#4A5568] font-semibold uppercase tracking-[0.5px] font-['Outfit',sans-serif] dark:text-tk-text-secondary">Status</span>
              <span
                className={`inline-flex items-center px-3.5 py-1.5 rounded-xl text-[12px] font-semibold capitalize w-fit font-['Outfit',sans-serif] ${String(restaurant?.status || "").toLowerCase()}`}
              >
                {formatLabel(String(restaurant?.status || "unknown"))}
              </span>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-[13px] text-[#4A5568] font-semibold uppercase tracking-[0.5px] font-['Outfit',sans-serif] dark:text-tk-text-secondary">Subscription Status</span>
              <span className="text-[16px] text-[#1A202C] font-medium font-['Outfit',sans-serif] dark:text-tk-text inline-flex items-center gap-2">
                <CreditCardIcon
                  size={15}
                  style={{
                    color: restaurant?.subscriptionStatus
                      ? "#48BB78"
                      : "#A0AEC0",
                  }}
                />
                {restaurant?.subscriptionStatus ? "Active" : "Inactive"}
                {restaurant?.subscriptionType
                  ? ` (${restaurant.subscriptionType})`
                  : ""}
              </span>
            </div>
          </div>
        );
      } else if (activeEditModal === "contact") {
        title = "Edit Contact & Operating Hours";
        description = "How customers can reach you and when you're open.";
        content = (
          <div className="flex flex-col gap-4">
            <div
              className="col-span-1"
              style={{
                fontSize: "13px",
                fontWeight: 600,
                color: "#718096",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                borderBottom: "1px solid #EDF2F7",
                paddingBottom: "8px",
                marginBottom: "8px",
              }}
            >
              Contact Information
            </div>

            <label className="flex flex-col gap-2">
              <span className="text-[12px] font-semibold text-[#4A5568] uppercase tracking-[0.5px] font-['Outfit',sans-serif] dark:text-tk-text-secondary">Contact Email</span>
              <input
                className="w-full border border-[#CBD5E0] rounded-xl bg-white text-[#1A202C] px-3.5 py-3 text-[14px] font-['Outfit',sans-serif] box-border transition-all duration-200 focus:outline-none focus:border-tk-burgundy focus:ring-4 focus:ring-[rgba(139,58,30,0.12)] dark:bg-tk-bg-surface dark:border-tk-border dark:text-tk-text"
                type="email"
                value={restaurantForm.contactEmail}
                onChange={(event) =>
                  handleRestaurantFieldChange(
                    "contactEmail",
                    event.target.value,
                  )
                }
                placeholder="ops@restaurant.com"
                required
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-[12px] font-semibold text-[#4A5568] uppercase tracking-[0.5px] font-['Outfit',sans-serif] dark:text-tk-text-secondary">Contact Phone</span>
              <input
                className="w-full border border-[#CBD5E0] rounded-xl bg-white text-[#1A202C] px-3.5 py-3 text-[14px] font-['Outfit',sans-serif] box-border transition-all duration-200 focus:outline-none focus:border-tk-burgundy focus:ring-4 focus:ring-[rgba(139,58,30,0.12)] dark:bg-tk-bg-surface dark:border-tk-border dark:text-tk-text"
                type="tel"
                value={restaurantForm.contactPhone}
                onChange={(event) =>
                  handleRestaurantFieldChange(
                    "contactPhone",
                    event.target.value,
                  )
                }
                placeholder="+91 98765 43210"
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-[12px] font-semibold text-[#4A5568] uppercase tracking-[0.5px] font-['Outfit',sans-serif] dark:text-tk-text-secondary">Address</span>
              <textarea
                className="w-full border border-[#CBD5E0] rounded-xl bg-white text-[#1A202C] px-3.5 py-3 text-[14px] font-['Outfit',sans-serif] box-border transition-all duration-200 focus:outline-none focus:border-tk-burgundy focus:ring-4 focus:ring-[rgba(139,58,30,0.12)] dark:bg-tk-bg-surface dark:border-tk-border dark:text-tk-text resize-y min-h-[96px]"
                value={restaurantForm.contactAddress}
                onChange={(event) =>
                  handleRestaurantFieldChange(
                    "contactAddress",
                    event.target.value,
                  )
                }
                placeholder="Street, locality, city, state"
                rows={3}
              />
            </label>

            <div
              className="col-span-1"
              style={{
                fontSize: "13px",
                fontWeight: 600,
                color: "#718096",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                borderBottom: "1px solid #EDF2F7",
                paddingBottom: "8px",
                marginTop: "16px",
                marginBottom: "8px",
              }}
            >
              Operating Hours
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-[12px] font-semibold text-[#4A5568] uppercase tracking-[0.5px] font-['Outfit',sans-serif] dark:text-tk-text-secondary">
                Operating Hours (Weekdays)
              </span>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-2" style={{ gap: "4px" }}>
                  <span
                    style={{
                      fontSize: "10px",
                      color: "#718096",
                      textTransform: "uppercase",
                      fontWeight: 600,
                    }}
                  >
                    Opening Time
                  </span>
                  <input
                    className="w-full border border-[#CBD5E0] rounded-xl bg-white text-[#1A202C] px-3.5 py-3 text-[14px] font-['Outfit',sans-serif] box-border transition-all duration-200 focus:outline-none focus:border-tk-burgundy focus:ring-4 focus:ring-[rgba(139,58,30,0.12)] dark:bg-tk-bg-surface dark:border-tk-border dark:text-tk-text"
                    type="time"
                    value={get24hTime(
                      restaurantForm.operatingHoursWeekdays,
                      "open",
                    )}
                    onChange={(event) =>
                      handleTimeChange("weekdays", "open", event.target.value)
                    }
                  />
                </div>
                <div className="flex flex-col gap-2" style={{ gap: "4px" }}>
                  <span
                    style={{
                      fontSize: "10px",
                      color: "#718096",
                      textTransform: "uppercase",
                      fontWeight: 600,
                    }}
                  >
                    Closing Time
                  </span>
                  <input
                    className="w-full border border-[#CBD5E0] rounded-xl bg-white text-[#1A202C] px-3.5 py-3 text-[14px] font-['Outfit',sans-serif] box-border transition-all duration-200 focus:outline-none focus:border-tk-burgundy focus:ring-4 focus:ring-[rgba(139,58,30,0.12)] dark:bg-tk-bg-surface dark:border-tk-border dark:text-tk-text"
                    type="time"
                    value={get24hTime(
                      restaurantForm.operatingHoursWeekdays,
                      "close",
                    )}
                    onChange={(event) =>
                      handleTimeChange(
                        "weekdays",
                        "close",
                        event.target.value,
                      )
                    }
                  />
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-[12px] font-semibold text-[#4A5568] uppercase tracking-[0.5px] font-['Outfit',sans-serif] dark:text-tk-text-secondary">
                Operating Hours (Weekends)
              </span>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-2" style={{ gap: "4px" }}>
                  <span
                    style={{
                      fontSize: "10px",
                      color: "#718096",
                      textTransform: "uppercase",
                      fontWeight: 600,
                    }}
                  >
                    Opening Time
                  </span>
                  <input
                    className="w-full border border-[#CBD5E0] rounded-xl bg-white text-[#1A202C] px-3.5 py-3 text-[14px] font-['Outfit',sans-serif] box-border transition-all duration-200 focus:outline-none focus:border-tk-burgundy focus:ring-4 focus:ring-[rgba(139,58,30,0.12)] dark:bg-tk-bg-surface dark:border-tk-border dark:text-tk-text"
                    type="time"
                    value={get24hTime(
                      restaurantForm.operatingHoursWeekends,
                      "open",
                    )}
                    onChange={(event) =>
                      handleTimeChange("weekends", "open", event.target.value)
                    }
                  />
                </div>
                <div className="flex flex-col gap-2" style={{ gap: "4px" }}>
                  <span
                    style={{
                      fontSize: "10px",
                      color: "#718096",
                      textTransform: "uppercase",
                      fontWeight: 600,
                    }}
                  >
                    Closing Time
                  </span>
                  <input
                    className="w-full border border-[#CBD5E0] rounded-xl bg-white text-[#1A202C] px-3.5 py-3 text-[14px] font-['Outfit',sans-serif] box-border transition-all duration-200 focus:outline-none focus:border-tk-burgundy focus:ring-4 focus:ring-[rgba(139,58,30,0.12)] dark:bg-tk-bg-surface dark:border-tk-border dark:text-tk-text"
                    type="time"
                    value={get24hTime(
                      restaurantForm.operatingHoursWeekends,
                      "close",
                    )}
                    onChange={(event) =>
                      handleTimeChange(
                        "weekends",
                        "close",
                        event.target.value,
                      )
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        );
      } else if (activeEditModal === "branding") {
        title = "Edit Location";
        description = "Where to find you.";
        content = (
          <div className="flex flex-col gap-4">

            <label className="flex flex-col gap-2">
              <span className="text-[12px] font-semibold text-[#4A5568] uppercase tracking-[0.5px] font-['Outfit',sans-serif] dark:text-tk-text-secondary">
                Access Area Radius (meters)
              </span>
              <input
                className="w-full border border-[#CBD5E0] rounded-xl bg-white text-[#1A202C] px-3.5 py-3 text-[14px] font-['Outfit',sans-serif] box-border transition-all duration-200 focus:outline-none focus:border-tk-burgundy focus:ring-4 focus:ring-[rgba(139,58,30,0.12)] dark:bg-tk-bg-surface dark:border-tk-border dark:text-tk-text"
                type="number"
                min="1"
                step="1"
                value={restaurantForm.allowedRadius}
                onChange={(event) =>
                  handleRestaurantFieldChange(
                    "allowedRadius",
                    event.target.value,
                  )
                }
                placeholder="250"
              />
            </label>

            <div className="flex flex-col gap-2 col-span-1">
              <span className="text-[12px] font-semibold text-[#4A5568] uppercase tracking-[0.5px] font-['Outfit',sans-serif] dark:text-tk-text-secondary">Location Coordinates</span>
              <div className="flex flex-col gap-4">
                <label className="flex flex-col gap-2" style={{ gap: "4px" }}>
                  <span
                    className="text-[12px] font-semibold text-[#4A5568] uppercase tracking-[0.5px] font-['Outfit',sans-serif] dark:text-tk-text-secondary"
                    style={{ fontSize: "10px", color: "#718096" }}
                  >
                    Latitude
                  </span>
                  <input
                    className="w-full border border-[#CBD5E0] rounded-xl bg-white text-[#1A202C] px-3.5 py-3 text-[14px] font-['Outfit',sans-serif] box-border transition-all duration-200 focus:outline-none focus:border-tk-burgundy focus:ring-4 focus:ring-[rgba(139,58,30,0.12)] dark:bg-tk-bg-surface dark:border-tk-border dark:text-tk-text"
                    type="number"
                    min="-90"
                    max="90"
                    step="0.000001"
                    value={restaurantForm.latitude}
                    onChange={(event) =>
                      handleRestaurantFieldChange(
                        "latitude",
                        event.target.value,
                      )
                    }
                    placeholder="26.144516"
                  />
                </label>
                <label className="flex flex-col gap-2" style={{ gap: "4px" }}>
                  <span
                    className="text-[12px] font-semibold text-[#4A5568] uppercase tracking-[0.5px] font-['Outfit',sans-serif] dark:text-tk-text-secondary"
                    style={{ fontSize: "10px", color: "#718096" }}
                  >
                    Longitude
                  </span>
                  <input
                    className="w-full border border-[#CBD5E0] rounded-xl bg-white text-[#1A202C] px-3.5 py-3 text-[14px] font-['Outfit',sans-serif] box-border transition-all duration-200 focus:outline-none focus:border-tk-burgundy focus:ring-4 focus:ring-[rgba(139,58,30,0.12)] dark:bg-tk-bg-surface dark:border-tk-border dark:text-tk-text"
                    type="number"
                    min="-180"
                    max="180"
                    step="0.000001"
                    value={restaurantForm.longitude}
                    onChange={(event) =>
                      handleRestaurantFieldChange(
                        "longitude",
                        event.target.value,
                      )
                    }
                    placeholder="91.736237"
                  />
                </label>
              </div>

              <div
                id="profile-map"
                style={{
                  height: "300px",
                  width: "100%",
                  borderRadius: "14px",
                  marginTop: "12px",
                  zIndex: 1,
                  backgroundColor: "#E2E8F0",
                  border: "1px solid #CBD5E0",
                }}
              ></div>

              <div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-3">
                <button
                  type="button"
                  className="inline-flex items-center gap-2 px-[18px] py-2.5 border-2 border-dashed border-tk-burgundy rounded-xl bg-[#F0FFF4] text-tk-burgundy text-[13px] font-semibold font-['Outfit',sans-serif] cursor-pointer transition-all duration-200 disabled:opacity-70 disabled:cursor-wait dark:bg-[rgba(72,187,120,0.1)] shrink-0"
                  onClick={handleUseMyLocation}
                  disabled={isLocating}
                >
                  <Crosshair
                    size={16}
                    className={isLocating ? "profile-locate-spin" : ""}
                  />
                  {isLocating ? "Locating…" : "Use My Current Location"}
                </button>
                <span className="text-[#4A5568] text-[12px] leading-relaxed font-['Outfit',sans-serif] dark:text-tk-text-secondary">
                  Drag the pin or click on the map to set location accurately.
                </span>
              </div>
            </div>

          </div>
        );
      } else if (activeEditModal === "story") {
        title = "Edit Our Story & Socials";
        description = "Tell your customers about your restaurant.";
        content = (
          <div className="flex flex-col gap-4">
            <label className="flex flex-col gap-2">
              <span className="text-[12px] font-semibold text-[#4A5568] uppercase tracking-[0.5px] font-['Outfit',sans-serif] dark:text-tk-text-secondary">Opening Date</span>
              <input
                className="w-full border border-[#CBD5E0] rounded-xl bg-white text-[#1A202C] px-3.5 py-3 text-[14px] font-['Outfit',sans-serif] box-border transition-all duration-200 focus:outline-none focus:border-tk-burgundy focus:ring-4 focus:ring-[rgba(139,58,30,0.12)] dark:bg-tk-bg-surface dark:border-tk-border dark:text-tk-text"
                type="date"
                value={restaurantForm.openingDate}
                onChange={(event) =>
                  handleRestaurantFieldChange("openingDate", event.target.value)
                }
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-[12px] font-semibold text-[#4A5568] uppercase tracking-[0.5px] font-['Outfit',sans-serif] dark:text-tk-text-secondary">Manifesto / Our Story</span>
              <textarea
                className="w-full border border-[#CBD5E0] rounded-xl bg-white text-[#1A202C] px-3.5 py-3 text-[14px] font-['Outfit',sans-serif] box-border transition-all duration-200 focus:outline-none focus:border-tk-burgundy focus:ring-4 focus:ring-[rgba(139,58,30,0.12)] dark:bg-tk-bg-surface dark:border-tk-border dark:text-tk-text resize-y min-h-[96px]"
                value={restaurantForm.manifesto}
                onChange={(event) =>
                  handleRestaurantFieldChange("manifesto", event.target.value)
                }
                placeholder="Tell the story of your restaurant..."
                rows={4}
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-[12px] font-semibold text-[#4A5568] uppercase tracking-[0.5px] font-['Outfit',sans-serif] dark:text-tk-text-secondary">Instagram URL</span>
              <input
                className="w-full border border-[#CBD5E0] rounded-xl bg-white text-[#1A202C] px-3.5 py-3 text-[14px] font-['Outfit',sans-serif] box-border transition-all duration-200 focus:outline-none focus:border-tk-burgundy focus:ring-4 focus:ring-[rgba(139,58,30,0.12)] dark:bg-tk-bg-surface dark:border-tk-border dark:text-tk-text"
                type="url"
                value={restaurantForm.instagramUrl}
                onChange={(event) =>
                  handleRestaurantFieldChange(
                    "instagramUrl",
                    event.target.value,
                  )
                }
                placeholder="https://instagram.com/yourrestaurant"
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-[12px] font-semibold text-[#4A5568] uppercase tracking-[0.5px] font-['Outfit',sans-serif] dark:text-tk-text-secondary">Facebook URL</span>
              <input
                className="w-full border border-[#CBD5E0] rounded-xl bg-white text-[#1A202C] px-3.5 py-3 text-[14px] font-['Outfit',sans-serif] box-border transition-all duration-200 focus:outline-none focus:border-tk-burgundy focus:ring-4 focus:ring-[rgba(139,58,30,0.12)] dark:bg-tk-bg-surface dark:border-tk-border dark:text-tk-text"
                type="url"
                value={restaurantForm.facebookUrl}
                onChange={(event) =>
                  handleRestaurantFieldChange("facebookUrl", event.target.value)
                }
                placeholder="https://facebook.com/yourrestaurant"
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-[12px] font-semibold text-[#4A5568] uppercase tracking-[0.5px] font-['Outfit',sans-serif] dark:text-tk-text-secondary">Website URL</span>
              <input
                className="w-full border border-[#CBD5E0] rounded-xl bg-white text-[#1A202C] px-3.5 py-3 text-[14px] font-['Outfit',sans-serif] box-border transition-all duration-200 focus:outline-none focus:border-tk-burgundy focus:ring-4 focus:ring-[rgba(139,58,30,0.12)] dark:bg-tk-bg-surface dark:border-tk-border dark:text-tk-text"
                type="url"
                value={restaurantForm.websiteUrl}
                onChange={(event) =>
                  handleRestaurantFieldChange("websiteUrl", event.target.value)
                }
                placeholder="https://yourrestaurant.com"
              />
            </label>
          </div>
        );
      }
    }

    return (
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[100] p-5">
        <div className="bg-white rounded-3xl p-8 max-w-[500px] w-full shadow-[0_24px_48px_rgba(0,0,0,0.12)] dark:bg-tk-bg-card dark:border dark:border-tk-border flex flex-col max-h-[90vh]">
          <div className="flex justify-between items-center mb-6 shrink-0">
            <div>
              <h2 className="text-[20px] font-bold text-[#1A202C] font-['Outfit',sans-serif] dark:text-tk-text m-0">{title}</h2>
              <p className="text-[13px] text-[#64748B] font-['Outfit',sans-serif] m-0 mt-1">{description}</p>
            </div>
            <button onClick={onCancel} className="bg-transparent border-none cursor-pointer text-[#94A3B8] hover:text-[#475569] transition-colors p-1" type="button">
              <X size={20} />
            </button>
          </div>

          <div className="overflow-y-auto no-scrollbar flex-1 pr-2 pb-4 -mr-2">
            {content}
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-[#E2E8F0] dark:border-tk-border shrink-0">
            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 border-none rounded-xl font-['Outfit',sans-serif] text-[14px] font-semibold cursor-pointer transition-all duration-200 bg-[#EDF2F7] text-[#2D3748] hover:bg-[#E2E8F0] dark:bg-tk-bg-elevated dark:text-tk-text dark:hover:bg-tk-bg-hover"
              onClick={onCancel}
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 min-h-[44px] px-6 border-none rounded-xl font-['Outfit',sans-serif] text-[14px] font-semibold cursor-pointer transition-all duration-200 bg-[linear-gradient(135deg,var(--tk-burgundy),#6B2A15)] text-white shadow-[0_8px_18px_rgba(139,58,30,0.2)] hover:shadow-[0_12px_24px_rgba(139,58,30,0.3)] hover:-translate-y-px disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
              onClick={onSave}
              disabled={isSaving}
            >
              <Save size={16} /> {isSaving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="flex flex-col gap-4 mb-8">
        {/* Header Row: Title & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E2E8F0] dark:border-tk-border">
          <div>
            <h1 className="text-3xl font-extrabold text-[#1A202C] font-['Outfit',sans-serif] dark:text-white mb-1.5 tracking-tight">
              Restaurant Profile
            </h1>
            <p className="text-[14px] text-[#64748B] font-['Outfit',sans-serif] dark:text-tk-text-secondary">
              Manage your restaurant details, branding, features, and settings.
            </p>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <button
              className="relative h-11 px-5 rounded-xl bg-white dark:bg-tk-bg-elevated text-[#E53E3E] border border-[#E53E3E]/20 flex items-center justify-center cursor-pointer shadow-[0_2px_8px_rgba(229,62,62,0.08)] overflow-hidden transition-all duration-300 z-10 before:absolute before:inset-0 before:w-full before:h-full before:bg-[#E53E3E] before:-z-10 before:-translate-x-full before:transition-transform before:duration-300 hover:before:translate-x-0 hover:text-white hover:shadow-[0_8px_16px_rgba(229,62,62,0.3)] hover:-translate-y-0.5 active:translate-y-0 font-bold font-['Outfit',sans-serif] text-[13px] tracking-wide"
              title="Sign Out"
              onClick={() => setShowLogoutConfirm(true)}
            >
              Sign Out
            </button>

          </div>
        </div>

        </div>

      {feedback && (
        <div
          className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[9999] px-4 py-3 rounded-[24px] flex items-center gap-3 shadow-[0_10px_30px_rgba(0,0,0,0.3)] animate-in fade-in slide-in-from-bottom-5 duration-300 font-['Outfit',sans-serif]"
          style={{
            backgroundColor: "#0F172A",
            color: "#FFFFFF",
          }}
        >
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
            style={{ backgroundColor: feedback.tone === 'success' ? '#4ADE80' : feedback.tone === 'error' ? '#EF4444' : '#3B82F6' }}
          >
            {feedback.tone === 'success' ? (
              <Check size={14} strokeWidth={3.5} color="#FFFFFF" />
            ) : (
              <AlertTriangle size={14} strokeWidth={3} color="#FFFFFF" />
            )}
          </div>
          <span className="text-[15px] font-medium whitespace-nowrap pr-3">
            {feedback.message}
          </span>
        </div>
      )}

      <div className="flex flex-col gap-8 w-full" style={{ display: "block" }}>
        {renderRestaurantProfileContent()}

        

        {/* Admin Profile Section */}
        <div style={{ width: '100%', height: '1px', background: '#E2E8F0', margin: '40px 0 20px 0' }} className="dark:bg-tk-border"></div>
        <form onSubmit={handleAdminSave} style={{ display: 'flex', flexDirection: 'column' }}>
          {renderAdminReadOnly()}
        </form>
      </div>

      {renderEditModal()}

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[100] p-5">
          <div className="bg-white rounded-3xl p-8 max-w-[420px] w-full shadow-[0_24px_48px_rgba(0,0,0,0.12)] dark:bg-tk-bg-card dark:border dark:border-tk-border">
            <div className="flex justify-between items-center mb-6">
              <div className="profile-modal-icon logout-icon">
                <LogOut size={24} />
              </div>
              <h3>Sign Out</h3>
            </div>
            <p>Are you sure you want to sign out of your account?</p>
            <div className="flex gap-3 justify-end">
              <button
                className="inline-flex items-center justify-center gap-2 min-h-[40px] px-4 border-none rounded-xl font-['Outfit',sans-serif] text-[13px] font-semibold cursor-pointer transition-all duration-200 bg-[#EDF2F7] text-[#2D3748] hover:-translate-y-px disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none dark:bg-tk-bg-elevated dark:text-tk-text dark:hover:bg-tk-bg-hover"
                onClick={() => setShowLogoutConfirm(false)}
              >
                Cancel
              </button>
              <button
                className="relative inline-flex items-center justify-center gap-2 min-h-[40px] px-6 border-none rounded-xl font-['Outfit',sans-serif] text-[13px] font-bold cursor-pointer overflow-hidden transition-all duration-300 z-10 bg-[#E53E3E] text-white shadow-[0_4px_12px_rgba(229,62,62,0.3)] hover:-translate-y-0.5 before:absolute before:inset-0 before:w-full before:h-full before:bg-[#C53030] before:-z-10 before:-translate-x-full before:transition-transform before:duration-300 hover:before:translate-x-0 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none logout-confirm-btn"
                onClick={handleLogout}
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProfilePage;
