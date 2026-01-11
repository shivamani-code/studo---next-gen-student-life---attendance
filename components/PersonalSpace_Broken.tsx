
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, RotateCcw, Award, BookOpen, Clock, Calendar as CalIcon, Plus, X, Check } from 'lucide-react';
import { Course, Exam, Task } from '../types';
import { DataService } from '../services/dataService';

interface Props {
  courses: Course[];
  exams: Exam[];
}

const PersonalSpace: React.FC<Props> = ({ courses, exams }) => {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<'focus' | 'short' | 'long'>('focus');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [showAddTask, setShowAddTask] = useState(false);

  useEffect(() => {
    setTasks(DataService.getTasks());
  }, []);

  const addTask = () => {
    if (!newTaskTitle.trim()) return;
    
    DataService.addTask({
      title: newTaskTitle,
      completed: false
    });
    
    setTasks(DataService.getTasks());
    setNewTaskTitle('');
    setShowAddTask(false);
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

  useEffect(() => {
    let interval: any = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(t => t - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const toggleTimer = () => setIsActive(!isActive);
  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(mode === 'focus' ? 25 * 60 : mode === 'short' ? 5 * 60 : 15 * 60);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const changeMode = (newMode: 'focus' | 'short' | 'long') => {
    setMode(newMode);
    setIsActive(false);
    setTimeLeft(newMode === 'focus' ? 25 * 60 : newMode === 'short' ? 5 * 60 : 15 * 60);
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      {/* Productivity Hub / Pomodoro */}
      <div className="xl:col-span-2 space-y-6">
        <div className="bg-[#111111] p-16 border border-white/5 rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col items-center justify-center text-center">
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none" />
          
          <div className="flex bg-[#0a0a0a] p-1.5 border border-white/10 rounded-2xl mb-16 relative z-10 shadow-inner">
            {(['focus', 'short', 'long'] as const).map((m) => (
              <button
                key={m}
                onClick={() => changeMode(m)}
                className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest mono transition-all ${
                  mode === m ? 'bg-[#ededed] text-[#0a0a0a] shadow-xl' : 'text-[#888888] hover:text-[#ededed] hover:bg-white/5'
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          <h1 className="text-[12rem] font-black tracking-tighter leading-none mb-16 tabular-nums italic mono text-white relative z-10" style={{ textShadow: '0 0 50px rgba(255,255,255,0.05)' }}>
            {formatTime(timeLeft)}
          </h1>

          <div className="flex items-center gap-10 relative z-10">
            <button 
              onClick={toggleTimer}
              className="w-28 h-28 bg-[#ededed] text-[#0a0a0a] flex items-center justify-center hover:bg-white hover:scale-105 active:scale-95 transition-all shadow-3xl shadow-white/5 rounded-full"
            >
              {isActive ? <Pause size={48} fill="currentColor" /> : <Play size={48} className="ml-2" fill="currentColor" />}
            </button>
            <button 
              onClick={resetTimer}
              className="w-16 h-16 border border-white/10 bg-white/5 text-[#888888] hover:text-white hover:bg-white/10 transition-all rounded-full flex items-center justify-center shadow-lg"
            >
              <RotateCcw size={28} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[#111111] p-10 border border-white/5 rounded-[2rem] shadow-xl">
            <h3 className="text-xl font-black uppercase tracking-tighter mb-10 flex items-center gap-3 text-white">
              <BookOpen className="text-indigo-400" size={20} /> COURSE_PROGRESS
            </h3>
            <div className="space-y-10">
              {courses.map(course => (
                <div key={course.id} className="space-y-4 group">
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest mono">
                    <span className="text-white group-hover:text-indigo-400 transition-colors">{course.name}</span>
                    <span className="text-indigo-400 italic font-black">{course.progress}%</span>
                  </div>
                  <div className="h-2 bg-[#1a1a1a] rounded-full overflow-hidden shadow-inner">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${course.progress}%` }}
                      className="h-full bg-gradient-to-r from-indigo-600 to-indigo-400 shadow-[0_0_10px_rgba(79,70,229,0.3)] rounded-full"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#111111] p-10 border border-white/5 rounded-[2rem] shadow-xl">
            <h3 className="text-xl font-black uppercase tracking-tighter mb-10 flex items-center gap-3 text-white">
              <Award className="text-indigo-400" size={20} /> TASK_SUMMARY
            </h3>
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-[#666] uppercase tracking-widest mono">TOTAL_TASKS</span>
                <span className="text-2xl font-black text-white">{tasks.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-[#666] uppercase tracking-widest mono">COMPLETED</span>
                <span className="text-2xl font-black text-emerald-500">{tasks.filter(t => t.completed).length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-[#666] uppercase tracking-widest mono">PENDING</span>
                <span className="text-2xl font-black text-amber-500">{tasks.filter(t => !t.completed).length}</span>
              </div>
            </div>
          </div>
            <div className="flex flex-col items-center justify-center py-6">
              <div className="w-24 h-24 border border-indigo-500/10 bg-indigo-500/5 rounded-full flex items-center justify-center mb-8 shadow-inner group transition-all hover:scale-105">
                <Clock className="text-indigo-400 group-hover:text-indigo-300" size={36} />
              </div>
              <p className="text-5xl font-black italic mono tracking-tighter text-white">1.5 HRS</p>
              <p className="text-[10px] text-[#888888] font-bold uppercase mono tracking-[0.3em] mt-3 opacity-60">Validated Focus</p>
            </div>
          </div>
        </div>
      </div>

      {/* Side: Upcoming Exams */}
      <div className="space-y-6">
        <h3 className="text-2xl font-black uppercase tracking-tighter px-4 text-white">ACADEMIC_QUEUE</h3>
        <div className="space-y-4">
          {exams.map(exam => {
            const date = new Date(exam.date);
            const daysLeft = Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
            return (
              <div key={exam.id} className="bg-[#111111] p-8 border border-white/5 rounded-[2rem] hover:border-white/20 transition-all shadow-xl group">
                <div className="flex justify-between items-start mb-8">
                  <div className="bg-[#0a0a0a] p-4 border border-white/10 rounded-2xl group-hover:bg-indigo-500/10 transition-colors">
                    <CalIcon size={22} className="text-[#666] group-hover:text-indigo-400" />
                  </div>
                  <span className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest mono shadow-lg ${daysLeft <= 3 ? 'bg-rose-500 text-white' : 'border border-indigo-500/30 text-indigo-400 bg-indigo-500/5'}`}>
                    T_MINUS_{daysLeft}_DAYS
                  </span>
                </div>
                <h4 className="font-black text-3xl uppercase tracking-tighter mb-2 text-white group-hover:translate-x-1 transition-transform">{exam.name}</h4>
                <p className="text-[10px] text-[#888888] font-bold mono uppercase tracking-[0.3em] mb-8 opacity-60">CODE // {exam.subjectId}</p>
                <div className="flex items-center gap-2 text-[10px] font-black text-[#444] mono group-hover:text-[#666] transition-colors">
                  <Clock size={14} />
                  {date.toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PersonalSpace;
