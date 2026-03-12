import React, { useCallback, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import Sidebar from "../../components/sidebar";
import SystemStatusPanel from "../../components/system_status_panel";
import { useTabVisibilityRefetch } from "../../hooks/useTabVisibilityRefetch";
import {
  getProfilePageData,
  updateOwnProfile,
  updateRestaurantProfile,
  type ProfilePageData,
} from "../../services/supabaseService";

import { BuildingIcon, UserCircleIcon, Bell, Save } from "lucide-react";
import "./profile.css";

const emptyProfileData: ProfilePageData = {
  restaurant: null,
  restaurantRow: null,
  profileRow: null,
  membershipRow: null,
};

const formatValue = (value: unknown): string => {
  if (value === null || value === undefined || value === "") return "NULL";
  if (typeof value === "object") return JSON.stringify(value, null, 2);
  return String(value);
};

/* ---------------- RECORD TABLE ---------------- */

const RecordTable = ({
  title,
  rows,
}: {
  title: string;
  rows: Array<{ column: string; value: unknown }>;
}) => {
  if (!rows.length) return null;

  return (
    <div className="profile-record-card">
      <div className="profile-record-header">
        <h3>{title}</h3>
      </div>

      <div className="profile-record-table-wrap">
        <table className="profile-record-table">
          <thead>
            <tr>
              <th>Column</th>
              <th>Value</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((row) => (
              <tr key={`${title}-${row.column}`}>
                <td>{row.column}</td>
                <td>
                  <span className="profile-record-value">
                    {formatValue(row.value)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* ---------------- PROFILE PAGE ---------------- */

const ProfilePage: React.FC = () => {
  const { user, activeRestaurantId, refreshUserContext } = useAuth();

  const [profileData, setProfileData] =
    useState<ProfilePageData>(emptyProfileData);

  const [restaurantForm, setRestaurantForm] = useState({
    name: "",
    contact_email: "",
    contact_phone: "",
    contact_address: "",
    logo_url: "",
    primary_color: "",
    secondary_color: "",
  });

  const [adminForm, setAdminForm] = useState({
    name: "",
    email: "",
    avatar_url: "",
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  /* ---------------- DATA FETCH ---------------- */

  const fetchProfileData = useCallback(async () => {
    if (!activeRestaurantId || !user?.id) {
      setProfileData(emptyProfileData);
      setIsLoading(false);
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const data = await getProfilePageData(activeRestaurantId, user.id);

      setProfileData(data);

      setRestaurantForm({
        name: data.restaurantRow?.name ?? "",
        contact_email: data.restaurantRow?.contact_email ?? "",
        contact_phone: data.restaurantRow?.contact_phone ?? "",
        contact_address: data.restaurantRow?.contact_address ?? "",
        logo_url: data.restaurantRow?.logo_url ?? "",
        primary_color: data.restaurantRow?.primary_color ?? "",
        secondary_color: data.restaurantRow?.secondary_color ?? "",
      });

      setAdminForm({
        name: data.profileRow?.name ?? "",
        email: data.profileRow?.email ?? "",
        avatar_url: data.profileRow?.avatar_url ?? "",
      });
    } catch (err) {
      console.error(err);
      setError("Failed to load profile data.");
    } finally {
      setIsLoading(false);
    }
  }, [activeRestaurantId, user?.id]);

  const { refetch: refetchProfile, refetching } =
    useTabVisibilityRefetch(fetchProfileData, {
      enabled: !!activeRestaurantId && !!user?.id,
      autoRefreshInterval: 60000,
      refetchOnMount: true,
    });

  /* ---------------- SAVE HANDLERS ---------------- */

  const handleRestaurantSave = async () => {
    if (!activeRestaurantId) return;

    setIsSaving(true);
    setError(null);

    try {
      await updateRestaurantProfile(activeRestaurantId, restaurantForm);
      await refetchProfile(true);
      setSuccess("Restaurant updated successfully.");
    } catch (err) {
      setError("Failed to update restaurant.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleProfileSave = async () => {
    if (!user?.id) return;

    setIsSaving(true);
    setError(null);

    try {
      await updateOwnProfile(user.id, adminForm);
      await refreshUserContext();
      await refetchProfile(true);
      setSuccess("Profile updated successfully.");
    } catch {
      setError("Failed to update profile.");
    } finally {
      setIsSaving(false);
    }
  };

  /* ---------------- ROW MAPPING ---------------- */

  const restaurantRows = useMemo(
    () =>
      profileData.restaurantRow
        ? Object.entries(profileData.restaurantRow).map(([column, value]) => ({
            column,
            value,
          }))
        : [],
    [profileData.restaurantRow]
  );

  const profileRows = useMemo(
    () =>
      profileData.profileRow
        ? Object.entries(profileData.profileRow).map(([column, value]) => ({
            column,
            value,
          }))
        : [],
    [profileData.profileRow]
  );

  const membershipRows = useMemo(
    () =>
      profileData.membershipRow
        ? Object.entries(profileData.membershipRow).map(([column, value]) => ({
            column,
            value,
          }))
        : [],
    [profileData.membershipRow]
  );

  if (isLoading && !refetching) {
    return (
      <div className="profile-container">
        <Sidebar />
        <div className="profile-main-content">
          <div className="profile-loading">
            <div className="profile-loading-spinner" />
            <p>Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  /* ---------------- UI ---------------- */

  return (
    <div className="profile-container">
      <Sidebar />

      <div className="profile-main-content">
        <div className="profile-header">
          <div>
            <h1 className="profile-page-title">Profile</h1>
            <p className="profile-page-subtitle">
              Manage your restaurant and account settings
            </p>
          </div>

          <div className="profile-header-right">
            <Bell size={20} />
            <div className="order-user-avatar">RA</div>
          </div>
        </div>

        <SystemStatusPanel />

        {error && <div className="error-container">{error}</div>}
        {success && <div className="success-container">{success}</div>}

        {/* RESTAURANT FORM */}

        <div className="profile-card">
          <div className="profile-card-header">
            <BuildingIcon size={20} />
            <h2>Restaurant Settings</h2>
          </div>

          <div className="profile-info-list">
            <label className="profile-info-item">
              <span className="profile-info-label">Restaurant Name</span>
              <input
                className="profile-input"
                value={restaurantForm.name}
                onChange={(e) =>
                  setRestaurantForm({
                    ...restaurantForm,
                    name: e.target.value,
                  })
                }
              />
            </label>

            <label className="profile-info-item">
              <span className="profile-info-label">Contact Email</span>
              <input
                type="email"
                className="profile-input"
                value={restaurantForm.contact_email}
                onChange={(e) =>
                  setRestaurantForm({
                    ...restaurantForm,
                    contact_email: e.target.value,
                  })
                }
              />
            </label>

            <label className="profile-info-item">
              <span className="profile-info-label">Phone</span>
              <input
                className="profile-input"
                value={restaurantForm.contact_phone}
                onChange={(e) =>
                  setRestaurantForm({
                    ...restaurantForm,
                    contact_phone: e.target.value,
                  })
                }
              />
            </label>

            <button
              className="profile-save-btn"
              disabled={isSaving}
              onClick={handleRestaurantSave}
            >
              <Save size={16} /> {isSaving ? "Saving..." : "Update Restaurant"}
            </button>
          </div>
        </div>

        {/* ADMIN PROFILE */}

        <div className="profile-card">
          <div className="profile-card-header">
            <UserCircleIcon size={20} />
            <h2>User Profile</h2>
          </div>

          <div className="profile-info-list">
            <input
              className="profile-input"
              value={adminForm.name}
              onChange={(e) =>
                setAdminForm({ ...adminForm, name: e.target.value })
              }
            />

            <input
              type="email"
              className="profile-input"
              value={adminForm.email}
              onChange={(e) =>
                setAdminForm({ ...adminForm, email: e.target.value })
              }
            />

            <button
              className="profile-save-btn"
              disabled={isSaving}
              onClick={handleProfileSave}
            >
              <Save size={16} /> {isSaving ? "Saving..." : "Update Profile"}
            </button>
          </div>
        </div>

        {/* RAW TABLES */}

        <div className="profile-record-grid">
          <RecordTable title="restaurants" rows={restaurantRows} />
          <RecordTable title="profiles" rows={profileRows} />
          <RecordTable title="restaurant_users" rows={membershipRows} />
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
