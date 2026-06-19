import { createBlankPayout, type Payout } from './payouts-data';
import { deletePrivateEntry, upsertPrivateEntry } from './supabase/private';

const STORAGE_KEY = 'shellnotes-payout-overrides';
const DELETED_KEY = 'shellnotes-payout-deleted';

export type PayoutOverride = Partial<Omit<Payout, 'id'>>;

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

function readAll(): Record<string, PayoutOverride> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeAll(data: Record<string, PayoutOverride>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // localStorage unavailable or quota exceeded
  }
}

export function getOverride(id: string): PayoutOverride | undefined {
  return readAll()[id];
}

export function saveOverride(id: string, data: PayoutOverride) {
  const all = readAll();
  all[id] = { ...all[id], ...data };
  writeAll(all);
  void upsertPrivateEntry('payout', id, { ...data, id }).catch(() => {});
}

export function deleteOverride(id: string) {
  const all = readAll();
  delete all[id];
  writeAll(all);
  void deletePrivateEntry('payout', id).catch(() => {});
}

// seed payouts can't be removed from the source array at runtime, so
// deletion is tracked as a separate id blocklist rather than an override
export function deletePayout(id: string) {
  const deleted = readDeleted();
  deleted.add(id);
  writeDeleted(deleted);
  deleteOverride(id);
}

export function getEffectivePayout(seed: Payout): Payout {
  const override = getOverride(seed.id);
  return override ? { ...seed, ...override } : seed;
}

export function getAllPayouts(): Payout[] {
  const overrides = readAll();
  const deleted = readDeleted();
  return Object.entries(overrides)
    .filter(([id]) => !deleted.has(id))
    .map(([id, override]) => ({ ...createBlankPayout(id), ...override }))
    .filter((payout) => payout.programId.trim() !== '' || payout.amount > 0);
}
