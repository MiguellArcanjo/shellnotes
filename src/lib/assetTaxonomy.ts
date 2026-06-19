import { ASSET_STATUSES, PRIORITIES } from './assets-data';
import { createClient } from './supabase/client';

export type TaxonomyKind = 'statuses' | 'priorities';

export type TaxonomyValue = {
  id: string;
  label: string;
  color: string;
};

export type AssetTaxonomy = {
  statuses: TaxonomyValue[];
  priorities: TaxonomyValue[];
};

const STORAGE_KEY = 'shellnotes-asset-taxonomy';
const SETTING_KEY = 'asset-taxonomy';

// Defaults reuse theme CSS variables so they keep matching the rest of the
// bounty UI in both light and dark mode; custom values added later fall back
// to a fixed hex palette (see COLOR_PALETTE) since they aren't theme-aware.
const DEFAULT_STATUS_COLORS: Record<string, string> = {
  'não testado': 'var(--secondary)',
  'em andamento': 'var(--severity-medium)',
  testado: 'var(--accent)',
  interessante: 'var(--severity-high)',
  morto: 'var(--secondary)',
};

const DEFAULT_PRIORITY_COLORS: Record<string, string> = {
  baixa: 'var(--severity-low)',
  média: 'var(--severity-medium)',
  alta: 'var(--severity-high)',
  crítica: 'var(--severity-critical)',
};

export const COLOR_PALETTE = [
  '#C2553F',
  '#CC7A3B',
  '#C2A03B',
  '#5E9E73',
  '#3E7A8E',
  '#6B5EA8',
  '#A85EA0',
  '#76746C',
];

export const DEFAULT_TAXONOMY: AssetTaxonomy = {
  statuses: ASSET_STATUSES.map((label) => ({
    id: label,
    label,
    color: DEFAULT_STATUS_COLORS[label] ?? 'var(--secondary)',
  })),
  priorities: PRIORITIES.map((label) => ({
    id: label,
    label,
    color: DEFAULT_PRIORITY_COLORS[label] ?? 'var(--secondary)',
  })),
};

function mergeTaxonomy(partial: Partial<AssetTaxonomy> | null | undefined): AssetTaxonomy {
  return {
    statuses: partial?.statuses?.length ? partial.statuses : DEFAULT_TAXONOMY.statuses,
    priorities: partial?.priorities?.length ? partial.priorities : DEFAULT_TAXONOMY.priorities,
  };
}

const listeners = new Set<() => void>();

export function getAssetTaxonomy(): AssetTaxonomy {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? mergeTaxonomy(JSON.parse(raw)) : DEFAULT_TAXONOMY;
  } catch {
    return DEFAULT_TAXONOMY;
  }
}

export function saveAssetTaxonomy(taxonomy: AssetTaxonomy) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(taxonomy));
  } catch {
    // localStorage unavailable or quota exceeded
  }
  listeners.forEach((listener) => listener());
  const supabase = createClient();
  void supabase
    .from('site_settings')
    .upsert({ setting_key: SETTING_KEY, data: taxonomy }, { onConflict: 'setting_key' });
}

export function subscribeAssetTaxonomy(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export async function getRemoteAssetTaxonomy(): Promise<AssetTaxonomy | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('site_settings')
    .select('data')
    .eq('setting_key', SETTING_KEY)
    .maybeSingle();
  if (error || !data) return null;
  return mergeTaxonomy(data.data as Partial<AssetTaxonomy>);
}

function slugifyId(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function addTaxonomyValue(taxonomy: AssetTaxonomy, kind: TaxonomyKind, label: string, color: string): AssetTaxonomy {
  const trimmed = label.trim();
  if (!trimmed) return taxonomy;
  const id = slugifyId(trimmed) || `valor-${Date.now()}`;
  if (taxonomy[kind].some((v) => v.id === id)) return taxonomy;
  return { ...taxonomy, [kind]: [...taxonomy[kind], { id, label: trimmed, color }] };
}

export function renameTaxonomyValue(taxonomy: AssetTaxonomy, kind: TaxonomyKind, id: string, label: string): AssetTaxonomy {
  const trimmed = label.trim();
  if (!trimmed) return taxonomy;
  return {
    ...taxonomy,
    [kind]: taxonomy[kind].map((v) => (v.id === id ? { ...v, label: trimmed } : v)),
  };
}

export function recolorTaxonomyValue(taxonomy: AssetTaxonomy, kind: TaxonomyKind, id: string, color: string): AssetTaxonomy {
  return {
    ...taxonomy,
    [kind]: taxonomy[kind].map((v) => (v.id === id ? { ...v, color } : v)),
  };
}

export function removeTaxonomyValue(taxonomy: AssetTaxonomy, kind: TaxonomyKind, id: string): AssetTaxonomy {
  return { ...taxonomy, [kind]: taxonomy[kind].filter((v) => v.id !== id) };
}

export function getTaxonomyValue(taxonomy: AssetTaxonomy, kind: TaxonomyKind, id: string): TaxonomyValue {
  return taxonomy[kind].find((v) => v.id === id) ?? { id, label: id, color: 'var(--secondary)' };
}
