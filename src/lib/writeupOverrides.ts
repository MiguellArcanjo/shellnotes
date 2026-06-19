import type { Writeup } from './writeups-data';
import {
  deleteContentEntry,
  getContentEntry,
  listContentEntries,
  upsertContentEntry,
} from './supabase/content';

const STORAGE_KEY = 'shellnotes-writeup-overrides';

export type WriteupOverride = Partial<Omit<Writeup, 'slug'>>;

function readAll(): Record<string, WriteupOverride> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeAll(data: Record<string, WriteupOverride>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // localStorage unavailable or quota exceeded (e.g. large embedded images)
  }
}

export function getOverride(slug: string): WriteupOverride | undefined {
  return readAll()[slug];
}

export function getAllOverrides(): Record<string, WriteupOverride> {
  return readAll();
}

export async function saveOverride(slug: string, data: WriteupOverride) {
  const all = readAll();
  all[slug] = { ...all[slug], ...data };
  writeAll(all);
  const status = data.status ?? 'draft';
  await upsertContentEntry('writeup', slug, status, { ...data, slug }).catch(() => {
    // The local draft remains available if Supabase has not been initialized yet.
  });
}

export async function deleteOverride(slug: string) {
  const all = readAll();
  delete all[slug];
  writeAll(all);
  await deleteContentEntry('writeup', slug).catch(() => {});
}

export async function getRemoteOverrides(): Promise<Record<string, WriteupOverride>> {
  const rows = await listContentEntries<WriteupOverride & { slug?: string }>('writeup');
  return Object.fromEntries(
    rows.map((row) => [
      row.slug,
      { ...row.data, status: row.status } satisfies WriteupOverride,
    ]),
  );
}

export async function getRemoteWriteups(): Promise<Writeup[]> {
  const rows = await listContentEntries<Writeup>('writeup');
  return rows.map((row) => ({
    ...row.data,
    slug: row.slug,
    status: row.status,
  }));
}

export async function getRemoteOverride(slug: string): Promise<WriteupOverride | undefined> {
  const row = await getContentEntry<WriteupOverride>('writeup', slug);
  return row ? { ...row.data, status: row.status } : undefined;
}

export function getEffectiveWriteup(seed: Writeup): Writeup {
  const override = getOverride(seed.slug);
  return override ? { ...seed, ...override } : seed;
}
