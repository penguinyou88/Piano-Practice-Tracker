import { useState, useEffect } from "react";
import { 
  Music, 
  Calendar, 
  Star, 
  BookOpen, 
  Smartphone, 
  FileEdit,
  User,
  Heart,
  Settings,
  Flame,
  Award
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { INITIAL_WEEKS, INITIAL_CHECKED_STATE } from "./data/initialData";
import { WeekData, WeeklyNotes } from "./types";
import DailyChecklist from "./components/DailyChecklist";
import WeeklySummary from "./components/WeeklySummary";
import TeacherNotesPanel from "./components/TeacherNotesPanel";

export default function App() {
  const [activeTab, setActiveTab] = useState<"daily" | "summary" | "notes">("daily");
  const [selectedWeekId, setSelectedWeekId] = useState<string>("this-week");
  const [transitionType, setTransitionType] = useState<"none" | "push">("none");

  // Load state from local storage or defaults
  const [weeks, setWeeks] = useState<WeekData[]>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("piano_practice_weeks");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          // Purge mock history "last-week", "oct-2-oct-8", "sept-25-oct-1"
          const purged = parsed.filter((wk: WeekData) => wk.id === "this-week");
          if (purged.length > 0) return purged;
        } catch (e) {
          console.error(e);
        }
      }
    }
    return INITIAL_WEEKS;
  });

  const [checkedTasks, setCheckedTasks] = useState<{ [weekId: string]: { [dayName: string]: string[] } }>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("piano_practice_checked");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          const cleaned: typeof parsed = {};
          if (parsed["this-week"]) {
            cleaned["this-week"] = parsed["this-week"];
          }
          return cleaned;
        } catch (e) {
          console.error(e);
        }
      }
    }
    return INITIAL_CHECKED_STATE;
  });

  // Calculate starsCount dynamically based on completed checklist items: each completed item is worth 10 stars.
  const currentWeekChecked = checkedTasks[selectedWeekId] || {};
  const totalChecks = Object.keys(currentWeekChecked).reduce(
    (total, dayName) => total + (currentWeekChecked[dayName] || []).length,
    0
  );
  const starsCount = totalChecks * 10;

  const [streakCount, setStreakCount] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("piano_practice_streak");
      return stored ? parseInt(stored, 10) : 0;
    }
    return 0;
  });

  const [practiceMinutes, setPracticeMinutes] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("piano_practice_minutes");
      return stored ? parseInt(stored, 10) : 0;
    }
    return 0;
  });

  const [bedtimeReminderTime, setBedtimeReminderTime] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("piano_practice_bedtime");
      return stored || "20:30";
    }
    return "20:30";
  });

  const [bedtimeReminderEnabled, setBedtimeReminderEnabled] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("piano_practice_bedtime_enabled");
      return stored === "false" ? false : true;
    }
    return true;
  });

  // Recompute compliance rate for the week dynamically
  const getRecomputedWeeks = (
    weekId: string,
    currentWeeksList: WeekData[],
    currentCheckedStateList: typeof checkedTasks
  ): WeekData[] => {
    return currentWeeksList.map((wk) => {
      if (wk.id === weekId) {
        const dailyCount = (wk.notes.pieces?.length || 0) + (wk.notes.technique?.length || 0);
        const theoryCount = (wk.notes.theory?.length || 0);
        const totalPossibleChecks = (dailyCount * 7) + (theoryCount * 1);
        
        const weekState = currentCheckedStateList[weekId] || {};
        let dailyChecksCount = 0;
        const completedTheoryIds = new Set<string>();

        const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
        days.forEach((d) => {
          const dayCheckedIds = weekState[d] || [];
          dayCheckedIds.forEach((id) => {
            const isTheory = wk.notes.theory?.some((th) => th.id === id);
            if (isTheory) {
              completedTheoryIds.add(id);
            } else {
              dailyChecksCount += 1;
            }
          });
        });

        const allChecksInWeekCount = dailyChecksCount + completedTheoryIds.size;
        const compPercent = totalPossibleChecks > 0 
          ? Math.min(100, Math.round((allChecksInWeekCount / totalPossibleChecks) * 100))
          : 0;

        return { ...wk, percentage: compPercent };
      }
      return wk;
    });
  };

  const handleAddManualTask = (category: "pieces" | "technique" | "theory", title: string, goal: string) => {
    const newId = `${category}-${Date.now()}`;
    const updatedWeeks = weeks.map((wk) => {
      if (wk.id === selectedWeekId) {
        const categoryItems = wk.notes[category] || [];
        return {
          ...wk,
          notes: {
            ...wk.notes,
            [category]: [
              ...categoryItems,
              { id: newId, title, goal }
            ]
          }
        };
      }
      return wk;
    });

    const finalWeeks = getRecomputedWeeks(selectedWeekId, updatedWeeks, checkedTasks);
    setWeeks(finalWeeks);
  };

  const handleRemoveManualTask = (category: "pieces" | "technique" | "theory", id: string) => {
    const updatedWeeks = weeks.map((wk) => {
      if (wk.id === selectedWeekId) {
        const categoryItems = wk.notes[category] || [];
        return {
          ...wk,
          notes: {
            ...wk.notes,
            [category]: categoryItems.filter((item) => item.id !== id)
          }
        };
      }
      return wk;
    });

    // Also remove from checked status across all days
    const weekState = checkedTasks[selectedWeekId] || {};
    const newWeekState = { ...weekState };
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    days.forEach((d) => {
      if (newWeekState[d]) {
        newWeekState[d] = newWeekState[d].filter((taskId) => taskId !== id);
      }
    });
    
    const updatedCheckedStatus = {
      ...checkedTasks,
      [selectedWeekId]: newWeekState
    };

    setCheckedTasks(updatedCheckedStatus);
    const finalWeeks = getRecomputedWeeks(selectedWeekId, updatedWeeks, updatedCheckedStatus);
    setWeeks(finalWeeks);
  };

  // Sync to database/localStorage
  useEffect(() => {
    localStorage.setItem("piano_practice_weeks", JSON.stringify(weeks));
  }, [weeks]);

  useEffect(() => {
    localStorage.setItem("piano_practice_checked", JSON.stringify(checkedTasks));
  }, [checkedTasks]);

  useEffect(() => {
    localStorage.setItem("piano_practice_stars", starsCount.toString());
  }, [starsCount]);

  useEffect(() => {
    localStorage.setItem("piano_practice_streak", streakCount.toString());
  }, [streakCount]);

  useEffect(() => {
    localStorage.setItem("piano_practice_minutes", practiceMinutes.toString());
  }, [practiceMinutes]);

  useEffect(() => {
    localStorage.setItem("piano_practice_bedtime", bedtimeReminderTime);
  }, [bedtimeReminderTime]);

  useEffect(() => {
    localStorage.setItem("piano_practice_bedtime_enabled", bedtimeReminderEnabled.toString());
  }, [bedtimeReminderEnabled]);

  const handleToggleTask = (dayName: string, taskId: string) => {
    setCheckedTasks((prev) => {
      const weekState = prev[selectedWeekId] || {};
      const dayTasks = weekState[dayName] || [];
      
      const newDayTasks = dayTasks.includes(taskId)
        ? dayTasks.filter((id) => id !== taskId)
        : [...dayTasks, taskId];

      const newWeekState = { ...weekState, [dayName]: newDayTasks };
      const nextChecked = { ...prev, [selectedWeekId]: newWeekState };

      // Dynamically calculate approximate overall progression percentage for this week
      const currentWeek = weeks.find((w) => w.id === selectedWeekId);
      if (currentWeek) {
        const dailyCount = (currentWeek.notes.pieces?.length || 0) + (currentWeek.notes.technique?.length || 0);
        const theoryCount = (currentWeek.notes.theory?.length || 0);
        const totalPossibleChecks = (dailyCount * 7) + (theoryCount * 1);
        
        let dailyChecksCount = 0;
        const completedTheoryIds = new Set<string>();
        const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
        days.forEach((d) => {
          const dayCheckedIds = newWeekState[d] || [];
          dayCheckedIds.forEach((id) => {
            const isTheory = currentWeek.notes.theory?.some((th) => th.id === id);
            if (isTheory) {
              completedTheoryIds.add(id);
            } else {
              dailyChecksCount += 1;
            }
          });
        });

        const allChecksInWeekCount = dailyChecksCount + completedTheoryIds.size;
        const compPercent = totalPossibleChecks > 0 
          ? Math.min(100, Math.round((allChecksInWeekCount / totalPossibleChecks) * 100))
          : 0;

        setWeeks((prevWeeks) =>
          prevWeeks.map((wk) =>
            wk.id === selectedWeekId ? { ...wk, percentage: compPercent } : wk
          )
        );
      }

      return nextChecked;
    });
  };

  // Callback when Gemini returns structured notes
  const handleNotesGenerated = (newNotes: WeeklyNotes) => {
    setWeeks((prev) => {
      // Find out if 'this-week' already exists, override its notes
      return prev.map((wk) => {
        if (wk.id === "this-week") {
          return {
            ...wk,
            notes: newNotes,
            percentage: 0 // Reset completions on note reload
          };
        }
        return wk;
      });
    });

    // Reset current checked items for 'this-week' to enable clean weekly checking slate
    setCheckedTasks((prev) => ({
      ...prev,
      "this-week": {
        "Mon": [], "Tue": [], "Wed": [], "Thu": [], "Fri": [], "Sat": [], "Sun": []
      }
    }));

    setSelectedWeekId("this-week");
    setActiveTab("daily");
  };

  const currentWeekData = weeks.find((w) => w.id === selectedWeekId) || weeks[0];

  // Specific transition wrapper calculation
  const getMotionProps = () => {
    if (transitionType === "push") {
      return {
        initial: { opacity: 0, x: 100 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -100 },
        transition: { type: "spring", stiffness: 220, damping: 25 }
      };
    }
    // "none" or default fade values matching spec instructions
    return {
      initial: { opacity: 0, y: 5 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0 },
      transition: { duration: 0.15 }
    };
  };

  return (
    <div className="bg-background font-sans min-h-screen pb-32 overflow-x-hidden relative">
      
      {/* Visual Ambient Key Background watermarks to fit the "Tactile & Music Accent" mood */}
      <div className="absolute top-10 left-[-40px] text-primary/5 pointer-events-none -rotate-12 z-0">
        <Music className="w-56 h-56" />
      </div>
      <div className="absolute bottom-20 right-[-30px] text-tertiary/5 pointer-events-none rotate-12 z-0">
        <Award className="w-44 h-44" />
      </div>

      {/* TopAppBar Navigation standard */}
      <header className="w-full sticky top-0 bg-white/95 backdrop-blur-md border-b border-slate-150 z-40 shadow-sm">
        <div className="flex justify-between items-center px-4 md:px-8 py-3.5 w-full max-w-5xl mx-auto">
          <div className="flex items-center gap-3">
            {/* Soft, clay style Boy headphones illustration mock */}
            <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center overflow-hidden border-2 border-primary shadow-sm hover:scale-105 duration-200">
              <img 
                alt="Kid avatar with headphones" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDIYTBVWv1_jEfmG6K1ytUoLuSLXfrlmKCWqJ417wQAuyelQZV7dphNDiHFHd3uP17ib35CXxNwtBd91r9EzYbwTLFX-QEyr3F8WM8jGVZbDTGZS9PKyopEZL_2xtty4t1jrVLJaLUGO0tibq71Acraxg3wA5bUAmdcwno7hKhV1uSJCC4tFdE1ZFnDktwOEvEBlHQR8BZy_wxomInM4_ZNB9AzoaE4uxdhckqxkzFT3BH-iHKJWcKcvqANZy_rWNmGuzWTpgfj1tg" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            
            <div className="space-y-0.5">
              <h1 className="font-display font-extrabold text-base md:text-xl text-primary leading-tight">
                Piano Practice Tracker for Kai
              </h1>
              {selectedWeekId !== "this-week" && (
                <div className="flex items-center gap-1 text-[10px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full font-bold">
                  <span>Viewing historical: {currentWeekData.label}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Stars Score point box */}
            <div 
              className="flex items-center gap-1.5 bg-amber-50 text-amber-950 shadow-sm px-3.5 py-1.5 rounded-full border border-amber-200/50"
              title="Your Practice Stars! Earn 10 stars for every exercise you complete!"
            >
              <Star className="w-5 h-5 text-amber-500 fill-current animate-bounce" />
              <span className="font-display font-extrabold text-lg text-amber-950">
                {starsCount}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Core Router View Panel Container */}
      <main className="relative z-10 px-4 md:px-6 py-6 w-full max-w-2xl mx-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${activeTab}-${selectedWeekId}`}
            {...getMotionProps()}
          >
            {activeTab === "daily" && (
              <DailyChecklist
                notes={currentWeekData.notes}
                checkedTasksByDay={checkedTasks[selectedWeekId] || {}}
                onToggleTask={handleToggleTask}
                starsCount={starsCount}
                onAddStars={() => {}}
                streakCount={streakCount}
                practiceMinutes={practiceMinutes}
                onAddMinutes={(amt) => setPracticeMinutes((prev) => Math.max(0, prev + amt))}
                onSetMinutes={(mins) => setPracticeMinutes(mins)}
                bedtimeReminderTime={bedtimeReminderTime}
                onSetBedtimeReminder={setBedtimeReminderTime}
                bedtimeReminderEnabled={bedtimeReminderEnabled}
                onSetBedtimeReminderEnabled={setBedtimeReminderEnabled}
              />
            )}

            {activeTab === "summary" && (
              <WeeklySummary
                weeks={weeks}
                selectedWeekId={selectedWeekId}
                onSelectWeek={(weekId) => {
                  setSelectedWeekId(weekId);
                  // Setup clean slide-in push transition state
                  setTransitionType("push");
                }}
                checkedTasksByDay={checkedTasks[selectedWeekId] || {}}
                onNavigateToDaily={() => {
                  setActiveTab("daily");
                  // Reset back to fade or other transition types after loading week
                  setTimeout(() => setTransitionType("none"), 800);
                }}
              />
            )}

            {activeTab === "notes" && (
              <TeacherNotesPanel
                onNotesGenerated={handleNotesGenerated}
                currentNotes={currentWeekData.notes}
                onAddManualTask={handleAddManualTask}
                onRemoveManualTask={handleRemoveManualTask}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Navigation Ribbon matching the exact spec anchors xpath:
          `//span[text()='Summary']/parent::a` and similar */}
      <nav 
        id="bottom-app-navigator"
        className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 py-3 bg-white/95 backdrop-blur-md border-t border-slate-155 shadow-lg rounded-t-2xl max-w-md mx-auto right-0"
      >
        {/* Daily Checklist Screen Link */}
        <a 
          onClick={() => {
            setTransitionType("none");
            setActiveTab("daily");
          }}
          className={`flex flex-col items-center justify-center cursor-pointer transition-all duration-200 py-1 px-4 rounded-xl ${
            activeTab === "daily" 
              ? "bg-primary text-white font-bold px-5 scale-105" 
              : "text-on-surface-variant hover:bg-slate-100"
          }`}
        >
          <Calendar className="w-5 h-5 mb-0.5" />
          <span className="text-[11px] uppercase tracking-wider font-label-caps font-bold">Daily</span>
        </a>

        {/* Weekly Summary Screen Link */}
        <a 
          onClick={() => {
            setTransitionType("none");
            setActiveTab("summary");
          }}
          className={`flex flex-col items-center justify-center cursor-pointer transition-all duration-200 py-1 px-4 rounded-xl ${
            activeTab === "summary" 
              ? "bg-primary text-white font-bold px-5 scale-105" 
              : "text-on-surface-variant hover:bg-slate-100"
          }`}
        >
          <Flame className="w-5 h-5 mb-0.5" />
          <span className="text-[11px] uppercase tracking-wider font-label-caps font-bold">Summary</span>
        </a>

        {/* Notes (Teacher Notes Panel) Config Link */}
        <a 
          onClick={() => {
            setTransitionType("none");
            setActiveTab("notes");
          }}
          className={`flex flex-col items-center justify-center cursor-pointer transition-all duration-200 py-1 px-4 rounded-xl ${
            activeTab === "notes" 
              ? "bg-primary text-white font-bold px-5 scale-105" 
              : "text-on-surface-variant hover:bg-slate-100"
          }`}
        >
          <FileEdit className="w-5 h-5 mb-0.5" />
          <span className="text-[11px] uppercase tracking-wider font-label-caps font-bold">Notes</span>
        </a>
      </nav>

    </div>
  );
}
