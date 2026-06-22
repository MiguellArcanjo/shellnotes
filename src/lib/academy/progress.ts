// Local-only progression. Single user, so localStorage is the source of truth:
// XP, level, day streak and the set of completed lessons / labs / quiz answers.

export type Progress = {
  xp: number;
  completedLessons: string[];
  completedLabs: string[];
  completedQuiz: string[];
  labAttempts: number;
  hintsUsed: number;
  streakDays: number;
  lastActiveDay: string; // YYYY-MM-DD
  history: string[]; // recent activity log (newest first)
};

export const XP = {
  lesson: 20,
  lab: 60,
  quiz: 15,
} as const;

export const STORAGE_KEY = 'shellnotes:academy:v1';

export const EMPTY_PROGRESS: Progress = {
  xp: 0,
  completedLessons: [],
  completedLabs: [],
  completedQuiz: [],
  labAttempts: 0,
  hintsUsed: 0,
  streakDays: 0,
  lastActiveDay: '',
  history: [],
};

// Smooth, slightly accelerating curve. Level n needs 100 * n * (n+1) / 2 total XP.
export function levelFromXp(xp: number): { level: number; into: number; needed: number; floor: number } {
  let level = 1;
  let floor = 0;
  // XP required to advance FROM level L is 100 * L.
  while (xp >= floor + 100 * level) {
    floor += 100 * level;
    level += 1;
  }
  const needed = 100 * level;
  return { level, into: xp - floor, needed, floor };
}

export const RANKS: Array<{ min: number; name: string }> = [
  { min: 1, name: 'Script Kiddie' },
  { min: 3, name: 'Aprendiz' },
  { min: 5, name: 'Caçador Júnior' },
  { min: 8, name: 'Hunter' },
  { min: 12, name: 'Hunter Sênior' },
  { min: 18, name: 'Especialista' },
  { min: 25, name: 'Lenda do Bounty' },
];

export function rankFor(level: number): string {
  return [...RANKS].reverse().find((rank) => level >= rank.min)?.name ?? RANKS[0].name;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function dayDiff(from: string, to: string): number {
  if (!from) return Infinity;
  const a = new Date(`${from}T00:00:00`).getTime();
  const b = new Date(`${to}T00:00:00`).getTime();
  return Math.round((b - a) / 86_400_000);
}

/** Refresh the day streak on load / on any activity. */
export function touchStreak(progress: Progress): Progress {
  const day = today();
  if (progress.lastActiveDay === day) return progress;
  const gap = dayDiff(progress.lastActiveDay, day);
  const streakDays = gap === 1 ? progress.streakDays + 1 : 1;
  return { ...progress, streakDays: Math.max(1, streakDays), lastActiveDay: day };
}

function log(progress: Progress, entry: string): string[] {
  return [entry, ...progress.history].slice(0, 12);
}

export function completeLesson(progress: Progress, id: string, title: string): Progress {
  if (progress.completedLessons.includes(id)) return progress;
  return touchStreak({
    ...progress,
    xp: progress.xp + XP.lesson,
    completedLessons: [...progress.completedLessons, id],
    history: log(progress, `Leu a lição "${title}" (+${XP.lesson} XP)`),
  });
}

export function completeLab(progress: Progress, id: string, title: string): Progress {
  const already = progress.completedLabs.includes(id);
  const base = touchStreak({ ...progress, labAttempts: progress.labAttempts + 1 });
  if (already) return base;
  return {
    ...base,
    xp: base.xp + XP.lab,
    completedLabs: [...base.completedLabs, id],
    history: log(base, `Resolveu o lab "${title}" (+${XP.lab} XP)`),
  };
}

export function registerAttempt(progress: Progress): Progress {
  return touchStreak({ ...progress, labAttempts: progress.labAttempts + 1 });
}

export function registerHint(progress: Progress): Progress {
  return { ...progress, hintsUsed: progress.hintsUsed + 1 };
}

export function completeQuiz(progress: Progress, id: string, correct: boolean): Progress {
  if (progress.completedQuiz.includes(id)) return touchStreak(progress);
  return touchStreak({
    ...progress,
    xp: progress.xp + (correct ? XP.quiz : 0),
    completedQuiz: [...progress.completedQuiz, id],
    history: correct ? log(progress, `Acertou um quiz (+${XP.quiz} XP)`) : progress.history,
  });
}

export function isModuleComplete(
  progress: Progress,
  module: { lessons: { id: string }[]; labs: { id: string }[]; quiz: { id: string }[] },
): boolean {
  const lessonsDone = module.lessons.every((lesson) => progress.completedLessons.includes(lesson.id));
  const labsDone = module.labs.every((lab) => progress.completedLabs.includes(lab.id));
  const quizDone = module.quiz.every((quiz) => progress.completedQuiz.includes(quiz.id));
  return lessonsDone && labsDone && quizDone;
}

export function moduleProgress(
  progress: Progress,
  module: { lessons: { id: string }[]; labs: { id: string }[]; quiz: { id: string }[] },
): { done: number; total: number } {
  const items = [
    ...module.lessons.map((lesson) => lesson.id),
    ...module.labs.map((lab) => lab.id),
    ...module.quiz.map((quiz) => quiz.id),
  ];
  const completed = new Set([
    ...progress.completedLessons,
    ...progress.completedLabs,
    ...progress.completedQuiz,
  ]);
  return { done: items.filter((id) => completed.has(id)).length, total: items.length };
}

export function isModuleUnlocked(progress: Progress, requires: string[], modules: { id: string; lessons: { id: string }[]; labs: { id: string }[]; quiz: { id: string }[] }[]): boolean {
  return requires.every((requiredId) => {
    const required = modules.find((module) => module.id === requiredId);
    return required ? isModuleComplete(progress, required) : true;
  });
}

export function load(): Progress {
  if (typeof window === 'undefined') return EMPTY_PROGRESS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_PROGRESS;
    return { ...EMPTY_PROGRESS, ...(JSON.parse(raw) as Partial<Progress>) };
  } catch {
    return EMPTY_PROGRESS;
  }
}

export function save(progress: Progress): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // ignore quota / private-mode failures
  }
}
