import { createClient } from './supabase/client';

export type SiteSettings = {
  tagline: string;
  githubUrl: string;
  linkedinUrl: string;
  rssUrl: string;
};

const STORAGE_KEY = 'shellnotes-site-settings';

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  tagline: 'notas de campo sobre segurança ofensiva',
  githubUrl: '#',
  linkedinUrl: '#',
  rssUrl: '#',
};

const listeners = new Set<() => void>();

export function getSiteSettings(): SiteSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULT_SITE_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SITE_SETTINGS;
  } catch {
    return DEFAULT_SITE_SETTINGS;
  }
}

export function saveSiteSettings(settings: SiteSettings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // localStorage unavailable or quota exceeded
  }
  listeners.forEach((listener) => listener());
  const supabase = createClient();
  void supabase
    .from('site_settings')
    .upsert({ setting_key: 'general', data: settings }, { onConflict: 'setting_key' });
}

export function subscribeSiteSettings(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export async function getRemoteSiteSettings(): Promise<SiteSettings | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('site_settings')
    .select('data')
    .eq('setting_key', 'general')
    .maybeSingle();
  if (error || !data) return null;
  return { ...DEFAULT_SITE_SETTINGS, ...(data.data as Partial<SiteSettings>) };
}
