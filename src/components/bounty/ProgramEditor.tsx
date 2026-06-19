'use client';

import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { Upload } from 'lucide-react';
import ChipInput from '@/components/site/ChipInput';
import {
  PLATFORMS,
  STATUSES,
  TYPES,
  SEVERITY_LABELS,
  SEVERITY_ORDER,
  type Program,
  type Severity,
} from '@/lib/bounty-data';
import { saveOverride } from '@/lib/programOverrides';
import { parseScopeCsv } from '@/lib/scopeImport';
import styles from './Bounty.module.css';

const AUTOSAVE_DELAY = 1200;

export default function ProgramEditor({
  program,
  isNew = false,
  onExit,
}: {
  program: Program;
  isNew?: boolean;
  onExit: (saved: Program) => void;
}) {
  const [draft, setDraft] = useState(program);
  const [saved, setSaved] = useState(false);
  const [scopeImportSummary, setScopeImportSummary] = useState('');
  const scopeFileInputRef = useRef<HTMLInputElement | null>(null);
  // a brand new program must never be persisted just by opening the editor
  // and leaving — only an explicit save (or autosave after that first save)
  // should create it
  const hasPersisted = useRef(!isNew);

  useEffect(() => {
    if (!hasPersisted.current) return;
    const id = window.setTimeout(() => {
      saveOverride(draft.id, draft);
      setSaved(true);
    }, AUTOSAVE_DELAY);
    return () => window.clearTimeout(id);
  }, [draft]);

  const update = (patch: Partial<Program>) => {
    setSaved(false);
    setDraft((current) => ({ ...current, ...patch }));
  };

  const updateReward = (severity: Severity, range: string) => {
    update({
      rewardTable: draft.rewardTable.map((row) =>
        row.severity === severity ? { ...row, range } : row,
      ),
    });
  };

  const save = () => {
    hasPersisted.current = true;
    saveOverride(draft.id, draft);
    setSaved(true);
  };

  const handleScopeCsvImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    const text = await file.text();
    const { scopeIn, scopeOut } = parseScopeCsv(text);
    if (scopeIn.length === 0 && scopeOut.length === 0) {
      setScopeImportSummary('nenhum escopo reconhecido nesse CSV.');
      return;
    }

    update({
      scopeIn: Array.from(new Set([...draft.scopeIn, ...scopeIn])),
      scopeOut: Array.from(new Set([...draft.scopeOut, ...scopeOut])),
    });
    setScopeImportSummary(`${scopeIn.length} em escopo + ${scopeOut.length} fora de escopo importados.`);
  };

  return (
    <div className={styles.programEditor}>
      <div className={styles.editorTopBar}>
        <div className={styles.breadcrumb}>
          <button type="button" onClick={() => onExit(draft)} className={styles.breadcrumbLink}>
            programas
          </button>
          <span className={styles.breadcrumbSep}>/</span>
          <span className={styles.breadcrumbCurrent}>{draft.name || 'novo programa'}</span>
        </div>
        <div className={styles.topBarRight}>
          <span className={styles.autosaveLabel}>{saved ? 'salvo há instantes' : ''}</span>
          <button type="button" onClick={save} className={styles.saveButton}>salvar</button>
        </div>
      </div>

      <input
        type="text"
        value={draft.name}
        onChange={(event) => update({ name: event.target.value })}
        placeholder="Nome do programa"
        className={styles.titleField}
      />

      <div className={styles.formGrid}>
        <label className={styles.formField}>
          <span className={styles.formLabel}>plataforma</span>
          <select
            value={draft.platform}
            onChange={(event) => update({ platform: event.target.value as Program['platform'] })}
            className={styles.formSelect}
          >
            {PLATFORMS.map((platform) => (
              <option key={platform} value={platform}>{platform}</option>
            ))}
          </select>
        </label>

        <label className={styles.formField}>
          <span className={styles.formLabel}>status</span>
          <select
            value={draft.status}
            onChange={(event) => update({ status: event.target.value as Program['status'] })}
            className={styles.formSelect}
          >
            {STATUSES.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </label>

        <label className={styles.formField}>
          <span className={styles.formLabel}>tipo</span>
          <select
            value={draft.type}
            onChange={(event) => update({ type: event.target.value as Program['type'] })}
            className={styles.formSelect}
          >
            {TYPES.map((type) => (
              <option key={type} value={type}>{type === 'VDP' ? 'VDP (sem recompensa)' : 'pago'}</option>
            ))}
          </select>
        </label>

        <label className={styles.formFieldWide}>
          <span className={styles.formLabel}>URL do programa</span>
          <input
            value={draft.url}
            onChange={(event) => update({ url: event.target.value })}
            placeholder="https://..."
            className={styles.formInput}
          />
        </label>

        <label className={styles.formField}>
          <span className={styles.formLabel}>faixa de recompensa</span>
          <input
            value={draft.rewardRange}
            onChange={(event) => update({ rewardRange: event.target.value })}
            placeholder="US$ 100 – 10.000"
            className={styles.formInput}
          />
        </label>

        <label className={styles.formField}>
          <span className={styles.formLabel}>última revisão de política</span>
          <input
            type="date"
            value={draft.lastPolicyReview}
            onChange={(event) => update({ lastPolicyReview: event.target.value })}
            className={styles.formInput}
          />
        </label>
      </div>

      <div className={styles.scopeImportRow}>
        <input
          ref={scopeFileInputRef}
          type="file"
          accept=".csv,text/csv"
          hidden
          onChange={handleScopeCsvImport}
        />
        <button type="button" onClick={() => scopeFileInputRef.current?.click()} className={styles.secondaryButtonSmall}>
          <Upload size={14} />
          importar CSV de escopo (HackerOne)
        </button>
        {scopeImportSummary && <span className={styles.scopeImportSummary}>{scopeImportSummary}</span>}
      </div>

      <div className={styles.scopeSection}>
        <div className={`${styles.scopeBlock} ${styles.scopeBlockIn}`}>
          <div className={`${styles.scopeHead} ${styles.scopeHeadIn}`}>escopo in</div>
          <p className={styles.scopeHint}>Domínios, wildcards, apps e APIs cobertos pelo programa.</p>
          <ChipInput
            values={draft.scopeIn}
            onChange={(next) => update({ scopeIn: next })}
            placeholder="ex: *.exemplo.com, api.exemplo.com"
            monospace
          />
        </div>
        <div className={`${styles.scopeBlock} ${styles.scopeBlockOut}`}>
          <div className={`${styles.scopeHead} ${styles.scopeHeadOut}`}>escopo out</div>
          <p className={styles.scopeHint}>Assets explicitamente fora de escopo.</p>
          <ChipInput
            values={draft.scopeOut}
            onChange={(next) => update({ scopeOut: next })}
            placeholder="ex: staging.exemplo.com"
            monospace
          />
        </div>
      </div>

      <label className={styles.formFieldWide}>
        <span className={styles.formLabel}>regras e rate limits</span>
        <textarea
          value={draft.rules}
          onChange={(event) => update({ rules: event.target.value })}
          placeholder="Regras de engajamento, limites de requisição, o que é proibido testar..."
          className={styles.formTextarea}
        />
      </label>

      <div>
        <div className={`${styles.formLabel} ${styles.rewardTableLabel}`}>recompensa por severidade</div>
        <div className={styles.rewardTable}>
          {SEVERITY_ORDER.map((severity) => {
            const row = draft.rewardTable.find((r) => r.severity === severity);
            return (
              <div key={severity} className={styles.rewardRow}>
                <span className={styles.rewardSeverityLabel}>
                  <span className={`${styles.severity} ${styles[severity]}`} />
                  {SEVERITY_LABELS[severity]}
                </span>
                <input
                  value={row?.range ?? ''}
                  onChange={(event) => updateReward(severity, event.target.value)}
                  placeholder="US$ ..."
                  className={styles.rewardInput}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
