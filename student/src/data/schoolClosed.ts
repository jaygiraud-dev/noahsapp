// SD44 / Sutherland Secondary 2025-2026 no-school days
export interface ClosedDay {
  date: string; // YYYY-MM-DD
  label: string;
}

export const SCHOOL_CLOSED: ClosedDay[] = [
  // September 2025
  { date: '2025-09-01', label: 'Labour Day' },
  { date: '2025-09-02', label: 'Pro-D Day' },
  { date: '2025-09-19', label: 'Pro-D Day' },

  // October 2025
  { date: '2025-10-13', label: 'Thanksgiving' },
  { date: '2025-10-24', label: 'Pro-D Day' },

  // November 2025
  { date: '2025-11-10', label: 'Pro-D Day' },
  { date: '2025-11-11', label: 'Remembrance Day' },

  // December 2025
  { date: '2025-12-05', label: 'Pro-D Day' },
  { date: '2025-12-22', label: 'Winter Break' },
  { date: '2025-12-23', label: 'Winter Break' },
  { date: '2025-12-24', label: 'Winter Break' },
  { date: '2025-12-25', label: 'Christmas Day' },
  { date: '2025-12-26', label: 'Boxing Day' },
  { date: '2025-12-29', label: 'Winter Break' },
  { date: '2025-12-30', label: 'Winter Break' },
  { date: '2025-12-31', label: 'Winter Break' },

  // January 2026
  { date: '2026-01-01', label: "New Year's Day" },
  { date: '2026-01-02', label: 'Winter Break' },

  // February 2026
  { date: '2026-02-16', label: 'Family Day' },

  // March 2026 – Spring Break (Mar 16–27, students return Mar 30)
  { date: '2026-03-16', label: 'Spring Break' },
  { date: '2026-03-17', label: 'Spring Break' },
  { date: '2026-03-18', label: 'Spring Break' },
  { date: '2026-03-19', label: 'Spring Break' },
  { date: '2026-03-20', label: 'Spring Break' },
  { date: '2026-03-23', label: 'Spring Break' },
  { date: '2026-03-24', label: 'Spring Break' },
  { date: '2026-03-25', label: 'Spring Break' },
  { date: '2026-03-26', label: 'Spring Break' },
  { date: '2026-03-27', label: 'Spring Break' },

  // April 2026
  { date: '2026-04-03', label: 'Good Friday' },
  { date: '2026-04-06', label: 'Easter Monday' },

  // May 2026
  { date: '2026-05-18', label: 'Victoria Day' },
];

export function getClosedReason(date: Date): string | null {
  const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  return SCHOOL_CLOSED.find((d) => d.date === key)?.label ?? null;
}
