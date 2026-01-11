import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Check, Calendar, Clock, AlertCircle, Filter, ChevronDown } from 'lucide-react';
import { Task } from '../types';
import { DataService } from '../services/dataService';

const TaskManager: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [filter, setFilter] = useState<'all' | 'today' | 'upcoming' | 'completed'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'created' | 'name'>('date');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    dueDate: '',
    completed: false
  });

  useEffect(() => {
    setTasks(DataService.getTasks());
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showFilterDropdown) {
        const target = event.target as HTMLElement;
        if (!target.closest('.filter-dropdown')) {
          setShowFilterDropdown(false);
        }
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showFilterDropdown]);

  const addTask = () => {
    if (!newTask.title.trim()) return;
    
    DataService.addTask({
      title: newTask.title,
      completed: false,
      dueDate: newTask.dueDate || undefined
    });
    
    setTasks(DataService.getTasks());
    setNewTask({ title: '', dueDate: '', completed: false });
    setShowAddModal(false);
  };

  const toggleTask = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      DataService.updateTask(taskId, { completed: !task.completed });
      setTasks(DataService.getTasks());
    }
  };

  const deleteTask = (taskId: string) => {
    DataService.deleteTask(taskId);
    setTasks(DataService.getTasks());
  };

  const getFilteredTasks = () => {
    let filtered = [...tasks];
    
    // Apply filters
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    switch (filter) {
      case 'today':
        filtered = filtered.filter(task => {
          if (!task.dueDate) return false;
          const taskDate = new Date(task.dueDate);
          taskDate.setHours(0, 0, 0, 0);
          return taskDate.getTime() === today.getTime();
        });
        break;
      case 'upcoming':
        filtered = filtered.filter(task => {
          if (!task.dueDate) return false;
          const taskDate = new Date(task.dueDate);
          taskDate.setHours(0, 0, 0, 0);
          return taskDate.getTime() > today.getTime();
        });
        break;
      case 'completed':
        filtered = filtered.filter(task => task.completed);
        break;
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        case 'created':
          return b.createdAt - a.createdAt;
        case 'name':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });
    
    return filtered;
  };

  const getTaskStatus = (task: Task) => {
    if (task.completed) return { color: 'text-emerald-500', label: 'COMPLETED', icon: Check };
    
    if (!task.dueDate) return { color: 'text-[#666]', label: 'NO_DUE_DATE', icon: Clock };
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const taskDate = new Date(task.dueDate);
    taskDate.setHours(0, 0, 0, 0);
    const daysLeft = Math.ceil((taskDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysLeft < 0) return { color: 'text-rose-500', label: 'OVERDUE', icon: AlertCircle };
    if (daysLeft === 0) return { color: 'text-amber-500', label: 'DUE_TODAY', icon: AlertCircle };
    if (daysLeft <= 3) return { color: 'text-yellow-500', label: `${daysLeft}_DAYS_LEFT`, icon: Clock };
    return { color: 'text-[#666]', label: `${daysLeft}_DAYS_LEFT`, icon: Clock };
  };

  const getTodayTasks = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return tasks.filter(task => {
      if (!task.dueDate) return false;
      const taskDate = new Date(task.dueDate);
      taskDate.setHours(0, 0, 0, 0);
      return taskDate.getTime() === today.getTime();
    });
  };

  const getRecentTasks = () => {
    const today = new Date();
    const threeDaysAgo = new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000);
    
    return tasks
      .filter(task => task.completed && task.createdAt >= threeDaysAgo.getTime())
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 5);
  };

  const filteredTasks = getFilteredTasks();
  const todayTasks = getTodayTasks();
  const recentTasks = getRecentTasks();

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Highlights Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Today's Tasks */}
        <div className="bg-[#0a0a0a] p-4 md:p-6 lg:p-8 border border-white/[0.03] rounded-[2.5rem] shadow-2xl">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-[#d4af37] rounded-xl shadow-[0_0_20px_rgba(212,175,55,0.3)]">
              <Calendar className="text-black w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base md:text-lg lg:text-2xl font-black uppercase tracking-tighter text-white">TODAY_HIGHLIGHTS</h3>
              <p className="text-[#888888] text-[10px] font-bold mono uppercase tracking-widest opacity-60">Tasks for today</p>
            </div>
          </div>
          
          <div className="space-y-3">
            {todayTasks.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="text-[#666] w-12 h-12 mx-auto mb-4 opacity-20" />
                <p className="text-[#666] text-sm mono">No tasks for today</p>
              </div>
            ) : (
              todayTasks.map(task => {
                const status = getTaskStatus(task);
                const StatusIcon = status.icon;
                
                return (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-white/[0.02] border border-white/[0.03] rounded-2xl p-4 hover:border-[#d4af37]/20 transition-all group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => toggleTask(task.id)}
                          className={`w-5 h-5 rounded-lg flex items-center justify-center transition-all ${
                            task.completed 
                              ? 'bg-[#d4af37]' 
                              : 'bg-black/30 border border-white/10'
                          }`}
                        >
                          {task.completed && <Check className="text-black w-3 h-3" />}
                        </button>
                        <div>
                          <h4 className={`text-sm font-black uppercase tracking-tighter ${task.completed ? 'text-[#666] line-through' : 'text-white'}`}>
                            {task.title}
                          </h4>
                          {task.dueDate && (
                            <p className="text-[10px] font-bold mono uppercase tracking-widest text-[#666]">
                              {new Date(task.dueDate).toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric' 
                              })}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <StatusIcon className={`w-4 h-4 ${status.color}`} />
                        <button
                          onClick={() => deleteTask(task.id)}
                          className="p-2 text-[#666] hover:text-rose-500 rounded-xl hover:bg-rose-500/10 transition-all opacity-0 group-hover:opacity-100"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>

        {/* Recent Tasks */}
        <div className="bg-[#0a0a0a] p-4 md:p-6 lg:p-8 border border-white/[0.03] rounded-[2.5rem] shadow-2xl">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-white/10 rounded-xl">
              <Clock className="text-white w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base md:text-lg lg:text-2xl font-black uppercase tracking-tighter text-white">RECENT_ACTIVITY</h3>
              <p className="text-[#888888] text-[10px] font-bold mono uppercase tracking-widest opacity-60">Last 3 days</p>
            </div>
          </div>
          
          <div className="space-y-3">
            {recentTasks.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="text-[#666] w-12 h-12 mx-auto mb-4 opacity-20" />
                <p className="text-[#666] text-sm mono">No recent activity</p>
              </div>
            ) : (
              recentTasks.map(task => {
                const status = getTaskStatus(task);
                const StatusIcon = status.icon;
                
                return (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-white/[0.02] border border-white/[0.03] rounded-2xl p-4 hover:border-[#d4af37]/20 transition-all group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => toggleTask(task.id)}
                          className={`w-5 h-5 rounded-lg flex items-center justify-center transition-all ${
                            task.completed 
                              ? 'bg-[#d4af37]' 
                              : 'bg-black/30 border border-white/10'
                          }`}
                        >
                          {task.completed && <Check className="text-black w-3 h-3" />}
                        </button>
                        <div>
                          <h4 className={`text-sm font-black uppercase tracking-tighter ${task.completed ? 'text-[#666] line-through' : 'text-white'}`}>
                            {task.title}
                          </h4>
                          <p className="text-[10px] font-bold mono uppercase tracking-widest text-[#666]">
                            Added {new Date(task.createdAt).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <StatusIcon className={`w-4 h-4 ${status.color}`} />
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Main Task Manager */}
      <div className="bg-[#0a0a0a] p-6 md:p-8 lg:p-10 border border-white/[0.03] rounded-[2.5rem] shadow-2xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 md:mb-8 gap-4">
          <div>
            <div className="flex items-center gap-4 mb-3">
              <div className="p-3 bg-[#d4af37] rounded-xl shadow-[0_0_20px_rgba(212,175,55,0.3)]">
                <Check className="text-black w-6 h-6" />
              </div>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-black uppercase tracking-tighter text-white">TASK_MANAGER</h2>
            </div>
            <p className="text-[#888888] text-[10px] font-bold mono uppercase tracking-widest opacity-60">Complete Task Control</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 md:gap-4 w-full sm:w-auto sm:justify-end">
            {/* Filter Dropdown */}
            <div className="relative filter-dropdown">
              <button 
                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                className="flex items-center justify-between gap-2 px-3 md:px-4 py-2 bg-white/[0.02] border border-white/10 rounded-xl text-[10px] font-black text-[#666] hover:text-[#d4af37] hover:bg-white/5 transition-all w-full sm:w-auto"
              >
                <Filter size={16} />
                {filter.toUpperCase()}
                <ChevronDown size={14} />
              </button>
              
              {showFilterDropdown && (
                <div className="absolute top-full mt-2 right-0 bg-[#111111] border border-white/10 rounded-xl shadow-2xl z-10 min-w-[150px] filter-dropdown">
                  {['all', 'today', 'upcoming', 'completed'].map(f => (
                    <button
                      key={f}
                      onClick={() => {
                        setFilter(f as any);
                        setShowFilterDropdown(false);
                      }}
                      className={`w-full px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest hover:bg-white/5 transition-all ${
                        filter === f ? 'text-[#d4af37] bg-white/5' : 'text-[#666]'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <button 
              onClick={() => setShowAddModal(true)}
              className="flex items-center justify-center gap-3 px-4 md:px-6 py-3 bg-[#d4af37] text-black rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white hover:scale-105 transition-all shadow-2xl w-full sm:w-auto"
            >
              <Plus size={16} className="md:size-18" />
              ADD_TASK
            </button>
          </div>
        </div>

        {/* Task List */}
        <div className="space-y-3">
          {filteredTasks.length === 0 ? (
            <div className="text-center py-20">
              <Check className="text-[#666] w-16 h-16 mx-auto mb-6 opacity-20" />
              <h3 className="text-xl font-black text-[#666] mb-4">NO_TASKS_FOUND</h3>
              <p className="text-[#666] text-sm mono mb-8">Try changing the filter or add a new task</p>
            </div>
          ) : (
            filteredTasks.map(task => {
              const status = getTaskStatus(task);
              const StatusIcon = status.icon;
              
              return (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white/[0.02] border border-white/[0.03] rounded-2xl p-6 hover:border-[#d4af37]/20 transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => toggleTask(task.id)}
                        className={`w-6 h-6 rounded-xl flex items-center justify-center transition-all ${
                          task.completed 
                            ? 'bg-[#d4af37] shadow-[0_0_20px_rgba(212,175,55,0.3)]' 
                            : 'bg-black/30 border-2 border-white/10 hover:border-[#d4af37]/40'
                        }`}
                      >
                        {task.completed && <Check className="text-black w-4 h-4" />}
                      </button>
                      
                      <div>
                        <h4 className={`text-lg font-black uppercase tracking-tighter mb-2 ${task.completed ? 'text-[#666] line-through' : 'text-white'}`}>
                          {task.title}
                        </h4>
                        <div className="flex items-center gap-6">
                          {task.dueDate && (
                            <div className="flex items-center gap-2">
                              <Calendar className="text-[#666] w-4 h-4" />
                              <span className="text-[10px] font-bold mono uppercase tracking-widest text-[#666]">
                                {new Date(task.dueDate).toLocaleDateString('en-US', { 
                                  weekday: 'short',
                                  month: 'short', 
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </span>
                            </div>
                          )}
                          
                          <div className={`flex items-center gap-2 ${status.color}`}>
                            <StatusIcon className="w-4 h-4" />
                            <span className="text-[10px] font-bold mono uppercase tracking-widest">
                              {status.label}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="p-3 text-[#666] hover:text-rose-500 rounded-xl hover:bg-rose-500/10 transition-all opacity-0 group-hover:opacity-100"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>

      {/* Add Task Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/70 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-[#111111] w-full max-w-md p-10 shadow-3xl relative rounded-[2.5rem] border border-white/10"
            >
              <button 
                onClick={() => setShowAddModal(false)}
                className="absolute top-8 right-8 p-2.5 text-[#888888] hover:text-white bg-white/5 rounded-xl transition-all"
              >
                <X size={20} />
              </button>
              
              <h3 className="text-3xl font-black uppercase tracking-tighter mb-2 text-white">NEW_TASK</h3>
              <p className="text-[#888888] text-[10px] font-bold mono uppercase tracking-widest mb-10 opacity-60">CREATE_TASK_ITEM</p>

              <div className="space-y-8">
                <div className="space-y-3">
                  <label className="block text-[10px] font-black text-[#888888] uppercase tracking-[0.2em] mb-2 mono opacity-60">TASK_TITLE</label>
                  <input 
                    type="text" 
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                    placeholder="Enter task title..." 
                    className="w-full bg-[#0a0a0a] border border-white/10 px-6 py-4.5 rounded-2xl outline-none focus:border-[#d4af37] transition-colors text-sm mono text-white" 
                    autoFocus
                  />
                </div>

                <div className="space-y-3">
                  <label className="block text-[10px] font-black text-[#888888] uppercase tracking-[0.2em] mb-2 mono opacity-60">DUE_DATE (OPTIONAL)</label>
                  <input 
                    type="date" 
                    value={newTask.dueDate}
                    onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                    className="w-full bg-[#0a0a0a] border border-white/10 px-6 py-4.5 rounded-2xl outline-none focus:border-[#d4af37] transition-colors text-sm mono text-white" 
                  />
                </div>

                <div className="flex gap-4">
                  <button 
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 bg-white/5 border border-white/10 text-white py-5 font-black uppercase tracking-tighter text-lg hover:bg-white/10 transition-all rounded-2xl"
                  >
                    CANCEL
                  </button>
                  <button 
                    onClick={addTask}
                    disabled={!newTask.title.trim()}
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

export default TaskManager;
