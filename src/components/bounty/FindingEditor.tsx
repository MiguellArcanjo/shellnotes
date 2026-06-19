'use client';

import { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, Plus, X } from 'lucide-react';
import ChipInput from '@/components/site/ChipInput';
import { SEVERITY_ORDER, SEVERITY_LABELS, type Program } from '@/lib/bounty-data';
import {
  PAYOUT_STATUSES,
  PIPELINE_STATUS_GROUPS,
  type CodeSnippet,
  type Finding,
} from '@/lib/findings-data';
import { saveOverride } from '@/lib/findingOverrides';
import {
  CVSS_AC_OPTIONS,
  CVSS_AV_OPTIONS,
  CVSS_IMPACT_OPTIONS,
  CVSS_PR_OPTIONS,
  CVSS_SCOPE_OPTIONS,
  CVSS_SEVERITY_LABELS,
  CVSS_UI_OPTIONS,
  calculateCvss,
  cvssSeverityToFindingSeverity,
  type CvssMetrics,
} from '@/lib/cvss';
import SeverityBadge from './SeverityBadge';
import styles from './Bounty.module.css';

const AUTOSAVE_DELAY = 1200;

function CopyIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15V5a2 2 0 0 1 2-2h10" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

function SnippetCopyButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      // clipboard unavailable, nothing to fall back to
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <button type="button" onClick={handleCopy} className={styles.iconButton}>
      {copied ? <CheckIcon /> : <CopyIcon />}
      {copied ? 'copiado' : 'copiar'}
    </button>
  );
}

export default function FindingEditor({
  finding,
  programs,
  onExit,
}: {
  finding: Finding;
  programs: Program[];
  onExit: (saved: Finding) => void;
}) {
  const [draft, setDraft] = useState(finding);
  const [saved, setSaved] = useState(false);
  const [cvssExpanded, setCvssExpanded] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => {
      saveOverride(draft.id, draft);
      setSaved(true);
    }, AUTOSAVE_DELAY);
    return () => window.clearTimeout(id);
  }, [draft]);

  // unless the user opted into a manual override, the badge always tracks the
  // CVSS metrics — recompute it whenever the metrics (or the override flag) change
  useEffect(() => {
    if (draft.severityOverride) return;
    const mapped = cvssSeverityToFindingSeverity(calculateCvss(draft.cvss).severity);
    setDraft((current) => (current.severity === mapped ? current : { ...current, severity: mapped }));
  }, [draft.cvss, draft.severityOverride]);

  const update = (patch: Partial<Finding>) => {
    setSaved(false);
    setDraft((current) => ({ ...current, ...patch }));
  };

  const updateCvss = (patch: Partial<CvssMetrics>) => {
    update({ cvss: { ...draft.cvss, ...patch } });
  };

  const updateStep = (index: number, value: string) => {
    update({ steps: draft.steps.map((step, i) => (i === index ? value : step)) });
  };

  const updateSnippet = (index: number, patch: Partial<CodeSnippet>) => {
    update({ snippets: draft.snippets.map((snippet, i) => (i === index ? { ...snippet, ...patch } : snippet)) });
  };

  const save = () => {
    saveOverride(draft.id, draft);
    setSaved(true);
  };

  const cvssResult = calculateCvss(draft.cvss);

  return (
    <div className={styles.programEditor}>
      <div className={styles.editorTopBar}>
        <div className={styles.breadcrumb}>
          <button type="button" onClick={() => onExit(draft)} className={styles.breadcrumbLink}>
            findings
          </button>
          <span className={styles.breadcrumbSep}>/</span>
          <span className={styles.breadcrumbCurrent}>{draft.title || 'novo finding'}</span>
        </div>
        <div className={styles.topBarRight}>
          <span className={styles.autosaveLabel}>{saved ? 'salvo há instantes' : ''}</span>
          <button type="button" onClick={save} className={styles.saveButton}>salvar</button>
        </div>
      </div>

      <input
        type="text"
        value={draft.title}
        onChange={(event) => update({ title: event.target.value })}
        placeholder="Título do finding"
        className={styles.titleField}
      />

      <div className={styles.formGrid}>
        <label className={styles.formField}>
          <span className={styles.formLabel}>programa</span>
          <select
            value={draft.programId}
            onChange={(event) => update({ programId: event.target.value })}
            className={styles.formSelect}
          >
            <option value="">selecione um programa</option>
            {programs.map((program) => (
              <option key={program.id} value={program.id}>{program.name || program.id}</option>
            ))}
          </select>
        </label>

        <label className={styles.formField}>
          <span className={styles.formLabel}>tipo (OWASP / CWE)</span>
          <input
            value={draft.classification}
            onChange={(event) => update({ classification: event.target.value })}
            placeholder="ex: OWASP A01:2021 · CWE-862"
            className={styles.formInput}
          />
        </label>

        <div className={styles.formField}>
          <span className={styles.formLabel}>severidade</span>
          <div className={styles.severityFieldRow}>
            <SeverityBadge severity={draft.severity} />
            <span className={styles.cvssScoreInline}>
              {cvssResult.score.toFixed(1)}{draft.severityOverride ? ' · manual' : ''}
            </span>
          </div>
          <button type="button" onClick={() => setCvssExpanded((v) => !v)} className={styles.addStepButton}>
            {cvssExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            calculadora CVSS
          </button>
        </div>

        <label className={styles.formFieldWide}>
          <span className={styles.formLabel}>asset / URL</span>
          <input
            value={draft.asset}
            onChange={(event) => update({ asset: event.target.value })}
            placeholder="ex: api.exemplo.com/v1/recurso/:id"
            className={styles.formInput}
          />
        </label>

        <label className={styles.formField}>
          <span className={styles.formLabel}>status no pipeline</span>
          <select
            value={draft.status}
            onChange={(event) => update({ status: event.target.value as Finding['status'] })}
            className={styles.formSelect}
          >
            {PIPELINE_STATUS_GROUPS.map((group) => (
              <optgroup key={group.label} label={group.label}>
                {group.statuses.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>

        <label className={styles.formField}>
          <span className={styles.formLabel}>recompensa</span>
          <input
            value={draft.reward}
            onChange={(event) => update({ reward: event.target.value })}
            placeholder="US$ ..."
            className={styles.formInput}
          />
        </label>

        <label className={styles.formField}>
          <span className={styles.formLabel}>status do payout</span>
          <select
            value={draft.payoutStatus}
            onChange={(event) => update({ payoutStatus: event.target.value as Finding['payoutStatus'] })}
            className={styles.formSelect}
          >
            {PAYOUT_STATUSES.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </label>

        {cvssExpanded && (
          <div className={styles.cvssPanel}>
            <div className={styles.cvssMetricsGrid}>
              <div className={styles.cvssMetric}>
                <span className={styles.cvssMetricLabel}>Attack Vector</span>
                <div className={styles.viewToggleGroup}>
                  {CVSS_AV_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => updateCvss({ av: option.value })}
                      className={draft.cvss.av === option.value ? styles.viewToggleActive : styles.viewToggleInactive}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.cvssMetric}>
                <span className={styles.cvssMetricLabel}>Attack Complexity</span>
                <div className={styles.viewToggleGroup}>
                  {CVSS_AC_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => updateCvss({ ac: option.value })}
                      className={draft.cvss.ac === option.value ? styles.viewToggleActive : styles.viewToggleInactive}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.cvssMetric}>
                <span className={styles.cvssMetricLabel}>Privileges Required</span>
                <div className={styles.viewToggleGroup}>
                  {CVSS_PR_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => updateCvss({ pr: option.value })}
                      className={draft.cvss.pr === option.value ? styles.viewToggleActive : styles.viewToggleInactive}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.cvssMetric}>
                <span className={styles.cvssMetricLabel}>User Interaction</span>
                <div className={styles.viewToggleGroup}>
                  {CVSS_UI_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => updateCvss({ ui: option.value })}
                      className={draft.cvss.ui === option.value ? styles.viewToggleActive : styles.viewToggleInactive}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.cvssMetric}>
                <span className={styles.cvssMetricLabel}>Scope</span>
                <div className={styles.viewToggleGroup}>
                  {CVSS_SCOPE_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => updateCvss({ scope: option.value })}
                      className={draft.cvss.scope === option.value ? styles.viewToggleActive : styles.viewToggleInactive}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.cvssMetric}>
                <span className={styles.cvssMetricLabel}>Confidentiality</span>
                <div className={styles.viewToggleGroup}>
                  {CVSS_IMPACT_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => updateCvss({ c: option.value })}
                      className={draft.cvss.c === option.value ? styles.viewToggleActive : styles.viewToggleInactive}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.cvssMetric}>
                <span className={styles.cvssMetricLabel}>Integrity</span>
                <div className={styles.viewToggleGroup}>
                  {CVSS_IMPACT_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => updateCvss({ i: option.value })}
                      className={draft.cvss.i === option.value ? styles.viewToggleActive : styles.viewToggleInactive}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.cvssMetric}>
                <span className={styles.cvssMetricLabel}>Availability</span>
                <div className={styles.viewToggleGroup}>
                  {CVSS_IMPACT_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => updateCvss({ a: option.value })}
                      className={draft.cvss.a === option.value ? styles.viewToggleActive : styles.viewToggleInactive}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className={styles.cvssResultRow}>
              <span className={styles.cvssVector}>{cvssResult.vector}</span>
              <span className={styles.cvssScoreBig}>
                {cvssResult.score.toFixed(1)} — {CVSS_SEVERITY_LABELS[cvssResult.severity]}
              </span>
            </div>

            <label className={styles.inlineCheckboxRow}>
              <input
                type="checkbox"
                checked={draft.severityOverride}
                onChange={(event) => update({ severityOverride: event.target.checked })}
                className={styles.checklistCheckbox}
              />
              <span>substituir manualmente a severidade calculada</span>
            </label>

            {draft.severityOverride && (
              <select
                value={draft.severity}
                onChange={(event) => update({ severity: event.target.value as Finding['severity'] })}
                className={styles.formSelect}
              >
                {SEVERITY_ORDER.map((severity) => (
                  <option key={severity} value={severity}>{SEVERITY_LABELS[severity]}</option>
                ))}
              </select>
            )}
          </div>
        )}
      </div>

      <div className={styles.formFieldWide}>
        <span className={styles.formLabel}>passos de reprodução</span>
        <div className={styles.stepsList}>
          {draft.steps.map((step, index) => (
            <div key={index} className={styles.stepRow}>
              <span className={styles.stepNumber}>{index + 1}</span>
              <input
                value={step}
                onChange={(event) => updateStep(index, event.target.value)}
                placeholder={`Passo ${index + 1}`}
                className={styles.stepInput}
              />
              <button
                type="button"
                onClick={() => update({ steps: draft.steps.filter((_, i) => i !== index) })}
                className={styles.removeStepButton}
                aria-label="Remover passo"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => update({ steps: [...draft.steps, ''] })}
          className={styles.addStepButton}
        >
          <Plus size={13} />
          adicionar passo
        </button>
      </div>

      <div className={styles.formFieldWide}>
        <span className={styles.formLabel}>payloads e request / response</span>
        <div className={styles.snippetList}>
          {draft.snippets.map((snippet, index) => (
            <div key={index} className={styles.snippetBlock}>
              <div className={styles.snippetHead}>
                <input
                  value={snippet.label}
                  onChange={(event) => updateSnippet(index, { label: event.target.value })}
                  placeholder="rótulo (payload, request, response...)"
                  className={styles.snippetLabelInput}
                />
                <div className={styles.snippetActions}>
                  <SnippetCopyButton code={snippet.code} />
                  <button
                    type="button"
                    onClick={() => update({ snippets: draft.snippets.filter((_, i) => i !== index) })}
                    className={styles.iconButton}
                    aria-label="Remover bloco"
                  >
                    <X size={13} />
                    remover
                  </button>
                </div>
              </div>
              <textarea
                value={snippet.code}
                onChange={(event) => updateSnippet(index, { code: event.target.value })}
                placeholder="cole aqui o payload, request ou response..."
                spellCheck={false}
                className={styles.snippetCode}
              />
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => update({ snippets: [...draft.snippets, { label: '', code: '' }] })}
          className={styles.addStepButton}
        >
          <Plus size={13} />
          adicionar bloco
        </button>
      </div>

      <label className={styles.formFieldWide}>
        <span className={styles.formLabel}>impacto</span>
        <textarea
          value={draft.impact}
          onChange={(event) => update({ impact: event.target.value })}
          placeholder="O que um atacante consegue fazer explorando isso, e quem é afetado..."
          className={styles.formTextarea}
        />
      </label>

      <div className={styles.formFieldWide}>
        <span className={styles.formLabel}>anexos / prints</span>
        <ChipInput
          values={draft.attachments}
          onChange={(next) => update({ attachments: next })}
          placeholder="ex: poc-login.png, request.har"
          monospace
        />
      </div>

      <div className={styles.promoteRow}>
        <button type="button" disabled className={styles.promoteButton}>
          promover a writeup público
        </button>
        <p className={styles.promoteNote}>
          Disponível apenas quando o programa autorizar a disclosure pública deste finding.
        </p>
      </div>
    </div>
  );
}
