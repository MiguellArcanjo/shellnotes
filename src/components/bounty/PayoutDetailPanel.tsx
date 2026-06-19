'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import ConfirmModal from '@/components/site/ConfirmModal';
import type { Program } from '@/lib/bounty-data';
import type { Finding } from '@/lib/findings-data';
import { formatAmount, PAYOUT_STATUSES, type Payout } from '@/lib/payouts-data';
import { saveOverride } from '@/lib/payoutOverrides';
import type { Report } from '@/lib/reports-data';
import styles from './Bounty.module.css';

const AUTOSAVE_DELAY = 1200;

export default function PayoutDetailPanel({
  payout,
  programs,
  findings,
  reports,
  isNew = false,
  onChange,
  onClose,
  onDelete,
}: {
  payout: Payout;
  programs: Program[];
  findings: Finding[];
  reports: Report[];
  isNew?: boolean;
  onChange: (updated: Payout) => void;
  onClose: () => void;
  onDelete?: (id: string) => void;
}) {
  const [draft, setDraft] = useState(payout);
  const [saved, setSaved] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  useEffect(() => {
    // a new payout is only persisted/added to the table once the user
    // explicitly clicks "criar payout" — typing alone must not leak it in
    if (isNew) return;
    onChange(draft);
    const id = window.setTimeout(() => {
      saveOverride(draft.id, draft);
      setSaved(true);
    }, AUTOSAVE_DELAY);
    return () => window.clearTimeout(id);
  }, [draft, isNew, onChange]);

  const update = (patch: Partial<Payout>) => {
    setSaved(false);
    setDraft((current) => ({ ...current, ...patch }));
  };

  const save = () => {
    saveOverride(draft.id, draft);
    setSaved(true);
    if (isNew) onChange(draft);
  };

  const relatedFindings = draft.programId ? findings.filter((f) => f.programId === draft.programId) : findings;
  const relatedReports = draft.programId ? reports.filter((r) => r.programId === draft.programId) : reports;

  const handleDelete = () => {
    if (!onDelete) return;
    setConfirmingDelete(true);
  };

  return (
    <div className={styles.reportPanel}>
      <ConfirmModal
        open={confirmingDelete}
        title="Excluir payout"
        message="Excluir este payout? Essa ação não pode ser desfeita."
        onConfirm={() => {
          setConfirmingDelete(false);
          onDelete?.(draft.id);
        }}
        onCancel={() => setConfirmingDelete(false)}
      />
      <button type="button" onClick={onClose} className={styles.panelCloseButton} aria-label="Fechar painel">
        <X size={15} />
      </button>
      <div className={styles.editorTopBar}>
        <span className={styles.breadcrumbCurrent}>
          {isNew ? 'novo payout' : `${draft.currency} ${formatAmount(draft.amount)}`}
        </span>
        <div className={`${styles.topBarRight} ${styles.topBarRightCorner}`}>
          {!isNew && onDelete && (
            <button type="button" onClick={handleDelete} className={styles.deleteButton}>excluir</button>
          )}
          <button type="button" onClick={save} className={styles.saveButton}>
            {isNew ? 'criar payout' : 'salvar'}
          </button>
        </div>
      </div>
      <div className={styles.autosaveRow}>{saved && !isNew ? 'salvo há instantes' : ''}</div>

      <div className={styles.reportMetaGrid}>
        <label className={styles.formField}>
          <span className={styles.formLabel}>programa</span>
          <select
            value={draft.programId}
            onChange={(event) => update({ programId: event.target.value, findingId: '', reportId: '' })}
            className={styles.formSelect}
          >
            <option value="">selecione um programa</option>
            {programs.map((program) => (
              <option key={program.id} value={program.id}>{program.name || program.id}</option>
            ))}
          </select>
        </label>

        <label className={styles.formField}>
          <span className={styles.formLabel}>status</span>
          <select
            value={draft.status}
            onChange={(event) => update({ status: event.target.value as Payout['status'] })}
            className={styles.formSelect}
          >
            {PAYOUT_STATUSES.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </label>

        <label className={styles.formField}>
          <span className={styles.formLabel}>finding vinculado</span>
          <select
            value={draft.findingId}
            onChange={(event) => update({ findingId: event.target.value })}
            className={styles.formSelect}
          >
            <option value="">nenhum</option>
            {relatedFindings.map((finding) => (
              <option key={finding.id} value={finding.id}>{finding.title || finding.id}</option>
            ))}
          </select>
        </label>

        <label className={styles.formField}>
          <span className={styles.formLabel}>report vinculado</span>
          <select
            value={draft.reportId}
            onChange={(event) => update({ reportId: event.target.value })}
            className={styles.formSelect}
          >
            <option value="">nenhum</option>
            {relatedReports.map((report) => (
              <option key={report.id} value={report.id}>{report.title || report.id}</option>
            ))}
          </select>
        </label>

        <label className={styles.formField}>
          <span className={styles.formLabel}>moeda</span>
          <input
            value={draft.currency}
            onChange={(event) => update({ currency: event.target.value })}
            placeholder="US$, €..."
            className={styles.formInput}
          />
        </label>

        <label className={styles.formField}>
          <span className={styles.formLabel}>valor</span>
          <input
            type="number"
            min={0}
            value={draft.amount || ''}
            onChange={(event) => update({ amount: Number(event.target.value) || 0 })}
            placeholder="0"
            className={styles.formInput}
          />
        </label>

        <label className={styles.formField}>
          <span className={styles.formLabel}>data</span>
          <input
            type="date"
            value={draft.date}
            onChange={(event) => update({ date: event.target.value })}
            className={styles.formInput}
          />
        </label>
      </div>
    </div>
  );
}
