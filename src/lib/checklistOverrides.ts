import { createBlankChecklist, type Checklist } from './checklists-data';
import { deletePrivateEntry, upsertPrivateEntry } from './supabase/private';

const STORAGE_KEY = 'shellnotes-checklist-overrides';
const DELETED_KEY = 'shellnotes-checklist-deleted';

export type ChecklistOverride = Partial<Omit<Checklist, 'id'>>;

function readDeleted(): Set<string> {
  try {
    const raw = localStorage.getItem(DELETED_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

function writeDeleted(ids: Set<string>) {
  try {
    localStorage.setItem(DELETED_KEY, JSON.stringify([...ids]));
  } catch {
    // localStorage unavailable or quota exceeded
  }
}

function readAll(): Record<string, ChecklistOverride> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeAll(data: Record<string, ChecklistOverride>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // localStorage unavailable or quota exceeded
  }
}

export function getOverride(id: string): ChecklistOverride | undefined {
  return readAll()[id];
}

export function saveOverride(id: string, data: ChecklistOverride) {
  const all = readAll();
  all[id] = { ...all[id], ...data };
  writeAll(all);
  void upsertPrivateEntry('checklist', id, { ...data, id }).catch(() => {});
}

export function deleteOverride(id: string) {
  const all = readAll();
  delete all[id];
  writeAll(all);
  void deletePrivateEntry('checklist', id).catch(() => {});
}

// seed checklists can't be removed from the source array at runtime, so
// deletion is tracked as a separate id blocklist rather than an override
export function deleteChecklist(id: string) {
  const deleted = readDeleted();
  deleted.add(id);
  writeDeleted(deleted);
  deleteOverride(id);
}

export function getEffectiveChecklist(seed: Checklist): Checklist {
  const override = getOverride(seed.id);
  return override ? { ...seed, ...override } : seed;
}

export function getAllChecklists(): Checklist[] {
  const overrides = readAll();
  const deleted = readDeleted();
  return Object.entries(overrides)
    .filter(([id]) => !deleted.has(id))
    .map(([id, override]) => ({ ...createBlankChecklist(id), ...override }))
    .filter((checklist) => checklist.title.trim() !== '');
}
