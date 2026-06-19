import { upsertPrivateEntry } from './supabase/private';

export type LeadStatus = 'aberto' | 'virou finding' | 'descartado';

export type BountyLead = {
  id: string;
  note: string;
  programId: string;
  asset: string;
  tags: string[];
  status: LeadStatus;
  createdAt: string;
};

const STORAGE_KEY = 'shellnotes-bounty-leads';

function readStored(): BountyLead[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeAll(leads: BountyLead[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(leads));
  } catch {
    // localStorage unavailable or quota exceeded
  }
}

export function getAllLeads(): BountyLead[] {
  return readStored() ?? [];
}

export function saveLead(lead: BountyLead): BountyLead[] {
  const current = getAllLeads();
  const exists = current.some((item) => item.id === lead.id);
  const next = exists
    ? current.map((item) => (item.id === lead.id ? lead : item))
    : [lead, ...current];
  writeAll(next);
  void upsertPrivateEntry('lead', lead.id, lead).catch(() => {});
  return next;
}

export function updateLeadStatus(id: string, status: LeadStatus): BountyLead[] {
  const next = getAllLeads().map((lead) => (lead.id === id ? { ...lead, status } : lead));
  writeAll(next);
  const updated = next.find((lead) => lead.id === id);
  if (updated) void upsertPrivateEntry('lead', id, updated).catch(() => {});
  return next;
}
