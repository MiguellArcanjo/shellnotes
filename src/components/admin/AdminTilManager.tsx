'use client';

import Link from 'next/link';
import { Edit2, Plus, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import ChipInput from '@/components/site/ChipInput';
import { type TilNote } from '@/lib/til-data';
import {
  createBlankNote,
  deleteNote,
  getRemoteTil,
  newKey,
  saveNote,
  type TilEntryWithKey,
} from '@/lib/tilStore';
import styles from './Admin.module.css';

export default function AdminTilManager({
  mode,
  entryKey,
}: {
  mode: 'list' | 'new' | 'edit';
  entryKey?: string;
}) {
  const router = useRouter();
  const [items, setItems] = useState<TilEntryWithKey[]>([]);
  const [draft, setDraft] = useState<TilNote>(createBlankNote());
  const reload = async () => {
    const remote = await getRemoteTil();
    setItems(remote.sort((a, b) => b.date.localeCompare(a.date)));
  };

  useEffect(() => {
    let active = true;
    const load = async () => {
    const current = await getRemoteTil();
    if (!active) return;
    setItems(current.sort((a, b) => b.date.localeCompare(a.date)));
    if (mode === 'edit' && entryKey) {
      const entry = current.find((item) => item._key === entryKey);
      if (entry) setDraft(entry);
    } else if (mode === 'new') {
      setDraft(createBlankNote());
    }
    };
    void load();
    return () => {
      active = false;
    };
  }, [mode, entryKey]);

  if (mode !== 'list') {
    const save = () => {
      const title = draft.title.trim();
      if (!title) return;
      saveNote(mode === 'edit' && entryKey ? entryKey : newKey(), { ...draft, title });
      router.push('/admin/til');
    };
    return (
      <div className={styles.editorWrapNarrow}>
        <div className={styles.editorHeader}>
          <div>
            <Link href="/admin/til" className={styles.breadcrumb}>til /</Link>
            <h1 className={styles.editorTitle}>{mode === 'new' ? 'Nova nota' : 'Editar nota'}</h1>
          </div>
          <button type="button" onClick={save} disabled={!draft.title.trim()} className={styles.primaryButton}>salvar</button>
        </div>
        <div className={styles.formPanel}>
          <input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} placeholder="título" className={styles.formInput} autoFocus />
          <textarea value={draft.body} onChange={(event) => setDraft({ ...draft, body: event.target.value })} placeholder="o que você aprendeu" className={styles.formTextarea} />
          <textarea value={draft.code} onChange={(event) => setDraft({ ...draft, code: event.target.value })} placeholder="comando (opcional)" className={styles.formCode} spellCheck={false} />
          <ChipInput values={draft.tags} onChange={(tags) => setDraft({ ...draft, tags })} placeholder="adicionar tag…" />
          <div className={styles.formActions}>
            <button type="button" onClick={save} disabled={!draft.title.trim()} className={styles.primaryButton}>salvar</button>
            <button type="button" onClick={() => router.push('/admin/til')} className={styles.secondaryButton}>cancelar</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.toolbar}>
        <div>
          <div className={styles.eyebrow}>conteúdo</div>
          <h1 className={styles.title}>TIL</h1>
          <p className={styles.subtitle}>Anotações curtas e comandos de campo.</p>
        </div>
        <Link href="/admin/til?new=1" className={styles.primaryButton}><Plus size={14} /> nova nota</Link>
      </div>
      <div className={styles.list}>
        {items.map((item) => (
          <div key={item._key} className={styles.listRow}>
            <div>
              <div className={styles.rowTitle}>{item.title}</div>
              <div className={styles.rowMeta}>{item.dateLabel} · {item.tags.join(' · ') || 'sem tags'}</div>
            </div>
            <div className={styles.rowActions}>
              <Link href={`/admin/til?edit=${encodeURIComponent(item._key)}`} className={styles.iconButton} aria-label={`Editar ${item.title}`}><Edit2 size={15} /></Link>
              <button type="button" onClick={() => {
                if (window.confirm('Remover esta nota?')) {
                  deleteNote(item._key, item);
                  void reload();
                }
              }} className={styles.dangerButton} aria-label={`Excluir ${item.title}`}><Trash2 size={15} /></button>
            </div>
          </div>
        ))}
      </div>
      <div className={styles.resultCount}>{items.length} notas</div>
    </div>
  );
}
