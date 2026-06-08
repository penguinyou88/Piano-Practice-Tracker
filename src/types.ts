export interface PracticeItem {
  id: string;
  title: string;
  goal: string;
}

export interface WeeklyNotes {
  pieces: PracticeItem[];
  technique: PracticeItem[];
  theory: PracticeItem[];
  summaryQuote: string;
  teacherName: string;
}

export interface WeekData {
  id: string; // e.g. 'this-week', 'last-week', 'oct-2-oct-8', 'sept-25-oct-1'
  label: string; // Display label: e.g. 'This Week', 'Last Week', 'Oct 2 - Oct 8', 'Sept 25 - Oct 1'
  subtitle: string; // e.g. '6 days completed'
  percentage: number; // e.g. 92, 85, 70
  notes: WeeklyNotes;
}

export interface PracticeSession {
  minutes: number;
  completedTasksCount: number;
}
