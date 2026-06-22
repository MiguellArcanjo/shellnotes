// Data model for the TryHackMe STUDY notebook. CTF write-ups live in the
// dedicated writeups section — this tab is only about learning: notes on rooms
// and learning paths, a study plan (pipeline) and focused study sessions.
// Everything here is private and persisted in Supabase private_entries.

export type RoomStatus = 'todo' | 'doing' | 'done';
export type RoomDifficulty = 'Info' | 'Easy' | 'Medium' | 'Hard' | 'Insane';

export type StudyNote = {
  slug: string;
  title: string;
  path: string;
  module: string;
  url: string;
  difficulty: RoomDifficulty;
  status: RoomStatus;
  tags: string[];
  notes: string; // markdown
  concepts: string[];
  createdAt: string;
  updatedAt: string;
};

export type PlanItem = {
  id: string;
  title: string;
  path: string;
  status: RoomStatus;
  targetDate: string; // YYYY-MM-DD or ''
  noteSlug: string; // optional link to a StudyNote
};

export type StudyPlan = {
  items: PlanItem[];
};

export type StudySession = {
  id: string;
  startedAt: string;
  endedAt: string;
  minutes: number;
  focusBreaks: number;
  label: string;
  noteSlug: string;
};

export const THM_PATHS = [
  'Pre Security',
  'Cyber Security 101',
  'Introduction to Cyber Security',
  'Jr Penetration Tester',
  'Web Fundamentals',
  'CompTIA Pentest+',
  'Offensive Pentesting',
  'Red Teaming',
  'SOC Level 1',
  'SOC Level 2',
  'Cyber Defense',
  'DevSecOps',
  'Sem trilha (avulsa)',
] as const;

export const DIFFICULTIES: RoomDifficulty[] = ['Info', 'Easy', 'Medium', 'Hard', 'Insane'];

export const STATUS_LABEL: Record<RoomStatus, string> = {
  todo: 'a fazer',
  doing: 'estudando',
  done: 'concluída',
};

export const DIFFICULTY_COLOR: Record<RoomDifficulty, string> = {
  Info: 'low',
  Easy: 'low',
  Medium: 'medium',
  Hard: 'high',
  Insane: 'critical',
};

export function newId(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

export function todayIso(): string {
  return new Date().toISOString();
}

export function dayKey(iso: string): string {
  return iso.slice(0, 10);
}

export function createBlankNote(): StudyNote {
  const now = todayIso();
  return {
    slug: `note-${newId()}`,
    title: '',
    path: 'Jr Penetration Tester',
    module: '',
    url: '',
    difficulty: 'Easy',
    status: 'doing',
    tags: [],
    notes: '',
    concepts: [],
    createdAt: now,
    updatedAt: now,
  };
}

export function createPlanItem(): PlanItem {
  return { id: newId(), title: '', path: 'Jr Penetration Tester', status: 'todo', targetDate: '', noteSlug: '' };
}
