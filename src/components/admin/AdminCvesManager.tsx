'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Edit2, Plus, Search, Trash2 } from 'lucide-react';
import ConfirmModal from '@/components/site/ConfirmModal';
import {
  CVE_TYPES,
  type CveEntry,
  type CveSeverity,
} from '@/lib/cves-data';
import { createNewCve, deleteCve, getAllCvesRemote } from '@/lib/cveStore';
import CveEditor from './CveEditor';
import styles from './Admin.module.css';

const ALL = 'todos';
type SortKey = 'cvss' | 'updatedAt';
type SortDirection = 'asc' | 'desc';

const severityLabel: Record<CveSeverity, string> = {
  critical: 'crítico',
  high: 'alto',
  medium: 'médio',
  low: 'baixo',
};

export default function AdminCvesManager({
  mode,
  entryId,
}: {
  mode: 'list' | 'new' | 'edit';
  entryId?: string;
}) {
  const [items, setItems] = useState<CveEntry[]>([]);
  const [draft, setDraft] = useState<CveEntry | null>(null);
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState(ALL);
  const [typeFilter, setTypeFilter] = useState(ALL);
  const [productFilter, setProductFilter] = useState(ALL);
  const [statusFilter, setStatusFilter] = useState(ALL);
  const [sortKey, setSortKey] = useState<SortKey>('updatedAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [pendingDelete, setPendingDelete] = useState<CveEntry | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const remote = await getAllCvesRemote();
      if (!active) return;
      setItems(remote);
      if (mode === 'new') setDraft(createNewCve());
      if (mode === 'edit' && entryId) {
        setDraft(remote.find((entry) => entry.id === entryId) ?? null);
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, [mode, entryId]);

  const products = useMemo(
    () => Array.from(new Set(items.map((item) => item.product).filter(Boolean))).sort(),
    [items],
  );

  const visibleItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    return items
      .filter((item) => {
        const matchesSearch =
          !query ||
          item.cveId.toLowerCase().includes(query) ||
          item.product.toLowerCase().includes(query) ||
          item.version.toLowerCase().includes(query) ||
          item.description.toLowerCase().includes(query);
        return (
          matchesSearch &&
          (severityFilter === ALL || item.severity === severityFilter) &&
          (typeFilter === ALL || item.vulnerabilityType === typeFilter) &&
          (productFilter === ALL || item.product === productFilter) &&
          (statusFilter === ALL || item.status === statusFilter)
        );
      })
      .sort((a, b) => {
        const comparison = sortKey === 'cvss'
          ? a.cvss - b.cvss
          : a.updatedAt.localeCompare(b.updatedAt);
        return sortDirection === 'asc' ? comparison : -comparison;
      });
  }, [items, productFilter, search, severityFilter, sortDirection, sortKey, statusFilter, typeFilter]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setSortKey(key);
    setSortDirection('desc');
  };

  const sortIcon = (key: SortKey) => {
    if (sortKey !== key) return null;
    return sortDirection === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />;
  };

  if (mode !== 'list') {
    return draft
      ? <CveEditor entry={draft} />
      : <div className={styles.loading}>CVE não encontrada.</div>;
  }

  return (
    <div className={styles.page}>
      <ConfirmModal
        open={!!pendingDelete}
        title="Excluir CVE"
        message={`Excluir ${pendingDelete?.cveId || 'esta CVE'}? Essa ação não pode ser desfeita.`}
        onConfirm={() => {
          if (!pendingDelete) return;
          const item = pendingDelete;
          setPendingDelete(null);
          void deleteCve(item.id).then(setItems);
        }}
        onCancel={() => setPendingDelete(null)}
      />
      <div className={styles.toolbar}>
        <div>
          <div className={styles.eyebrow}>conteúdo</div>
          <h1 className={styles.title}>CVEs</h1>
          <p className={styles.subtitle}>Vulnerabilidades acompanhadas, reproduzidas e documentadas.</p>
        </div>
        <a href="/admin/cves?new=1" className={styles.primaryButton}>
          <Plus size={14} />
          nova CVE
        </a>
      </div>

      <section className={styles.cveFilters} aria-label="Busca e filtros">
        <div className={styles.searchWrap}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="buscar por ID, produto, versão ou descrição…"
            className={styles.searchInput}
          />
        </div>
        <div className={styles.filterRow}>
          <select value={severityFilter} onChange={(event) => setSeverityFilter(event.target.value)} className={styles.filterSelect}>
            <option value={ALL}>todas as severidades</option>
            {(['critical', 'high', 'medium', 'low'] as CveSeverity[]).map((severity) => (
              <option key={severity} value={severity}>{severityLabel[severity]}</option>
            ))}
          </select>
          <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} className={styles.filterSelect}>
            <option value={ALL}>todos os tipos</option>
            {CVE_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
          </select>
          <select value={productFilter} onChange={(event) => setProductFilter(event.target.value)} className={styles.filterSelect}>
            <option value={ALL}>todos os produtos</option>
            {products.map((product) => <option key={product} value={product}>{product}</option>)}
          </select>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className={styles.filterSelect}>
            <option value={ALL}>todos os status</option>
            <option value="draft">rascunho</option>
            <option value="published">publicado</option>
          </select>
        </div>
      </section>

      <div className={styles.tableScroll}>
        <table className={`${styles.table} ${styles.cveTable}`}>
          <thead>
            <tr>
              <th>ID da CVE</th>
              <th>
                <button type="button" onClick={() => toggleSort('cvss')} className={styles.sortButton}>
                  CVSS {sortIcon('cvss')}
                </button>
              </th>
              <th>Produto / versão</th>
              <th>Tipo</th>
              <th>Status</th>
              <th>
                <button type="button" onClick={() => toggleSort('updatedAt')} className={styles.sortButton}>
                  Atualização {sortIcon('updatedAt')}
                </button>
              </th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {visibleItems.map((item) => (
              <tr key={item.id}>
                <td><span className={styles.cveIdentifier}>{item.cveId || 'sem ID'}</span></td>
                <td>
                  <span className={`${styles.cvssBadge} ${styles[`cvss${item.severity}`]}`}>
                    {item.cvss.toFixed(1)}
                  </span>
                </td>
                <td>
                  <div className={styles.tableTitle}>{item.product}</div>
                  <div className={styles.tableMeta}>{item.version}</div>
                </td>
                <td>{item.vulnerabilityType}</td>
                <td>
                  <span className={item.status === 'published' ? styles.statusPublished : styles.statusDraft}>
                    {item.status === 'published' ? 'publicado' : 'rascunho'}
                  </span>
                </td>
                <td>{new Date(`${item.updatedAt}T12:00:00`).toLocaleDateString('pt-BR')}</td>
                <td>
                  <div className={styles.tableActions}>
                    <a href={`/admin/cves?edit=${encodeURIComponent(item.id)}`} className={styles.iconButton} aria-label={`Editar ${item.cveId}`}>
                      <Edit2 size={15} />
                    </a>
                    <button type="button" onClick={() => setPendingDelete(item)} className={styles.dangerButton} aria-label={`Excluir ${item.cveId}`}>
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {visibleItems.length === 0 && (
              <tr><td colSpan={7} className={styles.empty}>Nenhuma CVE encontrada com esses filtros.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <div className={styles.resultCount}>{visibleItems.length} de {items.length} CVEs</div>
    </div>
  );
}
