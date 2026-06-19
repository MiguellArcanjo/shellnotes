'use client';

import { useState, type DragEvent, type ReactNode } from 'react';
import { ChevronDown, GripVertical, Plus, X } from 'lucide-react';
import type { CustomField, SectionKey } from '@/lib/assets-data';
import styles from './Bounty.module.css';

export default function DetailSection({
  id,
  title,
  collapsed,
  onToggleCollapse,
  onDragStart,
  onDragOver,
  onDrop,
  customFields,
  onAddField,
  onRemoveField,
  onFieldChange,
  children,
}: {
  id: SectionKey;
  title: string;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onDragStart: (event: DragEvent<HTMLElement>) => void;
  onDragOver: (event: DragEvent<HTMLElement>) => void;
  onDrop: (event: DragEvent<HTMLElement>) => void;
  customFields: CustomField[];
  onAddField: (section: SectionKey, label: string, value: string) => void;
  onRemoveField: (fieldId: string) => void;
  onFieldChange: (fieldId: string, value: string) => void;
  children: ReactNode;
}) {
  const [addingField, setAddingField] = useState(false);
  const [draftLabel, setDraftLabel] = useState('');
  const [draftValue, setDraftValue] = useState('');

  const confirmAddField = () => {
    const label = draftLabel.trim();
    if (!label) return;
    onAddField(id, label, draftValue);
    setDraftLabel('');
    setDraftValue('');
    setAddingField(false);
  };

  return (
    <div className={styles.detailSection} onDragOver={onDragOver} onDrop={onDrop}>
      <div className={styles.detailSectionHead}>
        <button
          type="button"
          className={styles.detailSectionDragHandle}
          draggable
          onDragStart={onDragStart}
          aria-label={`Reordenar seção ${title}`}
        >
          <GripVertical size={13} />
        </button>
        <button type="button" className={styles.detailSectionToggle} onClick={onToggleCollapse}>
          <ChevronDown size={14} className={collapsed ? styles.detailSectionChevronCollapsed : styles.detailSectionChevron} />
          <span className={styles.detailSectionTitle}>{title}</span>
        </button>
      </div>

      {!collapsed && (
        <>
          {children}

          {customFields.length > 0 && (
            <div className={styles.detailSectionGrid}>
              {customFields.map((field) => (
                <label key={field.id} className={styles.formField}>
                  <span className={styles.customFieldLabelRow}>
                    <span className={styles.formLabel}>{field.label}</span>
                    <button
                      type="button"
                      className={styles.customFieldRemove}
                      onClick={() => onRemoveField(field.id)}
                      aria-label={`Remover campo ${field.label}`}
                    >
                      <X size={11} />
                    </button>
                  </span>
                  <input
                    value={field.value}
                    onChange={(event) => onFieldChange(field.id, event.target.value)}
                    className={styles.formInput}
                  />
                </label>
              ))}
            </div>
          )}

          {addingField ? (
            <div className={styles.customFieldAddRow}>
              <input
                autoFocus
                value={draftLabel}
                onChange={(event) => setDraftLabel(event.target.value)}
                placeholder="rótulo do campo"
                className={styles.formInput}
              />
              <input
                value={draftValue}
                onChange={(event) => setDraftValue(event.target.value)}
                onKeyDown={(event) => event.key === 'Enter' && confirmAddField()}
                placeholder="valor"
                className={styles.formInput}
              />
              <button type="button" onClick={confirmAddField} className={styles.inlineAddButton}>
                adicionar
              </button>
              <button type="button" onClick={() => setAddingField(false)} className={styles.secondaryButtonSmall}>
                cancelar
              </button>
            </div>
          ) : (
            <button type="button" onClick={() => setAddingField(true)} className={styles.inlineAddButton}>
              <Plus size={13} />
              campo
            </button>
          )}
        </>
      )}
    </div>
  );
}
