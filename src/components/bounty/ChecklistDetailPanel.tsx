'use client';

import { useEffect, useRef, useState } from 'react';
import { Plus, X } from 'lucide-react';
import ConfirmModal from '@/components/site/ConfirmModal';
import type { Program } from '@/lib/bounty-data';
import {
  checklistProgress,
  STAGES,
  STAGE_LABELS,
  TARGET_TYPES,
  TARGET_TYPE_LABELS,
  type Checklist,
  type ChecklistItem,
  type ChecklistStage,
} from '@/lib/checklists-data';
import { saveOverride } from '@/lib/checklistOverrides';
import styles from './Bounty.module.css';

const AUTOSAVE_DELAY = 1200;

export default function ChecklistDetailPanel({
  checklist,
  programs,
  isNew = false,
  onChange,
  onClose,
  onApply,
  onDelete,
}: {
  checklist: Checklist;
  programs: Program[];
  isNew?: boolean;
  onChange: (updated: Checklist) => void;
  onClose: () => void;
  onApply: (checklist: Checklist, programId: string) => void;
  onDelete?: (id: string) => void;
}) {
  const [draft, setDraft] = useState(checklist);
  const [saved, setSaved] = useState(false);
  const [applyProgramId, setApplyProgramId] = useState('');
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const nextItemId = useRef(0);

  useEffect(() => {
    // a new checklist is only persisted/added to the list once the user
    // explicitly finalizes it — typing alone must not leak it into the table
    if (isNew) return;
    onChange(draft);
    const id = window.setTimeout(() => {
      saveOverride(draft.id, draft);
      setSaved(true);
    }, AUTOSAVE_DELAY);
    return () => window.clearTimeout(id);
  }, [draft, isNew, onChange]);

  const update = (patch: Partial<Checklist>) => {
    setSaved(false);
    setDraft((current) => ({ ...current, ...patch }));
  };

  const save = () => {
    saveOverride(draft.id, draft);
    setSaved(true);
    if (isNew) onChange(draft);
  };

  const updateItem = (itemId: string, patch: Partial<ChecklistItem>) => {
    update({ items: draft.items.map((i) => (i.id === itemId ? { ...i, ...patch } : i)) });
  };

  const removeItem = (itemId: string) => {
    update({ items: draft.items.filter((i) => i.id !== itemId) });
  };

  const addItem = (stage: ChecklistStage) => {
    nextItemId.current += 1;
    const newItem: ChecklistItem = { id: `${draft.id}-new-${nextItemId.current}`, stage, text: '', checked: false };
    update({ items: [...draft.items, newItem] });
  };

  const progress = checklistProgress(draft);
  const progressPct = progress.total > 0 ? Math.round((progress.checked / progress.total) * 100) : 0;
  const appliedProgram = draft.programId ? programs.find((p) => p.id === draft.programId) : undefined;

  const handleDelete = () => {
    if (!onDelete) return;
    setConfirmingDelete(true);
  };

  return (
    <div className={styles.reportPanel}>
      <ConfirmModal
        open={confirmingDelete}
        title="Excluir checklist"
        message="Excluir esta checklist? Essa ação não pode ser desfeita."
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
        <span className={styles.breadcrumbCurrent}>{draft.title || 'nova checklist'}</span>
        <div className={`${styles.topBarRight} ${styles.topBarRightCorner}`}>
          {!isNew && onDelete && (
            <button type="button" onClick={handleDelete} className={styles.deleteButton}>excluir</button>
          )}
          <button type="button" onClick={save} className={styles.saveButton}>
            {isNew ? 'criar checklist' : 'salvar'}
          </button>
        </div>
      </div>
      <div className={styles.autosaveRow}>{saved && !isNew ? 'salvo há instantes' : ''}</div>

      <input
        type="text"
        value={draft.title}
        onChange={(event) => update({ title: event.target.value })}
        placeholder="Título da checklist"
        className={styles.titleFieldSmall}
      />

      <div className={styles.reportMetaGrid}>
        <label className={styles.formField}>
          <span className={styles.formLabel}>tipo de alvo</span>
          <select
            value={draft.targetType}
            onChange={(event) => update({ targetType: event.target.value as Checklist['targetType'] })}
            className={styles.formSelect}
          >
            {TARGET_TYPES.map((type) => (
              <option key={type} value={type}>{TARGET_TYPE_LABELS[type]}</option>
            ))}
          </select>
        </label>

        <div className={styles.formField}>
          <span className={styles.formLabel}>progresso</span>
          <div className={styles.checklistProgressRow}>
            <div className={styles.checklistProgressTrack}>
              <div className={styles.checklistProgressFill} style={{ width: `${progressPct}%` }} />
            </div>
            <span className={styles.checklistProgressLabel}>{progress.checked}/{progress.total}</span>
          </div>
        </div>
      </div>

      {!isNew && (
        <div className={styles.promoteRow}>
          {appliedProgram ? (
            <p className={styles.promoteNote}>
              Esta checklist é uma cópia aplicada ao programa <strong>{appliedProgram.name || appliedProgram.id}</strong>.
            </p>
          ) : (
            <>
              <select
                value={applyProgramId}
                onChange={(event) => setApplyProgramId(event.target.value)}
                className={styles.formSelect}
              >
                <option value="">selecione um programa</option>
                {programs.map((program) => (
                  <option key={program.id} value={program.id}>{program.name || program.id}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => applyProgramId && onApply(draft, applyProgramId)}
                disabled={!applyProgramId}
                className={styles.saveButton}
              >
                aplicar a um programa
              </button>
              <p className={styles.promoteNote}>
                Cria uma cópia desta checklist com todos os itens desmarcados, vinculada ao programa escolhido.
              </p>
            </>
          )}
        </div>
      )}

      <div className={styles.checklistStages}>
        {STAGES.map((stage) => {
          const stageItems = draft.items.filter((i) => i.stage === stage);
          return (
            <div key={stage} className={styles.checklistStageGroup}>
              <div className={styles.checklistStageHead}>{STAGE_LABELS[stage]}</div>
              <div className={styles.checklistItemsList}>
                {stageItems.map((checklistItem) => (
                  <div key={checklistItem.id} className={styles.checklistItemRow}>
                    <input
                      type="checkbox"
                      checked={checklistItem.checked}
                      onChange={(event) => updateItem(checklistItem.id, { checked: event.target.checked })}
                      className={styles.checklistCheckbox}
                    />
                    <input
                      type="text"
                      value={checklistItem.text}
                      onChange={(event) => updateItem(checklistItem.id, { text: event.target.value })}
                      placeholder="descreva o item..."
                      className={checklistItem.checked ? styles.checklistItemInputDone : styles.checklistItemInput}
                    />
                    <button
                      type="button"
                      onClick={() => removeItem(checklistItem.id)}
                      className={styles.removeStepButton}
                      aria-label="Remover item"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
                {stageItems.length === 0 && (
                  <div className={styles.kanbanEmpty}>nenhum item nesta etapa.</div>
                )}
              </div>
              <button type="button" onClick={() => addItem(stage)} className={styles.addStepButton}>
                <Plus size={13} />
                adicionar item
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
