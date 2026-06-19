'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import {
  ASSET_STATUSES,
  PRIORITIES,
  createBlankAsset,
  type Asset,
} from '@/lib/assets-data';
import { deleteAsset, getAllAssets } from '@/lib/assetOverrides';
import type { Program } from '@/lib/bounty-data';
import { getAllFindings } from '@/lib/findingOverrides';
import type { Finding } from '@/lib/findings-data';
import { getAllPrograms } from '@/lib/programOverrides';
import AssetDetailPanel from './AssetDetailPanel';
import AssetStatusTag from './AssetStatusTag';
import PriorityTag from './PriorityTag';
import styles from './Bounty.module.css';

const TODOS = 'todos';

export default function AssetsPage() {
  const [items, setItems] = useState<Asset[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draftAsset, setDraftAsset] = useState<Asset | null>(null);
  const [programFilter, setProgramFilter] = useState(TODOS);
  const [statusFilter, setStatusFilter] = useState(TODOS);
  const [priorityFilter, setPriorityFilter] = useState(TODOS);
  const [tagFilter, setTagFilter] = useState(TODOS);
  const [query, setQuery] = useState('');

  useEffect(() => {
    // overrides are stored locally and only exist in the browser
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setItems(getAllAssets());
    setPrograms(getAllPrograms());
    setFindings(getAllFindings());
  }, []);

  const programName = useCallback(
    (programId: string) => programs.find((p) => p.id === programId)?.name || programId,
    [programs],
  );

  const allTags = useMemo(() => {
    const set = new Set<string>();
    items.forEach((asset) => asset.tags.forEach((tag) => set.add(tag)));
    return Array.from(set).sort();
  }, [items]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((asset) => {
      if (programFilter !== TODOS && asset.programId !== programFilter) return false;
      if (statusFilter !== TODOS && asset.status !== statusFilter) return false;
      if (priorityFilter !== TODOS && asset.priority !== priorityFilter) return false;
      if (tagFilter !== TODOS && !asset.tags.includes(tagFilter)) return false;
      if (!q) return true;
      const haystack = `${asset.host} ${asset.techStack.join(' ')} ${asset.notes} ${asset.tags.join(' ')}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [items, programFilter, statusFilter, priorityFilter, tagFilter, query]);

  const selected = items.find((asset) => asset.id === selectedId) || null;
  const panelAsset = draftAsset || selected;

  const handleCreate = () => {
    setSelectedId(null);
    setDraftAsset(createBlankAsset(`asset-${Date.now()}`));
  };

  const handleSelect = (id: string) => {
    setDraftAsset(null);
    setSelectedId(id);
  };

  const handleClosePanel = () => {
    setDraftAsset(null);
    setSelectedId(null);
  };

  const handleUpdate = useCallback((updated: Asset) => {
    setItems((current) => current.map((asset) => (asset.id === updated.id ? updated : asset)));
  }, []);

  const handleFinalizeCreate = useCallback((created: Asset) => {
    setItems((current) => [created, ...current]);
    setDraftAsset(null);
    setSelectedId(created.id);
  }, []);

  const handleDelete = useCallback((id: string) => {
    deleteAsset(id);
    setItems((current) => current.filter((asset) => asset.id !== id));
    setSelectedId(null);
    setDraftAsset(null);
  }, []);

  return (
    <>
      <section className={styles.toolbarRow}>
        <div>
          <div className={styles.eyebrow}>bug bounty</div>
          <h1 className={styles.title}>Alvos</h1>
          <p className={styles.subtitle}>Assets em recon — visão enxuta na lista, profundidade no painel de detalhe.</p>
        </div>
        <button type="button" onClick={handleCreate} className={styles.newButtonAccent}>
          <Plus size={14} />
          novo alvo
        </button>
      </section>

      <section className={styles.filtersRow} aria-label="Filtros">
        <select value={programFilter} onChange={(event) => setProgramFilter(event.target.value)} className={styles.filterSelect}>
          <option value={TODOS}>todos os programas</option>
          {programs.map((program) => (
            <option key={program.id} value={program.id}>{program.name || program.id}</option>
          ))}
        </select>
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className={styles.filterSelect}>
          <option value={TODOS}>todos os status</option>
          {ASSET_STATUSES.map((status) => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>
        <select value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value)} className={styles.filterSelect}>
          <option value={TODOS}>todas as prioridades</option>
          {PRIORITIES.map((priority) => (
            <option key={priority} value={priority}>{priority}</option>
          ))}
        </select>
        <select value={tagFilter} onChange={(event) => setTagFilter(event.target.value)} className={styles.filterSelect}>
          <option value={TODOS}>todas as tags</option>
          {allTags.map((tag) => (
            <option key={tag} value={tag}>{tag}</option>
          ))}
        </select>
        <div className={styles.searchInputWrap}>
          <Search size={14} className={styles.searchInputIcon} />
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="buscar por host, stack, tag ou notas..."
            className={styles.searchInput}
          />
        </div>
      </section>

      <section className={panelAsset ? styles.payoutsLayoutSplit : styles.payoutsLayout} aria-label="Alvos">
        <div className={styles.assetTable}>
          <div className={styles.assetTableScroll}>
            <div className={styles.assetTableHead}>
              <span className={styles.assetTableHeadCell}>host / valor</span>
              <span className={styles.assetTableHeadCell}>tipo</span>
              <span className={styles.assetTableHeadCell}>programa</span>
              <span className={styles.assetTableHeadCell}>stack</span>
              <span className={styles.assetTableHeadCell}>status</span>
              <span className={styles.assetTableHeadCell}>prioridade</span>
              <span className={styles.assetTableHeadCellCenter}>findings</span>
            </div>

            {filtered.length === 0 && (
              <div className={styles.emptyState}>nenhum alvo encontrado com esses filtros.</div>
            )}

            {filtered.map((asset) => (
              <button
                key={asset.id}
                type="button"
                onClick={() => handleSelect(asset.id)}
                className={`${styles.assetRow} ${selectedId === asset.id ? styles.assetRowActive : ''}`}
              >
                <span className={styles.assetHost}>{asset.host || 'sem host'}</span>
                <span className={styles.assetType}>{asset.type}</span>
                <span className={styles.assetProgram}>{programName(asset.programId).toUpperCase()}</span>
                <span className={styles.assetTechStack}>
                  {asset.techStack.length === 0 && <span className={styles.assetTechEmpty}>—</span>}
                  {asset.techStack.slice(0, 2).map((tech) => (
                    <span key={tech} className={styles.assetTechTag}>{tech}</span>
                  ))}
                  {asset.techStack.length > 2 && <span className={styles.assetTechEmpty}>+{asset.techStack.length - 2}</span>}
                </span>
                <AssetStatusTag status={asset.status} />
                <PriorityTag priority={asset.priority} compact />
                <span className={styles.assetFindingsCount}>{asset.findingIds.length || '—'}</span>
              </button>
            ))}
          </div>
        </div>

        {panelAsset && (
          <div className={styles.reportDetailCol}>
            <AssetDetailPanel
              key={panelAsset.id}
              asset={panelAsset}
              programs={programs}
              findings={findings}
              isNew={!!draftAsset}
              onChange={draftAsset ? handleFinalizeCreate : handleUpdate}
              onClose={handleClosePanel}
              onDelete={handleDelete}
            />
          </div>
        )}
      </section>
    </>
  );
}
