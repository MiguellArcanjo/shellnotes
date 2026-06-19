'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import type { Program } from '@/lib/bounty-data';
import { getAllPrograms } from '@/lib/programOverrides';
import {
  checklistProgress,
  cloneChecklistForProgram,
  createBlankChecklist,
  TARGET_TYPES,
  TARGET_TYPE_LABELS,
  type Checklist,
} from '@/lib/checklists-data';
import { deleteChecklist, getAllChecklists, saveOverride } from '@/lib/checklistOverrides';
import ChecklistDetailPanel from './ChecklistDetailPanel';
import styles from './Bounty.module.css';

const TODOS = 'todos';

export default function ChecklistsPage() {
  const [items, setItems] = useState<Checklist[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draftChecklist, setDraftChecklist] = useState<Checklist | null>(null);
  const [typeFilter, setTypeFilter] = useState(TODOS);

  useEffect(() => {
    // overrides are stored locally and only exist in the browser
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setItems(getAllChecklists());
    setPrograms(getAllPrograms());
  }, []);

  const programName = (programId: string) => programs.find((p) => p.id === programId)?.name || programId;

  const filtered = useMemo(
    () => items.filter((c) => typeFilter === TODOS || c.targetType === typeFilter),
    [items, typeFilter],
  );

  const selected = items.find((c) => c.id === selectedId) || null;
  const panelChecklist = draftChecklist || selected;

  const handleCreate = () => {
    setSelectedId(null);
    setDraftChecklist(createBlankChecklist(`checklist-${Date.now()}`));
  };

  const handleSelect = (id: string) => {
    setDraftChecklist(null);
    setSelectedId(id);
  };

  const handleClosePanel = () => {
    setDraftChecklist(null);
    setSelectedId(null);
  };

  const handleUpdate = useCallback((updated: Checklist) => {
    setItems((current) => current.map((c) => (c.id === updated.id ? updated : c)));
  }, []);

  // only invoked when the user explicitly finalizes a new checklist — this is
  // what makes it show up in the list, mirroring the payouts creation flow
  const handleFinalizeCreate = useCallback((created: Checklist) => {
    setItems((current) => [created, ...current]);
    setDraftChecklist(null);
    setSelectedId(created.id);
  }, []);

  const handleApply = useCallback((template: Checklist, programId: string) => {
    const applied = cloneChecklistForProgram(template, programId, `checklist-applied-${Date.now()}`);
    saveOverride(applied.id, applied);
    setItems((current) => [applied, ...current]);
    setDraftChecklist(null);
    setSelectedId(applied.id);
  }, []);

  const handleDelete = useCallback((id: string) => {
    deleteChecklist(id);
    setItems((current) => current.filter((checklist) => checklist.id !== id));
    setSelectedId(null);
    setDraftChecklist(null);
  }, []);

  return (
    <>
      <section className={styles.toolbarRow}>
        <div>
          <div className={styles.eyebrow}>bug bounty</div>
          <h1 className={styles.title}>Checklists</h1>
          <p className={styles.subtitle}>Metodologia reutilizável por tipo de alvo, com cópias aplicáveis a programas específicos.</p>
        </div>
        <button type="button" onClick={handleCreate} className={styles.newButtonAccent}>
          <Plus size={14} />
          nova checklist
        </button>
      </section>

      <section className={styles.filtersRow} aria-label="Filtros">
        <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} className={styles.filterSelect}>
          <option value={TODOS}>todos os tipos de alvo</option>
          {TARGET_TYPES.map((type) => (
            <option key={type} value={type}>{TARGET_TYPE_LABELS[type]}</option>
          ))}
        </select>
      </section>

      <section className={panelChecklist ? styles.payoutsLayoutSplit : styles.payoutsLayout} aria-label="Checklists">
        <div className={styles.reportsListCol}>
          {filtered.length === 0 && (
            <div className={styles.emptyState}>nenhuma checklist encontrada com esses filtros.</div>
          )}
          {filtered.map((checklist) => {
            const progress = checklistProgress(checklist);
            const pct = progress.total > 0 ? Math.round((progress.checked / progress.total) * 100) : 0;
            return (
              <button
                key={checklist.id}
                type="button"
                onClick={() => handleSelect(checklist.id)}
                className={`${styles.reportCard} ${selectedId === checklist.id ? styles.reportCardActive : ''}`}
              >
                <div className={styles.reportCardHead}>
                  <span className={styles.reportCardTitle}>{checklist.title || 'sem título'}</span>
                  <span className={styles.platformTag}>{TARGET_TYPE_LABELS[checklist.targetType]}</span>
                </div>
                <div className={styles.reportCardMeta}>
                  <span className={styles.reportCardProgram}>
                    {checklist.programId ? programName(checklist.programId).toUpperCase() : 'template reutilizável'}
                  </span>
                </div>
                <div className={styles.checklistProgressRow}>
                  <div className={styles.checklistProgressTrack}>
                    <div className={styles.checklistProgressFill} style={{ width: `${pct}%` }} />
                  </div>
                  <span className={styles.checklistProgressLabel}>{progress.checked}/{progress.total}</span>
                </div>
              </button>
            );
          })}
        </div>

        {panelChecklist && (
          <div className={styles.reportDetailCol}>
            <ChecklistDetailPanel
              key={panelChecklist.id}
              checklist={panelChecklist}
              programs={programs}
              isNew={!!draftChecklist}
              onChange={draftChecklist ? handleFinalizeCreate : handleUpdate}
              onClose={handleClosePanel}
              onApply={handleApply}
              onDelete={handleDelete}
            />
          </div>
        )}
      </section>
    </>
  );
}
