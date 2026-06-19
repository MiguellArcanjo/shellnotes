import { createBlankReport, type Report } from './reports-data';
import { deletePrivateEntry, upsertPrivateEntry } from './supabase/private';

const STORAGE_KEY = 'shellnotes-report-overrides';

export type ReportOverride = Partial<Omit<Report, 'id'>>;

function readAll(): Record<string, ReportOverride> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeAll(data: Record<string, ReportOverride>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // localStorage unavailable or quota exceeded
  }
}

export function getOverride(id: string): ReportOverride | undefined {
  return readAll()[id];
}

export function saveOverride(id: string, data: ReportOverride) {
  const all = readAll();
  all[id] = { ...all[id], ...data };
  writeAll(all);
  void upsertPrivateEntry('report', id, { ...data, id }).catch(() => {});
}

export function deleteOverride(id: string) {
  const all = readAll();
  delete all[id];
  writeAll(all);
  void deletePrivateEntry('report', id).catch(() => {});
}

export function getEffectiveReport(seed: Report): Report {
  const override = getOverride(seed.id);
  return override ? { ...seed, ...override } : seed;
}

export function getAllReports(): Report[] {
  const overrides = readAll();
  return Object.entries(overrides)
    .map(([id, override]) => ({ ...createBlankReport(id), ...override }))
    .filter((report) => report.title.trim() !== '');
}
