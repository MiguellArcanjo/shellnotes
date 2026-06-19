import { createBlankCve, type CveEntry } from './cves-data';
import {
  deleteContentEntry,
  listContentEntries,
  upsertContentEntry,
} from './supabase/content';

const STORAGE_KEY = 'shellnotes-cves';

function readAll(): CveEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const entries: CveEntry[] = raw ? JSON.parse(raw) : [];
    return entries.map(normalizeCve);
  } catch {
    return [];
  }
}

export function normalizeCve(entry: CveEntry): CveEntry {
  return {
    ...entry,
    impact: entry.impact ?? '',
    reproduction: entry.reproduction ?? '',
    mitigation: entry.mitigation ?? '',
    references: entry.references ?? [],
    codeBlocks: entry.codeBlocks ?? [],
  };
}

function writeAll(entries: CveEntry[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // localStorage unavailable or quota exceeded
  }
}

export function getAllCves(): CveEntry[] {
  return readAll();
}

export function getCve(id: string): CveEntry | undefined {
  return readAll().find((entry) => entry.id === id);
}

export function saveCve(entry: CveEntry): CveEntry[] {
  const current = readAll();
  const exists = current.some((item) => item.id === entry.id);
  const next = exists
    ? current.map((item) => (item.id === entry.id ? entry : item))
    : [entry, ...current];
  writeAll(next);
  void upsertContentEntry('cve', entry.id, entry.status, entry).catch(() => {
    // Preserve the browser copy while the remote schema is being initialized.
  });
  return next;
}

export function deleteCve(id: string): CveEntry[] {
  const next = readAll().filter((entry) => entry.id !== id);
  writeAll(next);
  void deleteContentEntry('cve', id).catch(() => {});
  return next;
}

export function createNewCve(): CveEntry {
  return createBlankCve(`cve-entry-${Date.now()}`);
}

export async function getAllCvesRemote(): Promise<CveEntry[]> {
  const rows = await listContentEntries<CveEntry>('cve');
  return rows.map((row) => normalizeCve({ ...row.data, id: row.slug, status: row.status }));
}
