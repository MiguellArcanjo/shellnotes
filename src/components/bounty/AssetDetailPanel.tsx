'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import ChipInput from '@/components/site/ChipInput';
import type { Program } from '@/lib/bounty-data';
import {
  ASSET_STATUSES,
  ASSET_TYPES,
  DISCOVERY_SOURCES,
  PRIORITIES,
  RESOLVE_STATUSES,
  type Asset,
} from '@/lib/assets-data';
import { saveOverride } from '@/lib/assetOverrides';
import type { Finding } from '@/lib/findings-data';
import AssetStatusTag from './AssetStatusTag';
import PriorityTag from './PriorityTag';
import styles from './Bounty.module.css';

const AUTOSAVE_DELAY = 1200;

export default function AssetDetailPanel({
  asset,
  programs,
  findings,
  isNew = false,
  onChange,
  onClose,
  onDelete,
}: {
  asset: Asset;
  programs: Program[];
  findings: Finding[];
  isNew?: boolean;
  onChange: (updated: Asset) => void;
  onClose: () => void;
  onDelete?: (id: string) => void;
}) {
  const [draft, setDraft] = useState(asset);
  const [saved, setSaved] = useState(false);
  const [findingToAdd, setFindingToAdd] = useState('');

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
    if (!window.confirm('Excluir este alvo? Essa ação não pode ser desfeita.')) return;
    onDelete(draft.id);
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

  return (
    <div className={styles.reportPanel}>
      <button type="button" onClick={onClose} className={styles.panelCloseButton} aria-label="Fechar painel">
        <X size={15} />
      </button>
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

      <div className={styles.detailSection}>
        <div className={styles.detailSectionTitle}>Identificação</div>
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
      </div>

      <div className={styles.detailSection}>
        <div className={styles.detailSectionTitle}>Rede</div>
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
      </div>

      <div className={styles.detailSection}>
        <div className={styles.detailSectionTitle}>Fingerprint web</div>
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
      </div>

      <div className={styles.detailSection}>
        <div className={styles.detailSectionTitle}>Superfície de ataque</div>
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
        </div>
      </div>

      <div className={styles.detailSection}>
        <div className={styles.detailSectionTitle}>Triagem</div>
        <div className={styles.detailSectionGrid}>
          <div className={styles.formField}>
            <span className={styles.formLabel}>status</span>
            <div className={styles.severityFieldRow}>
              <select value={draft.status} onChange={(event) => update({ status: event.target.value as Asset['status'] })} className={styles.formSelect}>
                {ASSET_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
              </select>
              <AssetStatusTag status={draft.status} />
            </div>
          </div>

          <div className={styles.formField}>
            <span className={styles.formLabel}>prioridade</span>
            <div className={styles.severityFieldRow}>
              <select value={draft.priority} onChange={(event) => update({ priority: event.target.value as Asset['priority'] })} className={styles.formSelect}>
                {PRIORITIES.map((priority) => <option key={priority} value={priority}>{priority}</option>)}
              </select>
              <PriorityTag priority={draft.priority} />
            </div>
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
        </div>
      </div>
    </div>
  );
}
