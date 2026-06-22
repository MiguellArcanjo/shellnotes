// Persistence for the study notebook. The DB (Supabase private_entries,
// owner-only) is the source of truth as the user asked. A localStorage cache is
// kept purely as an offline/instant-paint bridge and to avoid losing edits if a
// DB write fails (e.g. before the migration runs or while logged out) — every
// mutation reports whether the DB write succeeded so the UI can warn.

import {
  deletePrivateEntry,
  listPrivateEntries,
  upsertPrivateEntry,
} from '@/lib/supabase/private';
import type { PlanItem, StudyNote, StudySession } from './types';

const NOTES_CACHE = 'shellnotes-thm-notes';
const PLAN_CACHE = 'shellnotes-thm-plan';
const SESSIONS_CACHE = 'shellnotes-thm-sessions';

function readCache<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeCache<T>(key: string, value: T) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota / unavailable */
  }
}

// ---- notes ----------------------------------------------------------------

export async function loadNotes(): Promise<StudyNote[]> {
  const cached = readCache<Record<string, StudyNote>>(NOTES_CACHE, {});
  try {
    const rows = await listPrivateEntries<StudyNote>('study-note');
    for (const row of rows) {
      const remote = row.data;
      if (!remote?.slug) continue;
      const current = cached[remote.slug];
      if (!current || remote.updatedAt > current.updatedAt) cached[remote.slug] = remote;
    }
    writeCache(NOTES_CACHE, cached);
  } catch {
    /* keep cache */
  }
  return Object.values(cached).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function saveNote(note: StudyNote): Promise<boolean> {
  const cached = readCache<Record<string, StudyNote>>(NOTES_CACHE, {});
  cached[note.slug] = note;
  writeCache(NOTES_CACHE, cached);
  try {
    await upsertPrivateEntry('study-note', note.slug, note);
    return true;
  } catch {
    return false;
  }
}

export async function deleteNote(slug: string): Promise<void> {
  const cached = readCache<Record<string, StudyNote>>(NOTES_CACHE, {});
  delete cached[slug];
  writeCache(NOTES_CACHE, cached);
  await deletePrivateEntry('study-note', slug).catch(() => {});
}

// ---- plan (single document) -----------------------------------------------

export async function loadPlan(): Promise<PlanItem[]> {
  const cached = readCache<PlanItem[]>(PLAN_CACHE, []);
  try {
    const rows = await listPrivateEntries<{ items: PlanItem[] }>('study-plan');
    const remote = rows.find((row) => row.entryKey === 'plan');
    if (remote?.data?.items) {
      writeCache(PLAN_CACHE, remote.data.items);
      return remote.data.items;
    }
  } catch {
    /* keep cache */
  }
  return cached;
}

export async function savePlan(items: PlanItem[]): Promise<boolean> {
  writeCache(PLAN_CACHE, items);
  try {
    await upsertPrivateEntry('study-plan', 'plan', { items });
    return true;
  } catch {
    return false;
  }
}

// ---- sessions -------------------------------------------------------------

export async function loadSessions(): Promise<StudySession[]> {
  const cached = readCache<Record<string, StudySession>>(SESSIONS_CACHE, {});
  try {
    const rows = await listPrivateEntries<StudySession>('study-session');
    for (const row of rows) {
      if (row.data?.id) cached[row.data.id] = row.data;
    }
    writeCache(SESSIONS_CACHE, cached);
  } catch {
    /* keep cache */
  }
  return Object.values(cached).sort((a, b) => b.startedAt.localeCompare(a.startedAt));
}

export async function saveSession(session: StudySession): Promise<boolean> {
  const cached = readCache<Record<string, StudySession>>(SESSIONS_CACHE, {});
  cached[session.id] = session;
  writeCache(SESSIONS_CACHE, cached);
  try {
    await upsertPrivateEntry('study-session', session.id, session);
    return true;
  } catch {
    return false;
  }
}
