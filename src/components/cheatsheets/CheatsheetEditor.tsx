'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { Cheatsheet } from '@/lib/cheatsheets-data';
import { saveOverride } from '@/lib/cheatsheetOverrides';
import styles from './Cheatsheets.module.css';

const AUTOSAVE_DELAY = 1200;

export default function CheatsheetEditor({
  sheet,
  onExit,
  backHref = '/admin/cheatsheets',
}: {
  sheet: Cheatsheet;
  onExit: (sheet: Cheatsheet) => void;
  backHref?: string;
}) {
  const [draft, setDraft] = useState(sheet);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => {
      saveOverride(draft.slug, draft);
      setSaved(true);
    }, AUTOSAVE_DELAY);
    return () => window.clearTimeout(id);
  }, [draft]);

  const update = (patch: Partial<Cheatsheet>) => {
    setSaved(false);
    setDraft((current) => ({ ...current, ...patch }));
  };

  const updateGroup = (groupIndex: number, patch: Partial<Cheatsheet['groups'][number]>) => {
    update({
      groups: draft.groups.map((group, index) =>
        index === groupIndex ? { ...group, ...patch } : group,
      ),
    });
  };

  const updateItem = (
    groupIndex: number,
    itemIndex: number,
    patch: Partial<Cheatsheet['groups'][number]['items'][number]>,
  ) => {
    const group = draft.groups[groupIndex];
    updateGroup(groupIndex, {
      items: group.items.map((item, index) =>
        index === itemIndex ? { ...item, ...patch } : item,
      ),
    });
  };

  const save = () => {
    saveOverride(draft.slug, draft);
    setSaved(true);
  };

  return (
    <div className={styles.editor}>
      <div className={styles.editorTopBar}>
        <div className={styles.breadcrumb}>
          <Link href={backHref} className={styles.breadcrumbLink}>cheatsheets</Link>
          <span className={styles.breadcrumbSep}>/</span>
          <span className={styles.breadcrumbCurrent}>{draft.title || 'sem título'}</span>
          <button type="button" onClick={() => onExit(draft)} className={styles.closeEditButton}>
            voltar ao painel
          </button>
        </div>
        <div className={styles.topBarRight}>
          <span className={styles.autosaveLabel}>{saved ? 'salvo há instantes' : ''}</span>
          <button type="button" onClick={save} className={styles.saveButton}>salvar</button>
        </div>
      </div>

      <input
        type="text"
        value={draft.title}
        onChange={(event) => update({ title: event.target.value })}
        placeholder="Título da cheatsheet"
        className={styles.titleField}
      />

      <div className={styles.metadataPanel}>
        <label className={styles.metadataField}>
          <span className={styles.metadataLabel}>categoria</span>
          <input
            value={draft.kicker}
            onChange={(event) => update({ kicker: event.target.value })}
            className={styles.metadataInput}
          />
        </label>
        <div className={styles.metadataField}>
          <span className={styles.metadataLabel}>slug</span>
          <span className={styles.slugDisplay}>{draft.slug}</span>
        </div>
        <label className={styles.metadataFieldWide}>
          <span className={styles.metadataLabel}>descrição</span>
          <textarea
            value={draft.desc}
            onChange={(event) => update({ desc: event.target.value })}
            className={styles.metadataTextarea}
          />
        </label>
      </div>

      <div className={styles.groupsEditor}>
        {draft.groups.map((group, groupIndex) => (
          <section key={`${groupIndex}-${group.subtitle}`} className={styles.groupEditor}>
            <div className={styles.groupEditorHead}>
              <input
                value={group.subtitle}
                onChange={(event) => updateGroup(groupIndex, { subtitle: event.target.value })}
                placeholder="Nome do grupo"
                className={styles.groupSubtitleInput}
              />
              <button
                type="button"
                onClick={() => update({ groups: draft.groups.filter((_, index) => index !== groupIndex) })}
                className={styles.removeGroupButton}
              >
                remover grupo
              </button>
            </div>

            <div className={styles.itemEditorList}>
              {group.items.map((item, itemIndex) => (
                <div key={`${itemIndex}-${item.code}`} className={styles.itemEditorRow}>
                  <input
                    value={item.note}
                    onChange={(event) => updateItem(groupIndex, itemIndex, { note: event.target.value })}
                    placeholder="Descrição do comando"
                    className={styles.itemNoteInput}
                  />
                  <textarea
                    value={item.code}
                    onChange={(event) => updateItem(groupIndex, itemIndex, { code: event.target.value })}
                    placeholder="comando"
                    spellCheck={false}
                    className={styles.itemCodeInput}
                  />
                  <button
                    type="button"
                    onClick={() => updateGroup(groupIndex, {
                      items: group.items.filter((_, index) => index !== itemIndex),
                    })}
                    className={styles.removeItemButton}
                  >
                    remover comando
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => updateGroup(groupIndex, {
                items: [...group.items, { note: '', code: '' }],
              })}
              className={styles.addItemButton}
            >
              + adicionar comando
            </button>
          </section>
        ))}

        <button
          type="button"
          onClick={() => update({
            groups: [...draft.groups, { subtitle: '', items: [{ note: '', code: '' }] }],
          })}
          className={styles.addGroupButton}
        >
          + adicionar grupo
        </button>
      </div>
    </div>
  );
}
