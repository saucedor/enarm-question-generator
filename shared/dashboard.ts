export type DashboardData = {
  totals: { sets: number; questions: number; reviewed: number; pending: number; practices: number; activeRuns: number; failedRuns: number };
  activity: Array<{ date: string; sets: number }>;
  specialties: Array<{ name: string; questions: number }>;
  recent: Array<{ id: string; title: string; specialty: string; questions: number; reviewed: boolean; updatedAt: string }>;
  nextReview: { id: string; title: string } | null;
};
