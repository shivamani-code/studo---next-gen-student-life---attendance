
import React from 'react';
import { RefreshCw, CheckCircle2, ShieldCheck, Lock } from 'lucide-react';
import { Subject } from '../types';

interface Props {
  subjects: Subject[];
}

const UniversitySync: React.FC<Props> = ({ subjects }) => {
  return (
    <div className="relative h-full min-h-[500px]">
      {/* Coming Soon Overlay */}
      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-50/20 backdrop-blur-md rounded-[2.5rem]">
        <div className="bg-indigo-600 text-white p-6 rounded-3xl shadow-2xl flex flex-col items-center text-center max-w-sm border border-indigo-400">
          <Lock size={48} className="mb-4" />
          <h2 className="text-3xl font-black mb-2 uppercase tracking-tight">Coming Soon</h2>
          <p className="text-indigo-100 font-medium mb-6">
            We're currently building secure API bridges for over 500+ universities. Stay tuned!
          </p>
          <div className="w-full bg-indigo-500/30 h-1 rounded-full overflow-hidden">
            <div className="bg-white h-full w-2/3 animate-pulse" />
          </div>
        </div>
      </div>

      <div className="space-y-8 opacity-40 grayscale pointer-events-none">
        <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden relative">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <RefreshCw size={180} />
          </div>
          
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-3">
                <div className="bg-emerald-50 p-2 rounded-xl">
                  <ShieldCheck className="text-emerald-600" size={24} />
                </div>
                <h2 className="text-3xl font-bold">University Sync Status</h2>
              </div>
              <p className="text-slate-600 max-w-lg">
                We periodically sync your attendance records with the university portal.
              </p>
              <div className="flex items-center gap-6 pt-2">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</span>
                  <span className="text-emerald-600 font-bold flex items-center gap-1.5">
                    <CheckCircle2 size={16} /> Connected
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UniversitySync;
