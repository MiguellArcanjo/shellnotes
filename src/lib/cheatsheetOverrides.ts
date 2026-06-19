import type { Cheatsheet } from './cheatsheets-data';
import { deleteContentEntry, listContentEntries, upsertContentEntry } from './supabase/content';

const STORAGE_KEY = 'shellnotes-cheatsheet-overrides';

export type CheatsheetOverride = Partial<Omit<Cheatsheet, 'slug'>>;

function readAll(): Record<string, CheatsheetOverride> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeAll(data: Record<string, CheatsheetOverride>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // localStorage unavailable or quota exceeded
  }
}

export function getOverride(slug: string): CheatsheetOverride | undefined {
  return readAll()[slug];
}

export function getAllOverrides(): Record<string, CheatsheetOverride> {
  return readAll();
}

export async function saveOverride(slug: string, data: CheatsheetOverride) {
  const all = readAll();
  all[slug] = { ...all[slug], ...data };
  writeAll(all);
  await upsertContentEntry('cheatsheet', slug, 'published', { ...data, slug }).catch(() => {});
}

export async function deleteOverride(slug: string) {
  const all = readAll();
  delete all[slug];
  writeAll(all);
  await deleteContentEntry('cheatsheet', slug).catch(() => {});
}

export function getEffectiveCheatsheet(seed: Cheatsheet): Cheatsheet {
  const override = getOverride(seed.slug);
  return override ? { ...seed, ...override } : seed;
}

export async function getRemoteOverrides(): Promise<Record<string, CheatsheetOverride>> {
  const rows = await listContentEntries<CheatsheetOverride>('cheatsheet');
  return Object.fromEntries(rows.map((row) => [row.slug, row.data]));
}
