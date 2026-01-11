
import React, { useEffect, useState } from 'react';
import { Subject } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { DataService } from '../services/dataService';

interface Props {
  subjects: Subject[];
}

const AttendanceHealth: React.FC<Props> = ({ subjects }) => {
  const [analyticsData, setAnalyticsData] = useState<any>(null);

  useEffect(() => {
    const load = () => {
      const profile = DataService.getUserProfile();
      const start = profile?.semesterStartDate;
      const end = profile?.semesterEndDate;
      const data = start && end
        ? DataService.getAttendanceAnalyticsForRange(start, end)
        : DataService.getAttendanceAnalytics();
      setAnalyticsData(data);
    };

    load();
    const onAttendanceUpdated = () => load();
    const onProfileUpdated = () => load();
    window.addEventListener('studo_attendance_updated', onAttendanceUpdated);
    window.addEventListener('studo_profile_updated', onProfileUpdated);
    return () => {
      window.removeEventListener('studo_attendance_updated', onAttendanceUpdated);
      window.removeEventListener('studo_profile_updated', onProfileUpdated);
    };
  }, [subjects]);

  const monthKey = DataService.getCurrentMonthKey();
  const monthStats = analyticsData?.monthlyStats?.[monthKey] || { total: 0, present: 0, percentage: 0 };

  const totalConducted = Number(monthStats?.total || 0);
  const totalAttended = Number(monthStats?.present || 0);
  const totalAbsent = Math.max(0, totalConducted - totalAttended);
  const overallPercentage = Number.isFinite(monthStats?.percentage) ? Number(monthStats.percentage) : 0;

  const requiredForTarget = totalConducted > 0 ? Math.ceil(totalConducted * 0.75) : 0;
  const marginSafety = totalAttended - requiredForTarget;

  const getHealthColor = (percentage: number) => {
    if (percentage >= 85) return '#d4af37'; 
    if (percentage >= 75) return '#ffffff'; 
    return '#f43f5e'; 
  };

  const data = [
    { name: 'Attended', value: totalAttended },
    { name: 'Missed', value: totalAbsent },
  ];

  return (
    <div className="bg-[#0a0a0a] p-6 md:p-10 border border-white/[0.03] rounded-[2.5rem] h-full flex flex-col shadow-2xl relative group overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#d4af37]/5 blur-[100px] pointer-events-none group-hover:bg-[#d4af37]/10 transition-colors" />
      
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 md:mb-12 relative z-10 gap-4">
        <div>
          <h3 className="serif-luxury text-2xl md:text-3xl uppercase tracking-tighter mb-2 text-white">HEALTH_CORE</h3>
          <p className="text-[#666] text-[10px] font-bold mono uppercase tracking-widest">Aggregate Verification Status</p>
        </div>
        <div className="px-4 py-2 bg-white/[0.02] border border-white/[0.05] rounded-2xl text-[10px] font-bold mono uppercase text-[#d4af37] tracking-widest shadow-xl">
          LIVE_DATA
        </div>
      </div>

      <div className="flex flex-col lg:flex-row items-center gap-8 md:gap-16 flex-1 relative z-10">
        <div className="relative w-full max-w-[200px] md:max-w-[260px] h-[200px] md:h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                innerRadius={80}
                outerRadius={105}
                paddingAngle={0}
                dataKey="value"
                startAngle={90}
                endAngle={450}
                stroke="none"
              >
                <Cell fill={getHealthColor(overallPercentage)} />
                <Cell fill="rgba(255,255,255,0.02)" />
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-7xl font-black tracking-tighter italic mono leading-none mb-1 text-white" style={{ textShadow: `0 0 40px ${getHealthColor(overallPercentage)}30` }}>
              {overallPercentage}
            </span>
            <span className="text-[10px] text-[#666] font-black uppercase tracking-[0.3em]">PERCENT</span>
          </div>
        </div>

        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
          <div className="bg-black p-4 md:p-6 border border-white/[0.03] rounded-[1.5rem] transition-all hover:border-[#d4af37]/20 group/stat">
            <h4 className="text-[10px] font-bold text-[#666] uppercase tracking-[0.2em] mb-3 mono group-hover/stat:text-[#d4af37] transition-colors">Classes_Total</h4>
            <p className="text-2xl md:text-4xl font-black tracking-tighter mono text-white">{totalConducted}</p>
          </div>
          <div className="bg-black p-4 md:p-6 border border-white/[0.03] rounded-[1.5rem] transition-all hover:border-[#d4af37]/20 group/stat">
            <h4 className="text-[10px] font-bold text-[#666] uppercase tracking-[0.2em] mb-3 mono group-hover/stat:text-[#d4af37] transition-colors">Margin_Safety</h4>
            <p className={`text-2xl md:text-4xl font-black tracking-tighter mono ${marginSafety >= 0 ? 'text-[#d4af37]' : 'text-[#f43f5e]'}`}>
              {marginSafety >= 0 ? `+${marginSafety}` : `${marginSafety}`}
            </p>
          </div>
          <div className="bg-black p-4 md:p-6 border border-white/[0.03] rounded-[1.5rem] transition-all hover:border-[#d4af37]/20 group/stat">
            <h4 className="text-[10px] font-bold text-[#666] uppercase tracking-[0.2em] mb-3 mono group-hover/stat:text-[#d4af37] transition-colors">Presents</h4>
            <p className="text-2xl md:text-4xl font-black tracking-tighter mono text-white">{totalAttended}</p>
          </div>
          <div className="bg-black p-4 md:p-6 border border-white/[0.03] rounded-[1.5rem] transition-all hover:border-[#d4af37]/20 group/stat">
            <h4 className="text-[10px] font-bold text-[#666] uppercase tracking-[0.2em] mb-3 mono group-hover/stat:text-[#d4af37] transition-colors">Absents</h4>
            <p className="text-2xl md:text-4xl font-black tracking-tighter mono text-white">{totalAbsent}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceHealth;
