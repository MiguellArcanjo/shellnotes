'use client';

import Link from 'next/link';
import { Edit2, Plus, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import ConfirmModal from '@/components/site/ConfirmModal';
import { type GlossaryTerm } from '@/lib/glossary-data';
import {
  deleteTerm,
  getRemoteGlossary,
  newKey,
  saveTerm,
  type GlossaryEntryWithKey,
} from '@/lib/glossaryStore';
import styles from './Admin.module.css';

const BLANK: GlossaryTerm = { term: '', abbr: '', def: '' };

export default function AdminGlossaryManager({
  mode,
  entryKey,
}: {
  mode: 'list' | 'new' | 'edit';
  entryKey?: string;
}) {
  const router = useRouter();
  const [items, setItems] = useState<GlossaryEntryWithKey[]>([]);
  const [draft, setDraft] = useState<GlossaryTerm>(BLANK);
  const [pendingDelete, setPendingDelete] = useState<GlossaryEntryWithKey | null>(null);
  const reload = async () => {
    const remote = await getRemoteGlossary();
    setItems(remote.sort((a, b) => a.term.localeCompare(b.term)));
  };

  useEffect(() => {
    let active = true;
    const load = async () => {
    const current = await getRemoteGlossary();
    if (!active) return;
    setItems(current.sort((a, b) => a.term.localeCompare(b.term)));
    if (mode === 'edit' && entryKey) {
      const entry = current.find((item) => item._key === entryKey);
      if (entry) setDraft(entry);
    } else if (mode === 'new') {
      setDraft(BLANK);
    }
    };
    void load();
    return () => {
      active = false;
    };
  }, [mode, entryKey]);

  if (mode !== 'list') {
    const save = () => {
      const term = draft.term.trim();
      if (!term) return;
      void saveTerm(mode === 'edit' && entryKey ? entryKey : newKey(), { ...draft, term }).then(() => {
        router.push('/admin/glossary');
      });
    };
    return (
      <div className={styles.editorWrapNarrow}>
        <div className={styles.editorHeader}>
          <div>
            <Link href="/admin/glossary" className={styles.breadcrumb}>glossário /</Link>
            <h1 className={styles.editorTitle}>{mode === 'new' ? 'Novo termo' : 'Editar termo'}</h1>
          </div>
          <button type="button" onClick={save} disabled={!draft.term.trim()} className={styles.primaryButton}>salvar</button>
        </div>
        <div className={styles.formPanel}>
          <input value={draft.term} onChange={(event) => setDraft({ ...draft, term: event.target.value })} placeholder="termo" className={styles.formInput} autoFocus />
          <input value={draft.abbr} onChange={(event) => setDraft({ ...draft, abbr: event.target.value })} placeholder="sigla / forma estendida (opcional)" className={styles.formInput} />
          <textarea value={draft.def} onChange={(event) => setDraft({ ...draft, def: event.target.value })} placeholder="definição em uma frase" className={styles.formTextarea} />
          <div className={styles.formActions}>
            <button type="button" onClick={save} disabled={!draft.term.trim()} className={styles.primaryButton}>salvar</button>
            <button type="button" onClick={() => router.push('/admin/glossary')} className={styles.secondaryButton}>cancelar</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <ConfirmModal
        open={!!pendingDelete}
        title="Excluir termo"
        message={`Remover "${pendingDelete?.term ?? ''}"? Essa ação não pode ser desfeita.`}
        onConfirm={() => {
          if (!pendingDelete) return;
          const item = pendingDelete;
          setPendingDelete(null);
          void deleteTerm(item._key, item).then(() => reload());
        }}
        onCancel={() => setPendingDelete(null)}
      />
      <div className={styles.toolbar}>
        <div>
          <div className={styles.eyebrow}>conteúdo</div>
          <h1 className={styles.title}>Glossário</h1>
          <p className={styles.subtitle}>Termos e definições técnicas.</p>
        </div>
        <Link href="/admin/glossary?new=1" className={styles.primaryButton}><Plus size={14} /> novo termo</Link>
      </div>
      <div className={styles.list}>
        {items.map((item) => (
          <div key={item._key} className={styles.listRow}>
            <div>
              <div className={styles.rowTitle}>{item.term}</div>
              <div className={styles.rowMeta}>{item.abbr ? `${item.abbr} · ` : ''}{item.def}</div>
            </div>
            <div className={styles.rowActions}>
              <Link href={`/admin/glossary?edit=${encodeURIComponent(item._key)}`} className={styles.iconButton} aria-label={`Editar ${item.term}`}><Edit2 size={15} /></Link>
              <button type="button" onClick={() => setPendingDelete(item)} className={styles.dangerButton} aria-label={`Excluir ${item.term}`}><Trash2 size={15} /></button>
            </div>
          </div>
        ))}
      </div>
      <div className={styles.resultCount}>{items.length} termos</div>
    </div>
  );
}
