import { formatDateLabel } from './writeups-data';
import type { TilNote } from './til-data';
import { deleteContentEntry, listContentEntries, upsertContentEntry } from './supabase/content';

const STORAGE_KEY = 'shellnotes-til-entries';

type TilEntry = TilNote & { deleted?: boolean };

export type TilEntryWithKey = TilNote & { _key: string };

function readAll(): Record<string, TilEntry> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeAll(data: Record<string, TilEntry>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // localStorage unavailable or quota exceeded
  }
}

export function keyForSeed(note: TilNote): string {
  return `${note.date}__${note.title}`;
}

export function newKey(): string {
  return `new-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function createBlankNote(): TilNote {
  const date = todayIso();
  return { date, dateLabel: formatDateLabel(date), title: '', body: '', code: '', tags: [] };
}

export function saveNote(key: string, data: TilNote) {
  const all = readAll();
  all[key] = data;
  writeAll(all);
  void upsertContentEntry('til', key, 'published', data).catch(() => {});
}

export function deleteNote(key: string, fallback: TilNote) {
  const all = readAll();
  all[key] = { ...fallback, deleted: true };
  writeAll(all);
  void deleteContentEntry('til', key).catch(() => {});
}

export function getEffectiveTil(seed: TilNote[]): TilEntryWithKey[] {
  const overrides = readAll();
  const seedKeys = new Set(seed.map((n) => keyForSeed(n)));

  const merged = seed
    .map((n) => {
      const key = keyForSeed(n);
      const o = overrides[key];
      if (o?.deleted) return null;
      return o ? { ...n, ...o, _key: key } : { ...n, _key: key };
    })
    .filter((n): n is TilEntryWithKey => n !== null);

  const extra = Object.entries(overrides)
    .filter(([key, o]) => !seedKeys.has(key) && !o.deleted)
    .map(([key, o]) => ({
      date: o.date, dateLabel: o.dateLabel, title: o.title, body: o.body, code: o.code, tags: o.tags, _key: key,
    }));

  return [...merged, ...extra];
}

export async function getRemoteTil(): Promise<TilEntryWithKey[]> {
  const rows = await listContentEntries<TilNote>('til');
  return rows.map((row) => ({ ...row.data, _key: row.slug }));
}
