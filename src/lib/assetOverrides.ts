import { createBlankAsset, type Asset } from './assets-data';
import { deletePrivateEntry, upsertPrivateEntry } from './supabase/private';

const STORAGE_KEY = 'shellnotes-asset-overrides-v2';
const DELETED_KEY = 'shellnotes-asset-deleted-v2';

export type AssetOverride = Partial<Omit<Asset, 'id'>>;

function readAll(): Record<string, AssetOverride> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeAll(data: Record<string, AssetOverride>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // localStorage unavailable or quota exceeded
  }
}

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

export function getOverride(id: string): AssetOverride | undefined {
  return readAll()[id];
}

export function saveOverride(id: string, data: AssetOverride) {
  const all = readAll();
  all[id] = { ...all[id], ...data };
  writeAll(all);
  void upsertPrivateEntry('asset', id, { ...data, id }).catch(() => {});
}

export function deleteOverride(id: string) {
  const all = readAll();
  delete all[id];
  writeAll(all);
  void deletePrivateEntry('asset', id).catch(() => {});
}

// seed assets can't be removed from the source array at runtime, so
// deletion is tracked as a separate id blocklist rather than an override
export function deleteAsset(id: string) {
  const deleted = readDeleted();
  deleted.add(id);
  writeDeleted(deleted);
  deleteOverride(id);
}

export function getEffectiveAsset(seed: Asset): Asset {
  const override = getOverride(seed.id);
  return override ? { ...seed, ...override } : seed;
}

export function getAllAssets(): Asset[] {
  const overrides = readAll();
  const deleted = readDeleted();
  return Object.entries(overrides)
    .filter(([id]) => !deleted.has(id))
    .map(([id, override]) => ({ ...createBlankAsset(id), ...override }))
    .filter((asset) => asset.host.trim() !== '');
}
