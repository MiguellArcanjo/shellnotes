'use client';

import Link from 'next/link';
import { Edit2, Plus, Search, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import ConfirmModal from '@/components/site/ConfirmModal';
import type { Writeup } from '@/lib/writeups-data';
import { deleteOverride, getRemoteWriteups } from '@/lib/writeupOverrides';
import AdminWriteupForm from './AdminWriteupForm';
import styles from './Admin.module.css';

export default function AdminWriteupsManager({
  mode,
  slug,
}: {
  mode: 'list' | 'new' | 'edit';
  slug?: string;
}) {
  const [items, setItems] = useState<Writeup[]>([]);
  const [search, setSearch] = useState('');
  const [pendingDelete, setPendingDelete] = useState<Writeup | null>(null);

  useEffect(() => {
    let active = true;
    void getRemoteWriteups().then((remote) => {
      if (active) {
        setItems(remote.sort((a, b) => b.date.localeCompare(a.date)));
      }
    });
    return () => {
      active = false;
    };
  }, [mode]);

  const visibleItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return items;
    return items.filter(
      (item) =>
        item.title.toLowerCase().includes(query) ||
        item.platform.toLowerCase().includes(query) ||
        item.tags.some((tag) => tag.toLowerCase().includes(query)),
    );
  }, [items, search]);

  if (mode === 'new') return <AdminWriteupForm seed={null} slug="new" />;
  if (mode === 'edit' && slug) return <AdminWriteupForm seed={null} slug={slug} />;

  const confirmDelete = () => {
    if (!pendingDelete) return;
    const item = pendingDelete;
    setPendingDelete(null);
    void deleteOverride(item.slug).then(() => {
      setItems((current) => current.filter((writeup) => writeup.slug !== item.slug));
    });
  };

  return (
    <div className={styles.page}>
      <ConfirmModal
        open={!!pendingDelete}
        title="Excluir writeup"
        message={`Excluir "${pendingDelete?.title ?? ''}" permanentemente? Essa ação não pode ser desfeita.`}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
      <div className={styles.toolbar}>
        <div>
          <div className={styles.eyebrow}>conteúdo</div>
          <h1 className={styles.title}>Writeups</h1>
          <p className={styles.subtitle}>Crie, edite e publique análises sem sair do painel.</p>
        </div>
        <Link href="/admin/writeups?new=1" className={styles.primaryButton}>
          <Plus size={14} />
          novo writeup
        </Link>
      </div>

      <div className={styles.searchWrap}>
        <Search size={16} className={styles.searchIcon} />
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="buscar por título, plataforma ou tag…"
          className={styles.searchInput}
        />
      </div>

      <div className={styles.tableScroll}>
        <table className={styles.table}>
          <thead>
            <tr>
              {['Título', 'Status', 'Plataforma', 'Dificuldade', 'Data', 'Ações'].map((label) => (
                <th key={label}>{label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleItems.map((item) => (
              <tr key={item.slug}>
                <td>
                  <div className={styles.tableTitle}>{item.title}</div>
                  <div className={styles.tableMeta}>{item.tags.slice(0, 4).join(' · ') || 'sem tags'}</div>
                </td>
                <td>
                  <span className={item.status === 'published' ? styles.statusPublished : styles.statusDraft}>
                    {item.status === 'published' ? 'publicado' : 'rascunho'}
                  </span>
                </td>
                <td>{item.platform}</td>
                <td>{item.difficulty}</td>
                <td>{item.dateLabel}</td>
                <td>
                  <div className={styles.tableActions}>
                    <Link
                      href={`/admin/writeups?edit=${encodeURIComponent(item.slug)}`}
                      className={styles.iconButton}
                      aria-label={`Editar ${item.title}`}
                    >
                      <Edit2 size={15} />
                    </Link>
                    <button
                      type="button"
                      onClick={() => setPendingDelete(item)}
                      className={styles.dangerButton}
                      aria-label={`Excluir ${item.title}`}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {visibleItems.length === 0 && (
              <tr>
                <td colSpan={6} className={styles.empty}>Nenhum writeup encontrado.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className={styles.resultCount}>{visibleItems.length} de {items.length} writeups</div>
    </div>
  );
}
