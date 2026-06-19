import { createBlankFinding, type Finding } from './findings-data';
import { deletePrivateEntry, upsertPrivateEntry } from './supabase/private';

const STORAGE_KEY = 'shellnotes-finding-overrides';

export type FindingOverride = Partial<Omit<Finding, 'id'>>;

function readAll(): Record<string, FindingOverride> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeAll(data: Record<string, FindingOverride>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // localStorage unavailable or quota exceeded
  }
}

export function getOverride(id: string): FindingOverride | undefined {
  return readAll()[id];
}

export function saveOverride(id: string, data: FindingOverride) {
  const all = readAll();
  all[id] = { ...all[id], ...data };
  writeAll(all);
  void upsertPrivateEntry('finding', id, { ...data, id }).catch(() => {});
}

export function deleteOverride(id: string) {
  const all = readAll();
  delete all[id];
  writeAll(all);
  void deletePrivateEntry('finding', id).catch(() => {});
}

export function getEffectiveFinding(seed: Finding): Finding {
  const override = getOverride(seed.id);
  return override ? { ...seed, ...override } : seed;
}

export function getAllFindings(): Finding[] {
  const overrides = readAll();
  return Object.entries(overrides)
    .map(([id, override]) => ({ ...createBlankFinding(id), ...override }))
    .filter((finding) => finding.title.trim() !== '');
}
