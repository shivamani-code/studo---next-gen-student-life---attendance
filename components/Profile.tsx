import React, { useEffect, useMemo, useState } from 'react';
import { Save, User } from 'lucide-react';
import { DataService } from '../services/dataService';
import { UserProfile } from '../types';

const Profile: React.FC = () => {
  const saved = useMemo(() => DataService.getUserProfile(), []);

  const [profile, setProfile] = useState<UserProfile>(() => ({
    name: saved?.name || '',
    university: saved?.university || '',
    department: saved?.department || '',
    course: saved?.course || '',
    className: saved?.className || '',
    year: saved?.year || new Date().getFullYear(),
    semester: saved?.semester || 1,
    semesterStartDate: saved?.semesterStartDate || '',
    semesterEndDate: saved?.semesterEndDate || '',
    section: saved?.section || '',
    rollNumber: saved?.rollNumber || '',
    avatar: saved?.avatar || ''
  }));

  const [savedState, setSavedState] = useState<'idle' | 'saved'>('idle');

  useEffect(() => {
    if (savedState === 'saved') {
      const t = window.setTimeout(() => setSavedState('idle'), 1500);
      return () => window.clearTimeout(t);
    }
    return;
  }, [savedState]);

  const saveProfile = () => {
    if (!profile.name.trim()) return;
    DataService.saveUserProfile(profile);
    window.dispatchEvent(new Event('studo_profile_updated'));
    setSavedState('saved');
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="bg-[#0a0a0a] p-6 md:p-10 border border-white/[0.03] rounded-[2.5rem] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#d4af37]/5 blur-[100px] pointer-events-none" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8 relative z-10">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <div className="p-3 bg-[#d4af37] rounded-xl shadow-[0_0_20px_rgba(212,175,55,0.3)]">
                <User className="text-black w-6 h-6" />
              </div>
              <h2 className="text-2xl md:text-4xl font-black uppercase tracking-tighter text-white">PROFILE_CORE</h2>
            </div>
            <p className="text-[#888888] text-[10px] font-bold mono uppercase tracking-widest opacity-60">Student Identity + Context</p>
          </div>

          <button
            onClick={saveProfile}
            disabled={!profile.name.trim()}
            className="flex items-center justify-center gap-3 px-5 md:px-6 py-3 bg-[#d4af37] text-black rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white hover:scale-105 transition-all shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save size={16} />
            {savedState === 'saved' ? 'SAVED' : 'SAVE_PROFILE'}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 relative z-10">
          <div className="bg-black/30 p-5 md:p-6 border border-white/5 rounded-2xl">
            <p className="text-[10px] font-black text-[#666] uppercase tracking-widest mono mb-4">IDENTITY</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-[#888888] uppercase tracking-widest mono mb-2 opacity-60">NAME</label>
                <input
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  className="w-full bg-[#0a0a0a] border border-white/10 px-4 py-3 rounded-2xl outline-none focus:border-[#d4af37] transition-colors text-sm mono text-white"
                  placeholder="Your name"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-[#888888] uppercase tracking-widest mono mb-2 opacity-60">ROLL_NO</label>
                <input
                  value={profile.rollNumber || ''}
                  onChange={(e) => setProfile({ ...profile, rollNumber: e.target.value })}
                  className="w-full bg-[#0a0a0a] border border-white/10 px-4 py-3 rounded-2xl outline-none focus:border-[#d4af37] transition-colors text-sm mono text-white"
                  placeholder="e.g. 21CS043"
                />
              </div>
            </div>
          </div>

          <div className="bg-black/30 p-5 md:p-6 border border-white/5 rounded-2xl">
            <p className="text-[10px] font-black text-[#666] uppercase tracking-widest mono mb-4">ACADEMICS</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-[#888888] uppercase tracking-widest mono mb-2 opacity-60">DEPARTMENT</label>
                <input
                  value={profile.department || ''}
                  onChange={(e) => setProfile({ ...profile, department: e.target.value })}
                  className="w-full bg-[#0a0a0a] border border-white/10 px-4 py-3 rounded-2xl outline-none focus:border-[#d4af37] transition-colors text-sm mono text-white"
                  placeholder="e.g. CSE"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-[#888888] uppercase tracking-widest mono mb-2 opacity-60">COURSE</label>
                <input
                  value={profile.course || ''}
                  onChange={(e) => setProfile({ ...profile, course: e.target.value })}
                  className="w-full bg-[#0a0a0a] border border-white/10 px-4 py-3 rounded-2xl outline-none focus:border-[#d4af37] transition-colors text-sm mono text-white"
                  placeholder="e.g. B.Tech"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-[#888888] uppercase tracking-widest mono mb-2 opacity-60">CLASS</label>
                <input
                  value={profile.className || ''}
                  onChange={(e) => setProfile({ ...profile, className: e.target.value })}
                  className="w-full bg-[#0a0a0a] border border-white/10 px-4 py-3 rounded-2xl outline-none focus:border-[#d4af37] transition-colors text-sm mono text-white"
                  placeholder="e.g. CSE-A"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-[#888888] uppercase tracking-widest mono mb-2 opacity-60">SECTION</label>
                <input
                  value={profile.section || ''}
                  onChange={(e) => setProfile({ ...profile, section: e.target.value })}
                  className="w-full bg-[#0a0a0a] border border-white/10 px-4 py-3 rounded-2xl outline-none focus:border-[#d4af37] transition-colors text-sm mono text-white"
                  placeholder="e.g. A"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-[#888888] uppercase tracking-widest mono mb-2 opacity-60">YEAR</label>
                <input
                  type="number"
                  value={profile.year ?? ''}
                  onChange={(e) => setProfile({ ...profile, year: Number(e.target.value) })}
                  className="w-full bg-[#0a0a0a] border border-white/10 px-4 py-3 rounded-2xl outline-none focus:border-[#d4af37] transition-colors text-sm mono text-white"
                  placeholder="2026"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-[#888888] uppercase tracking-widest mono mb-2 opacity-60">SEM</label>
                <input
                  type="number"
                  min={1}
                  max={12}
                  value={profile.semester}
                  onChange={(e) => setProfile({ ...profile, semester: Number(e.target.value) })}
                  className="w-full bg-[#0a0a0a] border border-white/10 px-4 py-3 rounded-2xl outline-none focus:border-[#d4af37] transition-colors text-sm mono text-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-[#888888] uppercase tracking-widest mono mb-2 opacity-60">SEM_START</label>
                <input
                  type="date"
                  value={profile.semesterStartDate || ''}
                  onChange={(e) => setProfile({ ...profile, semesterStartDate: e.target.value })}
                  className="w-full bg-[#0a0a0a] border border-white/10 px-4 py-3 rounded-2xl outline-none focus:border-[#d4af37] transition-colors text-sm mono text-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-[#888888] uppercase tracking-widest mono mb-2 opacity-60">SEM_END</label>
                <input
                  type="date"
                  value={profile.semesterEndDate || ''}
                  onChange={(e) => setProfile({ ...profile, semesterEndDate: e.target.value })}
                  className="w-full bg-[#0a0a0a] border border-white/10 px-4 py-3 rounded-2xl outline-none focus:border-[#d4af37] transition-colors text-sm mono text-white"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[10px] font-black text-[#888888] uppercase tracking-widest mono mb-2 opacity-60">UNIVERSITY</label>
                <input
                  value={profile.university || ''}
                  onChange={(e) => setProfile({ ...profile, university: e.target.value })}
                  className="w-full bg-[#0a0a0a] border border-white/10 px-4 py-3 rounded-2xl outline-none focus:border-[#d4af37] transition-colors text-sm mono text-white"
                  placeholder="University name"
                />
              </div>
            </div>
          </div>
        </div>

        {!profile.name.trim() && (
          <div className="mt-6 text-[10px] font-black uppercase tracking-widest mono text-rose-500 opacity-80">
            NAME_REQUIRED
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
