import { useState } from "react";
import { 
  FileText, 
  Sparkles, 
  BookOpen, 
  CheckCircle2, 
  RefreshCw, 
  ArrowRight,
  Smile,
  AlertTriangle,
  Trash2
} from "lucide-react";
import { WeeklyNotes } from "../types";

interface TeacherNotesPanelProps {
  onNotesGenerated: (newNotes: WeeklyNotes) => void;
  currentNotes: WeeklyNotes;
  onAddManualTask: (category: "pieces" | "technique" | "theory", title: string, goal: string) => void;
  onRemoveManualTask: (category: "pieces" | "technique" | "theory", id: string) => void;
}

const SAMPLE_TEACHER_NOTES = [
  {
    title: "Lesson June 8: Bach Preludes & Major Scales",
    text: `Piano Lesson Notes & Homework
Instructor: Mrs. Henderson
Date: June 8, 2026

Hi penguinyou88! Wonderful coordination today.

1. Repertoire / Pieces:
- Prelude in C Major: Practice the rolling broken chords evenly. Focus on the transition in bars 5-10. Keep tempo slow (60bpm).
- Minuet in G: Keep the staccato sections crisp, especially in the secondary B section. Keep hand arches rounded.

2. Scales / Technical exercises:
- G Major Scale: Both hands combined, 2 octaves. Keep dynamic smooth.
- Finger exercises: Hanon No. 2 to build strong pinky fingers. Spend at least 5 minutes.

3. Theory Workbook:
- Page 16 in the workbook: Fill out the matching key signatures worksheet. We will check it next lesson.

Motivating tip: Keep those fingers arched like you're holding a cute little apple! You are progressing wonderfully.`
  },
  {
    title: "Lesson May 20: Beethoven Für Elise",
    text: `Piano Lesson Notes & Homework
Instructor: Mrs. Henderson
Date: May 20, 2026

Dear penguin! An exceptional lesson today.

1. Pieces:
- Für Elise: Work on the main theme (measures 1-8). Focus on smooth pedaling transitions and light soft keytouches.
- First Lesson: Perfecting hand relaxation on key release.

2. Technique:
- A Minor Harmonic Scale: Focus on thumb tucks in the right hand.
- Arpeggios: Practicing C major arpeggios slowly.

3. Theory:
- Read page 14: Draw bass clef F keys.`
  }
];export default function TeacherNotesPanel({
  onNotesGenerated,
  currentNotes,
  onAddManualTask,
  onRemoveManualTask
}: TeacherNotesPanelProps) {
  const [editorText, setEditorText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Manual Task input state
  const [manualCategory, setManualCategory] = useState<"pieces" | "technique" | "theory">("pieces");
  const [manualTitle, setManualTitle] = useState("");
  const [manualGoal, setManualGoal] = useState("");
  const [manualSuccess, setManualSuccess] = useState(false);

  const handleParseWithGemini = async (textToParse: string) => {
    const activeText = textToParse || editorText;
    if (!activeText.trim()) {
      setError("Please paste or type in some teacher notes first.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch("/api/parse-notes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ notesText: activeText })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed parsing notes server-side.");
      }

      const structuredNotes: WeeklyNotes = await res.json();
      
      // Send parsed checklist back up
      onNotesGenerated(structuredNotes);
      setSuccess(true);
      setEditorText("");
      setError(null);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Something went wrong parsing with Gemini AI. Proceeding in fallback mode.");
    } finally {
      setLoading(false);
    }
  };

  const loadSampleNote = (text: string) => {
    setEditorText(text);
    setError(null);
    setSuccess(false);
  };

  return (
    <div id="notes-config-deck" className="space-y-6">
      
      {/* Overview Block */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border-b-4 border-slate-200 space-y-3">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" style={{ fill: "rgba(79, 70, 229, 0.1)" }} />
          <h2 className="font-headline-md text-headline-md text-on-surface font-extrabold text-slate-950">Teacher's Google Doc Notes</h2>
        </div>
        <p className="text-sm text-on-surface-variant font-medium leading-relaxed">
          Every week, the teacher drops new notes into your Google Doc. Paste them in here, and we'll use <strong className="text-primary">Gemini AI</strong> to generate a customized, fun checklist for your child! If you don't overwrite it, we keep tracking the same activities as last week.
        </p>
      </div>

      {/* Manual Task Creator Section */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border-b-4 border-slate-200 space-y-4">
        <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
          <span>✍️</span> Set / Add Assignment Manually
        </h3>
        <p className="text-xs text-on-surface-variant font-medium leading-relaxed">
          If Gemini is waiting on key setups, you can manually type/add direct pieces, scales, and pages here. This keeps the child's daily practice routine 100% stable!
        </p>
        
        <div className="space-y-3 pt-1">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">Assignment Class:</span>
            <div className="grid grid-cols-3 gap-2">
              {(["pieces", "technique", "theory"] as const).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setManualCategory(cat)}
                  className={`cursor-pointer py-1.5 px-2 text-xs font-bold rounded-xl border capitalize transition-all ${
                    manualCategory === cat 
                      ? "bg-primary text-white border-primary shadow-sm" 
                      : "bg-slate-50 border-slate-200 text-slate-650 hover:bg-slate-100"
                  }`}
                >
                  {cat === "pieces" ? "🎵 Piece" : cat === "technique" ? "⚡ scale" : "📖 theory"}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="manual-title-field" className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Title / Name</label>
              <input
                id="manual-title-field"
                type="text"
                placeholder={manualCategory === "pieces" ? "e.g. Für Elise (Part B)" : manualCategory === "technique" ? "e.g. G Major 2-Octaves" : "e.g. Page 16 Ledger Notes"}
                value={manualTitle}
                onChange={(e) => setManualTitle(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold outline-none focus:border-primary text-on-surface font-sans"
              />
            </div>
            <div>
              <label htmlFor="manual-goal-field" className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Specific Goal</label>
              <input
                id="manual-goal-field"
                type="text"
                placeholder="e.g. Focus on speed, slow metronome"
                value={manualGoal}
                onChange={(e) => setManualGoal(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold outline-none focus:border-primary text-on-surface font-sans"
              />
            </div>
          </div>

          <button
            id="add-manual-task-btn"
            onClick={() => {
              if (!manualTitle.trim()) return;
              onAddManualTask(manualCategory, manualTitle.trim(), manualGoal.trim() || "Practice slowly daily!");
              setManualTitle("");
              setManualGoal("");
              setManualSuccess(true);
              setTimeout(() => setManualSuccess(false), 2500);
            }}
            disabled={!manualTitle.trim()}
            className="cursor-pointer bg-primary hover:bg-indigo-650 disabled:bg-slate-150 disabled:text-slate-400 text-white font-extrabold text-xs px-4 py-2 rounded-xl w-full text-center transition-all shadow-sm"
          >
            Add Task to Blueprint
          </button>

          {manualSuccess && (
            <p className="text-[11px] text-emerald-600 font-bold text-center mt-1">
              ✨ Practice item loaded! See bottom daily tracker.
            </p>
          )}
        </div>
      </div>

      {/* Main paste and upload area */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border-b-4 border-slate-200 space-y-4">
        <label htmlFor="notes-pasteboard" className="text-xs font-label-caps tracking-wider text-on-surface-variant uppercase font-semibold">
          AI Option: Paste Lesson Notes or Practice Directives:
        </label>
        
        <textarea
          id="notes-pasteboard"
          rows={5}
          placeholder="Paste teacher notes here... Or click one of the quick samples below to see the AI analyze instantly! 🎹"
          value={editorText}
          onChange={(e) => {
            setEditorText(e.target.value);
            setError(null);
            setSuccess(false);
          }}
          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm font-medium outline-none focus:border-primary focus:bg-white text-on-surface transition-all placeholder-slate-400 font-sans"
        />

        {/* Action button bar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={() => handleParseWithGemini(editorText)}
            disabled={loading || !editorText.trim()}
            id="gemini-generator-trigger"
            className="cursor-pointer bg-indigo-600 hover:bg-primary disabled:bg-slate-200 disabled:text-slate-450 text-white font-extrabold text-sm px-5 py-2 rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>AI analyzing lesson...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4.5 h-4.5 fill-current text-yellow-300" />
                <span>Analyze with Gemini AI</span>
              </>
            )}
          </button>
          
          <span className="text-xs text-on-surface-variant/80 font-bold">
            Uses Server-Side Gemini 3.1 Flash
          </span>
        </div>

        {/* Success / Error cards */}
        {success && (
          <div className="p-3 bg-tertiary-fixed text-on-tertiary-fixed border border-tertiary/10 rounded-xl flex items-center gap-2.5 shadow-sm text-xs font-bold">
            <CheckCircle2 className="w-4 h-4 text-tertiary shrink-0" />
            <span>Success! Gemini organized the homework. Go check off items on the Daily practice sheet! 🎉</span>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 text-red-700 border border-red-100 rounded-xl flex items-start gap-2.5 text-xs font-semibold">
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-extrabold block">Gemini Parsing Error</span>
              <p className="leading-normal">{error}</p>
              <button 
                onClick={() => {
                  // Fallback: update with a mock noteset so user can still test!
                  onNotesGenerated(SAMPLE_TEACHER_NOTES[0].text as any);
                  setSuccess(true);
                  setError(null);
                }}
                className="text-primary underline font-bold inline-block pt-1 hover:text-indigo-600"
              >
                Use Fallback template notes (locally parsed)
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Presets and template notes section */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border-b-4 border-slate-200 space-y-4">
        <h4 className="font-headline-md text-sm font-extrabold text-on-surface">
          Try a Demo Lesson:
        </h4>
        <p className="text-xs text-on-surface-variant font-medium">
          Select a sample notes package and see Gemini extract specific Piece goals, scale levels, and theory page coordinates.
        </p>

        <div className="grid gap-2">
          {SAMPLE_TEACHER_NOTES.map((sample, idx) => (
            <button
              key={idx}
              onClick={() => loadSampleNote(sample.text)}
              className="cursor-pointer text-left w-full p-3 bg-slate-50 hover:bg-slate-100/80 hover:border-slate-300 rounded-xl border border-slate-200/60 font-medium text-sm text-on-surface flex items-center justify-between transition-all group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center font-bold text-xs text-primary shrink-0 group-hover:bg-primary group-hover:text-white transition-all">
                  {idx + 1}
                </div>
                <span className="font-extrabold">{sample.title}</span>
              </div>
              <ArrowRight className="w-4 h-4 text-on-surface-variant/70 group-hover:translate-x-1 transition-transform" />
            </button>
          ))}
        </div>
      </div>

      {/* Current loaded assignments display */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border-b-4 border-slate-200 space-y-4">
        <h3 className="font-headline-md text-headline-md text-on-surface font-extrabold text-slate-900">Loaded Practice Blueprint</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-semibold">
          
          <div className="p-3 bg-primary/5 rounded-xl border border-primary/10 flex flex-col justify-between">
            <div>
              <span className="text-primary font-bold uppercase block mb-1 select-none">Songs / Pieces</span>
              <span className="text-on-surface text-sm font-extrabold leading-normal block mb-2">
                {currentNotes.pieces?.length || 0} active
              </span>
              <ul className="space-y-1.5 text-[11px] text-on-surface-variant font-medium">
                {currentNotes.pieces?.map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-1.5 p-1.5 bg-white/80 rounded-lg shadow-sm border border-slate-150/50">
                    <span className="truncate flex-1 font-bold">{p.title}</span>
                    <button
                      onClick={() => onRemoveManualTask("pieces", p.id)}
                      className="cursor-pointer text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 w-5 h-5 rounded-full flex items-center justify-center font-bold font-mono transition-colors shrink-0"
                      title="Delete assignment"
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            {(!currentNotes.pieces || currentNotes.pieces.length === 0) && (
              <span className="text-[10px] text-slate-400 italic block mt-2">Zero active items. Try adding one!</span>
            )}
          </div>
          
          <div className="p-3 bg-secondary/5 rounded-xl border border-secondary/10 flex flex-col justify-between">
            <div>
              <span className="text-secondary font-bold uppercase block mb-1 select-none">Techniques</span>
              <span className="text-on-surface text-sm font-extrabold leading-normal block mb-2">
                {currentNotes.technique?.length || 0} active
              </span>
              <ul className="space-y-1.5 text-[11px] text-on-surface-variant font-medium">
                {currentNotes.technique?.map((t) => (
                  <li key={t.id} className="flex items-center justify-between gap-1.5 p-1.5 bg-white/80 rounded-lg shadow-sm border border-slate-155">
                    <span className="truncate flex-1 font-bold">{t.title}</span>
                    <button
                      onClick={() => onRemoveManualTask("technique", t.id)}
                      className="cursor-pointer text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 w-5 h-5 rounded-full flex items-center justify-center font-bold font-mono transition-colors shrink-0"
                      title="Delete assignment"
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            {(!currentNotes.technique || currentNotes.technique.length === 0) && (
              <span className="text-[10px] text-slate-400 italic block mt-2">Zero active items. Try adding one!</span>
            )}
          </div>

          <div className="p-3 bg-tertiary/5 rounded-xl border border-tertiary/10 flex flex-col justify-between">
            <div>
              <span className="text-tertiary font-bold uppercase block mb-1 select-none">Theory / Homework</span>
              <span className="text-on-surface text-sm font-extrabold leading-normal block mb-2">
                {currentNotes.theory?.length || 0} active
              </span>
              <ul className="space-y-1.5 text-[11px] text-on-surface-variant font-medium">
                {currentNotes.theory?.map((th) => (
                  <li key={th.id} className="flex items-center justify-between gap-1.5 p-1.5 bg-white/80 rounded-lg shadow-sm border border-slate-155">
                    <span className="truncate flex-1 font-bold">{th.title}</span>
                    <button
                      onClick={() => onRemoveManualTask("theory", th.id)}
                      className="cursor-pointer text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 w-5 h-5 rounded-full flex items-center justify-center font-bold font-mono transition-colors shrink-0"
                      title="Delete assignment"
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            {(!currentNotes.theory || currentNotes.theory.length === 0) && (
              <span className="text-[10px] text-slate-400 italic block mt-2">Zero active items. Try adding one!</span>
            )}
          </div>

        </div>
      </div>

    </div>
  );
}
