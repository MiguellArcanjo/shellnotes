'use client';

import { useEffect, useRef, useState, type ChangeEvent, type ReactNode } from 'react';
import { Maximize2, Minimize2, Paperclip, X } from 'lucide-react';
import ChipInput from '@/components/site/ChipInput';
import ConfirmModal from '@/components/site/ConfirmModal';
import type { Program } from '@/lib/bounty-data';
import {
  ASSET_TYPES,
  DISCOVERY_SOURCES,
  RESOLVE_STATUSES,
  type Asset,
  type CustomField,
  type SectionKey,
} from '@/lib/assets-data';
import { saveOverride } from '@/lib/assetOverrides';
import { useAssetTaxonomy } from '@/lib/useAssetTaxonomy';
import { useAssetsUIState } from '@/lib/useAssetsUIState';
import type { Finding } from '@/lib/findings-data';
import { getPrivateFileUrl, uploadPrivateFile } from '@/lib/supabase/storage';
import DetailSection from './DetailSection';
import TaxonomyBadgeSelect from './TaxonomyBadgeSelect';
import styles from './Bounty.module.css';

const AUTOSAVE_DELAY = 1200;

const SECTION_TITLES: Record<SectionKey, string> = {
  identificacao: 'Identificação',
  rede: 'Rede',
  fingerprint: 'Fingerprint web',
  superficie: 'Superfície de ataque',
  triagem: 'Triagem',
};

function formatBytes(size: number): string {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export default function AssetDetailPanel({
  asset,
  programs,
  findings,
  isNew = false,
  onChange,
  onClose,
  onDelete,
  fullscreen = false,
  onToggleFullscreen,
}: {
  asset: Asset;
  programs: Program[];
  findings: Finding[];
  isNew?: boolean;
  onChange: (updated: Asset) => void;
  onClose: () => void;
  onDelete?: (id: string) => void;
  fullscreen?: boolean;
  onToggleFullscreen?: () => void;
}) {
  const [draft, setDraft] = useState(asset);
  const [saved, setSaved] = useState(false);
  const [findingToAdd, setFindingToAdd] = useState('');
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [observationDraft, setObservationDraft] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const draggedSectionRef = useRef<SectionKey | null>(null);

  const { taxonomy, save: saveTaxonomy } = useAssetTaxonomy();
  const { state: uiState, update: updateUiState } = useAssetsUIState();

  useEffect(() => {
    // a new asset is only persisted/added to the list once the user
    // explicitly finalizes it — typing alone must not leak it into the table
    if (isNew) return;
    onChange(draft);
    const id = window.setTimeout(() => {
      saveOverride(draft.id, draft);
      setSaved(true);
    }, AUTOSAVE_DELAY);
    return () => window.clearTimeout(id);
  }, [draft, isNew, onChange]);

  const update = (patch: Partial<Asset>) => {
    setSaved(false);
    setDraft((current) => ({ ...current, ...patch }));
  };

  const save = () => {
    saveOverride(draft.id, draft);
    setSaved(true);
    if (isNew) onChange(draft);
  };

  const handleDelete = () => {
    if (!onDelete) return;
    setConfirmingDelete(true);
  };

  const linkedFindings = draft.findingIds.map((id) => findings.find((f) => f.id === id)).filter((f): f is Finding => !!f);
  const availableFindings = findings.filter(
    (f) => !draft.findingIds.includes(f.id) && (!draft.programId || f.programId === draft.programId),
  );

  const addFinding = () => {
    if (!findingToAdd) return;
    update({ findingIds: [...draft.findingIds, findingToAdd] });
    setFindingToAdd('');
  };

  const customFields = draft.customFields ?? [];
  const addCustomField = (section: SectionKey, label: string, value: string) => {
    const field: CustomField = { id: `field-${Date.now()}`, section, label, value };
    update({ customFields: [...customFields, field] });
  };
  const removeCustomField = (fieldId: string) => {
    update({ customFields: customFields.filter((f) => f.id !== fieldId) });
  };
  const changeCustomField = (fieldId: string, value: string) => {
    update({ customFields: customFields.map((f) => (f.id === fieldId ? { ...f, value } : f)) });
  };

  const observationLog = draft.observationLog ?? [];
  const addObservation = () => {
    const text = observationDraft.trim();
    if (!text) return;
    update({ observationLog: [{ id: `obs-${Date.now()}`, text, at: new Date().toISOString() }, ...observationLog] });
    setObservationDraft('');
  };
  const removeObservation = (id: string) => {
    update({ observationLog: observationLog.filter((o) => o.id !== id) });
  };

  const attachments = draft.attachments ?? [];
  const handleAttach = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const uploaded = await Promise.all(
        Array.from(files).map(async (file) => {
          const path = await uploadPrivateFile(file, `assets/${draft.id}`);
          return { id: `att-${Date.now()}-${file.name}`, name: file.name, path, size: file.size, uploadedAt: new Date().toISOString() };
        }),
      );
      update({ attachments: [...attachments, ...uploaded] });
    } catch {
      window.alert('Não foi possível enviar o anexo para o Storage.');
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };
  const openAttachment = async (path: string) => {
    try {
      const url = await getPrivateFileUrl(path);
      window.open(url, '_blank', 'noopener');
    } catch {
      window.alert('Não foi possível gerar o link do anexo.');
    }
  };
  const removeAttachment = (id: string) => {
    update({ attachments: attachments.filter((a) => a.id !== id) });
  };

  const sectionOrder = uiState.sectionOrder;
  const collapsedSections = new Set(uiState.collapsedSections);

  const toggleSectionCollapse = (id: SectionKey) => {
    const next = collapsedSections.has(id)
      ? uiState.collapsedSections.filter((s) => s !== id)
      : [...uiState.collapsedSections, id];
    updateUiState({ collapsedSections: next });
  };

  const reorderSections = (targetId: SectionKey) => {
    const draggedId = draggedSectionRef.current;
    if (!draggedId || draggedId === targetId) return;
    const next = sectionOrder.filter((id) => id !== draggedId);
    const targetIndex = next.indexOf(targetId);
    next.splice(targetIndex, 0, draggedId);
    updateUiState({ sectionOrder: next });
  };

  const sectionContent: Record<SectionKey, ReactNode> = {
    identificacao: (
      <div className={styles.detailSectionGrid}>
        <label className={styles.formField}>
          <span className={styles.formLabel}>tipo</span>
          <select value={draft.type} onChange={(event) => update({ type: event.target.value as Asset['type'] })} className={styles.formSelect}>
            {ASSET_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
          </select>
        </label>

        <label className={styles.formField}>
          <span className={styles.formLabel}>programa</span>
          <select value={draft.programId} onChange={(event) => update({ programId: event.target.value })} className={styles.formSelect}>
            <option value="">selecione um programa</option>
            {programs.map((program) => <option key={program.id} value={program.id}>{program.name || program.id}</option>)}
          </select>
        </label>

        <label className={styles.formField}>
          <span className={styles.formLabel}>escopo</span>
          <select
            value={draft.inScope ? 'in' : 'out'}
            onChange={(event) => update({ inScope: event.target.value === 'in' })}
            className={styles.formSelect}
          >
            <option value="in">in scope</option>
            <option value="out">out of scope</option>
          </select>
        </label>

        <label className={styles.formField}>
          <span className={styles.formLabel}>origem da descoberta</span>
          <select
            value={draft.discoverySource}
            onChange={(event) => update({ discoverySource: event.target.value as Asset['discoverySource'] })}
            className={styles.formSelect}
          >
            {DISCOVERY_SOURCES.map((source) => <option key={source} value={source}>{source}</option>)}
          </select>
        </label>

        <label className={styles.formField}>
          <span className={styles.formLabel}>primeira vez visto</span>
          <input type="date" value={draft.firstSeen} onChange={(event) => update({ firstSeen: event.target.value })} className={styles.formInput} />
        </label>

        <label className={styles.formField}>
          <span className={styles.formLabel}>última vez visto</span>
          <input type="date" value={draft.lastSeen} onChange={(event) => update({ lastSeen: event.target.value })} className={styles.formInput} />
        </label>
      </div>
    ),
    rede: (
      <div className={styles.detailSectionGrid}>
        <label className={styles.formField}>
          <span className={styles.formLabel}>resolve?</span>
          <select value={draft.resolve} onChange={(event) => update({ resolve: event.target.value as Asset['resolve'] })} className={styles.formSelect}>
            {RESOLVE_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
        </label>

        <label className={styles.formField}>
          <span className={styles.formLabel}>ASN</span>
          <input value={draft.asn} onChange={(event) => update({ asn: event.target.value })} placeholder="ex: AS16509" className={`${styles.formInput} ${styles.formInputMono}`} />
        </label>

        <label className={styles.formField}>
          <span className={styles.formLabel}>provedor / CDN</span>
          <input value={draft.provider} onChange={(event) => update({ provider: event.target.value })} placeholder="ex: Cloudflare, AWS..." className={styles.formInput} />
        </label>

        <div className={styles.formFieldWide}>
          <span className={styles.formLabel}>IP(s)</span>
          <ChipInput values={draft.ips} onChange={(next) => update({ ips: next })} placeholder="ex: 203.0.113.41" monospace />
        </div>

        <div className={styles.formFieldWide}>
          <span className={styles.formLabel}>portas abertas + serviços</span>
          <ChipInput values={draft.openPorts} onChange={(next) => update({ openPorts: next })} placeholder="ex: 443/https, 22/ssh..." monospace />
        </div>

        <label className={styles.formFieldWide}>
          <span className={styles.formLabel}>CNAME <span className={styles.formHint}>(útil para detectar subdomain takeover)</span></span>
          <input value={draft.cname} onChange={(event) => update({ cname: event.target.value })} placeholder="ex: d123abc.cloudfront.net" className={`${styles.formInput} ${styles.formInputMono}`} />
        </label>
      </div>
    ),
    fingerprint: (
      <div className={styles.detailSectionGrid}>
        <label className={styles.formField}>
          <span className={styles.formLabel}>status HTTP</span>
          <input value={draft.httpStatus} onChange={(event) => update({ httpStatus: event.target.value })} placeholder="ex: 200, 403..." className={`${styles.formInput} ${styles.formInputMono}`} />
        </label>

        <label className={styles.formField}>
          <span className={styles.formLabel}>título da página</span>
          <input value={draft.pageTitle} onChange={(event) => update({ pageTitle: event.target.value })} placeholder="<title> da página" className={styles.formInput} />
        </label>

        <label className={styles.formField}>
          <span className={styles.formLabel}>WAF detectado</span>
          <input value={draft.waf} onChange={(event) => update({ waf: event.target.value })} placeholder="ex: Cloudflare, nenhum..." className={styles.formInput} />
        </label>

        <div className={styles.formFieldWide}>
          <span className={styles.formLabel}>tecnologias / stack</span>
          <ChipInput values={draft.techStack} onChange={(next) => update({ techStack: next })} placeholder="ex: Nginx, React, PostgreSQL..." />
        </div>

        <label className={styles.formFieldWide}>
          <span className={styles.formLabel}>TLS / certificado</span>
          <input value={draft.tlsInfo} onChange={(event) => update({ tlsInfo: event.target.value })} placeholder="emissor, validade..." className={styles.formInput} />
        </label>

        <label className={styles.formFieldWide}>
          <span className={styles.formLabel}>screenshot</span>
          <input value={draft.screenshot} onChange={(event) => update({ screenshot: event.target.value })} placeholder="ex: home.png, link da captura..." className={styles.formInput} />
        </label>
      </div>
    ),
    superficie: (
      <div className={styles.detailSectionGrid}>
        <div className={styles.formFieldWide}>
          <span className={styles.formLabel}>endpoints / rotas descobertas</span>
          <ChipInput values={draft.endpoints} onChange={(next) => update({ endpoints: next })} placeholder="ex: /api/v1/users/:id" monospace />
        </div>

        <div className={styles.formFieldWide}>
          <span className={styles.formLabel}>parâmetros</span>
          <ChipInput values={draft.parameters} onChange={(next) => update({ parameters: next })} placeholder="ex: id, redirect_uri..." monospace />
        </div>

        <div className={styles.formFieldWide}>
          <span className={styles.formLabel}>diretórios</span>
          <ChipInput values={draft.directories} onChange={(next) => update({ directories: next })} placeholder="ex: /admin/, /static/..." monospace />
        </div>

        <div className={styles.formFieldWide}>
          <span className={styles.formLabel}>arquivos JS</span>
          <ChipInput values={draft.jsFiles} onChange={(next) => update({ jsFiles: next })} placeholder="ex: bundle.js, vendor.js..." monospace />
        </div>

        <label className={styles.inlineCheckboxRow}>
          <input type="checkbox" checked={draft.hasAuth} onChange={(event) => update({ hasAuth: event.target.checked })} className={styles.checklistCheckbox} />
          <span>tem autenticação?</span>
        </label>

        <div className={styles.formFieldWide}>
          <span className={styles.formLabel}>funcionalidades notáveis</span>
          <ChipInput values={draft.notableFeatures} onChange={(next) => update({ notableFeatures: next })} placeholder="ex: upload, painel admin, GraphQL..." />
        </div>

        <div className={styles.formFieldWide}>
          <span className={styles.formLabel}>anexos <span className={styles.formHint}>(screenshots, saída de scan, nuclei...)</span></span>
          <input ref={fileInputRef} type="file" multiple hidden onChange={handleAttach} />
          <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading} className={styles.inlineAddButton}>
            <Paperclip size={13} />
            {uploading ? 'enviando…' : 'anexar arquivo'}
          </button>
          <div className={styles.attachmentList}>
            {attachments.length === 0 && <span className={styles.assetTechEmpty}>nenhum anexo.</span>}
            {attachments.map((file) => (
              <div key={file.id} className={styles.attachmentRow}>
                <button type="button" onClick={() => openAttachment(file.path)} className={styles.attachmentOpenButton}>
                  {file.name}
                </button>
                <span className={styles.attachmentMeta}>{formatBytes(file.size)}</span>
                <button type="button" onClick={() => removeAttachment(file.id)} aria-label={`Remover ${file.name}`} className={styles.customFieldRemove}>
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    triagem: (
      <div className={styles.detailSectionGrid}>
        <div className={styles.formField}>
          <span className={styles.formLabel}>status</span>
          <TaxonomyBadgeSelect kind="statuses" value={draft.status} taxonomy={taxonomy} onChange={(id) => update({ status: id })} onTaxonomySave={saveTaxonomy} />
        </div>

        <div className={styles.formField}>
          <span className={styles.formLabel}>prioridade</span>
          <TaxonomyBadgeSelect kind="priorities" value={draft.priority} taxonomy={taxonomy} onChange={(id) => update({ priority: id })} onTaxonomySave={saveTaxonomy} />
        </div>

        <label className={styles.formField}>
          <span className={styles.formLabel}>última vez testado</span>
          <input type="date" value={draft.lastTested} onChange={(event) => update({ lastTested: event.target.value })} className={styles.formInput} />
        </label>

        <div className={styles.formFieldWide}>
          <span className={styles.formLabel}>tags</span>
          <ChipInput values={draft.tags} onChange={(next) => update({ tags: next })} placeholder="ex: prioritário, auth, leak..." />
        </div>

        <div className={styles.formFieldWide}>
          <span className={styles.formLabel}>findings vinculados</span>
          <div className={styles.linkedFindingsRow}>
            <select value={findingToAdd} onChange={(event) => setFindingToAdd(event.target.value)} className={styles.formSelect}>
              <option value="">selecione um finding para vincular</option>
              {availableFindings.map((finding) => <option key={finding.id} value={finding.id}>{finding.title || finding.id}</option>)}
            </select>
            <button type="button" onClick={addFinding} disabled={!findingToAdd} className={styles.saveButton}>vincular</button>
          </div>
          <div className={styles.linkedFindingsList}>
            {linkedFindings.length === 0 && <span className={styles.assetTechEmpty}>nenhum finding vinculado.</span>}
            {linkedFindings.map((finding) => (
              <span key={finding.id} className={styles.linkedFindingChip}>
                {finding.title || finding.id}
                <button
                  type="button"
                  onClick={() => update({ findingIds: draft.findingIds.filter((id) => id !== finding.id) })}
                  aria-label={`Remover vínculo com ${finding.title}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        <label className={styles.formFieldWide}>
          <span className={styles.formLabel}>notas</span>
          <textarea value={draft.notes} onChange={(event) => update({ notes: event.target.value })} placeholder="observações de recon, contexto..." className={styles.formTextarea} />
        </label>

        <div className={styles.formFieldWide}>
          <span className={styles.formLabel}>log de observações</span>
          <div className={styles.observationAddRow}>
            <input
              value={observationDraft}
              onChange={(event) => setObservationDraft(event.target.value)}
              onKeyDown={(event) => event.key === 'Enter' && addObservation()}
              placeholder="ex: re-testado após patch, comportamento mudou..."
              className={styles.formInput}
            />
            <button type="button" onClick={addObservation} className={styles.inlineAddButton}>registrar</button>
          </div>
          <div className={styles.observationLogList}>
            {observationLog.length === 0 && <span className={styles.assetTechEmpty}>nenhuma observação registrada.</span>}
            {observationLog.map((entry) => (
              <div key={entry.id} className={styles.observationRow}>
                <span className={styles.observationDate}>{new Date(entry.at).toLocaleString('pt-BR')}</span>
                <span className={styles.observationText}>{entry.text}</span>
                <button type="button" onClick={() => removeObservation(entry.id)} aria-label="Remover observação" className={styles.customFieldRemove}>
                  <X size={11} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
  };

  return (
    <div className={`${styles.reportPanel} ${fullscreen ? styles.reportPanelFullscreen : ''}`}>
      <ConfirmModal
        open={confirmingDelete}
        title="Excluir alvo"
        message="Excluir este alvo? Essa ação não pode ser desfeita."
        onConfirm={() => {
          setConfirmingDelete(false);
          onDelete?.(draft.id);
        }}
        onCancel={() => setConfirmingDelete(false)}
      />
      <button type="button" onClick={onClose} className={styles.panelCloseButton} aria-label="Fechar painel">
        <X size={15} />
      </button>
      {onToggleFullscreen && (
        <button
          type="button"
          onClick={onToggleFullscreen}
          className={styles.panelFullscreenButton}
          aria-label={fullscreen ? 'Sair da tela cheia' : 'Expandir em tela cheia'}
        >
          {fullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
        </button>
      )}
      <div className={styles.editorTopBar}>
        <span className={styles.breadcrumbCurrent}>{draft.host || 'novo alvo'}</span>
        <div className={`${styles.topBarRight} ${styles.topBarRightCorner}`}>
          {!isNew && onDelete && (
            <button type="button" onClick={handleDelete} className={styles.deleteButton}>excluir</button>
          )}
          <button type="button" onClick={save} className={styles.saveButton}>
            {isNew ? 'criar alvo' : 'salvar'}
          </button>
        </div>
      </div>
      <div className={styles.autosaveRow}>{saved && !isNew ? 'salvo há instantes' : ''}</div>

      <input
        type="text"
        value={draft.host}
        onChange={(event) => update({ host: event.target.value })}
        placeholder="host / valor, ex: api.exemplo.com"
        className={`${styles.titleFieldSmall} ${styles.titleFieldMono}`}
        spellCheck={false}
      />

      {sectionOrder.map((sectionId) => (
        <DetailSection
          key={sectionId}
          id={sectionId}
          title={SECTION_TITLES[sectionId]}
          collapsed={collapsedSections.has(sectionId)}
          onToggleCollapse={() => toggleSectionCollapse(sectionId)}
          onDragStart={() => {
            draggedSectionRef.current = sectionId;
          }}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            reorderSections(sectionId);
          }}
          customFields={customFields.filter((f) => f.section === sectionId)}
          onAddField={addCustomField}
          onRemoveField={removeCustomField}
          onFieldChange={changeCustomField}
        >
          {sectionContent[sectionId]}
        </DetailSection>
      ))}
    </div>
  );
}
