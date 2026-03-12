import React, { useCallback, useMemo, useState } from 'react';
import { RefreshCw, ServerCrash, ShieldCheck, UserRound, Store, Link2 } from 'lucide-react';
import { supabase } from '@restaurant-saas/supabase';
import { useAuth } from '../context/AuthContext';
import { useTabVisibilityRefetch } from '../hooks/useTabVisibilityRefetch';
import './system_status_panel.css';

type StatusTone = 'ok' | 'warn' | 'error' | 'info';

interface StatusItem {
  label: string;
  tone: StatusTone;
  detail: string;
}

const toneLabel: Record<StatusTone, string> = {
  ok: 'Healthy',
  warn: 'Needs attention',
  error: 'Failed',
  info: 'Info',
};

const getErrorMessage = (error: unknown) => (
  error instanceof Error ? error.message : String(error)
);

const SystemStatusPanel: React.FC = () => {
  const { user, userProfile, memberships, activeRestaurantId, diagnostics, refreshUserContext } = useAuth();
  const [backendError, setBackendError] = useState<string | null>(null);
  const [lastCheckedAt, setLastCheckedAt] = useState<string | null>(null);
  const [restaurantName, setRestaurantName] = useState<string | null>(null);
  const [restaurantStatus, setRestaurantStatus] = useState<string | null>(null);

  const runChecks = useCallback(async () => {
    setBackendError(null);

    try {
      const { error: pingError } = await supabase
        .from('platform_settings')
        .select('id', { head: true, count: 'exact' });

      if (pingError) {
        throw pingError;
      }

      if (user?.id) {
        await refreshUserContext();
      }

      if (activeRestaurantId) {
        const { data, error } = await supabase
          .from('restaurants')
          .select('id,name,status')
          .eq('id', activeRestaurantId)
          .maybeSingle();

        if (error) {
          throw error;
        }

        setRestaurantName(data?.name ?? null);
        setRestaurantStatus(data?.status ?? null);
      } else {
        setRestaurantName(null);
        setRestaurantStatus(null);
      }
    } catch (error) {
      setBackendError(getErrorMessage(error));
    } finally {
      setLastCheckedAt(new Date().toISOString());
    }
  }, [activeRestaurantId, refreshUserContext, user?.id]);

  const { refetch: refetchChecks, refetching } = useTabVisibilityRefetch(runChecks, {
    enabled: true,
    autoRefreshInterval: 45000,
    refetchOnMount: true,
  });

  const statusItems = useMemo<StatusItem[]>(() => {
    const items: StatusItem[] = [];

    items.push({
      label: 'Backend',
      tone: backendError ? 'error' : 'ok',
      detail: backendError ? backendError : 'Supabase REST endpoint reachable',
    });

    items.push({
      label: 'Session',
      tone: user ? 'ok' : 'warn',
      detail: user ? `Signed in as ${user.email ?? user.id}` : 'No authenticated session',
    });

    items.push({
      label: 'Profile Row',
      tone: user ? (userProfile ? 'ok' : diagnostics.lastSyncError ? 'error' : 'warn') : 'info',
      detail: user
        ? userProfile
          ? `profiles.id=${userProfile.id}`
          : diagnostics.lastSyncError ?? 'No matching row in profiles'
        : 'Requires an authenticated session',
    });

    items.push({
      label: 'Membership',
      tone: user ? (memberships.length > 0 ? 'ok' : diagnostics.lastSyncError ? 'error' : 'warn') : 'info',
      detail: user
        ? memberships.length > 0
          ? `${memberships.length} active restaurant assignment(s)`
          : diagnostics.lastSyncError ?? 'No active row in restaurant_users'
        : 'Requires an authenticated session',
    });

    items.push({
      label: 'Active Restaurant',
      tone: activeRestaurantId ? 'ok' : 'warn',
      detail: activeRestaurantId
        ? `${restaurantName ?? activeRestaurantId}${restaurantStatus ? ` (${restaurantStatus})` : ''}`
        : 'No active restaurant selected in local state',
    });

    return items;
  }, [activeRestaurantId, backendError, diagnostics.lastSyncError, memberships.length, restaurantName, restaurantStatus, user, userProfile]);

  return (
    <section className="system-status-panel">
      <div className="system-status-header">
        <div>
          <h2>System Status</h2>
          <p>Backend, auth, and membership diagnostics for the current admin session.</p>
        </div>

        <button
          type="button"
          className="system-status-refresh"
          onClick={() => refetchChecks(true)}
          disabled={refetching}
        >
          <RefreshCw size={16} className={refetching ? 'spin' : ''} />
          {refetching ? 'Checking...' : 'Run Check'}
        </button>
      </div>

      <div className="system-status-grid">
        {statusItems.map((item) => (
          <div key={item.label} className={`system-status-card tone-${item.tone}`}>
            <div className="system-status-card-header">
              {item.label === 'Backend' && <ServerCrash size={16} />}
              {item.label === 'Session' && <ShieldCheck size={16} />}
              {item.label === 'Profile Row' && <UserRound size={16} />}
              {item.label === 'Membership' && <Link2 size={16} />}
              {item.label === 'Active Restaurant' && <Store size={16} />}
              <span>{item.label}</span>
            </div>
            <div className="system-status-chip">{toneLabel[item.tone]}</div>
            <p>{item.detail}</p>
          </div>
        ))}
      </div>

      <div className="system-status-meta">
        <span>Last auth sync: {diagnostics.lastSyncAt ? new Date(diagnostics.lastSyncAt).toLocaleString() : 'Never'}</span>
        <span>Last health check: {lastCheckedAt ? new Date(lastCheckedAt).toLocaleString() : 'Never'}</span>
      </div>
    </section>
  );
};

export default SystemStatusPanel;
