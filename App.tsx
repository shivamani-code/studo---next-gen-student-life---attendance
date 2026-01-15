import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import Dashboard from './components/Dashboard';
import { supabase } from './services/supabaseClient';
import { DataService } from './services/dataService';
import { CloudDataService } from './services/cloudDataService';

const CLOUD_LAST_ERROR_KEY = 'studo_cloud_last_error';
const CLOUD_LAST_PUSH_AT_KEY = 'studo_cloud_last_push_at';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [cloudReady, setCloudReady] = useState<boolean>(false);

  const isSnapshotEffectivelyEmpty = (snapshot: any): boolean => {
    try {
      if (!snapshot || typeof snapshot !== 'object') return true;

      const hasArray = (v: any) => Array.isArray(v) && v.length > 0;
      const isNonEmptyString = (v: any) => typeof v === 'string' && v.trim().length > 0;
      const hasMeaningfulProfile = (p: any) => {
        if (!p || typeof p !== 'object') return false;
        return Object.values(p).some((v) => {
          if (isNonEmptyString(v)) return true;
          return false;
        });
      };

      if (hasMeaningfulProfile(snapshot.userProfile)) return false;
      if (hasArray(snapshot.subjects)) return false;
      if (hasArray(snapshot.attendanceDays)) return false;
      if (hasArray(snapshot.queueItems)) return false;
      if (hasArray(snapshot.habits)) return false;
      if (hasArray(snapshot.tasks)) return false;
      if (hasArray(snapshot.courses)) return false;
      if (hasArray(snapshot.exams)) return false;
      if (hasArray(snapshot.contactSubmissions)) return false;
      if (hasArray(snapshot.focusSessions)) return false;
      if (hasArray(snapshot.habitChecks)) return false;
      if (hasArray(snapshot.importantDates)) return false;

      return true;
    } catch {
      return true;
    }
  };

  useEffect(() => {
    let active = true;

    const syncFromSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (!active) return;
        setIsAuthenticated(!!data.session);
        DataService.setActiveUserId(data.session?.user?.id ?? null);
        window.dispatchEvent(new Event('studo_data_updated'));
      } catch {
        // noop
      }
    };

    syncFromSession();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
      DataService.setActiveUserId(session?.user?.id ?? null);
      window.dispatchEvent(new Event('studo_data_updated'));
    });

    const onStorage = (e: StorageEvent) => {
      if (!e.key) return;
      if (e.key === 'studo_active_user_id' || e.key.startsWith('sb-')) {
        syncFromSession();
      }
    };
    window.addEventListener('storage', onStorage);

    return () => {
      active = false;
      sub.subscription.unsubscribe();
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const hydrateFromCloud = async () => {
      setCloudReady(false);

      if (!isAuthenticated) {
        setCloudReady(true);
        return;
      }

      try {
        const localSnapshotStr = DataService.exportData();
        const localSnapshotObj = JSON.parse(localSnapshotStr);
        const localEmpty = isSnapshotEffectivelyEmpty(localSnapshotObj);

        const localLastModifiedAt = DataService.getLocalLastModifiedAt();
        const localLastModifiedMs = localLastModifiedAt ? Date.parse(localLastModifiedAt) : null;

        const remoteRes = await CloudDataService.pullUserData();
        if (remoteRes.ok === false) {
          try {
            localStorage.setItem(CLOUD_LAST_ERROR_KEY, remoteRes.error);
          } catch {
            // noop
          }
          return;
        }

        const rawRemote = remoteRes.data.data;
        const remoteSnapshotObj = (() => {
          if (!rawRemote) return null;
          if (typeof rawRemote === 'string') {
            try {
              return JSON.parse(rawRemote);
            } catch {
              return null;
            }
          }
          return rawRemote;
        })();

        const remoteEmpty = isSnapshotEffectivelyEmpty(remoteSnapshotObj);

        const remoteUpdatedAt = remoteRes.data.updatedAt;
        const remoteUpdatedMs = remoteUpdatedAt ? Date.parse(remoteUpdatedAt) : null;

        const isRemoteNewer =
          remoteUpdatedMs !== null && (localLastModifiedMs === null || remoteUpdatedMs > localLastModifiedMs + 1000);

        const isLocalNewer =
          localLastModifiedMs !== null && (remoteUpdatedMs === null || localLastModifiedMs > remoteUpdatedMs + 1000);

        if (!remoteEmpty && remoteSnapshotObj && (localEmpty || isRemoteNewer)) {
          DataService.importData(JSON.stringify(remoteSnapshotObj));
          try {
            localStorage.removeItem(CLOUD_LAST_ERROR_KEY);
          } catch {
            // noop
          }
          return;
        }

        if (!localEmpty && (remoteEmpty || isLocalNewer)) {
          const pushRes = await CloudDataService.pushUserData(localSnapshotObj);
          if (pushRes.ok === true) {
            try {
              localStorage.setItem(CLOUD_LAST_PUSH_AT_KEY, new Date().toISOString());
              localStorage.removeItem(CLOUD_LAST_ERROR_KEY);
            } catch {
              // noop
            }
          } else if (pushRes.ok === false) {
            try {
              localStorage.setItem(CLOUD_LAST_ERROR_KEY, pushRes.error);
            } catch {
              // noop
            }
          }
        }
      } catch {
        
      } finally {
        if (!cancelled) setCloudReady(true);
      }
    };

    hydrateFromCloud();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (!cloudReady) return;

    let timer: number | null = null;
    let inFlight = false;
    let pending = false;
    let lastSentSnapshot: string | null = null;

    const schedule = () => {
      if (!isAuthenticated) return;
      pending = true;
      if (timer !== null) window.clearTimeout(timer);
      timer = window.setTimeout(async () => {
        timer = null;
        if (inFlight) return;
        if (!pending) return;

        pending = false;
        inFlight = true;
        try {
          const snapshot = DataService.exportData();
          if (lastSentSnapshot === snapshot) return;

          const payload = JSON.parse(snapshot);
          if (isSnapshotEffectivelyEmpty(payload)) return;
          const res = await CloudDataService.pushUserData(payload);
          if (res.ok === true) {
            lastSentSnapshot = snapshot;
            try {
              localStorage.setItem(CLOUD_LAST_PUSH_AT_KEY, new Date().toISOString());
              localStorage.removeItem(CLOUD_LAST_ERROR_KEY);
            } catch {
              // noop
            }
          } else if (res.ok === false) {
            try {
              localStorage.setItem(CLOUD_LAST_ERROR_KEY, res.error);
            } catch {
              // noop
            }
          }
        } catch {
          // best-effort autosync
        } finally {
          inFlight = false;
          if (pending) schedule();
        }
      }, 1500);
    };

    const onData = () => schedule();
    window.addEventListener('studo_data_updated', onData);
    window.addEventListener('studo_profile_updated', onData);
    window.addEventListener('studo_attendance_updated', onData);
    window.addEventListener('studo_focus_updated', onData);

    // Initial sync shortly after login
    schedule();

    return () => {
      if (timer !== null) window.clearTimeout(timer);
      window.removeEventListener('studo_data_updated', onData);
      window.removeEventListener('studo_profile_updated', onData);
      window.removeEventListener('studo_attendance_updated', onData);
      window.removeEventListener('studo_focus_updated', onData);
    };
  }, [isAuthenticated, cloudReady]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // best-effort
    } finally {
      DataService.setActiveUserId(null);
      setIsAuthenticated(false);
      try {
        window.dispatchEvent(new Event('studo_data_updated'));
      } catch {
        // noop
      }
    }
  };

  return (
    <div className="min-h-screen">
      <Routes>
        <Route 
          path="/" 
          element={isAuthenticated ? <Navigate to="/dashboard" /> : <LandingPage />} 
        />
        <Route 
          path="/dashboard/*" 
          element={
            isAuthenticated
              ? (cloudReady
                ? <Dashboard onLogout={handleLogout} />
                : (
                  <div className="min-h-screen flex items-center justify-center text-white">
                    LOADING
                  </div>
                ))
              : <Navigate to="/" />
          }
        />
      </Routes>
    </div>
  );
};

export default App;
