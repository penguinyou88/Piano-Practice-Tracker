import React, { useState, useRef, useEffect } from "react";
import { 
  Play, 
  Pause, 
  Clock, 
  Flame, 
  Sparkles, 
  Music, 
  Award, 
  BookOpen, 
  Dribbble, 
  Smile, 
  Plus, 
  Bell, 
  Volume2, 
  BookMarked,
  CheckCircle2,
  Calendar
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { WeeklyNotes, PracticeItem } from "../types";

interface DailyChecklistProps {
  notes: WeeklyNotes;
  checkedTasksByDay: { [dayName: string]: string[] };
  onToggleTask: (dayName: string, taskId: string) => void;
  starsCount: number;
  onAddStars: (amount: number) => void;
  streakCount: number;
  practiceMinutes: number;
  onAddMinutes: (amount: number) => void;
  onSetMinutes: (minutes: number) => void;
  bedtimeReminderTime: string;
  onSetBedtimeReminder: (time: string) => void;
  bedtimeReminderEnabled: boolean;
  onSetBedtimeReminderEnabled: (enabled: boolean) => void;
}

const DAYS_OF_WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function DailyChecklist({
  notes,
  checkedTasksByDay,
  onToggleTask,
  starsCount,
  onAddStars,
  streakCount,
  practiceMinutes,
  onAddMinutes,
  onSetMinutes,
  bedtimeReminderTime,
  onSetBedtimeReminder,
  bedtimeReminderEnabled,
  onSetBedtimeReminderEnabled
}: DailyChecklistProps) {
  const [selectedDay, setSelectedDay] = useState<string>("Mon");
  const [anchorDate, setAnchorDate] = useState<Date>(() => new Date());
  const [activeDate, setActiveDate] = useState<Date>(() => new Date());
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Dynamic dates calculator: 7 days before anchorDate, up to anchorDate (total 8 days)
  const getWeekDays = () => {
    const todayStrList = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const list = [];
    for (let i = 0; i < 8; i++) {
      const d = new Date(anchorDate);
      d.setDate(anchorDate.getDate() - (7 - i));
      const dayName = todayStrList[d.getDay()];
      const isRealToday = new Date().getDate() === d.getDate() && new Date().getMonth() === d.getMonth() && new Date().getFullYear() === d.getFullYear();
      list.push({
        dayName,
        dayNumber: d.getDate(),
        monthName: d.toLocaleString("default", { month: "short" }),
        fullDateString: d.toLocaleDateString("default", { weekday: "long", month: "short", day: "numeric", year: "numeric" }),
        isToday: isRealToday,
        dateObject: d
      });
    }
    return list;
  };

  const weekDays = getWeekDays();
  const formattedHeadingDate = activeDate.toLocaleDateString("default", { weekday: "long", month: "short", day: "numeric", year: "numeric" });

  // Check if a theory item is visible on the current chosen day (non-repeating homework logic)
  const isTheoryVisibleOnDay = (theoryId: string, day: string) => {
    const checkedDaysWithThisTask = DAYS_OF_WEEK.filter(d => 
      checkedTasksByDay[d]?.includes(theoryId)
    );
    if (checkedDaysWithThisTask.length === 0) {
      return true; // visible everywhere until done
    }
    return checkedDaysWithThisTask.includes(day); // once checked, only visible on the day it was checked
  };

  const visibleTheoryItems = (notes.theory || []).filter(item => isTheoryVisibleOnDay(item.id, selectedDay));
  const totalTasksToday = (notes.pieces?.length || 0) + (notes.technique?.length || 0) + visibleTheoryItems.length;

  // Set selectedDay to current real day on mount if it's one of Mon-Sun
  useEffect(() => {
    const todayName = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][new Date().getDay()];
    if (todayName && todayName !== "Sun") {
      setSelectedDay(todayName);
    } else if (todayName === "Sun") {
      setSelectedDay("Sun");
    }
  }, []);

  // Confetti notes emitter state
  const [floatingNotes, setFloatingNotes] = useState<{ id: number; left: number; top: number; char: string }[]>([]);
  const noteIdCounter = useRef(0);

  // Notification states
  const [notificationSupported, setNotificationSupported] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>("default");
  const [simulationActive, setSimulationActive] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setNotificationSupported(true);
      setNotificationPermission(Notification.permission);
    }
  }, []);

  // Timer loop logic
  useEffect(() => {
    if (isTimerRunning) {
      timerRef.current = setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev >= 59) {
            onAddMinutes(1);
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerRunning]);

  const requestNotificationPermission = async () => {
    if (!notificationSupported) return;
    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
    } catch (err) {
      console.warn("Failed requesting notification permissions:", err);
    }
  };

  const triggerBedtimePushNow = () => {
    // Collect incomplete tasks for selectedDay
    const dayCompletedIds = checkedTasksByDay[selectedDay] || [];
    const incompleteCount = totalTasksToday - dayCompletedIds.length;

    setSimulationActive(true);
    setTimeout(() => setSimulationActive(false), 5000);

    if (incompleteCount > 0) {
      const message = `🎹 Reminder: You still have ${incompleteCount} practice exercises to complete before bedtime! Don't lose your ${streakCount}-day streak! 🌟`;
      if (notificationSupported && Notification.permission === "granted") {
        new Notification("Bedtime Piano Practice Reminder", {
          body: message,
          icon: "/favicon.ico",
          tag: "bedtime-reminder",
          requireInteraction: true
        });
      } else {
        // App inner notification alert
        alert(message);
      }
    } else {
      const message = `🎉 Awesome job! You've completed all your custom practice goals for today! Rest up so you print beautiful melodies tomorrow! 💤`;
      if (notificationSupported && Notification.permission === "granted") {
        new Notification("Piano Practice Complete!", {
          body: message,
          icon: "/favicon.ico"
        });
      } else {
        alert(message);
      }
    }
  };

  // Click handler that toggles and emits floating music note confetti
  const handleCheckboxClick = (taskId: string, day: string, e: React.MouseEvent<HTMLButtonElement>) => {
    const isCompleted = checkedTasksByDay[day]?.includes(taskId);
    onToggleTask(day, taskId);

    if (isCompleted) {
      // Deduct 10 stars on uncheck
      onAddStars(-10);
    } else {
      // Award 10 stars on check off
      onAddStars(10);

      // Create confetti floating note effect
      const rect = e.currentTarget.getBoundingClientRect();
      const notesSymbols = ["♫", "♪", "♬", "♩", "𝆕", "⭐", "🎵"];
      const newFloatingNotes = Array.from({ length: 7 }).map((_, idx) => {
        noteIdCounter.current += 1;
        return {
          id: noteIdCounter.current,
          left: rect.left + window.scrollX + rect.width / 2 + (Math.random() * 60 - 30),
          top: rect.top + window.scrollY - 10 - (Math.random() * 20),
          char: notesSymbols[Math.floor(Math.random() * notesSymbols.length)]
        };
      });

      setFloatingNotes((prev) => [...prev, ...newFloatingNotes]);

      // Trigger automatic cleanup after animations end (1.5 seconds)
      setTimeout(() => {
        setFloatingNotes((prev) => prev.slice(newFloatingNotes.length));
      }, 1500);
    }
  };

  // Calculated Day Completions
  const currentDayChecks = checkedTasksByDay[selectedDay] || [];
  const dayIs100Percent = totalTasksToday > 0 && currentDayChecks.length === totalTasksToday;

  return (
    <div id="daily-checklist-screen" className="space-y-6">
      {/* Dynamic Floating Notes Portal */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-50">
        <AnimatePresence>
          {floatingNotes.map((nt) => (
            <motion.span
              key={nt.id}
              initial={{ opacity: 1, scale: 0.6, y: 0, x: 0 }}
              animate={{ 
                opacity: 0, 
                scale: 1.8, 
                y: -120, 
                x: (Math.random() * 80 - 40),
                rotate: Math.random() * 90 - 45 
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              style={{
                position: "absolute",
                left: nt.left,
                top: nt.top,
                color: "#1c852c",
                fontSize: "24px",
                fontWeight: "bold",
                textShadow: "0 2px 4px rgba(0,0,0,0.15)"
              }}
            >
              {nt.char}
            </motion.span>
          ))}
        </AnimatePresence>
      </div>

      {/* Premium Header displaying Selected Date & Progress Metrics */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 pb-1">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight font-display">Daily Practice Checklist</h2>
          <p className="text-slate-500 font-semibold mt-0.5 text-sm">{formattedHeadingDate}</p>
        </div>
        <div className="bg-white/90 backdrop-blur px-4 py-2 rounded-2xl shadow-sm border border-slate-150/80 text-center shrink-0 min-w-[120px]">
          <p className="text-xl font-black text-primary leading-none">
            {currentDayChecks.length} / {totalTasksToday}
          </p>
          <p className="text-[9px] uppercase font-extrabold text-slate-400 tracking-wider mt-1">Exercises Completed</p>
        </div>
      </div>

      {/* Dynamic Interactive Days Checklist Calendar */}
      <div className="bg-white/80 backdrop-blur-md rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <span className="text-xs font-label-caps tracking-widest text-slate-500 uppercase font-black">
            Dynamic Practice Calendar
          </span>
          {/* Full Calendar Picker with calendar icon */}
          <div className="relative group" title="Select Date from Calendar">
            <button className="cursor-pointer p-2 rounded-xl bg-slate-50 hover:bg-primary text-slate-600 hover:text-white transition-all border border-slate-200 hover:border-primary shadow-sm flex items-center justify-center">
              <Calendar className="w-4 h-4 shrink-0" />
            </button>
            <input 
              type="date"
              value={activeDate.toISOString().split('T')[0]}
              id="full-calendar-picker-input"
              onChange={(e) => {
                if (!e.target.value) return;
                const [year, month, day] = e.target.value.split("-").map(Number);
                const picked = new Date(year, month - 1, day);
                setAnchorDate(picked);
                setActiveDate(picked);
                
                const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
                const pickedDayName = dayNames[picked.getDay()];
                setSelectedDay(pickedDayName);
              }}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
          </div>
        </div>

        <div id="days-strip" className="flex justify-between md:justify-around gap-2 overflow-x-auto pb-1 no-scrollbar">
          {weekDays.map((wd, idx) => {
            const isSelected = activeDate.getDate() === wd.dateObject.getDate() && 
                               activeDate.getMonth() === wd.dateObject.getMonth() && 
                               activeDate.getFullYear() === wd.dateObject.getFullYear();
            const checks = checkedTasksByDay[wd.dayName] || [];
            const theoryVisibleOnThatDay = (notes.theory || []).filter(item => isTheoryVisibleOnDay(item.id, wd.dayName));
            const totalTasksOnThatDay = (notes.pieces?.length || 0) + (notes.technique?.length || 0) + theoryVisibleOnThatDay.length;
            const isCompleted = totalTasksOnThatDay > 0 && checks.length === totalTasksOnThatDay;
            
            return (
              <button
                key={`${wd.dayName}-${idx}`}
                id={`day-btn-${wd.dayName.toLowerCase()}`}
                onClick={() => {
                  setSelectedDay(wd.dayName);
                  setActiveDate(wd.dateObject);
                }}
                className={`cursor-pointer flex flex-col items-center min-w-[52px] p-2 rounded-2xl transition-all duration-200 shadow-sm relative ${
                  isSelected 
                    ? "bg-primary text-white scale-105 shadow-md font-bold" 
                    : isCompleted
                      ? "bg-emerald-500 text-white border border-emerald-400/20"
                      : wd.isToday
                        ? "bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold"
                        : "bg-slate-50 hover:bg-slate-100 text-slate-600 font-medium"
                }`}
              >
                <span className="text-[9px] font-bold uppercase tracking-wider opacity-90">{wd.dayName}</span>
                <span className="text-base font-black mt-0.5">{wd.dayNumber}</span>
                
                {/* Visual completion dot */}
                {checks.length > 0 && !isSelected && (
                  <span className={`absolute -bottom-1 w-2.5 h-2.5 rounded-full border-2 border-white ${isCompleted ? 'bg-emerald-500' : 'bg-primary'}`} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Streak & Timer Widgets Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Streak card */}
        <div className="bg-amber-50 text-amber-950 p-4 rounded-2xl flex items-center justify-between shadow-sm border border-amber-200/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-200/50 rounded-full flex items-center justify-center">
              <Flame className="w-5 h-5 text-amber-700 font-bold" style={{ fill: "#b45309" }} />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block">Streak Score</span>
              <span className="text-base font-black tracking-tight">{streakCount} DAY STREAK</span>
            </div>
          </div>
          <span className="text-2xl font-bold bg-amber-100 px-2.5 py-1 rounded-xl shadow-inner select-none">🔥</span>
        </div>

        {/* Dynamic Timer card with Manual Time Modifiers */}
        <div className="bg-white rounded-2xl p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between shadow-sm border border-slate-100 gap-3">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 bg-primary/10 rounded-full flex items-center justify-center ${isTimerRunning ? 'animate-bounce' : ''}`}>
              <Clock className="w-5 h-5 text-primary" />
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">Practice Time</span>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-black text-slate-800">
                  {practiceMinutes} MINS
                </span>
                {isTimerRunning && (
                  <span className="text-xs font-extrabold text-indigo-500 font-mono bg-indigo-50 px-1.5 py-0.5 rounded-md animate-pulse shrink-0">
                    {String(Math.floor(timerSeconds / 60)).padStart(2, '0')}:{String(timerSeconds % 60).padStart(2, '0')}s
                  </span>
                )}
              </div>
              
              {/* Keyboard time modifier row */}
              <div className="flex items-center gap-1.5 pt-0.5">
                <button 
                  onClick={() => onAddMinutes(-5)}
                  disabled={practiceMinutes < 5}
                  className="px-2 py-1 bg-slate-100 disabled:opacity-40 hover:bg-slate-200 text-[10px] font-extrabold rounded-lg select-none cursor-pointer transition-colors"
                  title="Subtract 5 minutes"
                >
                  -5m
                </button>
                <button 
                  onClick={() => onAddMinutes(-1)}
                  disabled={practiceMinutes < 1}
                  className="px-2 py-1 bg-slate-100 disabled:opacity-40 hover:bg-slate-200 text-[10px] font-extrabold rounded-lg select-none cursor-pointer transition-colors"
                  title="Subtract 1 minute"
                >
                  -1m
                </button>
                <input 
                  type="number"
                  min="0"
                  max="999"
                  value={practiceMinutes === 0 ? "" : practiceMinutes}
                  placeholder="0"
                  id="direct-practice-hours-input"
                  onChange={(e) => {
                    const parsed = parseInt(e.target.value, 10);
                    onSetMinutes(isNaN(parsed) ? 0 : Math.max(0, parsed));
                  }}
                  className="w-10 text-center bg-slate-50 border border-slate-200 text-[11px] font-black focus:outline-none focus:border-primary rounded-lg py-1 text-on-surface"
                  title="Type minutes directly"
                />
                <button 
                  onClick={() => onAddMinutes(1)}
                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-[10px] font-extrabold rounded-lg select-none cursor-pointer transition-colors"
                  title="Add 1 minute"
                >
                  +1m
                </button>
                <button 
                  onClick={() => onAddMinutes(5)}
                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-[10px] font-extrabold rounded-lg select-none cursor-pointer transition-colors"
                  title="Add 5 minutes"
                >
                  +5m
                </button>
              </div>
            </div>
          </div>
          
          <button
            id="toggle-practice-timer"
            onClick={() => {
              if (isTimerRunning) {
                // Reset seconds when stopping
                setTimerSeconds(0);
              }
              setIsTimerRunning(!isTimerRunning);
            }}
            className={`cursor-pointer min-w-[70px] h-10 px-3.5 rounded-xl flex items-center justify-center gap-1 transition-all ${
              isTimerRunning 
                ? "bg-red-500 hover:bg-red-650 text-white shadow-md shadow-red-200" 
                : "bg-primary hover:bg-indigo-650 text-white shadow-md shadow-indigo-100"
            }`}
            title={isTimerRunning ? "Pause practice timer" : "Start practices stopwatch"}
          >
            {isTimerRunning ? (
              <>
                <Pause className="w-4 h-4 fill-current mr-0.5" />
                <span className="text-xs font-extrabold">Stop</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current ml-0.5 mr-0.5" />
                <span className="text-xs font-extrabold">Start</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Checklist tasks structured by categories */}
      <div className="space-y-6">
        
        {/* Category standard: Current Pieces */}
        <section id="section-pieces" className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <div className="w-1.5 h-6 bg-primary rounded-full"></div>
            <Music className="w-5 h-5 text-primary" />
            <h2 className="font-headline-md text-headline-md text-on-surface">Current Pieces</h2>
            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold ml-auto">
              {(notes.pieces || []).length} songs
            </span>
          </div>

          <div className="grid gap-3">
            {notes.pieces?.map((piece) => {
              const isChecked = currentDayChecks.includes(piece.id);
              return (
                <div 
                  key={piece.id}
                  id={`card-piece-${piece.id}`}
                  className="group bg-white p-5 rounded-3xl shadow-sm border-b-4 border-slate-200 hover:border-primary hover:shadow transition-all flex items-center gap-4 relative overflow-hidden active:scale-[0.99]"
                >
                  {/* Music bar accent color */}
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary rounded-l-xl" />
                  
                  <div className="flex-grow pl-2">
                    <h3 className="font-body-lg text-body-lg text-primary font-extrabold">{piece.title}</h3>
                    <p className="text-on-surface-variant font-medium text-sm mt-0.5">{piece.goal}</p>
                  </div>

                  <button
                    id={`check-piece-${piece.id}`}
                    onClick={(e) => handleCheckboxClick(piece.id, selectedDay, e)}
                    className={`cursor-pointer w-11 h-11 rounded-full border-4 flex items-center justify-center transition-all duration-200 active:scale-90 ${
                      isChecked 
                        ? "bg-tertiary border-tertiary shadow-sm text-white" 
                        : "border-slate-200 hover:border-primary/50 bg-white"
                    }`}
                  >
                    <CheckCircle2 className={`w-6 h-6 ${isChecked ? 'text-white' : 'text-transparent'}`} />
                  </button>
                </div>
              );
            })}
            {(!notes.pieces || notes.pieces.length === 0) && (
              <p className="text-sm text-on-surface-variant/70 italic px-2">No active songs homework this week!</p>
            )}
          </div>
        </section>

        {/* Category standard: Technique */}
        <section id="section-technique" className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <div className="w-1.5 h-6 bg-secondary rounded-full"></div>
            <Sparkles className="w-5 h-5 text-secondary" style={{ fill: "#ebc23e" }} />
            <h2 className="font-headline-md text-headline-md text-on-surface">Technique</h2>
            <span className="text-xs bg-secondary-fixed text-on-secondary-fixed-variant px-2 py-0.5 rounded-full font-bold ml-auto">
              {(notes.technique || []).length} items
            </span>
          </div>

          <div className="grid gap-3">
            {notes.technique?.map((tech) => {
              const isChecked = currentDayChecks.includes(tech.id);
              return (
                <div 
                  key={tech.id}
                  id={`card-tech-${tech.id}`}
                  className="group bg-white p-5 rounded-3xl shadow-sm border-b-4 border-slate-200 hover:border-emerald-400 hover:shadow transition-all flex items-center gap-4 relative overflow-hidden active:scale-[0.99]"
                >
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-secondary rounded-l-xl" />
                  
                  <div className="flex-grow pl-2">
                    <h3 className="font-body-lg text-body-lg text-secondary font-extrabold">{tech.title}</h3>
                    <p className="text-on-surface-variant font-medium text-sm mt-0.5">{tech.goal}</p>
                  </div>

                  <button
                    id={`check-tech-${tech.id}`}
                    onClick={(e) => handleCheckboxClick(tech.id, selectedDay, e)}
                    className={`cursor-pointer w-11 h-11 rounded-full border-4 flex items-center justify-center transition-all duration-200 active:scale-90 ${
                      isChecked 
                        ? "bg-tertiary border-tertiary shadow-sm text-white" 
                        : "border-slate-200 hover:border-secondary/50 bg-white"
                    }`}
                  >
                    <CheckCircle2 className={`w-6 h-6 ${isChecked ? 'text-white' : 'text-transparent'}`} />
                  </button>
                </div>
              );
            })}
            {(!notes.technique || notes.technique.length === 0) && (
              <p className="text-sm text-on-surface-variant/70 italic px-2">No active scales/technical workout this week!</p>
            )}
          </div>
        </section>

        {/* Category standard: Theory */}
        <section id="section-theory" className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <div className="w-1.5 h-6 bg-tertiary rounded-full"></div>
            <BookMarked className="w-5 h-5 text-tertiary" />
            <h2 className="font-headline-md text-headline-md text-on-surface">Theory Homework</h2>
            <span className="text-xs bg-tertiary/10 text-tertiary px-2 py-0.5 rounded-full font-bold ml-auto">
              {visibleTheoryItems.length} homework
            </span>
          </div>

          <div className="grid gap-3">
            {visibleTheoryItems.map((theory) => {
              const isChecked = currentDayChecks.includes(theory.id);
              return (
                <div 
                  key={theory.id}
                  id={`card-theory-${theory.id}`}
                  className="group bg-white p-5 rounded-3xl shadow-sm border-b-4 border-slate-200 hover:border-amber-400 hover:shadow transition-all flex items-center gap-4 relative overflow-hidden active:scale-[0.99]"
                >
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-tertiary rounded-l-xl" />
                  
                  <div className="flex-grow pl-2">
                    <h3 className="font-body-lg text-body-lg text-tertiary font-extrabold">{theory.title}</h3>
                    <p className="text-on-surface-variant font-medium text-sm mt-0.5">{theory.goal}</p>
                  </div>

                  <button
                    id={`check-theory-${theory.id}`}
                    onClick={(e) => handleCheckboxClick(theory.id, selectedDay, e)}
                    className={`cursor-pointer w-11 h-11 rounded-full border-4 flex items-center justify-center transition-all duration-200 active:scale-90 ${
                      isChecked 
                        ? "bg-tertiary border-tertiary shadow-sm text-white" 
                        : "border-slate-200 hover:border-tertiary/50 bg-white"
                    }`}
                  >
                    <CheckCircle2 className={`w-6 h-6 ${isChecked ? 'text-white' : 'text-transparent'}`} />
                  </button>
                </div>
              );
            })}
            {visibleTheoryItems.length === 0 && (
              (!notes.theory || notes.theory.length === 0) ? (
                <p className="text-sm text-on-surface-variant/70 italic px-2">No homework assignments this week!</p>
              ) : (
                <div className="text-center py-6 bg-emerald-50/50 rounded-3xl border border-dashed border-emerald-200 p-4">
                  <span className="text-2xl block">🎉</span>
                  <p className="text-xs text-emerald-800 font-bold mt-1">Theory Homework Completed!</p>
                  <p className="text-[10px] text-emerald-600 font-medium mt-0.5">Checked off once and done for this week.</p>
                </div>
              )
            )}
          </div>
        </section>

      </div>

      {/* Bedtime Push Reminder Panel */}
      <div className="bg-gradient-to-tr from-slate-900 to-indigo-950 p-5 rounded-2xl text-white shadow-lg space-y-4 relative overflow-hidden">
        <div className="absolute right-[-20px] bottom-[-20px] opacity-[0.06] pointer-events-none">
          <Bell className="w-44 h-44 rotate-12" />
        </div>

        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-white/10 rounded-xl">
              <Bell className="w-5 h-5 text-amber-300" />
            </div>
            <div className="space-y-1">
              <h4 className="text-base font-bold font-headline-md text-amber-100">Incomplete Bedtime Reminder</h4>
              <p className="text-xs text-indigo-400 font-medium">
                Automatically check checklist at bedtime. If tasks are incomplete, we'll notify him!
              </p>
            </div>
          </div>
          
          <div className="shrink-0 flex flex-col items-end gap-1 select-none">
            <button
              onClick={() => onSetBedtimeReminderEnabled(!bedtimeReminderEnabled)}
              className={`cursor-pointer w-12 h-6.5 rounded-full p-0.5 transition-colors duration-200 outline-none flex items-center ${
                bedtimeReminderEnabled ? "bg-amber-400" : "bg-slate-700"
              }`}
              id="bedtime-reminder-toggle"
              type="button"
              title={bedtimeReminderEnabled ? "Disable Reminder" : "Enable Reminder"}
            >
              <div
                className={`w-5.5 h-5.5 rounded-full bg-white shadow-md transform transition-transform duration-200 ${
                  bedtimeReminderEnabled ? "translate-x-5.5" : "translate-x-0"
                }`}
              />
            </button>
            <span className="text-[9px] uppercase font-bold tracking-wider text-indigo-300">
              {bedtimeReminderEnabled ? "Enabled" : "Disabled"}
            </span>
          </div>
        </div>

        <div className={`flex flex-wrap items-center gap-3 pt-2 transition-opacity duration-200 ${bedtimeReminderEnabled ? "opacity-100" : "opacity-40 pointer-events-none"}`}>
          <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-xl border border-white/10">
            <span className="text-xs font-semibold">Reminder Time:</span>
            <input 
              type="time" 
              value={bedtimeReminderTime}
              id="bedtime-timer-input"
              onChange={(e) => onSetBedtimeReminder(e.target.value)}
              className="bg-transparent text-xs text-white outline-none border-none select-none font-bold"
              style={{ colorScheme: "dark" }}
            />
          </div>

          {notificationPermission !== "granted" && notificationSupported && (
            <button
              onClick={requestNotificationPermission}
              className="cursor-pointer bg-amber-400 hover:bg-amber-500 text-indigo-950 text-xs font-extrabold px-3.5 py-1.5 rounded-xl transition-all"
            >
              Enable Push Notifications
            </button>
          )}
        </div>

        {simulationActive && bedtimeReminderEnabled && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[11px] bg-indigo-900/50 border border-indigo-400/20 rounded-xl p-2.5 text-center font-medium"
          >
            🔔 Sending desktop push notification. If blocked/denied, see simulated browser alert popup!
          </motion.div>
        )}
      </div>

      {/* Motivational / Incentive Artwork Box */}
      <div className="p-5 bg-gradient-to-br from-primary/5 to-indigo-500/5 rounded-2xl border-2 border-dashed border-primary/15 flex flex-col items-center text-center space-y-3 relative">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          <Award className="w-9 h-9 text-primary" />
        </div>
        <div>
          <h4 className="font-extrabold text-primary text-base font-headline-md">
            {dayIs100Percent ? "Daily Checklist Complete! 🎉" : "You're doing great! ⭐"}
          </h4>
          <p id="badge-guide-paragraph" className="font-body-md text-on-surface-variant text-sm mt-1 max-w-sm">
            {dayIs100Percent 
              ? "Wonderful job packing the piano board! You earned a major badges today. Go check your Weekly Summary!"
              : "Finish today's checklist to earn a new badge and unlock additional piano keys!"}
          </p>
        </div>

        {dayIs100Percent && (
          <motion.div
            initial={{ scale: 0.8, rotate: -10 }}
            animate={{ scale: 1.1, rotate: 0 }}
            className="bg-tertiary text-white px-4 py-1.5 rounded-full text-xs font-extrabold flex items-center gap-1 shadow-md"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Badge Earned: Melody Maestro! 🏆</span>
          </motion.div>
        )}
      </div>
    </div>
  );
}
