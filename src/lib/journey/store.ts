import { listPrivateEntries, upsertPrivateEntry } from '@/lib/supabase/private';
import { EMPTY_JOURNEY, type JourneyData } from './types';

const CACHE_KEY = 'shellnotes-journey';
const ENTRY_KEY = 'main';

function readCache(): JourneyData {
  if (typeof window === 'undefined') return EMPTY_JOURNEY;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? { ...EMPTY_JOURNEY, ...(JSON.parse(raw) as JourneyData) } : EMPTY_JOURNEY;
  } catch {
    return EMPTY_JOURNEY;
  }
}

function writeCache(data: JourneyData) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch {
    /* storage unavailable */
  }
}

export async function loadJourney(): Promise<JourneyData> {
  const cached = readCache();
  try {
    const rows = await listPrivateEntries<JourneyData>('journey');
    const remote = rows.find((row) => row.entryKey === ENTRY_KEY)?.data;
    if (remote && (!cached.updatedAt || remote.updatedAt >= cached.updatedAt)) {
      const data = { ...EMPTY_JOURNEY, ...remote };
      writeCache(data);
      return data;
    }
  } catch {
    /* use offline cache */
  }
  return cached;
}

export async function saveJourney(data: JourneyData): Promise<boolean> {
  writeCache(data);
  try {
    await upsertPrivateEntry('journey', ENTRY_KEY, data);
    return true;
  } catch {
    return false;
  }
}
