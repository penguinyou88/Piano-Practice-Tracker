import { WeekData } from "../types";

export const INITIAL_WEEKS: WeekData[] = [
  {
    id: "this-week",
    label: "This Week",
    subtitle: "Active practice week",
    percentage: 0,
    notes: {
      pieces: [
        { id: "minuet-g", title: "Minuet in G", goal: "Practice bars 1-8 slowly" },
        { id: "first-lesson", title: "First Lesson", goal: "Focus on hand position" }
      ],
      technique: [
        { id: "c-major-scale", title: "C Major Scale", goal: "Both hands together, 2 octaves" },
        { id: "finger-exercises", title: "Finger Exercises", goal: "Hanon No. 1: 5 minutes" }
      ],
      theory: [
        { id: "page-12-workbook", title: "Page 12 Workbook", goal: "Complete the Bass Clef notes" }
      ],
      summaryQuote: "Great focus on your Repertoire this week! Try to squeeze in more scales tomorrow.",
      teacherName: "Mrs. Henderson"
    }
  }
];

export const INITIAL_CHECKED_STATE: { [weekId: string]: { [dayName: string]: string[] } } = {
  "this-week": {
    "Mon": [],
    "Tue": [],
    "Wed": [],
    "Thu": [],
    "Fri": [],
    "Sat": [],
    "Sun": []
  }
};
