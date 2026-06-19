'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { ArrowUpRight, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getAllPrograms } from '@/lib/programOverrides';
import { createBlankFinding } from '@/lib/findings-data';
import { saveOverride as saveFindingOverride } from '@/lib/findingOverrides';
import {
  getAllLeads,
  saveLead,
  updateLeadStatus,
  type BountyLead,
  type LeadStatus,
} from '@/lib/bounty-leads';
import type { Program } from '@/lib/bounty-data';
import styles from './Bounty.module.css';

const ALL = 'todos';
const STATUSES: LeadStatus[] = ['aberto', 'virou finding', 'descartado'];

function formatLeadDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

export default function BountyLeads() {
  const router = useRouter();
  const [leads, setLeads] = useState<BountyLead[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [note, setNote] = useState('');
  const [programId, setProgramId] = useState('');
  const [asset, setAsset] = useState('');
  const [tag, setTag] = useState('');
  const [statusFilter, setStatusFilter] = useState(ALL);
  const [tagFilter, setTagFilter] = useState(ALL);

  useEffect(() => {
    // Private data is persisted locally and is only available in the browser.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLeads(getAllLeads());
    setPrograms(getAllPrograms());
  }, []);

  const programName = (id: string) => programs.find((program) => program.id === id)?.name || id;

  const availableTags = useMemo(
    () => Array.from(new Set(leads.flatMap((lead) => lead.tags))).sort(),
    [leads],
  );

  const filteredLeads = useMemo(
    () =>
      leads.filter(
        (lead) =>
          (statusFilter === ALL || lead.status === statusFilter) &&
          (tagFilter === ALL || lead.tags.includes(tagFilter)),
      ),
    [leads, statusFilter, tagFilter],
  );

  const captureLead = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const cleanNote = note.trim();
    if (!cleanNote) return;

    const nextLead: BountyLead = {
      id: `lead-${Date.now()}`,
      note: cleanNote,
      programId,
      asset: asset.trim(),
      tags: tag
        .split(',')
        .map((value) => value.trim().replace(/^#/, '').toLowerCase())
        .filter(Boolean),
      status: 'aberto',
      createdAt: new Date().toISOString(),
    };

    setLeads(saveLead(nextLead));
    setNote('');
    setAsset('');
    setTag('');
  };

  const changeStatus = (id: string, status: LeadStatus) => {
    setLeads(updateLeadStatus(id, status));
  };

  const promoteToFinding = (lead: BountyLead) => {
    const findingId = `finding-${Date.now()}`;
    saveFindingOverride(findingId, {
      ...createBlankFinding(findingId),
      title: lead.note,
      programId: lead.programId,
      asset: lead.asset,
      status: 'lead',
    });
    setLeads(updateLeadStatus(lead.id, 'virou finding'));
    router.push(`/bounty/findings?edit=${encodeURIComponent(findingId)}`);
  };

  return (
    <>
      <section className={styles.toolbarRow}>
        <div>
          <div className={styles.eyebrow}>bug bounty</div>
          <h1 className={styles.title}>Leads / notas</h1>
          <p className={styles.subtitle}>Capture hipóteses enquanto elas ainda estão frescas.</p>
        </div>
      </section>

      <form onSubmit={captureLead} className={styles.leadCapture}>
        <label className={styles.leadNoteField}>
          <span className={styles.formLabel}>captura rápida</span>
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Anote uma hipótese, comportamento estranho ou próximo teste…"
            className={styles.leadNoteInput}
            rows={2}
            autoFocus
          />
        </label>
        <div className={styles.leadCaptureMeta}>
          <select
            value={programId}
            onChange={(event) => setProgramId(event.target.value)}
            className={styles.leadMetaInput}
            aria-label="Programa opcional"
          >
            <option value="">programa opcional</option>
            {programs.map((program) => (
              <option key={program.id} value={program.id}>{program.name}</option>
            ))}
          </select>
          <input
            value={asset}
            onChange={(event) => setAsset(event.target.value)}
            placeholder="asset opcional"
            className={`${styles.leadMetaInput} ${styles.leadMonoInput}`}
          />
          <input
            value={tag}
            onChange={(event) => setTag(event.target.value)}
            placeholder="tags: auth, api"
            className={styles.leadMetaInput}
          />
          <button type="submit" className={styles.leadAddButton} disabled={!note.trim()}>
            <Plus size={14} />
            adicionar
          </button>
        </div>
      </form>

      <section className={styles.leadListHead}>
        <div>
          <h2 className={styles.sectionTitle}>Feed</h2>
          <span className={styles.sectionMeta}>{filteredLeads.length} notas</span>
        </div>
        <div className={styles.filtersRow}>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className={styles.filterSelect}
          >
            <option value={ALL}>todos os status</option>
            {STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
          <select
            value={tagFilter}
            onChange={(event) => setTagFilter(event.target.value)}
            className={styles.filterSelect}
          >
            <option value={ALL}>todas as tags</option>
            {availableTags.map((value) => <option key={value} value={value}>#{value}</option>)}
          </select>
        </div>
      </section>

      <section className={styles.leadFeed} aria-label="Leads e notas">
        {filteredLeads.length === 0 && (
          <div className={styles.emptyState}>nenhuma nota encontrada com esses filtros.</div>
        )}
        {filteredLeads.map((lead) => (
          <article key={lead.id} className={styles.leadRow}>
            <time dateTime={lead.createdAt} className={styles.leadDate}>{formatLeadDate(lead.createdAt)}</time>
            <div className={styles.leadBody}>
              <p className={styles.leadText}>{lead.note}</p>
              <div className={styles.leadContext}>
                {lead.programId && <span>{programName(lead.programId)}</span>}
                {lead.asset && <code>{lead.asset}</code>}
                {lead.tags.map((value) => <span key={value} className={styles.leadTag}>#{value}</span>)}
              </div>
            </div>
            <div className={styles.leadActions}>
              <select
                value={lead.status}
                onChange={(event) => changeStatus(lead.id, event.target.value as LeadStatus)}
                className={`${styles.leadStatus} ${styles[`leadStatus${lead.status.replace(' ', '')}`]}`}
                aria-label={`Status de ${lead.note}`}
              >
                {STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
              </select>
              {lead.status !== 'virou finding' && (
                <button type="button" onClick={() => promoteToFinding(lead)} className={styles.leadPromoteButton}>
                  promover a finding
                  <ArrowUpRight size={13} />
                </button>
              )}
            </div>
          </article>
        ))}
      </section>
    </>
  );
}
