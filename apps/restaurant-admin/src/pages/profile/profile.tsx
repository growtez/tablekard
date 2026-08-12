import React, { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  Check,
  CreditCardIcon,
  Crosshair,
  ExternalLink,
  LogOut,
  MailIcon,
  MapPinIcon,
  PhoneIcon,
} from "lucide-react";
import { Link } from "react-router-dom";
import type { Restaurant } from "@restaurant-saas/types";
import { useAuth } from "../../context/AuthContext";
import {
  getRestaurantById,
  updateAdministratorProfile,
  updateRestaurantProfile,
} from "../../services/supabaseService";
import { supabase } from "@restaurant-saas/supabase";

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
  restaurant: Restaurant
): RestaurantFormState => ({
  name: restaurant.name ?? "",
  slug:
    restaurant.slug ||
    (restaurant.name
      ? restaurant.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "")
      : ""),
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
  } | null
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
  if (!/^[a-z0-9-]+$/.test(form.slug.trim()))
    return "Slug can only contain lowercase letters, numbers, and hyphens.";
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

const Row = ({
  label,
  children,
  plain,
}: {
  label: string;
  children: React.ReactNode;
  plain?: boolean;
}) => (
  <div className="grid grid-cols-[220px_1fr] sm:grid-cols-[260px_1fr] gap-2 py-1 items-center">
    <span className="text-[13px] text-[#4A5568] font-semibold uppercase tracking-[0.5px] font-['Outfit',sans-serif] dark:text-tk-text-secondary">
      {label}
    </span>
    {plain ? (
      <div className="text-[15px] text-[#1A202C] font-medium font-['Outfit',sans-serif] dark:text-tk-text flex items-center w-full">
        {children}
      </div>
    ) : (
      <div className="text-[15px] text-[#1A202C] font-medium font-['Outfit',sans-serif] dark:text-tk-text flex justify-start items-center w-full gap-2 min-h-[46px]">
        {children}
      </div>
    )}
  </div>
);

const ProfilePage: React.FC = () => {
  const { userProfile, activeRestaurantId, refreshSessionData, signOut } =
    useAuth();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [restaurantForm, setRestaurantForm] =
    useState<RestaurantFormState | null>(null);
  const [adminForm, setAdminForm] = useState<AdminFormState>(
    createAdminFormState(userProfile)
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

  const [showMap, setShowMap] = useState<boolean>(false);
  const [isEditingProfile, setIsEditingProfile] = useState<boolean>(false);
  const [isRestaurantSaving, setIsRestaurantSaving] = useState(false);
  const [isAdminSaving, setIsAdminSaving] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
    const [isLocating, setIsLocating] = useState(false);

  const shallowEqual = (obj1: any, obj2: any): boolean => {
    if (obj1 === obj2) return true;
    if (!obj1 || !obj2 || typeof obj1 !== 'object' || typeof obj2 !== 'object') return false;
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);
    if (keys1.length !== keys2.length) return false;
    for (const key of keys1) {
      if (obj1[key] !== obj2[key]) return false;
    }
    return true;
  };

  const hasChanges =
    (restaurant && restaurantForm &&
      !shallowEqual(restaurantForm, createRestaurantFormState(restaurant))) ||
    (userProfile && adminForm &&
      !shallowEqual(adminForm, createAdminFormState(userProfile)));



  useEffect(() => {
    if (!isEditingProfile || !restaurantForm?.slug) {
      setSlugAvailable(null);
      setCheckingSlug(false);
      return;
    }

    if (restaurant && restaurantForm.slug === restaurant.slug) {
      setSlugAvailable(true);
      setCheckingSlug(false);
      return;
    }

    setSlugAvailable(null);
    setCheckingSlug(true);

    const checkSlug = async () => {
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
  }, [restaurantForm?.slug, isEditingProfile, restaurant]);

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
            "Failed to load restaurant details. Please try again."
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
    value: string
  ) => {
    setRestaurantForm((current) =>
      current ? { ...current, [field]: value } : current
    );
  };

  const handleAdminFieldChange = (
    field: keyof AdminFormState,
    value: string
  ) => {
    setAdminForm((current) => ({ ...current, [field]: value }));
  };

  const get24hTime = (
    text: string | undefined | null,
    type: "open" | "close"
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
    val: string
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
      `${formatTime12h(newOpen24)} - ${formatTime12h(newClose24)}`
    );
  };

  const mapInstanceRef = useRef<any>(null);
  const mapMarkerRef = useRef<any>(null);
  const isEditingProfileRef = useRef(isEditingProfile);

  useEffect(() => {
    isEditingProfileRef.current = isEditingProfile;
  }, [isEditingProfile]);

  useEffect(() => {
    if (!showMap && !isEditingProfile) return;

    const initMap = () => {
      const L = (window as any).L;
      if (!L) return;
      const mapEl = document.getElementById("profile-map");
      if (!mapEl) return;

      if (mapInstanceRef.current) return;

      const initialLat = parseFloat(String(restaurantForm?.latitude || restaurant?.location?.latitude || "26.1445"));
      const initialLng = parseFloat(String(restaurantForm?.longitude || restaurant?.location?.longitude || "91.7362"));

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
        draggable: isEditingProfileRef.current,
      }).addTo(map);

      marker.on("dragend", function () {
        if (!isEditingProfileRef.current) return;
        const position = marker.getLatLng();
        setRestaurantForm((current) =>
          current
            ? {
              ...current,
              latitude: position.lat.toFixed(6),
              longitude: position.lng.toFixed(6),
            }
            : current
        );
      });

      map.on("click", function (event: any) {
        if (!isEditingProfileRef.current) return;
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
            : current
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

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        mapMarkerRef.current = null;
      }
    };
  }, [restaurant, showMap, isEditingProfile]);

  useEffect(() => {
    if (mapMarkerRef.current) {
      if (isEditingProfile) {
        mapMarkerRef.current.dragging.enable();
      } else {
        mapMarkerRef.current.dragging.disable();
      }
    }
  }, [isEditingProfile]);

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
  }, [isEditingProfile, restaurantForm?.latitude, restaurantForm?.longitude]);

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
            : current
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
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleCancelEdit = () => {
    if (hasChanges) {
      setShowCancelConfirm(true);
    } else {
      handleConfirmCancel();
    }
  };

  const handleConfirmCancel = () => {
    resetRestaurantForm();
    resetAdminForm();
    setIsEditingProfile(false);
    setShowCancelConfirm(false);
  };

  const handleSaveProfile = async () => {
    let success = true;

    // Save Restaurant
    if (activeRestaurantId && restaurantForm) {
      const validationError = validateRestaurantForm(restaurantForm);
      if (validationError) {
        setFeedback({ tone: "error", message: validationError });
        return;
      }

      if (
        restaurantForm.slug !== restaurant?.slug &&
        slugAvailable === false
      ) {
        setFeedback({
          tone: "error",
          message: "Custom slug is not available. Please choose another.",
        });
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
              restaurantForm.operatingHoursWeekdays
            ),
            operatingHoursWeekends: emptyToNull(
              restaurantForm.operatingHoursWeekends
            ),
            instagramUrl: emptyToNull(restaurantForm.instagramUrl),
            facebookUrl: emptyToNull(restaurantForm.facebookUrl),
            websiteUrl: emptyToNull(restaurantForm.websiteUrl),
            pay_online: restaurantForm.payOnline,
            kitchen_app_enabled: restaurantForm.kitchenAppEnabled,
          }
        );

        setRestaurant(updatedRestaurant);
        setRestaurantForm(createRestaurantFormState(updatedRestaurant));
      } catch (error: unknown) {
        setFeedback({
          tone: "error",
          message: getErrorMessage(
            error,
            "Failed to save restaurant information."
          ),
        });
        success = false;
      } finally {
        setIsRestaurantSaving(false);
      }
    }

    // Save Admin
    if (success && userProfile && adminForm) {
      if (
        adminForm.name !== userProfile.name ||
        adminForm.email !== userProfile.email
      ) {
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
          setFeedback({
            tone: result.emailChangePending ? "info" : "success",
            message: result.emailChangePending
              ? `Profile saved. Confirm the email change sent to ${result.pendingEmail}.`
              : "Profile updated successfully.",
          });
        } catch (error: unknown) {
          setFeedback({
            tone: "error",
            message: getErrorMessage(
              error,
              "Failed to save administrator details."
            ),
          });
          success = false;
        } finally {
          setIsAdminSaving(false);
        }
      } else if (success) {
        setFeedback({
          tone: "success",
          message: "Profile updated successfully.",
        });
      }
    }

    if (success) {
      setIsEditingProfile(false);
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
          "Failed to sign out. Please try again."
        ),
      });
    }
  };



  
  const SectionHeader = ({ title }: { title: string }) => (
    <div className="pt-4 pb-2 border-b border-[#E2E8F0] dark:border-tk-border">
      <h3 className="text-[18px] font-bold text-[#1A202C] dark:text-tk-text font-['Outfit',sans-serif] m-0 uppercase tracking-wide">
        {title}
      </h3>
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



    return (
      <div className="flex flex-col gap-0 w-full max-w-5xl">
        <SectionHeader title="Core Details" />
        {/* Restaurant Name */}
        <Row label="Restaurant Name">
          {isEditingProfile ? (
            <div className="flex items-center justify-between w-full gap-2">
              <input
                type="text"
                className="w-full border border-[#CBD5E0] rounded-xl bg-white text-[#1A202C] px-3.5 py-1.5 text-[14px] font-['Outfit',sans-serif] focus:outline-none focus:border-tk-burgundy dark:bg-tk-bg-surface dark:border-tk-border dark:text-tk-text"
                value={restaurantForm.name}
                onChange={(e) =>
                  handleRestaurantFieldChange("name", e.target.value)
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveProfile();
                  if (e.key === "Escape") handleCancelEdit();
                }}
                maxLength={120}
              />

            </div>
          ) : (
            <>
              <span>{restaurant?.name}</span>

            </>
          )}
        </Row>

        {/* Page URL */}
        <Row label="Restaurant Page URL">
          {isEditingProfile ? (
            <div className="flex items-center justify-between w-full gap-2">
              <div className="relative flex items-center w-full">
                <span className="px-3 py-1.5 bg-[#EDF2F7] border border-[#CBD5E0] border-r-0 rounded-l-xl text-[#4A5568] text-[13px] font-['Outfit',sans-serif] dark:bg-tk-bg-surface dark:border-tk-border dark:text-tk-text-secondary select-none shrink-0">
                  tablekard.com/
                </span>
                <input
                  type="text"
                  className={`w-full border rounded-r-xl bg-white text-[#1A202C] px-3 py-1.5 text-[14px] font-['Outfit',sans-serif] focus:outline-none dark:bg-tk-bg-surface dark:text-tk-text pr-[130px] ${slugAvailable === false
                    ? "border-red-500 text-red-500"
                    : "border-[#CBD5E0] focus:border-tk-burgundy dark:border-tk-border"
                    }`}
                  value={restaurantForm.slug}
                  onChange={(e) =>
                    handleRestaurantFieldChange(
                      "slug",
                      e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "")
                    )
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveProfile();
                    if (e.key === "Escape") handleCancelEdit();
                  }}
                  maxLength={60}
                />
                {checkingSlug ? (
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#718096] text-[12px] font-medium bg-white dark:bg-tk-bg-surface px-1 flex items-center gap-1.5">
                    <div className="w-3 h-3 border-[1.5px] border-[#CBD5E0] border-t-[#718096] dark:border-tk-border dark:border-t-tk-text-secondary rounded-full animate-spin" />
                    Checking...
                  </span>
                ) : restaurantForm.slug !== restaurant?.slug ? (
                  <>
                    {slugAvailable === true && restaurantForm.slug.trim() !== "" && (
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#48BB78] text-[12px] font-medium bg-white dark:bg-tk-bg-surface px-1">
                        ✓ URL is available
                      </span>
                    )}
                    {slugAvailable === false && restaurantForm.slug.trim() !== "" && (
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-red-500 text-[12px] font-medium bg-white dark:bg-tk-bg-surface px-1">
                        ✕ URL is not available
                      </span>
                    )}
                  </>
                ) : null}
              </div>
            </div>
          ) : (
            <>
              <a
                href={`https://tablekard.com/${restaurant?.slug ||
                  restaurant?.name
                    ?.toLowerCase()
                    .replace(/[^a-z0-9]+/g, "-")
                    .replace(/(^-|-$)/g, "") ||
                  ""
                  }`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 w-fit text-[#2B6CB0] text-[14px] font-medium no-underline break-all font-['Outfit',sans-serif] hover:underline dark:text-[#90CDF4]"
              >
                tablekard.com/
                {restaurant?.slug ||
                  restaurant?.name
                    ?.toLowerCase()
                    .replace(/[^a-z0-9]+/g, "-")
                    .replace(/(^-|-$)/g, "") ||
                  ""}{" "}
                <ExternalLink size={14} />
              </a>

            </>
          )}
        </Row>

        {/* Tagline */}
        <Row label="Tagline">
          {isEditingProfile ? (
            <div className="flex items-center justify-between w-full gap-2">
              <input
                type="text"
                className="w-full border border-[#CBD5E0] rounded-xl bg-white text-[#1A202C] px-3.5 py-1.5 text-[14px] font-['Outfit',sans-serif] focus:outline-none focus:border-tk-burgundy dark:bg-tk-bg-surface dark:border-tk-border dark:text-tk-text"
                value={restaurantForm.tagline}
                placeholder="A short catchy phrase"
                onChange={(e) =>
                  handleRestaurantFieldChange("tagline", e.target.value)
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveProfile();
                  if (e.key === "Escape") handleCancelEdit();
                }}
              />

            </div>
          ) : (
            <>
              <span>{restaurant?.tagline || "Not set"}</span>

            </>
          )}
        </Row>

        {/* Manifesto */}
        <Row label="Manifesto">
          {isEditingProfile ? (
            <div className="flex items-start justify-between w-full gap-2">
              <textarea
                className="w-full border border-[#CBD5E0] rounded-xl bg-white text-[#1A202C] px-3.5 py-2 text-[14px] font-['Outfit',sans-serif] focus:outline-none focus:border-tk-burgundy dark:bg-tk-bg-surface dark:border-tk-border dark:text-tk-text min-h-[60px]"
                value={restaurantForm.manifesto}
                placeholder="Tell the story of your restaurant..."
                onChange={(e) =>
                  handleRestaurantFieldChange("manifesto", e.target.value)
                }
                onKeyDown={(e) => {
                  if (e.key === "Escape") handleCancelEdit();
                }}
                rows={3}
              />

            </div>
          ) : (
            <>
              <span>{restaurant?.manifesto || "Not set"}</span>

            </>
          )}
        </Row>

        {/* Opening Date */}
        <Row label="Opening Date">
          {isEditingProfile ? (
            <div className="flex items-center justify-between w-full gap-2">
              <input
                type="date"
                className="w-full border border-[#CBD5E0] rounded-xl bg-white text-[#1A202C] px-3.5 py-1.5 text-[14px] font-['Outfit',sans-serif] focus:outline-none focus:border-tk-burgundy dark:bg-tk-bg-surface dark:border-tk-border dark:text-tk-text"
                value={restaurantForm.openingDate}
                onChange={(e) =>
                  handleRestaurantFieldChange("openingDate", e.target.value)
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveProfile();
                  if (e.key === "Escape") handleCancelEdit();
                }}
              />

            </div>
          ) : (
            <>
              <span>{restaurant?.openingDate || "Not set"}</span>

            </>
          )}
        </Row>

        {/* Subscription Status */}
        <Row label="Subscription Status" plain>
          <div className="flex items-center gap-3">
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[13px] font-semibold"
              style={{
                backgroundColor: restaurant?.subscriptionStatus ? "rgba(72, 187, 120, 0.15)" : "rgba(160, 174, 192, 0.2)",
                color: restaurant?.subscriptionStatus ? "#2F855A" : "#4A5568",
              }}
            >
              <CreditCardIcon size={14} />
              {restaurant?.subscriptionStatus ? "Active" : "Inactive"}
              {restaurant?.subscriptionType
                ? ` (${restaurant.subscriptionType})`
                : ""}
            </span>
            {!restaurant?.subscriptionStatus && (
              <Link
                to="/subscription"
                className="text-tk-burgundy hover:text-[#6B2A15] text-[13px] font-semibold underline underline-offset-2 decoration-tk-burgundy/30 hover:decoration-tk-burgundy transition-colors"
              >
                Upgrade Subscription
              </Link>
            )}
          </div>
        </Row>

        
        <SectionHeader title="Contact Information" />
        {/* Email Address */}
        <Row label="Email Address">
          {isEditingProfile ? (
            <div className="flex items-center justify-between w-full gap-2">
              <input
                type="email"
                className="w-full border border-[#CBD5E0] rounded-xl bg-white text-[#1A202C] px-3.5 py-1.5 text-[14px] font-['Outfit',sans-serif] focus:outline-none focus:border-tk-burgundy dark:bg-tk-bg-surface dark:border-tk-border dark:text-tk-text"
                value={restaurantForm.contactEmail}
                placeholder="ops@restaurant.com"
                onChange={(e) =>
                  handleRestaurantFieldChange("contactEmail", e.target.value)
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveProfile();
                  if (e.key === "Escape") handleCancelEdit();
                }}
              />

            </div>
          ) : (
            <>
              <span className="inline-flex items-center gap-2">
                <MailIcon size={15} />
                {restaurant?.contact.email || "N/A"}
              </span>

            </>
          )}
        </Row>

        {/* Phone Number */}
        <Row label="Phone Number">
          {isEditingProfile ? (
            <div className="flex items-center justify-between w-full gap-2">
              <input
                type="tel"
                className="w-full border border-[#CBD5E0] rounded-xl bg-white text-[#1A202C] px-3.5 py-1.5 text-[14px] font-['Outfit',sans-serif] focus:outline-none focus:border-tk-burgundy dark:bg-tk-bg-surface dark:border-tk-border dark:text-tk-text"
                value={restaurantForm.contactPhone}
                placeholder="+91 98765 43210"
                onChange={(e) =>
                  handleRestaurantFieldChange("contactPhone", e.target.value)
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveProfile();
                  if (e.key === "Escape") handleCancelEdit();
                }}
              />

            </div>
          ) : (
            <>
              <span className="inline-flex items-center gap-2">
                <PhoneIcon size={15} />
                {restaurant?.contact.phone || "N/A"}
              </span>

            </>
          )}
        </Row>

        
        <SectionHeader title="Location & Operations" />
        {/* Address */}
        <Row label="Address">
          {isEditingProfile ? (
            <div className="flex items-start justify-between w-full gap-2">
              <textarea
                className="w-full border border-[#CBD5E0] rounded-xl bg-white text-[#1A202C] px-3.5 py-2 text-[14px] font-['Outfit',sans-serif] focus:outline-none focus:border-tk-burgundy dark:bg-tk-bg-surface dark:border-tk-border dark:text-tk-text min-h-[60px]"
                value={restaurantForm.contactAddress}
                placeholder="Street, locality, city, state"
                onChange={(e) =>
                  handleRestaurantFieldChange("contactAddress", e.target.value)
                }
                onKeyDown={(e) => {
                  if (e.key === "Escape") handleCancelEdit();
                }}
                rows={2}
              />

            </div>
          ) : (
            <>
              <span className="inline-flex items-center gap-2">
                <MapPinIcon size={15} />
                {restaurant?.contact.address || "N/A"}
              </span>

            </>
          )}
        </Row>

        {/* Operating Hours (Weekdays) */}
        <Row label="Operating Hours (Weekdays)">
          {isEditingProfile ? (
            <div className="flex items-center justify-between w-full gap-2">
              <div className="flex items-center gap-2">
                <input
                  type="time"
                  className="border border-[#CBD5E0] rounded-xl bg-white text-[#1A202C] px-3 py-1.5 text-[14px] font-['Outfit',sans-serif] focus:outline-none focus:border-tk-burgundy dark:bg-tk-bg-surface dark:border-tk-border dark:text-tk-text"
                  value={get24hTime(
                    restaurantForm.operatingHoursWeekdays,
                    "open"
                  )}
                  onChange={(e) =>
                    handleTimeChange("weekdays", "open", e.target.value)
                  }
                />
                <span className="text-[#718096] dark:text-tk-text-secondary text-[13px]">
                  to
                </span>
                <input
                  type="time"
                  className="border border-[#CBD5E0] rounded-xl bg-white text-[#1A202C] px-3 py-1.5 text-[14px] font-['Outfit',sans-serif] focus:outline-none focus:border-tk-burgundy dark:bg-tk-bg-surface dark:border-tk-border dark:text-tk-text"
                  value={get24hTime(
                    restaurantForm.operatingHoursWeekdays,
                    "close"
                  )}
                  onChange={(e) =>
                    handleTimeChange("weekdays", "close", e.target.value)
                  }
                />
              </div>

            </div>
          ) : (
            <>
              <span>{restaurant?.operatingHoursWeekdays || "Not set"}</span>

            </>
          )}
        </Row>

        {/* Operating Hours (Weekends) */}
        <Row label="Operating Hours (Weekends)">
          {isEditingProfile ? (
            <div className="flex items-center justify-between w-full gap-2">
              <div className="flex items-center gap-2">
                <input
                  type="time"
                  className="border border-[#CBD5E0] rounded-xl bg-white text-[#1A202C] px-3 py-1.5 text-[14px] font-['Outfit',sans-serif] focus:outline-none focus:border-tk-burgundy dark:bg-tk-bg-surface dark:border-tk-border dark:text-tk-text"
                  value={get24hTime(
                    restaurantForm.operatingHoursWeekends,
                    "open"
                  )}
                  onChange={(e) =>
                    handleTimeChange("weekends", "open", e.target.value)
                  }
                />
                <span className="text-[#718096] dark:text-tk-text-secondary text-[13px]">
                  to
                </span>
                <input
                  type="time"
                  className="border border-[#CBD5E0] rounded-xl bg-white text-[#1A202C] px-3 py-1.5 text-[14px] font-['Outfit',sans-serif] focus:outline-none focus:border-tk-burgundy dark:bg-tk-bg-surface dark:border-tk-border dark:text-tk-text"
                  value={get24hTime(
                    restaurantForm.operatingHoursWeekends,
                    "close"
                  )}
                  onChange={(e) =>
                    handleTimeChange("weekends", "close", e.target.value)
                  }
                />
              </div>

            </div>
          ) : (
            <>
              <span>{restaurant?.operatingHoursWeekends || "Not set"}</span>

            </>
          )}
        </Row>

        {/* Location Coordinates */}
        <Row label="Location Coordinates">
          <div className="flex w-full items-center flex-wrap gap-4">
            {isEditingProfile ? (
              <div className="flex flex-col w-full gap-3 py-1">
                <div className="flex items-center justify-between w-full gap-2">
                  <div className="flex items-center gap-3 w-full flex-wrap">
                    <label className="flex items-center gap-1.5 text-[12px] text-[#4A5568] dark:text-tk-text-secondary font-semibold">
                      Lat:
                      <input
                        type="number"
                        min="-90"
                        max="90"
                        step="0.000001"
                        className="w-28 border border-[#CBD5E0] rounded-xl bg-white text-[#1A202C] px-2.5 py-1 text-[13px] font-['Outfit',sans-serif] focus:outline-none focus:border-tk-burgundy dark:bg-tk-bg-surface dark:border-tk-border dark:text-tk-text"
                        value={restaurantForm.latitude}
                        onChange={(e) =>
                          handleRestaurantFieldChange("latitude", e.target.value)
                        }
                      />
                    </label>
                    <label className="flex items-center gap-1.5 text-[12px] text-[#4A5568] dark:text-tk-text-secondary font-semibold">
                      Lng:
                      <input
                        type="number"
                        min="-180"
                        max="180"
                        step="0.000001"
                        className="w-28 border border-[#CBD5E0] rounded-xl bg-white text-[#1A202C] px-2.5 py-1 text-[13px] font-['Outfit',sans-serif] focus:outline-none focus:border-tk-burgundy dark:bg-tk-bg-surface dark:border-tk-border dark:text-tk-text"
                        value={restaurantForm.longitude}
                        onChange={(e) =>
                          handleRestaurantFieldChange("longitude", e.target.value)
                        }
                      />
                    </label>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 px-3 py-1 border border-dashed border-tk-burgundy rounded-xl bg-[#F0FFF4] text-tk-burgundy text-[12px] font-semibold cursor-pointer dark:bg-[rgba(72,187,120,0.1)] shrink-0"
                      onClick={handleUseMyLocation}
                      disabled={isLocating}
                    >
                      <Crosshair
                        size={14}
                        className={isLocating ? "profile-locate-spin" : ""}
                      />
                      {isLocating ? "Locating…" : "Current Location"}
                    </button>
                  </div>
                </div>
                <div
                  id="profile-map"
                  style={{
                    width: "100%",
                    height: "300px",
                    borderRadius: "12px",
                    backgroundColor: "#E2E8F0",
                    border: "1px solid #CBD5E0",
                    marginTop: "8px",
                    position: "relative",
                    zIndex: 10,
                  }}
                />
              </div>
            ) : (
              <>
                <span className="inline-flex items-center gap-2">
                  <MapPinIcon size={15} />
                  {restaurant
                    ? `${formatCoordinate(restaurant.location?.latitude)}, ${formatCoordinate(restaurant.location?.longitude)}`
                    : "N/A"}
                </span>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowMap(!showMap)}
                    className="px-4 py-2 bg-white text-[#4A5568] border border-[#CBD5E0] hover:bg-[#EDF2F7] dark:bg-tk-bg-elevated dark:text-tk-text-secondary dark:border-tk-border dark:hover:bg-tk-bg-hover rounded-xl text-[13px] font-bold w-fit transition-all duration-300 cursor-pointer shadow-sm"
                  >
                    {showMap ? "Hide Map" : "Show Map"}
                  </button>
                  {showMap && (
                    <div
                      id="profile-map"
                      style={{
                        position: "absolute",
                        top: "50%",
                        left: "calc(100% + 12px)",
                        transform: "translateY(-50%)",
                        width: "300px",
                        height: "300px",
                        borderRadius: "12px",
                        zIndex: 50,
                        backgroundColor: "#E2E8F0",
                        border: "1px solid #CBD5E0",
                        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
                      }}
                    />
                  )}
                </div>
              </>
            )}
          </div>
        </Row>

        {/* Access Area Radius */}
        <Row label="Access Area Radius">
          {isEditingProfile ? (
            <div className="flex items-center justify-between w-full gap-2">
              <div className="flex items-center gap-2 w-full">
                <input
                  type="number"
                  min="1"
                  step="1"
                  className="w-32 border border-[#CBD5E0] rounded-xl bg-white text-[#1A202C] px-3.5 py-1.5 text-[14px] font-['Outfit',sans-serif] focus:outline-none focus:border-tk-burgundy dark:bg-tk-bg-surface dark:border-tk-border dark:text-tk-text"
                  value={restaurantForm.allowedRadius}
                  placeholder="150"
                  onChange={(e) =>
                    handleRestaurantFieldChange("allowedRadius", e.target.value)
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveProfile();
                    if (e.key === "Escape") handleCancelEdit();
                  }}
                />
                <span className="text-[14px] text-[#4A5568] dark:text-tk-text-secondary">
                  meters
                </span>
              </div>

            </div>
          ) : (
            <>
              <span>
                {restaurant?.location?.allowedRadius != null
                  ? `${restaurant.location.allowedRadius} meters`
                  : "Not set"}
              </span>

            </>
          )}
        </Row>

        
        <SectionHeader title="Web & Social Media" />
        {/* Website URL */}
        <Row label="Website URL">
          {isEditingProfile ? (
            <div className="flex items-center justify-between w-full gap-2">
              <input
                type="url"
                className="w-full border border-[#CBD5E0] rounded-xl bg-white text-[#1A202C] px-3.5 py-1.5 text-[14px] font-['Outfit',sans-serif] focus:outline-none focus:border-tk-burgundy dark:bg-tk-bg-surface dark:border-tk-border dark:text-tk-text"
                value={restaurantForm.websiteUrl}
                placeholder="https://yourrestaurant.com"
                onChange={(e) =>
                  handleRestaurantFieldChange("websiteUrl", e.target.value)
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveProfile();
                  if (e.key === "Escape") handleCancelEdit();
                }}
              />

            </div>
          ) : (
            <>
              <span>{restaurant?.websiteUrl || "Not set"}</span>

            </>
          )}
        </Row>{/* Instagram URL */}
        <Row label="Instagram URL">
          {isEditingProfile ? (
            <div className="flex items-center justify-between w-full gap-2">
              <input
                type="url"
                className="w-full border border-[#CBD5E0] rounded-xl bg-white text-[#1A202C] px-3.5 py-1.5 text-[14px] font-['Outfit',sans-serif] focus:outline-none focus:border-tk-burgundy dark:bg-tk-bg-surface dark:border-tk-border dark:text-tk-text"
                value={restaurantForm.instagramUrl}
                placeholder="https://instagram.com/yourrestaurant"
                onChange={(e) =>
                  handleRestaurantFieldChange("instagramUrl", e.target.value)
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveProfile();
                  if (e.key === "Escape") handleCancelEdit();
                }}
              />

            </div>
          ) : (
            <>
              <span>{restaurant?.instagramUrl || "Not set"}</span>

            </>
          )}
        </Row>

        {/* Facebook URL */}
        <Row label="Facebook URL">
          {isEditingProfile ? (
            <div className="flex items-center justify-between w-full gap-2">
              <input
                type="url"
                className="w-full border border-[#CBD5E0] rounded-xl bg-white text-[#1A202C] px-3.5 py-1.5 text-[14px] font-['Outfit',sans-serif] focus:outline-none focus:border-tk-burgundy dark:bg-tk-bg-surface dark:border-tk-border dark:text-tk-text"
                value={restaurantForm.facebookUrl}
                placeholder="https://facebook.com/yourrestaurant"
                onChange={(e) =>
                  handleRestaurantFieldChange("facebookUrl", e.target.value)
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveProfile();
                  if (e.key === "Escape") handleCancelEdit();
                }}
              />

            </div>
          ) : (
            <>
              <span>{restaurant?.facebookUrl || "Not set"}</span>

            </>
          )}
        </Row>

        
      
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



    return (
      <div className="flex flex-col gap-0 w-full max-w-5xl">
        <SectionHeader title="Administrator Details" />
        <Row label="Admin Full Name">
          {isEditingProfile ? (
            <div className="flex items-center justify-between w-full gap-2">
              <input
                type="text"
                className="w-full border border-[#CBD5E0] rounded-xl bg-white text-[#1A202C] px-3.5 py-1.5 text-[14px] font-['Outfit',sans-serif] focus:outline-none focus:border-tk-burgundy dark:bg-tk-bg-surface dark:border-tk-border dark:text-tk-text"
                value={adminForm.name}
                placeholder="Administrator name"
                onChange={(e) => handleAdminFieldChange("name", e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveProfile();
                  if (e.key === "Escape") handleCancelEdit();
                }}
                maxLength={120}
              />

            </div>
          ) : (
            <>
              <span>{userProfile?.name || "Admin User"}</span>

            </>
          )}
        </Row>

        <Row label="Admin Email Address">
          {isEditingProfile ? (
            <div className="flex flex-col w-full gap-1">
              <div className="flex items-center justify-between w-full gap-2">
                <input
                  type="email"
                  className="w-full border border-[#CBD5E0] rounded-xl bg-white text-[#1A202C] px-3.5 py-1.5 text-[14px] font-['Outfit',sans-serif] focus:outline-none focus:border-tk-burgundy dark:bg-tk-bg-surface dark:border-tk-border dark:text-tk-text"
                  value={adminForm.email}
                  placeholder="admin@restaurant.com"
                  onChange={(e) =>
                    handleAdminFieldChange("email", e.target.value)
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveProfile();
                    if (e.key === "Escape") handleCancelEdit();
                  }}
                />

              </div>
              <span className="text-[#4A5568] text-[11px] leading-relaxed font-['Outfit',sans-serif] dark:text-tk-text-secondary">
                Changing email may require confirmation before it becomes active.
              </span>
            </div>
          ) : (
            <>
              <span>{userProfile?.email || "N/A"}</span>

            </>
          )}
        </Row>

        <Row label="Global Role" plain>
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

  return (
    <>
      <div className="sticky top-0 z-[60] bg-tk-bg-surface pt-4 pb-3 -mt-6 -mx-6 px-6 mb-6 border-b border-[#E2E8F0] dark:border-tk-border flex flex-col gap-2 shadow-sm">
        {/* Header Row: Title & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-[#1A202C] font-['Outfit',sans-serif] dark:text-white mb-1 tracking-tight">
              Restaurant Profile
            </h1>

          </div>

          <div className="flex items-center gap-3 shrink-0">
            {isEditingProfile ? (
              <>
                <button
                  className="relative h-10 px-4 rounded-xl bg-white dark:bg-tk-bg-elevated text-[#4A5568] border border-[#CBD5E0] flex items-center justify-center cursor-pointer transition-all duration-300 font-bold font-['Outfit',sans-serif] text-[13px] tracking-wide hover:bg-[#EDF2F7] dark:text-tk-text-secondary dark:border-tk-border dark:hover:bg-tk-bg-hover disabled:opacity-50"
                  onClick={handleCancelEdit}
                  disabled={isRestaurantSaving || isAdminSaving}
                >
                  Cancel
                </button>
                <button
                  className="relative h-10 px-5 rounded-xl bg-tk-burgundy text-white flex items-center justify-center cursor-pointer shadow-[0_2px_8px_rgba(229,62,62,0.15)] transition-all duration-300 font-bold font-['Outfit',sans-serif] text-[13px] tracking-wide hover:bg-[#6B2A15] disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleSaveProfile}
                  disabled={isRestaurantSaving || isAdminSaving || !hasChanges}
                >
                  {(isRestaurantSaving || isAdminSaving) ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Saving...
                    </div>
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </>
            ) : (
              <button
                className="relative h-10 px-5 rounded-xl bg-tk-burgundy text-white flex items-center justify-center cursor-pointer shadow-[0_2px_8px_rgba(229,62,62,0.15)] transition-all duration-300 font-bold font-['Outfit',sans-serif] text-[13px] tracking-wide hover:bg-[#6B2A15]"
                onClick={() => {
                  setRestaurantForm(restaurant ? createRestaurantFormState(restaurant) : null);
                  setAdminForm(createAdminFormState(userProfile));
                  setIsEditingProfile(true);
                  setShowMap(true);
                }}
              >
                Edit Profile
              </button>
            )}
            <button
              className="relative h-10 px-4 rounded-xl bg-white dark:bg-tk-bg-elevated text-[#E53E3E] border border-[#E53E3E]/20 flex items-center justify-center cursor-pointer shadow-[0_2px_8px_rgba(229,62,62,0.08)] overflow-hidden transition-all duration-300 z-10 before:absolute before:inset-0 before:w-full before:h-full before:bg-[#E53E3E] before:-z-10 before:-translate-x-full before:transition-transform before:duration-300 hover:before:translate-x-0 hover:text-white hover:shadow-[0_8px_16px_rgba(229,62,62,0.3)] hover:-translate-y-0.5 active:translate-y-0 font-bold font-['Outfit',sans-serif] text-[13px] tracking-wide"
              title="Sign Out"
              onClick={() => setShowLogoutConfirm(true)}
            >
              Sign Out
            </button>
          </div>
        </div>
        
        {/* Tabs Row */}
        <div className="flex justify-center gap-8 mt-2">
          <button
            className={`pb-3 px-2 border-b-2 text-[14px] font-bold font-['Outfit',sans-serif] transition-colors ${
              activeTab === "details"
                ? "border-tk-burgundy text-tk-burgundy"
                : "border-transparent text-[#4A5568] hover:text-[#1A202C] dark:text-tk-text-secondary dark:hover:text-tk-text"
            }`}
            onClick={() => setActiveTab("details")}
          >
            Details
          </button>
          <button
            className={`pb-3 px-2 border-b-2 text-[14px] font-bold font-['Outfit',sans-serif] transition-colors ${
              activeTab === "operations"
                ? "border-tk-burgundy text-tk-burgundy"
                : "border-transparent text-[#4A5568] hover:text-[#1A202C] dark:text-tk-text-secondary dark:hover:text-tk-text"
            }`}
            onClick={() => setActiveTab("operations")}
          >
            Operations
          </button>
        </div>
      </div>

      {feedback && (
        <div
          className="fixed bottom-10 right-10 z-[9999] px-4 py-3 rounded-[24px] flex items-center gap-3 shadow-[0_10px_30px_rgba(0,0,0,0.3)] animate-in fade-in slide-in-from-bottom-5 duration-300 font-['Outfit',sans-serif]"
          style={{
            backgroundColor: "#0F172A",
            color: "#FFFFFF",
          }}
        >
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
            style={{
              backgroundColor:
                feedback.tone === "success"
                  ? "#4ADE80"
                  : feedback.tone === "error"
                    ? "#EF4444"
                    : "#3B82F6",
            }}
          >
            {feedback.tone === "success" ? (
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
        <div
          style={{
            width: "100%",
            height: "1px",
            background: "#E2E8F0",
            margin: "40px 0 20px 0",
          }}
          className="dark:bg-tk-border"
        />
        <div style={{ display: "flex", flexDirection: "column" }}>
          {renderAdminReadOnly()}
        </div>
      </div>

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

      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[100] p-5">
          <div className="bg-white rounded-3xl p-8 max-w-[420px] w-full shadow-[0_24px_48px_rgba(0,0,0,0.12)] dark:bg-tk-bg-card dark:border dark:border-tk-border">
            <div className="flex justify-between items-center mb-6">
              <div className="profile-modal-icon logout-icon">
                <AlertTriangle size={24} />
              </div>
              <h3 className="text-[20px] font-bold text-tk-text font-['Outfit',sans-serif] m-0">Discard Changes?</h3>
            </div>
            <p className="text-[#4A5568] text-[15px] font-['Outfit',sans-serif] leading-[1.5] mb-8 dark:text-tk-text-secondary">Are you sure you want to cancel? All unsaved changes will be lost.</p>
            <div className="flex gap-3 justify-end">
              <button
                className="inline-flex items-center justify-center gap-2 min-h-[40px] px-4 border-none rounded-xl font-['Outfit',sans-serif] text-[13px] font-semibold cursor-pointer transition-all duration-200 bg-[#EDF2F7] text-[#2D3748] hover:-translate-y-px disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none dark:bg-tk-bg-elevated dark:text-tk-text dark:hover:bg-tk-bg-hover"
                onClick={() => setShowCancelConfirm(false)}
              >
                Keep Editing
              </button>
              <button
                className="relative inline-flex items-center justify-center gap-2 min-h-[40px] px-6 border-none rounded-xl font-['Outfit',sans-serif] text-[13px] font-bold cursor-pointer overflow-hidden transition-all duration-300 z-10 bg-tk-burgundy text-white shadow-[0_4px_12px_rgba(139,58,30,0.3)] hover:-translate-y-0.5 before:absolute before:inset-0 before:w-full before:h-full before:bg-[#6B2A15] before:-z-10 before:-translate-x-full before:transition-transform before:duration-300 hover:before:translate-x-0 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
                onClick={handleConfirmCancel}
              >
                Discard Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProfilePage;
