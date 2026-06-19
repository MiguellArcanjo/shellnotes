import type { GlossaryTerm } from './glossary-data';
import { deleteContentEntry, listContentEntries, upsertContentEntry } from './supabase/content';

const STORAGE_KEY = 'shellnotes-glossary-entries';

type GlossaryEntry = GlossaryTerm & { deleted?: boolean };

export type GlossaryEntryWithKey = GlossaryTerm & { _key: string };

function readAll(): Record<string, GlossaryEntry> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeAll(data: Record<string, GlossaryEntry>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // localStorage unavailable or quota exceeded
  }
}

export function keyFor(term: string): string {
  return term.trim().toLowerCase();
}

export function newKey(): string {
  return `new-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

export function saveTerm(key: string, data: GlossaryTerm) {
  const all = readAll();
  all[key] = data;
  writeAll(all);
  void upsertContentEntry('glossary', key, 'published', data).catch(() => {});
}

export function deleteTerm(key: string, fallback: GlossaryTerm) {
  const all = readAll();
  all[key] = { ...fallback, deleted: true };
  writeAll(all);
  void deleteContentEntry('glossary', key).catch(() => {});
}

export function getEffectiveGlossary(seed: GlossaryTerm[]): GlossaryEntryWithKey[] {
  const overrides = readAll();
  const seedKeys = new Set(seed.map((t) => keyFor(t.term)));

  const merged = seed
    .map((t) => {
      const key = keyFor(t.term);
      const o = overrides[key];
      if (o?.deleted) return null;
      return o ? { ...t, ...o, _key: key } : { ...t, _key: key };
    })
    .filter((t): t is GlossaryEntryWithKey => t !== null);

  const extra = Object.entries(overrides)
    .filter(([key, o]) => !seedKeys.has(key) && !o.deleted)
    .map(([key, o]) => ({ term: o.term, abbr: o.abbr, def: o.def, _key: key }));

  return [...merged, ...extra];
}

export async function getRemoteGlossary(): Promise<GlossaryEntryWithKey[]> {
  const rows = await listContentEntries<GlossaryTerm>('glossary');
  return rows.map((row) => ({ ...row.data, _key: row.slug }));
}
