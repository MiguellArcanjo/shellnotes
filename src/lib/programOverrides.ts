import { createBlankProgram, type Program } from './bounty-data';
import { deletePrivateEntry, upsertPrivateEntry } from './supabase/private';

const STORAGE_KEY = 'shellnotes-program-overrides';

export type ProgramOverride = Partial<Omit<Program, 'id'>>;

function readAll(): Record<string, ProgramOverride> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeAll(data: Record<string, ProgramOverride>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // localStorage unavailable or quota exceeded
  }
}

export function getOverride(id: string): ProgramOverride | undefined {
  return readAll()[id];
}

export function getAllOverrides(): Record<string, ProgramOverride> {
  return readAll();
}

export function saveOverride(id: string, data: ProgramOverride) {
  const all = readAll();
  all[id] = { ...all[id], ...data };
  writeAll(all);
  void upsertPrivateEntry('program', id, { ...data, id }).catch(() => {});
}

export function deleteOverride(id: string) {
  const all = readAll();
  delete all[id];
  writeAll(all);
  void deletePrivateEntry('program', id).catch(() => {});
}

export function getEffectiveProgram(seed: Program): Program {
  const override = getOverride(seed.id);
  return override ? { ...seed, ...override } : seed;
}

export function getAllPrograms(): Program[] {
  const overrides = readAll();
  return Object.entries(overrides)
    .map(([id, override]) => ({ ...createBlankProgram(id), ...override }))
    .filter((program) => program.name.trim() !== '');
}
