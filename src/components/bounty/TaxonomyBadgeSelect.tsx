'use client';

import { useEffect, useState } from 'react';
import { Check, Pencil, Plus, Trash2, X } from 'lucide-react';
import {
  addTaxonomyValue,
  COLOR_PALETTE,
  getTaxonomyValue,
  recolorTaxonomyValue,
  removeTaxonomyValue,
  renameTaxonomyValue,
  type AssetTaxonomy,
  type TaxonomyKind,
} from '@/lib/assetTaxonomy';
import styles from './Bounty.module.css';

export default function TaxonomyBadgeSelect({
  kind,
  value,
  taxonomy,
  onChange,
  onTaxonomySave,
  isInUse,
  compact = false,
}: {
  kind: TaxonomyKind;
  value: string;
  taxonomy: AssetTaxonomy;
  onChange: (id: string) => void;
  onTaxonomySave: (next: AssetTaxonomy) => void;
  isInUse?: (id: string) => boolean;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [managing, setManaging] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingLabel, setEditingLabel] = useState('');

  useEffect(() => {
    if (!open) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        setManaging(false);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open]);

  const current = getTaxonomyValue(taxonomy, kind, value);
  const options = taxonomy[kind];

  const close = () => {
    setOpen(false);
    setManaging(false);
    setEditingId(null);
  };

  const startEdit = (id: string, label: string) => {
    setEditingId(id);
    setEditingLabel(label);
  };

  const commitEdit = () => {
    if (!editingId) return;
    onTaxonomySave(renameTaxonomyValue(taxonomy, kind, editingId, editingLabel));
    setEditingId(null);
  };

  const addValue = () => {
    const label = newLabel.trim();
    if (!label) return;
    const color = COLOR_PALETTE[options.length % COLOR_PALETTE.length];
    onTaxonomySave(addTaxonomyValue(taxonomy, kind, label, color));
    setNewLabel('');
  };

  return (
    <div className={styles.taxonomyBadgeWrap}>
      <button
        type="button"
        className={compact ? styles.taxonomyBadgeCompact : styles.taxonomyBadge}
        style={{ borderColor: current.color, color: current.color, background: `color-mix(in srgb, ${current.color} 12%, transparent)` }}
        onClick={() => setOpen((v) => !v)}
      >
        <span className={styles.taxonomyBadgeDot} style={{ background: current.color }} />
        {current.label}
      </button>

      {open && (
        <>
          <div className={styles.taxonomyOverlay} onClick={close} />
          <div className={styles.taxonomyDropdown} role="listbox">
            {!managing && options.map((option) => (
              <button
                key={option.id}
                type="button"
                role="option"
                aria-selected={option.id === value}
                className={styles.taxonomyOption}
                onClick={() => {
                  onChange(option.id);
                  close();
                }}
              >
                <span className={styles.taxonomyBadgeDot} style={{ background: option.color }} />
                <span className={styles.taxonomyOptionLabel}>{option.label}</span>
                {option.id === value && <Check size={13} />}
              </button>
            ))}

            {managing && (
              <div className={styles.taxonomyManageList}>
                {options.map((option) => (
                  <div key={option.id} className={styles.taxonomyManageRow}>
                    <div className={styles.taxonomyColorSwatches}>
                      {COLOR_PALETTE.map((color) => (
                        <button
                          key={color}
                          type="button"
                          aria-label={`Cor ${color}`}
                          className={styles.taxonomySwatch}
                          style={{ background: color, outline: option.color === color ? `2px solid ${color}` : 'none' }}
                          onClick={() => onTaxonomySave(recolorTaxonomyValue(taxonomy, kind, option.id, color))}
                        />
                      ))}
                    </div>
                    {editingId === option.id ? (
                      <input
                        autoFocus
                        value={editingLabel}
                        onChange={(event) => setEditingLabel(event.target.value)}
                        onKeyDown={(event) => event.key === 'Enter' && commitEdit()}
                        onBlur={commitEdit}
                        className={styles.taxonomyEditInput}
                      />
                    ) : (
                      <button type="button" className={styles.taxonomyManageLabel} onClick={() => startEdit(option.id, option.label)}>
                        {option.label}
                        <Pencil size={11} />
                      </button>
                    )}
                    <button
                      type="button"
                      className={styles.taxonomyDeleteButton}
                      disabled={isInUse?.(option.id)}
                      title={isInUse?.(option.id) ? 'em uso — não pode ser removido' : 'remover'}
                      onClick={() => onTaxonomySave(removeTaxonomyValue(taxonomy, kind, option.id))}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
                <div className={styles.taxonomyAddRow}>
                  <input
                    value={newLabel}
                    onChange={(event) => setNewLabel(event.target.value)}
                    onKeyDown={(event) => event.key === 'Enter' && addValue()}
                    placeholder="novo valor…"
                    className={styles.taxonomyEditInput}
                  />
                  <button type="button" onClick={addValue} className={styles.taxonomyAddButton} aria-label="Adicionar valor">
                    <Plus size={13} />
                  </button>
                </div>
              </div>
            )}

            <button type="button" className={styles.taxonomyManageToggle} onClick={() => setManaging((v) => !v)}>
              {managing ? <X size={12} /> : <Pencil size={12} />}
              {managing ? 'concluído' : 'gerenciar valores'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
