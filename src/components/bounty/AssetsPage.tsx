'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import {
  ArrowDown,
  ArrowUp,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Search,
  SlidersHorizontal,
  Trash2,
  Upload,
} from 'lucide-react';
import {
  createBlankAsset,
  type Asset,
} from '@/lib/assets-data';
import { deleteAsset, getAllAssets, saveOverride } from '@/lib/assetOverrides';
import type { Program } from '@/lib/bounty-data';
import { getAllFindings } from '@/lib/findingOverrides';
import type { Finding } from '@/lib/findings-data';
import { getAllPrograms } from '@/lib/programOverrides';
import { getTaxonomyValue } from '@/lib/assetTaxonomy';
import { useAssetTaxonomy } from '@/lib/useAssetTaxonomy';
import { useAssetsUIState, type AssetColumnKey } from '@/lib/useAssetsUIState';
import { useResizableSplit } from '@/lib/useResizableSplit';
import ConfirmModal from '@/components/site/ConfirmModal';
import AssetDetailPanel from './AssetDetailPanel';
import BulkImportAssetsModal from './BulkImportAssetsModal';
import TaxonomyBadgeSelect from './TaxonomyBadgeSelect';
import styles from './Bounty.module.css';

const TODOS = 'todos';

const COLUMN_DEFS: { key: AssetColumnKey; label: string; width: string }[] = [
  { key: 'host', label: 'host / valor', width: 'minmax(160px, 1.2fr)' },
  { key: 'type', label: 'tipo', width: '96px' },
  { key: 'program', label: 'programa', width: 'minmax(110px, 1fr)' },
  { key: 'stack', label: 'stack', width: 'minmax(120px, 1.3fr)' },
  { key: 'status', label: 'status', width: '136px' },
  { key: 'priority', label: 'prioridade', width: '116px' },
  { key: 'findings', label: 'findings', width: '66px' },
];

type SortKey = AssetColumnKey;

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
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortKey, setSortKey] = useState<SortKey>('host');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [columnsMenuOpen, setColumnsMenuOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [fullscreenPanel, setFullscreenPanel] = useState(false);
  const [bulkDeleteConfirming, setBulkDeleteConfirming] = useState(false);
  const [bulkTagDraft, setBulkTagDraft] = useState('');

  const { taxonomy, save: saveTaxonomy } = useAssetTaxonomy();
  const { state: uiState, update: updateUiState } = useAssetsUIState();
  const splitRef = useRef<HTMLDivElement | null>(null);
  const { resizing, onHandlePointerDown } = useResizableSplit({
    onChange: (pct) => updateUiState({ panelWidthPct: pct }),
    containerRef: splitRef,
  });

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

  const sorted = useMemo(() => {
    const value = (asset: Asset): string | number => {
      switch (sortKey) {
        case 'host': return asset.host.toLowerCase();
        case 'type': return asset.type;
        case 'program': return programName(asset.programId).toLowerCase();
        case 'stack': return asset.techStack.length;
        case 'status': return getTaxonomyValue(taxonomy, 'statuses', asset.status).label;
        case 'priority': return getTaxonomyValue(taxonomy, 'priorities', asset.priority).label;
        case 'findings': return asset.findingIds.length;
        default: return '';
      }
    };
    return [...filtered].sort((a, b) => {
      const va = value(a);
      const vb = value(b);
      const comparison = typeof va === 'number' && typeof vb === 'number' ? va - vb : String(va).localeCompare(String(vb));
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [filtered, sortKey, sortDirection, programName, taxonomy]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setSortKey(key);
    setSortDirection('asc');
  };

  const selected = items.find((asset) => asset.id === selectedId) || null;
  const panelAsset = draftAsset || selected;

  const handleCreate = () => {
    setSelectedId(null);
    setDraftAsset(createBlankAsset(`asset-${Date.now()}`));
    // a new asset is always created in fullscreen — there is no split-view
    // option until it's actually saved and becomes a real list item
    setFullscreenPanel(true);
  };

  const handleSelect = (id: string) => {
    setDraftAsset(null);
    setSelectedId(id);
  };

  const handleClosePanel = () => {
    setDraftAsset(null);
    setSelectedId(null);
    setFullscreenPanel(false);
  };

  const handleUpdate = useCallback((updated: Asset) => {
    setItems((current) => current.map((asset) => (asset.id === updated.id ? updated : asset)));
  }, []);

  const handleFinalizeCreate = useCallback((created: Asset) => {
    setItems((current) => [created, ...current]);
    setDraftAsset(null);
    setSelectedId(created.id);
    setFullscreenPanel(false);
  }, []);

  const handleDelete = useCallback((id: string) => {
    deleteAsset(id);
    setItems((current) => current.filter((asset) => asset.id !== id));
    setSelectedId(null);
    setDraftAsset(null);
    setFullscreenPanel(false);
  }, []);

  const quickUpdate = (asset: Asset, patch: Partial<Asset>) => {
    const updated = { ...asset, ...patch };
    setItems((current) => current.map((a) => (a.id === asset.id ? updated : a)));
    void saveOverride(asset.id, updated);
  };

  const toggleRowSelected = (id: string) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const allVisibleSelected = sorted.length > 0 && sorted.every((a) => selectedIds.has(a.id));
  const toggleSelectAll = () => {
    setSelectedIds(allVisibleSelected ? new Set() : new Set(sorted.map((a) => a.id)));
  };

  const applyBulkPatch = (patch: Partial<Asset>) => {
    const next = items.map((a) => (selectedIds.has(a.id) ? { ...a, ...patch } : a));
    setItems(next);
    next.filter((a) => selectedIds.has(a.id)).forEach((a) => void saveOverride(a.id, a));
  };

  const applyBulkTag = () => {
    const tag = bulkTagDraft.trim();
    if (!tag) return;
    const next = items.map((a) => (selectedIds.has(a.id) && !a.tags.includes(tag) ? { ...a, tags: [...a.tags, tag] } : a));
    setItems(next);
    next.filter((a) => selectedIds.has(a.id)).forEach((a) => void saveOverride(a.id, a));
    setBulkTagDraft('');
  };

  const confirmBulkDelete = () => {
    selectedIds.forEach((id) => deleteAsset(id));
    setItems((current) => current.filter((a) => !selectedIds.has(a.id)));
    setSelectedIds(new Set());
    setBulkDeleteConfirming(false);
  };

  const handleImport = (created: Asset[]) => {
    setItems((current) => [...created, ...current]);
    created.forEach((asset) => void saveOverride(asset.id, asset));
    setImportOpen(false);
  };

  const visibleColumns = COLUMN_DEFS.filter((c) => uiState.columnVisibility[c.key]);
  const gridTemplateColumns = ['28px', ...visibleColumns.map((c) => c.width)].join(' ');
  const density = uiState.density;
  const showSplitList = !!panelAsset && !uiState.listCollapsed;

  if (fullscreenPanel && panelAsset) {
    return (
      <div className={styles.panelFullscreenOverlay}>
        <AssetDetailPanel
          key={panelAsset.id}
          asset={panelAsset}
          programs={programs}
          findings={findings}
          isNew={!!draftAsset}
          onChange={draftAsset ? handleFinalizeCreate : handleUpdate}
          onClose={handleClosePanel}
          onDelete={handleDelete}
          fullscreen
          onToggleFullscreen={draftAsset ? undefined : () => setFullscreenPanel(false)}
        />
      </div>
    );
  }

  return (
    <>
      <BulkImportAssetsModal
        open={importOpen}
        existingHosts={items.map((a) => a.host)}
        onImport={handleImport}
        onClose={() => setImportOpen(false)}
      />
      <ConfirmModal
        open={bulkDeleteConfirming}
        title="Excluir alvos selecionados"
        message={`Excluir ${selectedIds.size} alvo${selectedIds.size === 1 ? '' : 's'} selecionado${selectedIds.size === 1 ? '' : 's'}? Essa ação não pode ser desfeita.`}
        onConfirm={confirmBulkDelete}
        onCancel={() => setBulkDeleteConfirming(false)}
      />

      <section className={styles.toolbarRow}>
        <div>
          <div className={styles.eyebrow}>bug bounty</div>
          <h1 className={styles.title}>Alvos</h1>
          <p className={styles.subtitle}>Assets em recon — visão enxuta na lista, profundidade no painel de detalhe.</p>
        </div>
        <div className={styles.assetToolbarActions}>
          <button type="button" onClick={() => setImportOpen(true)} className={styles.secondaryButtonSmall}>
            <Upload size={14} />
            importar lista
          </button>
          <button type="button" onClick={handleCreate} className={styles.newButtonAccent}>
            <Plus size={14} />
            novo alvo
          </button>
        </div>
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
          {taxonomy.statuses.map((status) => (
            <option key={status.id} value={status.id}>{status.label}</option>
          ))}
        </select>
        <select value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value)} className={styles.filterSelect}>
          <option value={TODOS}>todas as prioridades</option>
          {taxonomy.priorities.map((priority) => (
            <option key={priority.id} value={priority.id}>{priority.label}</option>
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

        <div className={styles.viewToggleGroup}>
          <button
            type="button"
            onClick={() => updateUiState({ density: 'confortável' })}
            className={density === 'confortável' ? styles.viewToggleActive : styles.viewToggleInactive}
          >
            confortável
          </button>
          <button
            type="button"
            onClick={() => updateUiState({ density: 'compacto' })}
            className={density === 'compacto' ? styles.viewToggleActive : styles.viewToggleInactive}
          >
            compacto
          </button>
        </div>

        <div className={styles.columnsMenuWrap}>
          <button type="button" onClick={() => setColumnsMenuOpen((v) => !v)} className={styles.secondaryButtonSmall} aria-label="Configurar colunas">
            <SlidersHorizontal size={14} />
            colunas
          </button>
          {columnsMenuOpen && (
            <>
              <div className={styles.taxonomyOverlay} onClick={() => setColumnsMenuOpen(false)} />
              <div className={styles.columnsMenu}>
                {COLUMN_DEFS.map((col) => (
                  <label key={col.key} className={styles.columnsMenuRow}>
                    <input
                      type="checkbox"
                      checked={uiState.columnVisibility[col.key]}
                      onChange={(event) =>
                        updateUiState({ columnVisibility: { ...uiState.columnVisibility, [col.key]: event.target.checked } })
                      }
                    />
                    {col.label}
                  </label>
                ))}
              </div>
            </>
          )}
        </div>

        {panelAsset && (
          <button
            type="button"
            onClick={() => updateUiState({ listCollapsed: !uiState.listCollapsed })}
            className={styles.secondaryButtonSmall}
            aria-label={uiState.listCollapsed ? 'Mostrar lista' : 'Recolher lista'}
          >
            {uiState.listCollapsed ? <PanelLeftOpen size={14} /> : <PanelLeftClose size={14} />}
          </button>
        )}
      </section>

      {selectedIds.size > 0 && (
        <section className={styles.bulkActionBar}>
          <span className={styles.bulkActionCount}>{selectedIds.size} selecionado{selectedIds.size === 1 ? '' : 's'}</span>
          <select
            defaultValue=""
            onChange={(event) => {
              if (event.target.value) applyBulkPatch({ status: event.target.value });
              event.target.value = '';
            }}
            className={styles.filterSelect}
          >
            <option value="">mudar status…</option>
            {taxonomy.statuses.map((status) => <option key={status.id} value={status.id}>{status.label}</option>)}
          </select>
          <select
            defaultValue=""
            onChange={(event) => {
              if (event.target.value) applyBulkPatch({ priority: event.target.value });
              event.target.value = '';
            }}
            className={styles.filterSelect}
          >
            <option value="">mudar prioridade…</option>
            {taxonomy.priorities.map((priority) => <option key={priority.id} value={priority.id}>{priority.label}</option>)}
          </select>
          <div className={styles.bulkTagInputWrap}>
            <input
              value={bulkTagDraft}
              onChange={(event: ChangeEvent<HTMLInputElement>) => setBulkTagDraft(event.target.value)}
              onKeyDown={(event) => event.key === 'Enter' && applyBulkTag()}
              placeholder="adicionar tag…"
              className={styles.searchInput}
            />
            <button type="button" onClick={applyBulkTag} className={styles.secondaryButtonSmall}>aplicar</button>
          </div>
          <button type="button" onClick={() => setBulkDeleteConfirming(true)} className={styles.deleteButton}>
            <Trash2 size={14} />
            excluir
          </button>
          <button type="button" onClick={() => setSelectedIds(new Set())} className={styles.secondaryButtonSmall}>limpar seleção</button>
        </section>
      )}

      <section
        ref={splitRef}
        className={showSplitList ? styles.payoutsLayoutSplit : styles.payoutsLayout}
        style={showSplitList ? { gridTemplateColumns: `minmax(0, 1fr) 6px ${uiState.panelWidthPct}%` } : undefined}
        aria-label="Alvos"
      >
        {!(uiState.listCollapsed && panelAsset) && (
          <div className={styles.assetTable}>
            <div className={styles.assetTableScroll}>
              <div className={styles.assetTableHead} style={{ gridTemplateColumns }}>
                <span className={styles.assetTableHeadCellCenter}>
                  <input type="checkbox" checked={allVisibleSelected} onChange={toggleSelectAll} aria-label="Selecionar todos" />
                </span>
                {visibleColumns.map((col) => (
                  <button key={col.key} type="button" onClick={() => toggleSort(col.key)} className={styles.sortButton}>
                    {col.label}
                    {sortKey === col.key && (sortDirection === 'asc' ? <ArrowUp size={11} /> : <ArrowDown size={11} />)}
                  </button>
                ))}
              </div>

              {sorted.length === 0 && (
                <div className={styles.emptyState}>nenhum alvo encontrado com esses filtros.</div>
              )}

              {sorted.map((asset) => (
                <div
                  key={asset.id}
                  className={`${styles.assetRow} ${density === 'compacto' ? styles.assetRowCompact : ''} ${selectedId === asset.id ? styles.assetRowActive : ''}`}
                  style={{ gridTemplateColumns }}
                >
                  <span className={styles.assetTableHeadCellCenter} onClick={(event) => event.stopPropagation()}>
                    <input type="checkbox" checked={selectedIds.has(asset.id)} onChange={() => toggleRowSelected(asset.id)} aria-label={`Selecionar ${asset.host}`} />
                  </span>
                  {uiState.columnVisibility.host && (
                    <span className={styles.assetHost} onClick={() => handleSelect(asset.id)}>{asset.host || 'sem host'}</span>
                  )}
                  {uiState.columnVisibility.type && (
                    <span className={styles.assetType} onClick={() => handleSelect(asset.id)}>{asset.type}</span>
                  )}
                  {uiState.columnVisibility.program && (
                    <span className={styles.assetProgram} onClick={() => handleSelect(asset.id)}>{programName(asset.programId).toUpperCase()}</span>
                  )}
                  {uiState.columnVisibility.stack && (
                    <span className={styles.assetTechStack} onClick={() => handleSelect(asset.id)}>
                      {asset.techStack.length === 0 && <span className={styles.assetTechEmpty}>—</span>}
                      {asset.techStack.slice(0, 2).map((tech) => (
                        <span key={tech} className={styles.assetTechTag}>{tech}</span>
                      ))}
                      {asset.techStack.length > 2 && <span className={styles.assetTechEmpty}>+{asset.techStack.length - 2}</span>}
                    </span>
                  )}
                  {uiState.columnVisibility.status && (
                    <span onClick={(event) => event.stopPropagation()}>
                      <TaxonomyBadgeSelect
                        kind="statuses"
                        value={asset.status}
                        taxonomy={taxonomy}
                        onChange={(id) => quickUpdate(asset, { status: id })}
                        onTaxonomySave={saveTaxonomy}
                        compact
                      />
                    </span>
                  )}
                  {uiState.columnVisibility.priority && (
                    <span onClick={(event) => event.stopPropagation()}>
                      <TaxonomyBadgeSelect
                        kind="priorities"
                        value={asset.priority}
                        taxonomy={taxonomy}
                        onChange={(id) => quickUpdate(asset, { priority: id })}
                        onTaxonomySave={saveTaxonomy}
                        compact
                      />
                    </span>
                  )}
                  {uiState.columnVisibility.findings && (
                    <span className={styles.assetFindingsCount} onClick={() => handleSelect(asset.id)}>{asset.findingIds.length || '—'}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {showSplitList && (
          <div
            className={styles.resizeHandle}
            onPointerDown={onHandlePointerDown}
            role="separator"
            aria-orientation="vertical"
            aria-label="Redimensionar painel"
            data-resizing={resizing}
          />
        )}

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
              fullscreen={false}
              onToggleFullscreen={() => setFullscreenPanel(true)}
            />
          </div>
        )}
      </section>
    </>
  );
}
