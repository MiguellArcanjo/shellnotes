'use client';

import Link from 'next/link';
import { Edit2, Plus, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import ConfirmModal from '@/components/site/ConfirmModal';
import CheatsheetEditor from '@/components/cheatsheets/CheatsheetEditor';
import {
  countCommands,
  createBlankCheatsheet,
  type Cheatsheet,
} from '@/lib/cheatsheets-data';
import {
  deleteOverride,
  getRemoteOverrides,
  saveOverride,
} from '@/lib/cheatsheetOverrides';
import styles from './Admin.module.css';

async function loadSheets(): Promise<Cheatsheet[]> {
  const overrides = await getRemoteOverrides();
  const extras = Object.entries(overrides)
    .map(([slug, override]) => ({ ...createBlankCheatsheet(slug), ...override }))
    .filter((sheet) => sheet.title.trim() !== '');
  return extras;
}

export default function AdminCheatsheetsManager({
  mode,
  slug,
}: {
  mode: 'list' | 'new' | 'edit';
  slug?: string;
}) {
  const router = useRouter();
  const [items, setItems] = useState<Cheatsheet[]>([]);
  const [draft, setDraft] = useState<Cheatsheet | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Cheatsheet | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
    const remoteOverrides = await getRemoteOverrides();
    const loaded = await loadSheets();
    if (!active) return;
    setItems(loaded);
    if (mode === 'new') {
      setDraft(createBlankCheatsheet(`cheatsheet-${Date.now()}`));
    } else if (mode === 'edit' && slug) {
      const override = remoteOverrides[slug];
      setDraft(override ? { ...createBlankCheatsheet(slug), ...override } : null);
    }
    };
    void load();
    return () => {
      active = false;
    };
  }, [mode, slug]);

  if (mode !== 'list') {
    return draft ? (
      <div className={styles.editorWrap}>
        <CheatsheetEditor
          sheet={draft}
          onExit={(updated) => {
            void saveOverride(updated.slug, updated).then(() => {
              router.push('/admin/cheatsheets');
            });
          }}
        />
      </div>
    ) : <div className={styles.loading}>Preparando cheatsheet…</div>;
  }

  return (
    <div className={styles.page}>
      <ConfirmModal
        open={!!pendingDelete}
        title="Excluir cheatsheet"
        message={`Remover as alterações locais de "${pendingDelete?.title ?? ''}"? Essa ação não pode ser desfeita.`}
        onConfirm={() => {
          if (!pendingDelete) return;
          const sheet = pendingDelete;
          setPendingDelete(null);
          void deleteOverride(sheet.slug).then(() => {
            setItems((current) => current.filter((item) => item.slug !== sheet.slug));
          });
        }}
        onCancel={() => setPendingDelete(null)}
      />
      <div className={styles.toolbar}>
        <div>
          <div className={styles.eyebrow}>conteúdo</div>
          <h1 className={styles.title}>Cheatsheets</h1>
          <p className={styles.subtitle}>Gerencie seus guias e comandos rápidos.</p>
        </div>
        <Link href="/admin/cheatsheets?new=1" className={styles.primaryButton}>
          <Plus size={14} /> nova cheatsheet
        </Link>
      </div>
      <div className={styles.list}>
        {items.map((sheet) => (
          <div key={sheet.slug} className={styles.listRow}>
            <div>
              <div className={styles.rowTitle}>{sheet.title}</div>
              <div className={styles.rowMeta}>{sheet.kicker} · {countCommands(sheet)} comandos</div>
            </div>
            <div className={styles.rowActions}>
              <Link href={`/admin/cheatsheets?edit=${encodeURIComponent(sheet.slug)}`} className={styles.iconButton} aria-label={`Editar ${sheet.title}`}>
                <Edit2 size={15} />
              </Link>
              <button type="button" onClick={() => setPendingDelete(sheet)} className={styles.dangerButton} aria-label={`Excluir ${sheet.title}`}>
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className={styles.resultCount}>{items.length} cheatsheets</div>
    </div>
  );
}
