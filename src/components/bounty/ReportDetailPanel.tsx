'use client';

import { useEffect, useState } from 'react';
import { Plus, X } from 'lucide-react';
import WriteupBody from '@/components/writeups/WriteupBody';
import type { Program } from '@/lib/bounty-data';
import type { Finding } from '@/lib/findings-data';
import { REPORT_STATUSES, type Report, type TimelineEntry } from '@/lib/reports-data';
import { saveOverride } from '@/lib/reportOverrides';
import ReportStatusTag from './ReportStatusTag';
import styles from './Bounty.module.css';

const AUTOSAVE_DELAY = 1200;

export default function ReportDetailPanel({
  report,
  programs,
  findings,
  onChange,
  onClose,
}: {
  report: Report;
  programs: Program[];
  findings: Finding[];
  onChange: (updated: Report) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState(report);
  const [saved, setSaved] = useState(false);
  const [bodyView, setBodyView] = useState<'editar' | 'previa'>('editar');

  useEffect(() => {
    onChange(draft);
    const id = window.setTimeout(() => {
      saveOverride(draft.id, draft);
      setSaved(true);
    }, AUTOSAVE_DELAY);
    return () => window.clearTimeout(id);
  }, [draft, onChange]);

  const update = (patch: Partial<Report>) => {
    setSaved(false);
    setDraft((current) => ({ ...current, ...patch }));
  };

  const updateTimelineEntry = (index: number, patch: Partial<TimelineEntry>) => {
    update({ timeline: draft.timeline.map((entry, i) => (i === index ? { ...entry, ...patch } : entry)) });
  };

  const save = () => {
    saveOverride(draft.id, draft);
    setSaved(true);
  };

  const relatedFindings = draft.programId ? findings.filter((f) => f.programId === draft.programId) : findings;

  return (
    <div className={styles.reportPanel}>
      <button type="button" onClick={onClose} className={styles.panelCloseButton} aria-label="Fechar painel">
        <X size={15} />
      </button>
      <div className={styles.editorTopBar}>
        <span className={styles.breadcrumbCurrent}>{draft.title || 'novo report'}</span>
        <div className={styles.topBarRight}>
          <button type="button" onClick={save} className={styles.saveButton}>salvar</button>
        </div>
      </div>
      <div className={styles.autosaveRow}>{saved ? 'salvo há instantes' : ''}</div>

      <input
        type="text"
        value={draft.title}
        onChange={(event) => update({ title: event.target.value })}
        placeholder="Título do report"
        className={styles.titleFieldSmall}
      />

      <div className={styles.reportMetaGrid}>
        <label className={styles.formField}>
          <span className={styles.formLabel}>programa</span>
          <select
            value={draft.programId}
            onChange={(event) => update({ programId: event.target.value, findingId: '' })}
            className={styles.formSelect}
          >
            <option value="">selecione um programa</option>
            {programs.map((program) => (
              <option key={program.id} value={program.id}>{program.name || program.id}</option>
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
          <span className={styles.formLabel}>data de submissão</span>
          <input
            type="date"
            value={draft.submittedAt}
            onChange={(event) => update({ submittedAt: event.target.value })}
            className={styles.formInput}
          />
        </label>

        <div className={styles.formField}>
          <span className={styles.formLabel}>status</span>
          <div className={styles.severityFieldRow}>
            <select
              value={draft.status}
              onChange={(event) => update({ status: event.target.value as Report['status'] })}
              className={styles.formSelect}
            >
              {REPORT_STATUSES.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
            <ReportStatusTag status={draft.status} />
          </div>
        </div>

        <label className={styles.formFieldWide}>
          <span className={styles.formLabel}>bounty</span>
          <input
            value={draft.bounty}
            onChange={(event) => update({ bounty: event.target.value })}
            placeholder="ex: US$ 2.400, pendente, reconhecimento público..."
            className={styles.formInput}
          />
        </label>
      </div>

      <div className={styles.formFieldWide}>
        <div className={styles.bodyHead}>
          <span className={styles.formLabel}>corpo do report (markdown)</span>
          <div className={styles.viewToggleGroup}>
            {(['editar', 'previa'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setBodyView(mode)}
                className={bodyView === mode ? styles.viewToggleActive : styles.viewToggleInactive}
              >
                {mode === 'previa' ? 'prévia' : mode}
              </button>
            ))}
          </div>
        </div>
        {bodyView === 'editar' ? (
          <textarea
            value={draft.body}
            onChange={(event) => update({ body: event.target.value })}
            placeholder={'## Passos de reprodução\n\n...\n\n## Impacto\n\n...\n\n## Remediação\n\n...'}
            spellCheck={false}
            className={styles.reportBodyTextarea}
          />
        ) : (
          <div className={styles.reportBodyPreview}>
            <WriteupBody content={draft.body} />
          </div>
        )}
      </div>

      <div className={styles.formFieldWide}>
        <span className={styles.formLabel}>timeline do triador</span>
        <div className={styles.timelineList}>
          {draft.timeline.map((entry, index) => (
            <div key={index} className={styles.timelineEntry}>
              <input
                type="date"
                value={entry.date}
                onChange={(event) => updateTimelineEntry(index, { date: event.target.value })}
                className={styles.timelineDateInput}
              />
              <textarea
                value={entry.comment}
                onChange={(event) => updateTimelineEntry(index, { comment: event.target.value })}
                placeholder="comentário do triador..."
                className={styles.timelineCommentInput}
              />
              <button
                type="button"
                onClick={() => update({ timeline: draft.timeline.filter((_, i) => i !== index) })}
                className={styles.removeStepButton}
                aria-label="Remover entrada da timeline"
              >
                <X size={14} />
              </button>
            </div>
          ))}
          {draft.timeline.length === 0 && (
            <div className={styles.kanbanEmpty}>nenhuma resposta do triador ainda.</div>
          )}
        </div>
        <button
          type="button"
          onClick={() => update({ timeline: [...draft.timeline, { date: '', comment: '' }] })}
          className={styles.addStepButton}
        >
          <Plus size={13} />
          adicionar entrada
        </button>
      </div>
    </div>
  );
}
