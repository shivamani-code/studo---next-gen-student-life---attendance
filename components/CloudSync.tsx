import React, { useEffect, useMemo, useState } from 'react';
import { CloudDownload, CloudUpload, CheckCircle2, AlertCircle, User, RefreshCw } from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { CloudDataService } from '../services/cloudDataService';
import { DataService } from '../services/dataService';

const CloudSync: React.FC = () => {
  const [email, setEmail] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string>('');
  const [lastCloudUpdatedAt, setLastCloudUpdatedAt] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      setEmail(data.user?.email ?? null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user?.email ?? null);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const isAuthed = !!email;

  const localSnapshotSize = useMemo(() => {
    try {
      return DataService.exportData().length;
    } catch {
      return 0;
    }
  }, []);

  const refreshCloudMeta = async () => {
    const res = await CloudDataService.pullUserData();
    if (res.ok) {
      setLastCloudUpdatedAt(res.data.updatedAt);
    }
  };

  useEffect(() => {
    if (isAuthed) refreshCloudMeta();
  }, [isAuthed]);

  const push = async () => {
    setStatus('loading');
    setMessage('Uploading your data to cloud...');

    try {
      const payload = JSON.parse(DataService.exportData());
      const res = await CloudDataService.pushUserData(payload);
      if (res.ok === false) {
        setStatus('error');
        setMessage(res.error);
        return;
      }
      await refreshCloudMeta();
      setStatus('success');
      setMessage('Cloud upload completed.');
    } catch (e: any) {
      setStatus('error');
      setMessage(e?.message || 'Upload failed');
    }
  };

  const pull = async () => {
    setStatus('loading');
    setMessage('Downloading your data from cloud...');

    const res = await CloudDataService.pullUserData();
    if (res.ok === false) {
      setStatus('error');
      setMessage(res.error);
      return;
    }

    if (!res.data.data) {
      setStatus('error');
      setMessage('No cloud backup found for this account. Upload once to initialize.');
      return;
    }

    const ok = DataService.importData(JSON.stringify(res.data.data));
    if (!ok) {
      setStatus('error');
      setMessage('Cloud data exists but import failed.');
      return;
    }

    setLastCloudUpdatedAt(res.data.updatedAt);
    setStatus('success');
    setMessage('Cloud restore completed. Refreshing UI may be required.');
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] p-8 md:p-12 shadow-2xl relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#d4af37]/5 blur-[120px] pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-4 mb-3">
              <div className="p-3 bg-white/5 rounded-2xl border border-white/10 text-[#d4af37]">
                <RefreshCw size={20} />
              </div>
              <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter text-white">CLOUD_SYNC</h2>
            </div>
            <p className="text-[#888888] text-[10px] font-bold mono uppercase tracking-[0.4em] opacity-60">Multi-device persistence via Supabase</p>
          </div>

          <div className="bg-black/30 border border-white/10 rounded-[2rem] p-5 min-w-[260px]">
            <p className="text-[10px] font-black uppercase tracking-[0.4em] mono text-[#666]">IDENTITY</p>
            <div className="mt-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl border border-[#d4af37]/20 bg-[#d4af37]/10 flex items-center justify-center text-[#d4af37]">
                <User size={18} />
              </div>
              <div>
                <p className="text-sm font-black uppercase tracking-tighter text-white">{isAuthed ? 'CONNECTED' : 'DISCONNECTED'}</p>
                <p className="text-[10px] text-[#666] font-bold mono uppercase tracking-widest">{email || 'SIGN IN REQUIRED'}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
          <div className="bg-black/30 border border-white/10 rounded-[2rem] p-5">
            <p className="text-[10px] font-black uppercase tracking-[0.4em] mono text-[#666]">LOCAL_SNAPSHOT</p>
            <p className="mt-3 text-lg font-black text-white mono">{Math.round(localSnapshotSize / 1024)} KB</p>
            <p className="mt-2 text-[10px] font-bold mono uppercase tracking-widest text-[#777] opacity-70">From localStorage</p>
          </div>
          <div className="bg-black/30 border border-white/10 rounded-[2rem] p-5">
            <p className="text-[10px] font-black uppercase tracking-[0.4em] mono text-[#666]">CLOUD_LAST_WRITE</p>
            <p className="mt-3 text-lg font-black text-white mono">{lastCloudUpdatedAt ? new Date(lastCloudUpdatedAt).toLocaleString() : '—'}</p>
            <button
              type="button"
              onClick={refreshCloudMeta}
              disabled={!isAuthed}
              className="mt-3 text-[10px] font-black uppercase tracking-widest mono text-[#d4af37] disabled:opacity-40"
            >
              Refresh
            </button>
          </div>
          <div className="bg-black/30 border border-white/10 rounded-[2rem] p-5">
            <p className="text-[10px] font-black uppercase tracking-[0.4em] mono text-[#666]">STATUS</p>
            <div className="mt-3 flex items-start gap-3">
              {status === 'success' ? (
                <CheckCircle2 className="text-emerald-400" size={18} />
              ) : status === 'error' ? (
                <AlertCircle className="text-rose-400" size={18} />
              ) : (
                <RefreshCw className={`text-[#666] ${status === 'loading' ? 'animate-spin' : ''}`} size={18} />
              )}
              <p className="text-xs font-bold mono text-[#888] leading-relaxed">{message || (isAuthed ? 'Ready.' : 'Sign in to enable cloud sync.')}</p>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col md:flex-row gap-4 relative z-10">
          <button
            type="button"
            onClick={push}
            disabled={!isAuthed || status === 'loading'}
            className="flex-1 bg-[#d4af37] text-black py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:scale-[0.99] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            <CloudUpload size={18} /> Upload to Cloud
          </button>
          <button
            type="button"
            onClick={pull}
            disabled={!isAuthed || status === 'loading'}
            className="flex-1 bg-white/5 border border-white/10 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-white/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            <CloudDownload size={18} /> Restore from Cloud
          </button>
        </div>

        <p className="mt-6 text-[10px] font-bold mono uppercase tracking-widest text-[#666] opacity-70 relative z-10">
          Tip: Upload once after major changes. Restore is destructive (overwrites local data).
        </p>
      </div>
    </div>
  );
};

export default CloudSync;
