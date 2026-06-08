import React, { useState } from "react";
import { 
  Trophy, 
  MessageSquare, 
  ChevronRight, 
  Sparkles, 
  ArrowLeft,
  Music,
  Heart,
  Undo2
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from "recharts";
import { WeekData, WeeklyNotes } from "../types";

interface WeeklySummaryProps {
  weeks: WeekData[];
  selectedWeekId: string;
  onSelectWeek: (weekId: string) => void;
  checkedTasksByDay: { [dayName: string]: string[] };
  onNavigateToDaily: () => void;
}

export default function WeeklySummary({
  weeks,
  selectedWeekId,
  onSelectWeek,
  checkedTasksByDay,
  onNavigateToDaily
}: WeeklySummaryProps) {
  const currentWeek = weeks.find((w) => w.id === selectedWeekId) || weeks[0];
  const { notes, label } = currentWeek;

  // Calculate practice counts for current week
  // Aggregated over Mon-Sun
  const categoriesCount = {
    pieces: 0,
    technique: 0,
    theory: 0
  };

  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  
  dayNames.forEach((day) => {
    const checkedIds = checkedTasksByDay[day] || [];
    checkedIds.forEach((id) => {
      if (notes.pieces.some((p) => p.id === id)) {
        categoriesCount.pieces += 1;
      } else if (notes.technique.some((t) => t.id === id)) {
        categoriesCount.technique += 1;
      } else if (notes.theory.some((th) => th.id === id)) {
        categoriesCount.theory += 1;
      }
    });
  });

  // Prepare chart data format for Recharts
  const chartData = [
    {
      name: "PIECES",
      count: categoriesCount.pieces,
      color: "#004ddb" // primary blue
    },
    {
      name: "TECHNIQUE",
      count: categoriesCount.technique,
      color: "#735c00" // secondary dark gold
    },
    {
      name: "THEORY",
      count: categoriesCount.theory,
      color: "#006a1b" // friendly green
    }
  ];

  // Reply message feature for Mrs. Henderson's note card
  const [replyText, setReplyText] = useState("");
  const [replySent, setReplySent] = useState(false);
  const [showReplyField, setShowReplyField] = useState(false);

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    setReplySent(true);
    setReplyText("");
    setTimeout(() => {
      setReplySent(false);
      setShowReplyField(false);
    }, 3000);
  };

  const handleHistoricClick = (weekId: string) => {
    onSelectWeek(weekId);
    onNavigateToDaily(); // Navigate with transition
  };

  // Determine practiced days in current selected week
  let practicedDaysCount = 0;
  dayNames.forEach((day) => {
    if ((checkedTasksByDay[day] || []).length > 0) {
      practicedDaysCount += 1;
    }
  });

  return (
    <div id="weekly-summary-screen" className="space-y-6">
      
      {/* Streak Indicator / Hero accomplishment Card */}
      <section className="bg-white rounded-3xl p-6 shadow-sm border-b-4 border-slate-200 relative overflow-hidden">
        {/* Yellow spotlight overlay */}
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-yellow-400/5 rotate-12 rounded-full blur-xl pointer-events-none" />
        
        <div className="relative z-10 flex items-center justify-between gap-4">
          <div className="space-y-2">
            <span className="text-[10px] font-label-caps tracking-wider text-secondary bg-secondary-fixed px-3 py-1 rounded-full font-bold">
              {practicedDaysCount >= 5 ? "🌟 HIGH MILESTONE!" : "PRACTICE IN PROGRESS"}
            </span>
            <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface font-extrabold">
              {practicedDaysCount === 0 
                ? "Start practicing to earn badges!" 
                : `You've practiced ${practicedDaysCount} days this week!`}
            </h2>
            <p className="text-on-surface-variant font-medium text-sm">
              {practicedDaysCount >= 6 
                ? "Incredible job! Weekly goal of 6 days achieved! 🏆"
                : `Keep playing to reach your weekly goal of 6 days.`}
            </p>
          </div>

          <div className="bg-secondary-container w-16 h-16 rounded-2xl flex items-center justify-center shadow-md shrink-0 border border-yellow-300">
            <Trophy className="w-10 h-10 text-on-secondary-container" />
          </div>
        </div>
      </section>

      {/* Grid: Stats and Teacher Notes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Progress Chart Card */}
        <section id="distribution-chart-card" className="md:col-span-2 bg-white rounded-3xl p-6 shadow-sm border-b-4 border-slate-200 flex flex-col justify-between hover:border-primary transition-all">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-headline-md text-headline-md text-on-surface font-extrabold text-slate-900">Skill Distribution</h3>
              <span className="text-[11px] font-label-caps tracking-widest text-on-surface-variant/80 uppercase font-extrabold">
                {label === "This Week" ? "CURRENT SECTOR" : label.toUpperCase()}
              </span>
            </div>
            
            {/* Recharts responsive bar graph */}
            <div className="h-44 w-full pr-4 text-xs font-semibold">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <XAxis 
                    dataKey="name" 
                    tick={{ fill: "#434655", fontSize: 10, fontWeight: "bold" }} 
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis 
                    allowDecimals={false}
                    tick={{ fill: "#737687", fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip 
                    cursor={{ fill: "rgba(0,0,0,0.02)" }}
                    contentStyle={{ borderRadius: "8px", border: "1px solid #eceef1" }}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]} barSize={40}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-4 p-3.5 bg-slate-50 rounded-xl border border-slate-100/60">
            <p id="motivational-mentor-quote" className="text-sm text-on-surface-variant font-medium text-center italic">
              "{notes.summaryQuote || 'Every note brings you closer to harmony. Complete daily tasks to fill out your charts!'}"
            </p>
          </div>
        </section>

        {/* Teacher's Note Card */}
        <section className="bg-indigo-900 px-6 py-6 rounded-[2.5rem] shadow-xl text-white flex flex-col justify-between relative overflow-hidden border border-indigo-950">
          <div className="absolute right-[-10px] bottom-[-10px] opacity-[0.06] pointer-events-none">
            <Music className="w-36 h-36" />
          </div>

          <div className="relative z-10 space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-white/20 rounded-lg">
                <MessageSquare className="w-4.5 h-4.5 text-white animate-bounce" />
              </div>
              <h3 className="font-headline-md text-headline-md font-extrabold text-white">Teacher's Note</h3>
            </div>

            <p className="text-base font-body-lg font-semibold leading-relaxed text-indigo-100 italic">
              "{notes.summaryQuote ? notes.summaryQuote : 'You are doing amazing! Steady rhythm counts.'}"
            </p>
            <p className="text-[10px] uppercase font-label-caps tracking-wider text-indigo-300 block opacity-85">
              — {notes.teacherName || "Mrs. Henderson"}, Piano Instructor
            </p>
          </div>

          <div className="pt-4 z-10">
            {!showReplyField ? (
              <button
                onClick={() => setShowReplyField(true)}
                id="reply-now-btn"
                className="cursor-pointer bg-white text-indigo-900 hover:bg-slate-100 font-extrabold text-xs px-4 py-2 rounded-full shadow-md active:scale-95 transition-all"
              >
                Reply Now
              </button>
            ) : (
              <form onSubmit={handleSendReply} className="space-y-2">
                <input
                  type="text"
                  placeholder="Type a message to your teacher..."
                  value={replyText}
                  id="teacher-reply-input"
                  onChange={(e) => setReplyText(e.target.value)}
                  className="w-full bg-white/10 text-white placeholder-white/60 border border-white/20 rounded-xl px-3 py-1.5 text-xs outline-none focus:border-white"
                  required
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="cursor-pointer bg-white text-indigo-900 font-bold text-[11px] px-3 py-1.5 rounded-lg hover:bg-slate-50"
                  >
                    Send
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowReplyField(false)}
                    className="cursor-pointer text-indigo-200 font-medium text-[11px] px-2"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {replySent && (
              <div className="mt-2 text-white text-[11px] font-bold flex items-center gap-1 bg-white/10 p-1.5 rounded-lg">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Message sent to {notes.teacherName || "Mrs. Henderson"}!</span>
              </div>
            )}
          </div>
        </section>

      </div>

      {/* Historical practices list */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="font-headline-md text-headline-md text-on-surface font-extrabold">Practice History</h3>
          <span className="text-xs text-on-surface-variant font-semibold">Click week to load checklist</span>
        </div>

        <div className="grid gap-3" id="history-weeks-collection">
          {weeks.filter((w) => w.id !== "this-week").length === 0 ? (
            <div className="text-center py-10 px-4 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
              <span className="text-3xl block filter drop-shadow">📅</span>
              <p className="text-sm font-bold text-slate-700 mt-2">No practice history recorded yet.</p>
              <p className="text-xs text-slate-400 mt-1 font-medium max-w-sm mx-auto">As weeks progress and new teacher notes are added, your weekly reports will archive here automatically!</p>
            </div>
          ) : (
            weeks.map((week) => {
              const isCurrent = week.id === selectedWeekId;
              // Only render rows for historical nodes to match spec boundaries
              if (week.id === "this-week") return null;

              return (
                <div
                  key={week.id}
                  id={`history-row-${week.id}`}
                  onClick={() => handleHistoricClick(week.id)}
                  className="piano-key-accent cursor-pointer bg-white border-l-8 border-slate-900 rounded-r-2xl p-4 flex items-center justify-between shadow-sm relative hover:bg-slate-50 hover:translate-x-1 hover:shadow transition-all active:translate-y-0.5"
                >
                  <div className="flex items-center gap-4 pl-2">
                    <div className="w-12 h-12 rounded-xl bg-slate-150 flex items-center justify-center font-extrabold shrink-0 border border-slate-200">
                      <span className="text-sm text-primary">{week.percentage}%</span>
                    </div>
                    <div>
                      {/* The xpath specifically queries a p with this week.label text inside a div carrying piano-key-accent */}
                      <p className="font-body-lg text-body-lg font-extrabold text-slate-800">
                        {week.label}
                      </p>
                      <p className="text-xs text-slate-500 font-medium">
                        {week.subtitle}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isCurrent && (
                      <span className="text-[10px] bg-primary/10 text-primary px-2.5 py-1 rounded-full font-bold">
                        Loaded
                      </span>
                    )}
                    <ChevronRight className="w-5 h-5 text-on-surface-variant/70" />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}
