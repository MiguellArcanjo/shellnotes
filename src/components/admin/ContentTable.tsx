'use client';

import { Edit2, Search, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { BaseContent, ContentStatus } from '@/types/content';
import styles from './Admin.module.css';

interface ContentTableProps {
  items: BaseContent[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  columns?: {
    key: string;
    label: string;
    render?: (item: BaseContent) => React.ReactNode;
  }[];
}

export default function ContentTable({
  items,
  onEdit,
  onDelete,
  columns = [],
}: ContentTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const filteredItems = items.filter(
    (item) =>
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase())),
  );

  const statusBadge = (status: ContentStatus) => (
    <span className={status === 'published' ? styles.statusPublished : styles.statusDraft}>
      {status === 'published' ? 'publicado' : 'rascunho'}
    </span>
  );

  return (
    <>
      <div className={styles.searchWrap}>
        <Search className={styles.searchIcon} size={16} />
        <input
          type="search"
          placeholder="buscar por título ou tags…"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          className={styles.searchInput}
        />
      </div>

      <div className={styles.tableScroll}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Título</th>
              <th>Status</th>
              <th>Data</th>
              <th>Tags</th>
              {columns.map((column) => <th key={column.key}>{column.label}</th>)}
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.length === 0 ? (
              <tr><td colSpan={5 + columns.length} className={styles.empty}>Nenhum item encontrado.</td></tr>
            ) : filteredItems.map((item) => (
              <tr key={item.id}>
                <td><div className={styles.tableTitle}>{item.title}</div></td>
                <td>{statusBadge(item.status)}</td>
                <td>{new Date(item.date).toLocaleDateString('pt-BR')}</td>
                <td>
                  <div className={styles.tags}>
                    {item.tags.slice(0, 3).map((tag) => <span key={tag} className={styles.tag}>{tag}</span>)}
                    {item.tags.length > 3 && <span className={styles.tag}>+{item.tags.length - 3}</span>}
                  </div>
                </td>
                {columns.map((column) => (
                  <td key={column.key}>
                    {column.render ? column.render(item) : String((item as unknown as Record<string, unknown>)[column.key] ?? '')}
                  </td>
                ))}
                <td>
                  <div className={styles.tableActions}>
                    <button type="button" onClick={() => onEdit(item.id)} className={styles.iconButton} aria-label="Editar"><Edit2 size={15} /></button>
                    <button type="button" onClick={() => onDelete(item.id)} className={styles.dangerButton} aria-label="Excluir"><Trash2 size={15} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className={styles.resultCount}>Mostrando {filteredItems.length} de {items.length} {items.length === 1 ? 'item' : 'itens'}</div>
    </>
  );
}
