import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  ChefHat,
  CreditCardIcon,
  Crosshair,
  Edit3,
  ExternalLink,
  ImageIcon,
  Key,
  Lock,
  LogOut,
  MailIcon,
  MapPinIcon,
  PhoneIcon,
  Save,
  ShieldCheck,
  Upload,
  Webhook,
  X,
  XCircle,
} from "lucide-react";
import type { Restaurant } from "@restaurant-saas/types";
import ImageCropper from "../../components/ImageCropper";
import { useAuth } from "../../context/AuthContext";
import {
  getRestaurantById,
  getRestaurantPaymentSettings,
  updateAdministratorProfile,
  updateRestaurantProfile,
  updateRestaurantPaymentSettings,
} from "../../services/supabaseService";
import { uploadProfileImage } from "../../services/storageService";


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
  slug: string;
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
  avatarUrl: string;
}

interface FeedbackState {
  tone: "success" | "error" | "info";
  message: string;
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const hexColorPattern = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

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
  contactEmail: restaurant.contact.email ?? "",
  contactPhone: restaurant.contact.phone ?? "",
  contactAddress: restaurant.contact.address ?? "",
  logoUrl: restaurant.branding?.logoUrl ?? "",
  primaryColor: restaurant.branding?.primaryColor ?? "",
  secondaryColor: restaurant.branding?.secondaryColor ?? "",
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
  slug: restaurant.slug ?? "",
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
  avatarUrl: profile?.avatarUrl ?? "",
});

const formatCoordinate = (value?: number | null): string => {
  if (value == null || Number.isNaN(value)) {
    return "Not set";
  }

  return value.toFixed(6);
};

const validateRestaurantForm = (form: RestaurantFormState): string | null => {
  if (!form.name.trim()) return "Restaurant name is required.";
  if (!form.contactEmail.trim() || !emailPattern.test(form.contactEmail.trim()))
    return "A valid contact email is required.";
  if (form.logoUrl.trim() && !isValidUrl(form.logoUrl.trim()))
    return "Logo URL must be a valid http or https URL.";
  if (
    form.primaryColor.trim() &&
    !hexColorPattern.test(form.primaryColor.trim())
  )
    return "Primary color must be a valid hex value like #1F2937.";
  if (
    form.secondaryColor.trim() &&
    !hexColorPattern.test(form.secondaryColor.trim())
  )
    return "Secondary color must be a valid hex value like #F59E0B.";

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
  if (form.avatarUrl.trim() && !isValidUrl(form.avatarUrl.trim()))
    return "Avatar URL must be a valid http or https URL.";
  return null;
};

const ProfilePage: React.FC = () => {
  const {
    userProfile,
    activeRestaurantId,
    memberships,
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
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [isRestaurantEditing, setIsRestaurantEditing] = useState(false);
  const [editingSections, setEditingSections] = useState<Record<string, boolean>>({});
  const [isAdminEditing, setIsAdminEditing] = useState(false);
  const [isRestaurantSaving, setIsRestaurantSaving] = useState(false);
  const [isAdminSaving, setIsAdminSaving] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "general" | "branding" | "story" | "payments" | "admin" | "features"
  >("general");

  // Confirm modal state
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    title: string;
    description: string;
    warning: string;
    confirmLabel: string;
    confirmColor: string;
    onConfirm: () => Promise<void>;
  }>({
    open: false, title: '', description: '', warning: '',
    confirmLabel: 'Confirm', confirmColor: '#EF4444',
    onConfirm: async () => {},
  });
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [showPaymentSetupModal, setShowPaymentSetupModal] = useState(false);
  const [paymentSetupForm, setPaymentSetupForm] = useState({ razorpayKeyId: '', razorpayKeySecret: '', razorpayWebhookSecret: '' });
  const [paymentSetupSaving, setPaymentSetupSaving] = useState(false);
  const [paymentSetupError, setPaymentSetupError] = useState<string | null>(null);

  // Payment settings state
  const [paymentSettings, setPaymentSettings] = useState({
    razorpayKeyId: "",
    hasRazorpayKeySecret: false,
    hasRazorpayWebhookSecret: false,
    onlinePaymentsEnabled: false,
  });

  // Cropping state
  const [cropImage, setCropImage] = useState<string | null>(null);
  const [cropType, setCropType] = useState<"logo" | "avatar" | null>(null);

  const activeMembership = memberships.find(
    (membership) => membership.restaurantId === activeRestaurantId,
  );

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
        const [data, pmtSettings] = await Promise.all([
          getRestaurantById(activeRestaurantId),
          getRestaurantPaymentSettings(activeRestaurantId),
        ]);
        setRestaurant(data);
        setRestaurantForm(data ? createRestaurantFormState(data) : null);
        const ps = {
          razorpayKeyId: pmtSettings.razorpayKeyId ?? "",
          hasRazorpayKeySecret: pmtSettings.hasRazorpayKeySecret,
          hasRazorpayWebhookSecret: pmtSettings.hasRazorpayWebhookSecret,
          onlinePaymentsEnabled: pmtSettings.onlinePaymentsEnabled,
        };
        setPaymentSettings(ps);

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

  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = useCallback(
    async (
      file: File,
      folder: string,
      onSuccess: (url: string) => void,
      setUploading: (v: boolean) => void,
    ) => {
      setUploading(true);
      setFeedback(null);
      try {
        const url = await uploadProfileImage(folder, file);
        onSuccess(url);
        setFeedback({
          tone: "success",
          message: "Image uploaded successfully.",
        });
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : "Upload failed.";
        setFeedback({ tone: "error", message: msg });
      } finally {
        setUploading(false);
      }
    },
    [],
  );

  const handleLogoDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file && activeRestaurantId) {
        handleImageUpload(
          file,
          `logos/${activeRestaurantId}`,
          (url) => handleRestaurantFieldChange("logoUrl", url),
          setIsUploadingLogo,
        );
      }
    },
    [activeRestaurantId, handleImageUpload],
  );

  const handleAvatarDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setCropImage(reader.result as string);
        setCropType("avatar");
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const handleLogoFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = () => {
          setCropImage(reader.result as string);
          setCropType("logo");
        };
        reader.readAsDataURL(file);
      }
      e.target.value = "";
    },
    [],
  );

  const handleAvatarFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = () => {
          setCropImage(reader.result as string);
          setCropType("avatar");
        };
        reader.readAsDataURL(file);
      }
      e.target.value = "";
    },
    [],
  );

  const handleCropComplete = async (croppedBlob: Blob) => {
    if (!cropType || !activeRestaurantId || !userProfile) {
      setCropImage(null);
      setCropType(null);
      return;
    }

    const file = new File(
      [croppedBlob],
      cropType === "logo" ? "logo.jpg" : "avatar.jpg",
      { type: "image/jpeg" },
    );

    if (cropType === "logo") {
      await handleImageUpload(
        file,
        `logos/${activeRestaurantId}`,
        (url) => handleRestaurantFieldChange("logoUrl", url),
        setIsUploadingLogo,
      );
    } else {
      await handleImageUpload(
        file,
        `avatars/${userProfile.id}`,
        (url) => handleAdminFieldChange("avatarUrl", url),
        setIsUploadingAvatar,
      );
    }

    setCropImage(null);
    setCropType(null);
  };

  const startRestaurantEdit = (section: 'core' | 'contact' | 'branding' | 'story' | 'payments') => {
    const alreadyEditing = Object.values(editingSections).some(Boolean);
    if (!alreadyEditing) {
      resetRestaurantForm();
    }
    setFeedback(null);
    setEditingSections(prev => ({ ...prev, [section]: true }));
    setIsRestaurantEditing(true);
  };
  const cancelRestaurantEdit = (section: 'core' | 'contact' | 'branding' | 'story' | 'payments') => {
    setEditingSections(prev => {
      const next = { ...prev, [section]: false };
      const stillEditing = Object.values(next).some(Boolean);
      if (!stillEditing) {
        setIsRestaurantEditing(false);
        resetRestaurantForm();
      }
      return next;
    });
  };
  const startAdminEdit = () => {
    resetAdminForm();
    setFeedback(null);
    setIsAdminEditing(true);
  };
  const cancelAdminEdit = () => {
    resetAdminForm();
    setIsAdminEditing(false);
  };

  const handleRestaurantSave = async (
    section: 'core' | 'contact' | 'branding' | 'story'
  ) => {
    if (!activeRestaurantId || !restaurantForm) {
      return;
    }

    const validationError = validateRestaurantForm(restaurantForm);
    if (validationError) {
      setFeedback({ tone: "error", message: validationError });
      return;
    }

    setIsRestaurantSaving(true);
    setFeedback(null);

    try {
      const updatedRestaurant = await updateRestaurantProfile(
        activeRestaurantId,
        {
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
          slug: emptyToNull(restaurantForm.slug),
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
      setEditingSections(prev => {
        const next = { ...prev, [section]: false };
        const stillEditing = Object.values(next).some(Boolean);
        if (!stillEditing) {
          setIsRestaurantEditing(false);
        }
        return next;
      });
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
        avatarUrl: emptyToNull(adminForm.avatarUrl),
      });

      await refreshSessionData();
      setAdminForm(createAdminFormState(result.profile));
      setIsAdminEditing(false);
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
      {editingSections[section] ? (
        <>
          <button
            type="button"
            className="inline-flex items-center justify-center gap-2 min-h-[40px] px-4 border-none rounded-xl font-['Outfit',sans-serif] text-[13px] font-semibold cursor-pointer transition-all duration-200 bg-[#EDF2F7] text-[#2D3748] hover:-translate-y-px disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none dark:bg-tk-bg-elevated dark:text-tk-text dark:hover:bg-tk-bg-hover"
            onClick={() => cancelRestaurantEdit(section)}
            disabled={isRestaurantSaving}
          >
            <X size={16} /> Cancel
          </button>
          <button
            type="button"
            className="inline-flex items-center justify-center gap-2 min-h-[40px] px-4 border-none rounded-xl font-['Outfit',sans-serif] text-[13px] font-semibold cursor-pointer transition-all duration-200 bg-[linear-gradient(135deg,var(--tk-burgundy),#6B2A15)] text-white shadow-[0_8px_18px_rgba(139,58,30,0.2)] hover:-translate-y-px disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
            disabled={isRestaurantSaving || !restaurantForm}
            onClick={() => handleRestaurantSave(section)}
          >
            <Save size={16} /> {isRestaurantSaving ? "Saving..." : "Save"}
          </button>
        </>
      ) : (
        <button
          type="button"
          className="inline-flex items-center justify-center gap-2 min-h-[40px] px-4 border-none rounded-xl font-['Outfit',sans-serif] text-[13px] font-semibold cursor-pointer transition-all duration-200 bg-[#EDF2F7] text-[#2D3748] hover:-translate-y-px disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none dark:bg-tk-bg-elevated dark:text-tk-text dark:hover:bg-tk-bg-hover"
          onClick={() => startRestaurantEdit(section)}
          disabled={!restaurant}
        >
          <Edit3 size={16} /> Edit
        </button>
      )}
    </div>
  );

  const renderAdminActions = () => (
    <div className="flex items-center gap-2.5">
      {isAdminEditing ? (
        <>
          <button
            type="button"
            className="inline-flex items-center justify-center gap-2 min-h-[40px] px-4 border-none rounded-xl font-['Outfit',sans-serif] text-[13px] font-semibold cursor-pointer transition-all duration-200 bg-[#EDF2F7] text-[#2D3748] hover:-translate-y-px disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none dark:bg-tk-bg-elevated dark:text-tk-text dark:hover:bg-tk-bg-hover"
            onClick={cancelAdminEdit}
            disabled={isAdminSaving}
          >
            <X size={16} /> Cancel
          </button>
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 min-h-[40px] px-4 border-none rounded-xl font-['Outfit',sans-serif] text-[13px] font-semibold cursor-pointer transition-all duration-200 bg-[linear-gradient(135deg,var(--tk-burgundy),#6B2A15)] text-white shadow-[0_8px_18px_rgba(139,58,30,0.2)] hover:-translate-y-px disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
            disabled={isAdminSaving || !userProfile}
          >
            <Save size={16} /> {isAdminSaving ? "Saving..." : "Save"}
          </button>
        </>
      ) : (
        <button
          type="button"
          className="inline-flex items-center justify-center gap-2 min-h-[40px] px-4 border-none rounded-xl font-['Outfit',sans-serif] text-[13px] font-semibold cursor-pointer transition-all duration-200 bg-[#EDF2F7] text-[#2D3748] hover:-translate-y-px disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none dark:bg-tk-bg-elevated dark:text-tk-text dark:hover:bg-tk-bg-hover"
          onClick={startAdminEdit}
          disabled={!userProfile}
        >
          <Edit3 size={16} /> Edit
        </button>
      )}
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
      <div className="flex flex-col gap-6">
        <div
          style={{
            display: activeTab === "general" ? "grid" : "none",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 340px), 1fr))",
            gap: "24px",
          }}
        >
          <div className="border border-[#E2E8F0] rounded-[18px] p-4 sm:p-[18px] bg-white dark:bg-tk-bg-card dark:border-tk-border">
            <div className="flex flex-wrap justify-between items-start gap-3 mb-4">
              <div className="min-w-0">
                <h3 className="font-bold">Core Identity</h3>
                <p>Essential details about the restaurant.</p>
              </div>
              <div className="shrink-0">{renderRestaurantActions("core")}</div>
            </div>
            {editingSections.core ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

                <label className="flex flex-col gap-2">
                  <span className="text-[12px] font-semibold text-[#4A5568] uppercase tracking-[0.5px] font-['Outfit',sans-serif] dark:text-tk-text-secondary">Slug</span>
                  <div style={{ display: "flex", alignItems: "stretch" }}>
                    <input
                      className="w-full border border-[#CBD5E0] rounded-xl bg-white text-[#1A202C] px-3.5 py-3 text-[14px] font-['Outfit',sans-serif] box-border transition-all duration-200 focus:outline-none focus:border-tk-burgundy focus:ring-4 focus:ring-[rgba(139,58,30,0.12)] dark:bg-tk-bg-surface dark:border-tk-border dark:text-tk-text"
                      style={{
                        borderTopRightRadius: 0,
                        borderBottomRightRadius: 0,
                        flex: 1,
                      }}
                      type="text"
                      value={restaurantForm.slug}
                      onChange={(event) =>
                        handleRestaurantFieldChange("slug", event.target.value)
                      }
                      placeholder="restaurant-slug"
                    />
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        padding: "0 12px",
                        background: "#EDF2F7",
                        border: "1px solid #E2E8F0",
                        borderLeft: "none",
                        borderTopRightRadius: "8px",
                        borderBottomRightRadius: "8px",
                        fontSize: "14px",
                        color: "#4A5568",
                        whiteSpace: "nowrap",
                      }}
                    >
                      .tablekard.com
                    </span>
                  </div>
                </label>

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
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <span className="text-[13px] text-[#4A5568] font-semibold uppercase tracking-[0.5px] font-['Outfit',sans-serif] dark:text-tk-text-secondary">Restaurant Name</span>
                  <span className="text-[16px] text-[#1A202C] font-medium font-['Outfit',sans-serif] dark:text-tk-text">{restaurant?.name}</span>
                </div>

                <div className="flex flex-col gap-1.5">
                  <span className="text-[13px] text-[#4A5568] font-semibold uppercase tracking-[0.5px] font-['Outfit',sans-serif] dark:text-tk-text-secondary">Slug</span>
                  <span className="text-[16px] text-[#1A202C] font-medium font-['Outfit',sans-serif] dark:text-tk-text">
                    {restaurant?.slug ? (
                      <a
                        href={`https://${restaurant.slug}.tablekard.com`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 w-fit text-[#2B6CB0] text-[14px] font-medium no-underline break-all font-['Outfit',sans-serif] hover:underline dark:text-[#90CDF4]"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        {restaurant.slug}.tablekard.com{" "}
                        <ExternalLink size={14} />
                      </a>
                    ) : (
                      "Not set"
                    )}
                  </span>
                </div>

                <div className="flex flex-col gap-1.5">
                  <span className="text-[13px] text-[#4A5568] font-semibold uppercase tracking-[0.5px] font-['Outfit',sans-serif] dark:text-tk-text-secondary">Tagline</span>
                  <span className="text-[16px] text-[#1A202C] font-medium font-['Outfit',sans-serif] dark:text-tk-text">
                    {restaurant?.tagline || "Not set"}
                  </span>
                </div>



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
            )}
          </div>

          <div className="border border-[#E2E8F0] rounded-[18px] p-4 sm:p-[18px] bg-white dark:bg-tk-bg-card dark:border-tk-border">
            <div className="flex flex-wrap justify-between items-start gap-3 mb-4">
              <div className="min-w-0">
                <h3 className="font-bold">Contact & Operating Hours</h3>
                <p>How customers can reach you and when you're open.</p>
              </div>
              <div className="shrink-0">{renderRestaurantActions("contact")}</div>
            </div>
             {editingSections.contact ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div
                  className="col-span-1 sm:col-span-2"
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

                <label className="flex flex-col gap-2 sm:col-span-2">
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
                  className="col-span-1 sm:col-span-2"
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
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div
                  className="col-span-1 sm:col-span-2"
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

                <div className="flex flex-col gap-1.5">
                  <span className="text-[16px] text-[#1A202C] font-medium font-['Outfit',sans-serif] dark:text-tk-text inline-flex items-center gap-2">
                    <MailIcon size={15} />
                    {restaurant?.contact.email || "N/A"}
                  </span>
                </div>

                <div className="flex flex-col gap-1.5">
                  <span className="text-[16px] text-[#1A202C] font-medium font-['Outfit',sans-serif] dark:text-tk-text inline-flex items-center gap-2">
                    <PhoneIcon size={15} />
                    {restaurant?.contact.phone || "N/A"}
                  </span>
                </div>

                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <span className="text-[16px] text-[#1A202C] font-medium font-['Outfit',sans-serif] dark:text-tk-text inline-flex items-center gap-2">
                    <MapPinIcon size={15} />
                    {restaurant?.contact.address || "N/A"}
                  </span>
                </div>

                <div
                  className="col-span-1 sm:col-span-2"
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

                <div className="flex flex-col gap-1.5">
                  <span className="text-[13px] text-[#4A5568] font-semibold uppercase tracking-[0.5px] font-['Outfit',sans-serif] dark:text-tk-text-secondary">
                    Operating Hours (Weekdays)
                  </span>
                  <span className="text-[16px] text-[#1A202C] font-medium font-['Outfit',sans-serif] dark:text-tk-text">
                    {restaurant?.operatingHoursWeekdays || "Not set"}
                  </span>
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-[13px] text-[#4A5568] font-semibold uppercase tracking-[0.5px] font-['Outfit',sans-serif] dark:text-tk-text-secondary">
                    Operating Hours (Weekends)
                  </span>
                  <span className="text-[16px] text-[#1A202C] font-medium font-['Outfit',sans-serif] dark:text-tk-text">
                    {restaurant?.operatingHoursWeekends || "Not set"}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div
          className="border border-[#E2E8F0] rounded-[18px] p-4 sm:p-[18px] bg-white dark:bg-tk-bg-card dark:border-tk-border"
          style={{ display: activeTab === "branding" ? "block" : "none" }}
        >
          <div className="flex flex-wrap justify-between items-start gap-3 mb-4">
            <div className="min-w-0">
              <h3 className="font-bold">Location & Branding</h3>
              <p>Where to find you and your visual identity.</p>
            </div>
            <div className="shrink-0">{renderRestaurantActions("branding")}</div>
          </div>
           {editingSections.branding ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <span className="text-[12px] font-semibold text-[#4A5568] uppercase tracking-[0.5px] font-['Outfit',sans-serif] dark:text-tk-text-secondary">Logo</span>
                <div
                  className={`border-2 border-dashed border-[#CBD5E0] rounded-2xl bg-[#F8FAFC] cursor-pointer transition-all duration-200 overflow-hidden hover:border-tk-burgundy hover:bg-[#F0FFF4] dark:bg-tk-bg-surface dark:border-tk-border dark:hover:bg-[rgba(72,187,120,0.1)] ${isUploadingLogo ? "opacity-70 cursor-wait pointer-events-none" : ""}`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.add("profile-dropzone-hover");
                  }}
                  onDragLeave={(e) => {
                    e.currentTarget.classList.remove("profile-dropzone-hover");
                  }}
                  onDrop={(e) => {
                    e.currentTarget.classList.remove("profile-dropzone-hover");
                    handleLogoDrop(e);
                  }}
                  onClick={() =>
                    !isUploadingLogo && logoInputRef.current?.click()
                  }
                >
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif"
                    className="hidden"
                    onChange={handleLogoFileSelect}
                  />
                  {restaurantForm.logoUrl ? (
                    <div className="flex items-center gap-3.5 px-4 py-3.5">
                      <img
                        src={restaurantForm.logoUrl}
                        alt="Logo preview"
                        className="w-14 h-14 object-contain rounded-xl border border-[#E2E8F0] bg-white shrink-0 dark:bg-tk-bg-surface dark:border-tk-border"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                      <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-tk-burgundy font-['Outfit',sans-serif]">
                        <Upload size={14} />
                        {isUploadingLogo
                          ? "Uploading…"
                          : "Drop or click to replace"}
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-2 px-4 py-6 text-[#4A5568] font-['Outfit',sans-serif] text-center dark:text-tk-text-secondary">
                      <ImageIcon size={28} strokeWidth={1.5} />
                      <span>
                        {isUploadingLogo
                          ? "Uploading…"
                          : "Drop image here or click to browse"}
                      </span>
                      <span className="!text-[11px] !text-[#718096] !font-normal dark:!text-tk-text-secondary">
                        PNG, JPG, WebP, SVG • Max 2 MB
                      </span>
                    </div>
                  )}
                </div>
              </div>

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

              <div className="flex flex-col gap-2 col-span-1 sm:col-span-2">
                <span className="text-[12px] font-semibold text-[#4A5568] uppercase tracking-[0.5px] font-['Outfit',sans-serif] dark:text-tk-text-secondary">Location Coordinates</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

              <label className="flex flex-col gap-2">
                <span className="text-[12px] font-semibold text-[#4A5568] uppercase tracking-[0.5px] font-['Outfit',sans-serif] dark:text-tk-text-secondary">Primary Color</span>
                <div className="flex items-center gap-3">
                  <input
                    className="w-12 h-12 p-0 border border-[#CBD5E0] rounded-xl bg-white cursor-pointer shrink-0 dark:bg-tk-bg-surface dark:border-tk-border [&::-webkit-color-swatch-wrapper]:p-1 [&::-webkit-color-swatch]:border-none [&::-webkit-color-swatch]:rounded-[10px]"
                    type="color"
                    value={
                      hexColorPattern.test(restaurantForm.primaryColor)
                        ? restaurantForm.primaryColor
                        : "#4f755c"
                    }
                    onChange={(event) =>
                      handleRestaurantFieldChange(
                        "primaryColor",
                        event.target.value,
                      )
                    }
                  />
                  <input
                    className="w-full border border-[#CBD5E0] rounded-xl bg-white text-[#1A202C] px-3.5 py-3 text-[14px] font-['Outfit',sans-serif] box-border transition-all duration-200 focus:outline-none focus:border-tk-burgundy focus:ring-4 focus:ring-[rgba(139,58,30,0.12)] dark:bg-tk-bg-surface dark:border-tk-border dark:text-tk-text"
                    type="text"
                    value={restaurantForm.primaryColor}
                    onChange={(event) =>
                      handleRestaurantFieldChange(
                        "primaryColor",
                        event.target.value,
                      )
                    }
                    placeholder="#4F755C"
                  />
                </div>
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-[12px] font-semibold text-[#4A5568] uppercase tracking-[0.5px] font-['Outfit',sans-serif] dark:text-tk-text-secondary">Secondary Color</span>
                <div className="flex items-center gap-3">
                  <input
                    className="w-12 h-12 p-0 border border-[#CBD5E0] rounded-xl bg-white cursor-pointer shrink-0 dark:bg-tk-bg-surface dark:border-tk-border [&::-webkit-color-swatch-wrapper]:p-1 [&::-webkit-color-swatch]:border-none [&::-webkit-color-swatch]:rounded-[10px]"
                    type="color"
                    value={
                      hexColorPattern.test(restaurantForm.secondaryColor)
                        ? restaurantForm.secondaryColor
                        : "#68d391"
                    }
                    onChange={(event) =>
                      handleRestaurantFieldChange(
                        "secondaryColor",
                        event.target.value,
                      )
                    }
                  />
                  <input
                    className="w-full border border-[#CBD5E0] rounded-xl bg-white text-[#1A202C] px-3.5 py-3 text-[14px] font-['Outfit',sans-serif] box-border transition-all duration-200 focus:outline-none focus:border-tk-burgundy focus:ring-4 focus:ring-[rgba(139,58,30,0.12)] dark:bg-tk-bg-surface dark:border-tk-border dark:text-tk-text"
                    type="text"
                    value={restaurantForm.secondaryColor}
                    onChange={(event) =>
                      handleRestaurantFieldChange(
                        "secondaryColor",
                        event.target.value,
                      )
                    }
                    placeholder="#68D391"
                  />
                </div>
              </label>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <span className="text-[13px] text-[#4A5568] font-semibold uppercase tracking-[0.5px] font-['Outfit',sans-serif] dark:text-tk-text-secondary">Location</span>
                <span className="text-[16px] text-[#1A202C] font-medium font-['Outfit',sans-serif] dark:text-tk-text inline-flex items-center gap-2">
                  <MapPinIcon size={15} />
                  {restaurant ? `${formatCoordinate(restaurant.location?.latitude)}, ${formatCoordinate(restaurant.location?.longitude)}` : "N/A"}
                </span>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-[13px] text-[#4A5568] font-semibold uppercase tracking-[0.5px] font-['Outfit',sans-serif] dark:text-tk-text-secondary">Access Area Radius</span>
                <span className="text-[16px] text-[#1A202C] font-medium font-['Outfit',sans-serif] dark:text-tk-text">
                  {restaurant?.location?.allowedRadius != null
                    ? `${restaurant.location.allowedRadius} meters`
                    : "Not set"}
                </span>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-[13px] text-[#4A5568] font-semibold uppercase tracking-[0.5px] font-['Outfit',sans-serif] dark:text-tk-text-secondary">Brand Colors</span>
                <div className="flex flex-wrap gap-2.5">
                  <span className="inline-flex items-center gap-2.5 px-3 py-2 rounded-full bg-[#EDF2F7] text-[#2D3748] text-[13px] font-medium font-['Outfit',sans-serif] dark:bg-tk-bg-elevated dark:text-tk-text">
                    <span
                      className="w-4 h-4 rounded-full border border-[rgba(26,32,44,0.12)]"
                      style={{
                        backgroundColor:
                          restaurant?.branding?.primaryColor || "#4f755c",
                      }}
                    />
                    {restaurant?.branding?.primaryColor || "Not set"}
                  </span>
                  <span className="inline-flex items-center gap-2.5 px-3 py-2 rounded-full bg-[#EDF2F7] text-[#2D3748] text-[13px] font-medium font-['Outfit',sans-serif] dark:bg-tk-bg-elevated dark:text-tk-text">
                    <span
                      className="w-4 h-4 rounded-full border border-[rgba(26,32,44,0.12)]"
                      style={{
                        backgroundColor:
                          restaurant?.branding?.secondaryColor || "#68d391",
                      }}
                    />
                    {restaurant?.branding?.secondaryColor || "Not set"}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-[13px] text-[#4A5568] font-semibold uppercase tracking-[0.5px] font-['Outfit',sans-serif] dark:text-tk-text-secondary">Logo</span>
                {restaurant?.branding?.logoUrl ? (
                  <div className="flex flex-col gap-2">
                    <img
                      src={restaurant.branding.logoUrl}
                      alt={`${restaurant.name} logo`}
                      className="w-16 h-16 object-contain rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] dark:bg-tk-bg-surface dark:border-tk-border"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  </div>
                ) : (
                  <span className="text-[16px] text-[#1A202C] font-medium font-['Outfit',sans-serif] dark:text-tk-text text-[#4A5568] dark:text-tk-text-secondary">
                    Not set
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Our Story & Additional Info */}
        <div
          className="border border-[#E2E8F0] rounded-[18px] p-4 sm:p-[18px] bg-white dark:bg-tk-bg-card dark:border-tk-border"
          style={{ display: activeTab === "story" ? "block" : "none" }}
        >
          <div className="flex flex-wrap justify-between items-start gap-3 mb-4">
            <div className="min-w-0">
              <h3 className="font-bold">Our Story & Socials</h3>
              <p>Tell your customers about your restaurant.</p>
            </div>
            <div className="shrink-0">{renderRestaurantActions("story")}</div>
          </div>
           {editingSections.story ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

              <label className="flex flex-col gap-2 sm:col-span-2">
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

              <label className="flex flex-col gap-2 sm:col-span-2">
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
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <span className="text-[13px] text-[#4A5568] font-semibold uppercase tracking-[0.5px] font-['Outfit',sans-serif] dark:text-tk-text-secondary">Opening Date</span>
                <span className="text-[16px] text-[#1A202C] font-medium font-['Outfit',sans-serif] dark:text-tk-text">
                  {restaurant?.openingDate || "Not set"}
                </span>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-[13px] text-[#4A5568] font-semibold uppercase tracking-[0.5px] font-['Outfit',sans-serif] dark:text-tk-text-secondary">Manifesto</span>
                <span className="text-[16px] text-[#1A202C] font-medium font-['Outfit',sans-serif] dark:text-tk-text">
                  {restaurant?.manifesto || "Not set"}
                </span>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-[13px] text-[#4A5568] font-semibold uppercase tracking-[0.5px] font-['Outfit',sans-serif] dark:text-tk-text-secondary">Instagram</span>
                <span className="text-[16px] text-[#1A202C] font-medium font-['Outfit',sans-serif] dark:text-tk-text">
                  {restaurant?.instagramUrl ? (
                    <a
                      href={restaurant.instagramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 w-fit text-[#2B6CB0] text-[14px] font-medium no-underline break-all font-['Outfit',sans-serif] hover:underline dark:text-[#90CDF4]"
                    >
                      {restaurant.instagramUrl} <ExternalLink size={14} />
                    </a>
                  ) : (
                    "Not set"
                  )}
                </span>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-[13px] text-[#4A5568] font-semibold uppercase tracking-[0.5px] font-['Outfit',sans-serif] dark:text-tk-text-secondary">Facebook</span>
                <span className="text-[16px] text-[#1A202C] font-medium font-['Outfit',sans-serif] dark:text-tk-text">
                  {restaurant?.facebookUrl ? (
                    <a
                      href={restaurant.facebookUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 w-fit text-[#2B6CB0] text-[14px] font-medium no-underline break-all font-['Outfit',sans-serif] hover:underline dark:text-[#90CDF4]"
                    >
                      {restaurant.facebookUrl} <ExternalLink size={14} />
                    </a>
                  ) : (
                    "Not set"
                  )}
                </span>
              </div>

              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <span className="text-[13px] text-[#4A5568] font-semibold uppercase tracking-[0.5px] font-['Outfit',sans-serif] dark:text-tk-text-secondary">Website</span>
                <span className="text-[16px] text-[#1A202C] font-medium font-['Outfit',sans-serif] dark:text-tk-text">
                  {restaurant?.websiteUrl ? (
                    <a
                      href={restaurant.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 w-fit text-[#2B6CB0] text-[14px] font-medium no-underline break-all font-['Outfit',sans-serif] hover:underline dark:text-[#90CDF4]"
                    >
                      {restaurant.websiteUrl} <ExternalLink size={14} />
                    </a>
                  ) : (
                    "Not set"
                  )}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── helpers used inside Features tab ────────────────────────────────────

  // ── helpers used inside Features tab ────────────────────────────────────
  const featureBadge = (on: boolean) => (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 10px', borderRadius: 20,
      fontSize: 12, fontWeight: 600, fontFamily: "'Outfit',sans-serif",
      background: on ? 'rgba(22,163,74,0.10)' : 'rgba(239,68,68,0.10)',
      color: on ? '#15803D' : '#B91C1C',
      border: `1px solid ${on ? 'rgba(22,163,74,0.22)' : 'rgba(239,68,68,0.22)'}`,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: on ? '#16A34A' : '#EF4444', display: 'inline-block' }} />
      {on ? 'Active' : 'Inactive'}
    </span>
  );

  const ToggleKnob = ({ on }: { on: boolean }) => (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => {}}
      style={{
        position: 'relative', display: 'inline-flex', alignItems: 'center',
        width: 52, height: 28, borderRadius: 9999, border: 'none', cursor: 'pointer',
        flexShrink: 0, transition: 'background-color 0.25s', padding: 0,
        backgroundColor: on ? '#8B3A1E' : '#CBD5E0',
      }}
    >
      <span style={{
        display: 'block', width: 22, height: 22, borderRadius: '50%', backgroundColor: '#fff',
        boxShadow: '0 1px 4px rgba(0,0,0,0.25)', transition: 'transform 0.25s',
        transform: `translateX(${on ? 27 : 3}px)`,
      }} />
    </button>
  );

  const triggerConfirm = (
    title: string, description: string, warning: string,
    confirmLabel: string, confirmColor: string,
    action: () => Promise<void>
  ) => {
    setConfirmModal({ open: true, title, description, warning, confirmLabel, confirmColor, onConfirm: action });
  };

  const handlePayOnlineFeatureToggle = () => {
    const on = (restaurant as any)?.pay_online === true || restaurantForm?.payOnline === true;
    if (!on) {
      // turning ON — need credentials
      const hasAll = paymentSettings.razorpayKeyId && paymentSettings.hasRazorpayKeySecret && paymentSettings.hasRazorpayWebhookSecret;
      if (!hasAll) {
        setPaymentSetupForm({ razorpayKeyId: paymentSettings.razorpayKeyId, razorpayKeySecret: '', razorpayWebhookSecret: '' });
        setPaymentSetupError(null);
        setShowPaymentSetupModal(true);
        return;
      }
      triggerConfirm(
        'Enable Online Payments?',
        'Customers will be able to pay online via Razorpay. Make sure your Razorpay account is active.',
        'This allows real money transactions on your storefront.',
        'Enable Payments', '#16A34A',
        async () => {
          if (!activeRestaurantId) return;
          await updateRestaurantProfile(activeRestaurantId, { pay_online: true });
          const updated = await getRestaurantById(activeRestaurantId);
          if (updated) { setRestaurant(updated); setRestaurantForm(createRestaurantFormState(updated)); }
          setFeedback({ tone: 'success', message: 'Online payments enabled.' });
        }
      );
    } else {
      triggerConfirm(
        'Disable Online Payments?',
        'The "Pay Online" button will be removed from your storefront. Customers can only pay at the counter.',
        'Ensure there are no in-progress payments before disabling.',
        'Disable Payments', '#EF4444',
        async () => {
          if (!activeRestaurantId) return;
          await updateRestaurantProfile(activeRestaurantId, { pay_online: false });
          const updated = await getRestaurantById(activeRestaurantId);
          if (updated) { setRestaurant(updated); setRestaurantForm(createRestaurantFormState(updated)); }
          setFeedback({ tone: 'success', message: 'Online payments disabled.' });
        }
      );
    }
  };

  const handleKitchenFeatureToggle = () => {
    const on = (restaurant as any)?.kitchen_app_enabled !== false;
    if (!on) {
      triggerConfirm(
        'Enable Kitchen Web App?',
        'Kitchen staff will be able to log in. Customers will see the Live Queue button.',
        'Ensure kitchen staff accounts are set up before enabling.',
        'Enable Kitchen App', '#16A34A',
        async () => {
          if (!activeRestaurantId) return;
          await updateRestaurantProfile(activeRestaurantId, { kitchen_app_enabled: true });
          const updated = await getRestaurantById(activeRestaurantId);
          if (updated) { setRestaurant(updated); setRestaurantForm(createRestaurantFormState(updated)); }
          setFeedback({ tone: 'success', message: 'Kitchen App enabled.' });
        }
      );
    } else {
      triggerConfirm(
        'Disable Kitchen Web App?',
        'Kitchen staff will be locked out. The Live Queue button will be hidden from all customers immediately.',
        'Any kitchen staff currently logged in will see a "Disabled" screen.',
        'Disable Kitchen App', '#EF4444',
        async () => {
          if (!activeRestaurantId) return;
          await updateRestaurantProfile(activeRestaurantId, { kitchen_app_enabled: false });
          const updated = await getRestaurantById(activeRestaurantId);
          if (updated) { setRestaurant(updated); setRestaurantForm(createRestaurantFormState(updated)); }
          setFeedback({ tone: 'success', message: 'Kitchen App disabled.' });
        }
      );
    }
  };

  function renderFeaturesTab(): React.ReactNode {
    const payOn = (restaurant as any)?.pay_online === true;
    const kitchenOn = (restaurant as any)?.kitchen_app_enabled !== false;

    const cardCls = "border border-[#E2E8F0] rounded-[24px] shadow-[0_8px_30px_rgba(0,0,0,0.04)] overflow-hidden bg-white dark:bg-tk-bg-card dark:border-tk-border";
    const sectionHeaderCls = "flex items-center gap-3 px-5 py-4 border-b border-[#E2E8F0] dark:border-tk-border bg-[#F8FAFC] dark:bg-tk-bg-elevated";
    const rowCls = "flex items-start justify-between gap-4 px-5 py-5 flex-wrap";
    const credRowCls = "flex items-center justify-between px-5 py-3 border-t border-[#E2E8F0] dark:border-tk-border text-[13px] font-['Outfit',sans-serif]";

    return (
      <div style={{ display: activeTab === 'features' ? 'flex' : 'none', flexDirection: 'column', gap: 20 }}>
        {/* ── Card: Online Payments ─────────────────────────────────────────── */}
        <div className={cardCls}>
          <div className={sectionHeaderCls}>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: 'linear-gradient(135deg,#8B3A1E,#6B2A15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <CreditCardIcon size={16} color="#fff" />
            </div>
            <div>
              <div className="text-[15px] font-bold text-[#1A202C] font-['Outfit',sans-serif] dark:text-tk-text">Online Payments · Razorpay</div>
              <div className="text-[12px] text-[#64748B] font-['Outfit',sans-serif]">Let customers pay via UPI, Cards &amp; Net Banking</div>
            </div>
          </div>

          {/* Toggle row */}
          <div className={rowCls}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <span className="text-[15px] font-semibold text-[#1A202C] font-['Outfit',sans-serif] dark:text-tk-text">Enable Pay Online</span>
                {featureBadge(payOn)}
              </div>
              <p className="text-[13px] text-[#64748B] font-['Outfit',sans-serif]" style={{ margin: 0, lineHeight: 1.5 }}>
                When enabled, the "Pay Online" button appears at checkout.
                {!payOn && !paymentSettings.razorpayKeyId && (
                  <span style={{ color: '#F59E0B', display: 'block', marginTop: 4 }}>⚠ Razorpay credentials not set up yet.</span>
                )}
              </p>
            </div>
            <div onClick={handlePayOnlineFeatureToggle} style={{ cursor: 'pointer' }}>
              <ToggleKnob on={payOn} />
            </div>
          </div>

          {/* Credential status rows */}
          <div className={credRowCls}>
            <span className="text-[#64748B] dark:text-tk-text-secondary flex items-center gap-1.5"><Key size={12} /> Key ID</span>
            <span style={{ color: paymentSettings.razorpayKeyId ? '#15803D' : '#94A3B8', fontWeight: 500 }}>
              {paymentSettings.razorpayKeyId ? `${paymentSettings.razorpayKeyId.slice(0, 14)}•••` : 'Not set'}
            </span>
          </div>
          <div className={credRowCls}>
            <span className="text-[#64748B] dark:text-tk-text-secondary flex items-center gap-1.5"><Lock size={12} /> Key Secret</span>
            <span style={{ color: paymentSettings.hasRazorpayKeySecret ? '#15803D' : '#94A3B8', fontWeight: 500 }}>
              {paymentSettings.hasRazorpayKeySecret ? '✓ Saved' : 'Not set'}
            </span>
          </div>
          <div className={credRowCls}>
            <span className="text-[#64748B] dark:text-tk-text-secondary flex items-center gap-1.5"><Webhook size={12} /> Webhook Secret</span>
            <span style={{ color: paymentSettings.hasRazorpayWebhookSecret ? '#15803D' : '#94A3B8', fontWeight: 500 }}>
              {paymentSettings.hasRazorpayWebhookSecret ? '✓ Saved' : 'Not set'}
            </span>
          </div>

          {/* Update credentials button */}
          <div style={{ padding: '14px 20px', borderTop: '1px solid var(--tk-border,#E2E8F0)' }}>
            <button
              type="button"
              onClick={() => { setPaymentSetupForm({ razorpayKeyId: paymentSettings.razorpayKeyId, razorpayKeySecret: '', razorpayWebhookSecret: '' }); setPaymentSetupError(null); setShowPaymentSetupModal(true); }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-tk-burgundy text-tk-burgundy text-[13px] font-semibold font-['Outfit',sans-serif] bg-transparent cursor-pointer transition-all hover:bg-[rgba(139,58,30,0.06)]"
            >
              <Key size={13} />{paymentSettings.razorpayKeyId ? 'Update Razorpay Credentials' : 'Setup Razorpay'}
            </button>
          </div>
        </div>

        {/* ── Card: Kitchen Web App ─────────────────────────────────────────── */}
        <div className={cardCls}>
          <div className={sectionHeaderCls}>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: 'linear-gradient(135deg,#1E40AF,#1E3A8A)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <ChefHat size={16} color="#fff" />
            </div>
            <div>
              <div className="text-[15px] font-bold text-[#1A202C] font-['Outfit',sans-serif] dark:text-tk-text">Kitchen Web App &amp; Live Queue</div>
              <div className="text-[12px] text-[#64748B] font-['Outfit',sans-serif]">Kitchen display system &amp; customer-facing live queue</div>
            </div>
          </div>

          {/* Toggle row */}
          <div className={rowCls}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <span className="text-[15px] font-semibold text-[#1A202C] font-['Outfit',sans-serif] dark:text-tk-text">Enable Kitchen App</span>
                {featureBadge(kitchenOn)}
              </div>
              <p className="text-[13px] text-[#64748B] font-['Outfit',sans-serif]" style={{ margin: 0, lineHeight: 1.5 }}>
                When enabled, kitchen staff can log in and customers see the Live Queue button everywhere.
              </p>
            </div>
            <div onClick={handleKitchenFeatureToggle} style={{ cursor: 'pointer' }}>
              <ToggleKnob on={kitchenOn} />
            </div>
          </div>

          {/* Impact list */}
          <div style={{ padding: '14px 20px', borderTop: '1px solid var(--tk-border,#E2E8F0)' }}>
            <div className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-[0.5px] font-['Outfit',sans-serif]" style={{ marginBottom: 10 }}>
              Disabling will affect:
            </div>
            {['Kitchen Web App login for staff', 'Live Queue button on storefront', 'Live Queue in hamburger menu', 'Direct access to /live-queue page'].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#475569', marginBottom: 6, fontFamily: "'Outfit',sans-serif" }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: kitchenOn ? '#EF4444' : '#16A34A', flexShrink: 0 }} />
                {item}
              </div>
            ))}
          </div>
        </div>

        {/* ── Confirmation Modal ────────────────────────────────────────────── */}
        {confirmModal.open && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', padding: 20 }}>
            <div style={{ background: 'var(--tk-bg-surface,#fff)', borderRadius: 20, padding: '32px 28px', maxWidth: 430, width: '100%', boxShadow: '0 24px 60px rgba(0,0,0,0.22)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div style={{ width: 46, height: 46, borderRadius: 12, background: 'rgba(245,158,11,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <AlertTriangle size={22} color="#F59E0B" />
                </div>
                <button onClick={() => setConfirmModal(m => ({ ...m, open: false }))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}><X size={18} /></button>
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--tk-text,#1A202C)', margin: '0 0 8px', fontFamily: "'Outfit',sans-serif" }}>{confirmModal.title}</h3>
              <p style={{ fontSize: 14, color: '#64748B', lineHeight: 1.6, margin: '0 0 14px', fontFamily: "'Outfit',sans-serif" }}>{confirmModal.description}</p>
              <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#92400E', display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 22, fontFamily: "'Outfit',sans-serif" }}>
                <AlertTriangle size={13} style={{ flexShrink: 0, marginTop: 1 }} />{confirmModal.warning}
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setConfirmModal(m => ({ ...m, open: false }))}
                  disabled={confirmLoading}
                  style={{ flex: 1, padding: '11px 16px', borderRadius: 10, border: '1.5px solid #E2E8F0', background: 'transparent', color: 'var(--tk-text,#1A202C)', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: "'Outfit',sans-serif" }}
                >Cancel</button>
                <button
                  type="button"
                  disabled={confirmLoading}
                  onClick={async () => {
                    setConfirmLoading(true);
                    try { await confirmModal.onConfirm(); setConfirmModal(m => ({ ...m, open: false })); }
                    catch (err: any) { setFeedback({ tone: 'error', message: err?.message ?? 'Failed.' }); }
                    finally { setConfirmLoading(false); }
                  }}
                  style={{ flex: 1, padding: '11px 16px', borderRadius: 10, border: 'none', background: confirmModal.confirmColor, color: '#fff', fontSize: 14, fontWeight: 600, cursor: confirmLoading ? 'not-allowed' : 'pointer', opacity: confirmLoading ? 0.7 : 1, fontFamily: "'Outfit',sans-serif" }}
                >{confirmLoading ? 'Saving…' : confirmModal.confirmLabel}</button>
              </div>
            </div>
          </div>
        )}

        {/* ── Payment Setup Modal ───────────────────────────────────────────── */}
        {showPaymentSetupModal && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', padding: 20 }}>
            <div style={{ background: 'var(--tk-bg-surface,#fff)', borderRadius: 20, padding: '32px 28px', maxWidth: 490, width: '100%', boxShadow: '0 24px 60px rgba(0,0,0,0.22)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 42, height: 42, borderRadius: 10, background: 'linear-gradient(135deg,#8B3A1E,#6B2A15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CreditCardIcon size={18} color="#fff" />
                  </div>
                  <div>
                    <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--tk-text,#1A202C)', margin: 0, fontFamily: "'Outfit',sans-serif" }}>Setup Razorpay</h3>
                    <p style={{ fontSize: 12, color: '#64748B', margin: 0, fontFamily: "'Outfit',sans-serif" }}>All 3 fields required to enable payments</p>
                  </div>
                </div>
                <button onClick={() => setShowPaymentSetupModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}><X size={18} /></button>
              </div>
              {/* Info Banner */}
              <div style={{ background: 'rgba(59,130,246,0.07)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#1D4ED8', display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 18, fontFamily: "'Outfit',sans-serif" }}>
                <ShieldCheck size={13} style={{ flexShrink: 0, marginTop: 1 }} />
                Credentials are encrypted and stored securely. Secrets are never shown after saving.
              </div>
              {/* Fields */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  { icon: <Key size={12} />, label: 'Razorpay Key ID', key: 'razorpayKeyId', placeholder: 'rzp_live_xxxxxxxxxxxx', type: 'text' },
                  { icon: <Lock size={12} />, label: 'Key Secret', key: 'razorpayKeySecret', placeholder: '••••••••••••', type: 'password' },
                  { icon: <Webhook size={12} />, label: 'Webhook Secret', key: 'razorpayWebhookSecret', placeholder: '••••••••••••', type: 'password' },
                ].map(f => (
                  <div key={f.key}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6, fontFamily: "'Outfit',sans-serif" }}>
                      {f.icon}{f.label}
                    </label>
                    <input
                      type={f.type as any}
                      placeholder={f.placeholder}
                      value={(paymentSetupForm as any)[f.key]}
                      onChange={e => setPaymentSetupForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                      autoComplete="new-password"
                      className="w-full border border-[#CBD5E0] rounded-xl bg-white text-[#1A202C] px-3.5 py-3 text-[14px] font-['Outfit',sans-serif] box-border transition-all duration-200 focus:outline-none focus:border-tk-burgundy focus:ring-4 focus:ring-[rgba(139,58,30,0.12)] dark:bg-tk-bg-surface dark:border-tk-border dark:text-tk-text"
                    />
                  </div>
                ))}
              </div>
              {paymentSetupError && (
                <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, fontSize: 13, color: '#B91C1C', display: 'flex', gap: 8, alignItems: 'center', fontFamily: "'Outfit',sans-serif" }}>
                  <XCircle size={13} />{paymentSetupError}
                </div>
              )}
              <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
                <button type="button" onClick={() => setShowPaymentSetupModal(false)} style={{ flex: 1, padding: '11px 16px', borderRadius: 10, border: '1.5px solid #E2E8F0', background: 'transparent', color: 'var(--tk-text,#1A202C)', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: "'Outfit',sans-serif" }}>Cancel</button>
                <button
                  type="button"
                  disabled={paymentSetupSaving || !paymentSetupForm.razorpayKeyId.trim() || !paymentSetupForm.razorpayKeySecret.trim() || !paymentSetupForm.razorpayWebhookSecret.trim()}
                  onClick={async () => {
                    setPaymentSetupSaving(true); setPaymentSetupError(null);
                    try {
                      if (!activeRestaurantId) return;
                      const updated = await updateRestaurantPaymentSettings(activeRestaurantId, {
                        razorpayKeyId: paymentSetupForm.razorpayKeyId.trim(),
                        razorpayKeySecret: paymentSetupForm.razorpayKeySecret.trim(),
                        razorpayWebhookSecret: paymentSetupForm.razorpayWebhookSecret.trim(),
                        onlinePaymentsEnabled: true,
                      });
                      await updateRestaurantProfile(activeRestaurantId, { pay_online: true });
                      setPaymentSettings({ razorpayKeyId: updated.razorpayKeyId ?? '', hasRazorpayKeySecret: updated.hasRazorpayKeySecret, hasRazorpayWebhookSecret: updated.hasRazorpayWebhookSecret, onlinePaymentsEnabled: true });
                      const rest = await getRestaurantById(activeRestaurantId);
                      if (rest) { setRestaurant(rest); setRestaurantForm(createRestaurantFormState(rest)); }
                      setShowPaymentSetupModal(false);
                      setFeedback({ tone: 'success', message: 'Razorpay set up — payments enabled!' });
                    } catch (err: any) {
                      setPaymentSetupError(err?.message ?? 'Failed to save credentials.');
                    } finally { setPaymentSetupSaving(false); }
                  }}
                  style={{ flex: 1, padding: '11px 16px', borderRadius: 10, border: 'none', background: (!paymentSetupForm.razorpayKeyId.trim() || !paymentSetupForm.razorpayKeySecret.trim() || !paymentSetupForm.razorpayWebhookSecret.trim()) ? '#CBD5E0' : 'linear-gradient(135deg,#8B3A1E,#6B2A15)', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: "'Outfit',sans-serif" }}
                >{paymentSetupSaving ? 'Saving…' : 'Save & Enable'}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  function renderAdminEditor(): React.ReactNode {
    if (!userProfile) {
      return (
        <div className="border border-dashed border-[#CBD5E0] rounded-2xl p-[18px] text-[#4A5568] bg-[#F8FAFC] text-[14px] font-['Outfit',sans-serif] dark:bg-tk-bg-surface dark:border-tk-border dark:text-tk-text-secondary">
          Administrator profile could not be loaded.
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-6">
        <div className="border border-[#E2E8F0] rounded-[18px] p-4 sm:p-[18px] bg-white dark:bg-tk-bg-card dark:border-tk-border">
          <div className="flex flex-wrap justify-between items-start gap-3 mb-4">
            <div className="min-w-0">
              <h3 className="font-bold">Personal Information</h3>
              <p>Your personal details and profile picture.</p>
            </div>
            <div className="shrink-0">{renderAdminActions()}</div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

            <div className="flex flex-col gap-2 sm:col-span-2">
              <span className="text-[12px] font-semibold text-[#4A5568] uppercase tracking-[0.5px] font-['Outfit',sans-serif] dark:text-tk-text-secondary">Avatar</span>
              <div
                className={`border-2 border-dashed border-[#CBD5E0] rounded-2xl bg-[#F8FAFC] cursor-pointer transition-all duration-200 overflow-hidden hover:border-tk-burgundy hover:bg-[#F0FFF4] dark:bg-tk-bg-surface dark:border-tk-border dark:hover:bg-[rgba(72,187,120,0.1)] ${isUploadingAvatar ? "opacity-70 cursor-wait pointer-events-none" : ""}`}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.add("profile-dropzone-hover");
                }}
                onDragLeave={(e) => {
                  e.currentTarget.classList.remove("profile-dropzone-hover");
                }}
                onDrop={(e) => {
                  e.currentTarget.classList.remove("profile-dropzone-hover");
                  handleAvatarDrop(e);
                }}
                onClick={() =>
                  !isUploadingAvatar && avatarInputRef.current?.click()
                }
              >
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif"
                  className="hidden"
                  onChange={handleAvatarFileSelect}
                />
                {adminForm.avatarUrl ? (
                  <div className="flex items-center gap-3.5 px-4 py-3.5">
                    <img
                      src={adminForm.avatarUrl}
                      alt="Avatar preview"
                      className="w-14 h-14 object-contain rounded-xl border border-[#E2E8F0] bg-white shrink-0 dark:bg-tk-bg-surface dark:border-tk-border rounded-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                    <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-tk-burgundy font-['Outfit',sans-serif]">
                      <Upload size={14} />
                      {isUploadingAvatar
                        ? "Uploading…"
                        : "Drop or click to replace"}
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-2 px-4 py-6 text-[#4A5568] font-['Outfit',sans-serif] text-center dark:text-tk-text-secondary">
                    <ImageIcon size={28} strokeWidth={1.5} />
                    <span>
                      {isUploadingAvatar
                        ? "Uploading…"
                        : "Drop image here or click to browse"}
                    </span>
                    <span className="!text-[11px] !text-[#718096] !font-normal dark:!text-tk-text-secondary">
                      PNG, JPG, WebP, SVG • Max 2 MB
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="border border-[#E2E8F0] rounded-2xl bg-white px-4 py-3.5 flex flex-col gap-2.5 dark:bg-tk-bg-card dark:border-tk-border">
            <span className="text-[13px] text-[#4A5568] font-semibold uppercase tracking-[0.5px] font-['Outfit',sans-serif] dark:text-tk-text-secondary">Global Role</span>
            <span className="inline-flex items-center px-3.5 py-1.5 rounded-xl text-[12px] font-semibold capitalize w-fit font-['Outfit',sans-serif] bg-[#D6BCFA] text-[#44337A] dark:bg-[rgba(214,188,250,0.15)] dark:text-[#D6BCFA]">
              {formatLabel(userProfile?.role)}
            </span>
          </div>
          <div className="border border-[#E2E8F0] rounded-2xl bg-white px-4 py-3.5 flex flex-col gap-2.5 dark:bg-tk-bg-card dark:border-tk-border">
            <span className="text-[13px] text-[#4A5568] font-semibold uppercase tracking-[0.5px] font-['Outfit',sans-serif] dark:text-tk-text-secondary">Restaurant Access Role</span>
            <span
              className={`inline-flex items-center px-3.5 py-1.5 rounded-xl text-[12px] font-semibold capitalize w-fit font-['Outfit',sans-serif] ${
                String(activeMembership?.role || "").toLowerCase() === "bg-[#D6BCFA] text-[#44337A] dark:bg-[rgba(214,188,250,0.15)] dark:text-[#D6BCFA]"
                  ? "bg-[#D6BCFA] text-[#44337A] dark:bg-[rgba(214,188,250,0.15)] dark:text-[#D6BCFA]"
                  : "bg-tk-burgundy text-white"
              }`}
            >
              {formatLabel(activeMembership?.role || "staff")}
            </span>
          </div>
          <div className="border border-[#E2E8F0] rounded-2xl bg-white px-4 py-3.5 flex flex-col gap-2.5 dark:bg-tk-bg-card dark:border-tk-border sm:col-span-2">
            <span className="text-[13px] text-[#4A5568] font-semibold uppercase tracking-[0.5px] font-['Outfit',sans-serif] dark:text-tk-text-secondary">Account ID</span>
            <span className="text-[12px] text-[#4A5568] font-mono break-all dark:text-tk-text-secondary" title={userProfile?.id}>
              {userProfile?.id}
            </span>
          </div>
        </div>
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
      <div className="flex flex-col gap-6">
        <div className="border border-[#E2E8F0] rounded-[18px] p-4 sm:p-[18px] bg-white dark:bg-tk-bg-card dark:border-tk-border">
          <div className="flex flex-wrap justify-between items-start gap-3 mb-4">
            <div className="min-w-0">
              <h3 className="font-bold">Personal Information</h3>
              <p>Your personal details and profile picture.</p>
            </div>
            <div className="shrink-0">{renderAdminActions()}</div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <span className="text-[13px] text-[#4A5568] font-semibold uppercase tracking-[0.5px] font-['Outfit',sans-serif] dark:text-tk-text-secondary">Full Name</span>
              <span className="text-[16px] text-[#1A202C] font-medium font-['Outfit',sans-serif] dark:text-tk-text">
                {userProfile?.name || "Admin User"}
              </span>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-[13px] text-[#4A5568] font-semibold uppercase tracking-[0.5px] font-['Outfit',sans-serif] dark:text-tk-text-secondary">Email Address</span>
              <span className="text-[16px] text-[#1A202C] font-medium font-['Outfit',sans-serif] dark:text-tk-text">
                {userProfile?.email || "N/A"}
              </span>
            </div>

            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <span className="text-[13px] text-[#4A5568] font-semibold uppercase tracking-[0.5px] font-['Outfit',sans-serif] dark:text-tk-text-secondary">Avatar</span>
              {userProfile?.avatarUrl ? (
                <div className="flex flex-col gap-2">
                  <img
                    src={userProfile?.avatarUrl}
                    alt={`${userProfile?.name || "Admin"} avatar`}
                    className="w-[52px] h-[52px] object-cover rounded-full border-2 border-[#E2E8F0] dark:border-tk-border"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>
              ) : (
                <span className="text-[16px] text-[#1A202C] font-medium font-['Outfit',sans-serif] dark:text-tk-text text-[#4A5568] dark:text-tk-text-secondary">
                  Not set
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="border border-[#E2E8F0] rounded-2xl bg-white px-4 py-3.5 flex flex-col gap-2.5 dark:bg-tk-bg-card dark:border-tk-border">
            <span className="text-[13px] text-[#4A5568] font-semibold uppercase tracking-[0.5px] font-['Outfit',sans-serif] dark:text-tk-text-secondary">Global Role</span>
            <span className="inline-flex items-center px-3.5 py-1.5 rounded-xl text-[12px] font-semibold capitalize w-fit font-['Outfit',sans-serif] bg-[#D6BCFA] text-[#44337A] dark:bg-[rgba(214,188,250,0.15)] dark:text-[#D6BCFA]">
              {formatLabel(userProfile?.role)}
            </span>
          </div>

          {activeMembership && (
            <div className="border border-[#E2E8F0] rounded-2xl bg-white px-4 py-3.5 flex flex-col gap-2.5 dark:bg-tk-bg-card dark:border-tk-border">
              <span className="text-[13px] text-[#4A5568] font-semibold uppercase tracking-[0.5px] font-['Outfit',sans-serif] dark:text-tk-text-secondary">Restaurant Access Role</span>
              <span
                className={`inline-flex items-center px-3.5 py-1.5 rounded-xl text-[12px] font-semibold capitalize w-fit font-['Outfit',sans-serif] ${
                  String(activeMembership.role).toLowerCase() === "bg-[#D6BCFA] text-[#44337A] dark:bg-[rgba(214,188,250,0.15)] dark:text-[#D6BCFA]"
                    ? "bg-[#D6BCFA] text-[#44337A] dark:bg-[rgba(214,188,250,0.15)] dark:text-[#D6BCFA]"
                    : "bg-tk-burgundy text-white"
                }`}
              >
                {formatLabel(activeMembership.role)}
              </span>
            </div>
          )}

          <div className="border border-[#E2E8F0] rounded-2xl bg-white px-4 py-3.5 flex flex-col gap-2.5 dark:bg-tk-bg-card dark:border-tk-border sm:col-span-2">
            <span className="text-[13px] text-[#4A5568] font-semibold uppercase tracking-[0.5px] font-['Outfit',sans-serif] dark:text-tk-text-secondary">Account ID</span>
            <span className="text-[12px] text-[#4A5568] font-mono break-all dark:text-tk-text-secondary" title={userProfile?.id}>
              {userProfile?.id}
            </span>
          </div>
        </div>
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
      <div className="flex flex-col gap-6 mb-8">
        {/* Header Row: Title & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E2E8F0] dark:border-tk-border">
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
            {userProfile?.avatarUrl ? (
              <img
                src={userProfile.avatarUrl}
                alt="Admin avatar"
                className="w-12 h-12 rounded-full bg-[linear-gradient(135deg,var(--tk-burgundy),#6B2A15)] shadow-[0_4px_12px_rgba(139,58,30,0.15)] text-white flex items-center justify-center text-[12px] font-bold tracking-[0.12em] font-['Outfit',sans-serif] object-cover ring-2 ring-white dark:ring-tk-bg-surface"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                  (e.target as HTMLImageElement).parentElement
                    ?.querySelector(".order-user-avatar-fallback")
                    ?.classList.remove("hidden");
                }}
              />
            ) : null}
          </div>
        </div>

        {/* Tabs Row */}
        <div className="inline-flex gap-1.5 p-1.5 bg-[#F1F5F9] dark:bg-[rgba(199,91,58,0.1)] border border-[#E2E8F0] dark:border-[rgba(199,91,58,0.2)] rounded-[16px] overflow-x-auto max-w-full self-start no-scrollbar shadow-inner mt-2">
          {[
            { id: "general", label: "General Info" },
            { id: "branding", label: "Location & Branding" },
            { id: "story", label: "Story & Socials" },
            { id: "features", label: "Features" },
            { id: "admin", label: "Admin Profile" },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`relative flex items-center gap-2 px-6 py-2.5 text-[14px] font-bold font-['Outfit',sans-serif] rounded-xl whitespace-nowrap transition-all duration-300 shrink-0 ${
                  isActive
                    ? "text-tk-burgundy bg-white shadow-sm dark:bg-tk-burgundy dark:text-white ring-1 ring-black/5 dark:ring-white/10 dark:shadow-[0_2px_10px_rgba(199,91,58,0.3)]"
                    : "text-[#64748B] dark:text-[#F0EDE8]/70 bg-transparent hover:text-tk-burgundy dark:hover:text-white hover:bg-black/5 dark:hover:bg-[rgba(199,91,58,0.15)]"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

        {feedback && (
          <div
            className={`mb-6 px-[18px] py-[14px] rounded-2xl flex items-center gap-2.5 font-['Outfit',sans-serif] text-[14px] font-medium shadow-[0_2px_8px_rgba(0,0,0,0.04)] profile-banner-${feedback.tone}`}
            style={{ marginBottom: "24px" }}
          >
            <span className="w-2.5 h-2.5 rounded-full shrink-0 bg-current" />
            <span>{feedback.message}</span>
          </div>
        )}

        <div className="flex flex-col gap-8 w-full" style={{ display: "block" }}>
          <form
            onSubmit={(e) => e.preventDefault()}
            style={{
              display: activeTab !== "admin" ? "flex" : "none",
              flexDirection: "column",
            }}
          >
            {renderRestaurantProfileContent()}
          </form>

          {/* Features Tab */}
          {renderFeaturesTab()}

          <form
            onSubmit={handleAdminSave}
            style={{
              display: activeTab === "admin" ? "flex" : "none",
              flexDirection: "column",
            }}
          >
            {isAdminEditing ? renderAdminEditor() : renderAdminReadOnly()}
          </form>
        </div>
      {/* Image Cropper Modal */}
      {cropImage && (
        <ImageCropper
          image={cropImage}
          onCropComplete={handleCropComplete}
          onCancel={() => {
            setCropImage(null);
            setCropType(null);
          }}
          circular={cropType === "avatar"}
          aspect={cropType === "logo" ? 1 : 1}
        />
      )}
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
