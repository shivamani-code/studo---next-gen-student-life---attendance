import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Plus, ChevronDown, ChevronUp, BarChart, X, Check } from 'lucide-react';
import { Habit } from '../types';
import { DataService } from '../services/dataService';

const HabitTracker: React.FC = () => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [newHabitName, setNewHabitName] = useState('');
  const [showAddHabit, setShowAddHabit] = useState(false);

  useEffect(() => {
    setHabits(DataService.getHabits());
  }, []);

  const checkInHabit = (habitId: string) => {
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

  const getCompletionRate = (habit: Habit): number => {
    return Math.min(100, habit.streak * 10);
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#0a0a0a] p-12 border border-[#d4af37]/10 rounded-[2.5rem] overflow-hidden shadow-2xl relative">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#d4af37]/30 to-transparent" />
        
        <div className="flex items-center justify-between mb-12">
          <div>
            <div className="flex items-center gap-5 mb-3">
              <div className="p-3 bg-[#d4af37] rounded-xl shadow-[0_0_20px_rgba(212,175,55,0.3)]">
                <Flame className="text-black w-6 h-6" />
              </div>
              <h2 className="text-4xl font-black uppercase tracking-tighter text-white">HABIT_CORE</h2>
            </div>
            <p className="text-[#888888] text-[10px] font-bold mono uppercase tracking-[0.2em] opacity-60">Behavioral Pattern Analysis</p>
          </div>
          
          <button 
            onClick={() => setShowAddHabit(true)}
            className="flex items-center gap-3 px-8 py-4 bg-[#d4af37] text-black rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white hover:scale-105 transition-all shadow-2xl"
          >
            <Plus size={18} />
            NEW_HABIT
          </button>
        </div>

        <div className="space-y-6">
          {habits.map(habit => {
            const isCheckedToday = isHabitCheckedToday(habit);
            const completionRate = getCompletionRate(habit);
            
            return (
              <motion.div 
                key={habit.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/[0.02] border border-white/[0.03] rounded-[2rem] p-8 hover:border-[#d4af37]/20 transition-all group"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-6">
                    <button
                      onClick={() => checkInHabit(habit.id)}
                      disabled={isCheckedToday}
                      className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all ${
                        isCheckedToday 
                          ? 'bg-[#d4af37] shadow-[0_0_20px_rgba(212,175,55,0.4)] cursor-not-allowed' 
                          : 'bg-black border-2 border-white/[0.1] hover:border-[#d4af37]/40 hover:bg-white/5'
                      }`}
                    >
                      {isCheckedToday ? <Check className="text-black w-8 h-8" /> : <div className="w-3 h-3 bg-[#666] rounded-full" />}
                    </button>
                    
                    <div>
                      <h3 className="text-xl font-black uppercase tracking-tighter text-white mb-2">{habit.name}</h3>
                      <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                          <Flame className="text-[#d4af37] w-4 h-4" />
                          <span className="text-[10px] font-black text-[#d4af37] mono uppercase tracking-widest">{habit.streak} DAY STREAK</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <BarChart className="text-[#666] w-4 h-4" />
                          <span className="text-[10px] font-black text-[#666] mono uppercase tracking-widest">{completionRate}% COMPLETE</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => deleteHabit(habit.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-3 text-[#666] hover:text-rose-500 rounded-xl hover:bg-rose-500/10"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="w-full bg-black/50 rounded-full h-2 overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${completionRate}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-[#d4af37] to-[#f4e4bc] rounded-full"
                  />
                </div>
              </motion.div>
            );
          })}
        </div>

        {habits.length === 0 && (
          <div className="text-center py-20">
            <Flame className="text-[#666] w-16 h-16 mx-auto mb-6 opacity-20" />
            <h3 className="text-xl font-black text-[#666] mb-4">NO_HABITS_TRACKED</h3>
            <p className="text-[#666] text-sm mono mb-8">Start building better habits today</p>
            <button 
              onClick={() => setShowAddHabit(true)}
              className="px-8 py-4 bg-[#d4af37] text-black rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white hover:scale-105 transition-all"
            >
              CREATE_FIRST_HABIT
            </button>
          </div>
        )}

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
                  const completionRate = getCompletionRate(habit);
                  return (
                    <div key={habit.id} className="bg-white/[0.02] p-8 border border-white/[0.03] rounded-[2rem] hover:border-[#d4af37]/20 transition-colors">
                      <h4 className="text-[10px] font-black text-[#666] uppercase tracking-[0.2em] mb-8 mono truncate">{habit.name}</h4>
                      <div className="flex items-center justify-between mb-8">
                         <div className="text-left">
                            <p className="text-[9px] font-bold text-[#444] uppercase mono mb-2 tracking-widest">Rate</p>
                            <p className="text-4xl font-black italic mono tracking-tighter text-white">{completionRate}%</p>
                         </div>
                         <div className="text-right">
                            <p className="text-[9px] font-bold text-[#444] uppercase mono mb-2 tracking-widest">Streak</p>
                            <p className="text-4xl font-black italic mono tracking-tighter text-[#d4af37]">{habit.streak}D</p>
                         </div>
                      </div>
                      <div className="w-full bg-black/50 rounded-full h-2 overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${completionRate}%` }}
                          transition={{ duration: 0.5, ease: "easeOut" }}
                          className="h-full bg-gradient-to-r from-[#d4af37] to-[#f4e4bc] rounded-full"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showAddHabit && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/70 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-[#111111] w-full max-w-md p-10 shadow-3xl relative rounded-[2.5rem] border border-white/10"
            >
              <button 
                onClick={() => setShowAddHabit(false)}
                className="absolute top-8 right-8 p-2.5 text-[#888888] hover:text-white bg-white/5 rounded-xl transition-all"
              >
                <X size={20} />
              </button>
              
              <h3 className="text-3xl font-black uppercase tracking-tighter mb-2 text-white">NEW_HABIT</h3>
              <p className="text-[#888888] text-[10px] font-bold mono uppercase tracking-widest mb-10 opacity-60">CREATE_PATTERN</p>

              <div className="space-y-8">
                <div className="space-y-3">
                  <label className="block text-[10px] font-black text-[#888888] uppercase tracking-[0.2em] mb-2 mono opacity-60">HABIT_NAME</label>
                  <input 
                    type="text" 
                    value={newHabitName}
                    onChange={(e) => setNewHabitName(e.target.value)}
                    placeholder="ENTER_HABIT..." 
                    className="w-full bg-[#0a0a0a] border border-white/10 px-6 py-4.5 rounded-2xl outline-none focus:border-[#d4af37] transition-colors text-sm mono text-white" 
                    autoFocus
                  />
                </div>

                <div className="flex gap-4">
                  <button 
                    onClick={() => setShowAddHabit(false)}
                    className="flex-1 bg-white/5 border border-white/10 text-white py-5 font-black uppercase tracking-tighter text-lg hover:bg-white/10 transition-all rounded-2xl"
                  >
                    CANCEL
                  </button>
                  <button 
                    onClick={addHabit}
                    disabled={!newHabitName.trim()}
                    className="flex-1 bg-[#d4af37] text-black py-5 font-black uppercase tracking-tighter text-lg hover:bg-white hover:scale-[0.98] active:scale-95 transition-all rounded-2xl shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    CREATE
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HabitTracker;
