
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Plus, ChevronDown, ChevronUp, BarChart } from 'lucide-react';
import { Habit } from '../types';
import { DataService } from '../services/dataService';

const HabitTracker: React.FC = () => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [newHabitName, setNewHabitName] = useState('');
  const [showAddHabit, setShowAddHabit] = useState(false);

  // Load habits on component mount
  useEffect(() => {
    setHabits(DataService.getHabits());
  }, []);

  const toggleDay = (habitId: string) => {
    DataService.checkInHabit(habitId);
    setHabits(DataService.getHabits());
  };

  const addHabit = () => {
    if (!newHabitName.trim()) return;
    
    const newHabit: Habit = {
      id: Date.now().toString(),
      name: newHabitName,
      streak: 0,
      lastChecked: ''
    };
    
    const updatedHabits = [...habits, newHabit];
    DataService.saveHabits(updatedHabits);
    setHabits(updatedHabits);
    setNewHabitName('');
    setShowAddHabit(false);
  };

  const deleteHabit = (habitId: string) => {
    const updatedHabits = habits.filter(h => h.id !== habitId);
    DataService.saveHabits(updatedHabits);
    setHabits(updatedHabits);
  };

  const isHabitCheckedToday = (habit: Habit): boolean => {
    const today = new Date().toISOString().split('T')[0];
    const lastChecked = habit.lastChecked.split('T')[0];
    return lastChecked === today;
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#0a0a0a] p-12 border border-[#d4af37]/10 rounded-[2.5rem] overflow-hidden shadow-2xl relative">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#d4af37]/30 to-transparent" />
        
        <div className="flex items-center justify-between mb-12">
          <div>
            <div className="flex items-center gap-5 mb-3">
              <div className="bg-[#d4af37] p-2.5 rounded-2xl text-black shadow-lg shadow-[#d4af37]/20">
                <Flame size={20} />
              </div>
              <div className="flex items-baseline gap-4">
                <h2 className="serif-luxury text-4xl tracking-tighter uppercase italic text-white">MONITOR</h2>
                <h2 className="text-3xl font-black text-[#333] tracking-[0.2em] uppercase mono">GRID</h2>
              </div>
            </div>
            <p className="text-[10px] font-bold text-[#666] uppercase tracking-[0.4em] flex items-center gap-8 mono">
              <span>BATCH: Q2_STRETCH</span>
              <span className="w-32 h-[1px] bg-white/[0.03]" />
            </p>
          </div>
          <button className="bg-white/5 border border-white/10 text-[#d4af37] p-4 hover:bg-white/10 transition-all rounded-2xl shadow-xl">
            <Plus size={22} />
          </button>
        </div>

        {/* Fixed Grid Layout */}
        <div className="overflow-x-auto pb-6 custom-scrollbar">
          <div className="min-w-[1200px] space-y-2">
            {/* Days Header */}
            <div className="flex items-center mb-6">
              <div className="w-64" /> 
              <div className="flex-1 grid-cols-31">
                {Array(31).fill(0).map((_, i) => (
                  <div key={i} className="text-[10px] font-black text-[#333] text-center w-full mono tracking-tighter">
                    {(i + 1).toString().padStart(2, '0')}
                  </div>
                ))}
              </div>
            </div>

            {/* Habit Rows */}
            <div className="space-y-4">
              {habits.map((habit) => (
                <div key={habit.id} className="flex items-center group">
                  <div className="w-64 px-4 py-4">
                    <span className="text-[11px] font-black text-[#ededed] uppercase tracking-[0.15em] mono truncate block opacity-50 group-hover:opacity-100 group-hover:text-[#d4af37] transition-all">
                      {habit.name}
                    </span>
                  </div>
                  <div className="flex-1 grid-cols-31 gap-1">
                    {habit.completions.map((isDone, i) => (
                      <button
                        key={i}
                        onClick={() => toggleDay(habit.id, i)}
                        className={`h-12 w-full transition-all rounded-lg border active:scale-90 ${
                          isDone 
                            ? 'bg-[#d4af37] border-[#d4af37] shadow-[0_0_15px_rgba(212,175,55,0.2)]' 
                            : 'bg-black border-white/[0.03] hover:border-[#d4af37]/40'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-white/[0.03] pt-8">
          <button 
            onClick={() => setShowAnalysis(!showAnalysis)}
            className="flex items-center gap-4 text-[10px] font-black text-[#666] hover:text-[#d4af37] transition-all uppercase tracking-[0.3em] mx-auto mono px-8 py-3 bg-white/[0.02] rounded-2xl border border-white/[0.03]"
          >
            {showAnalysis ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            {showAnalysis ? 'COLLAPSE_METRICS' : 'EXPAND_METRICS'}
          </button>
        </div>

        <AnimatePresence>
          {showAnalysis && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="pt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {habits.map(habit => {
                  const stats = calculateStats(habit);
                  return (
                    <div key={habit.id} className="bg-white/[0.02] p-8 border border-white/[0.03] rounded-[2rem] hover:border-[#d4af37]/20 transition-colors">
                      <h4 className="text-[10px] font-black text-[#666] uppercase tracking-[0.2em] mb-8 mono truncate">{habit.name}</h4>
                      <div className="flex items-center justify-between mb-8">
                         <div className="text-left">
                            <p className="text-[9px] font-bold text-[#444] uppercase mono mb-2 tracking-widest">Rate</p>
                            <p className="text-4xl font-black italic mono tracking-tighter text-white">{stats.percentage}%</p>
                         </div>
                         <div className="text-right">
                            <p className="text-[9px] font-bold text-[#444] uppercase mono mb-2 tracking-widest">Streak</p>
                            <p className="text-4xl font-black italic mono tracking-tighter text-[#d4af37]">{stats.streak}D</p>
                         </div>
                      </div>
                      <div className="h-1.5 bg-white/[0.02] w-full rounded-full overflow-hidden shadow-inner">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${stats.percentage}%` }} className="h-full bg-gradient-to-r from-[#d4af37] to-[#8a6d3b] rounded-full" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default HabitTracker;
