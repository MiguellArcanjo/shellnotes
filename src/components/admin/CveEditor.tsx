'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2 } from 'lucide-react';
import {
  CVE_TYPES,
  EXPLOIT_STATUSES,
  severityFromScore,
  type CveEntry,
  type CveStatus,
} from '@/lib/cves-data';
import { saveCve } from '@/lib/cveStore';
import type { Writeup } from '@/lib/writeups-data';
import { getRemoteWriteups } from '@/lib/writeupOverrides';
import styles from './Admin.module.css';

export default function CveEditor({ entry }: { entry: CveEntry }) {
  const router = useRouter();
  const [draft, setDraft] = useState(entry);
  const [writeups, setWriteups] = useState<Writeup[]>([]);
  const severity = severityFromScore(draft.cvss);

  useEffect(() => {
    void getRemoteWriteups().then(setWriteups);
  }, []);

  const update = (patch: Partial<CveEntry>) => {
    setDraft((current) => ({ ...current, ...patch, updatedAt: new Date().toISOString().slice(0, 10) }));
  };

  const updateCodeBlock = (index: number, patch: Partial<CveEntry['codeBlocks'][number]>) => {
    update({
      codeBlocks: draft.codeBlocks.map((block, blockIndex) =>
        blockIndex === index ? { ...block, ...patch } : block,
      ),
    });
  };

  const persist = (status?: CveStatus) => {
    const next = {
      ...draft,
      cveId: draft.cveId.trim().toUpperCase(),
      severity,
      status: status ?? draft.status,
      updatedAt: new Date().toISOString().slice(0, 10),
    };
    saveCve(next);
    router.push('/admin/cves');
  };

  return (
    <div className={styles.cveEditor}>
      <div className={styles.cveEditorTopbar}>
        <div className={styles.cveBreadcrumb}>
          <Link href="/admin/cves">CVEs</Link>
          <span>/</span>
          <span>{draft.cveId || 'nova CVE'}</span>
        </div>
        <div className={styles.cveEditorActions}>
          <span className={draft.status === 'published' ? styles.statusPublished : styles.statusDraft}>
            {draft.status === 'published' ? 'publicado' : 'rascunho'}
          </span>
          <button type="button" onClick={() => persist()} className={styles.secondaryButton}>salvar</button>
          <button type="button" onClick={() => persist('published')} disabled={!draft.cveId.trim() || !draft.product.trim()} className={styles.primaryButton}>
            publicar
          </button>
        </div>
      </div>

      <section className={styles.cveFormIntro}>
        <div>
          <div className={styles.eyebrow}>registro de vulnerabilidade</div>
          <h1 className={styles.editorTitle}>{draft.cveId || 'Nova CVE'}</h1>
        </div>
        <div className={styles.cveScoreSummary}>
          <span className={`${styles.cvssBadgeLarge} ${styles[`cvss${severity}`]}`}>{draft.cvss.toFixed(1)}</span>
          <span className={styles.cveSeverityName}>
            {severity === 'critical' ? 'crítico' : severity === 'high' ? 'alto' : severity === 'medium' ? 'médio' : 'baixo'}
          </span>
        </div>
      </section>

      <div className={styles.cveFormGrid}>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>ID da CVE</span>
          <input
            value={draft.cveId}
            onChange={(event) => update({ cveId: event.target.value })}
            placeholder="CVE-2026-00000"
            className={`${styles.formInput} ${styles.monoInput}`}
            autoFocus
          />
        </label>

        <label className={styles.field}>
          <span className={styles.fieldLabel}>CVSS</span>
          <input
            type="number"
            min="0"
            max="10"
            step="0.1"
            value={draft.cvss}
            onChange={(event) => update({ cvss: Math.min(10, Math.max(0, Number(event.target.value))) })}
            className={styles.formInput}
          />
        </label>

        <label className={styles.field}>
          <span className={styles.fieldLabel}>Produto afetado</span>
          <input value={draft.product} onChange={(event) => update({ product: event.target.value })} placeholder="ex: OpenSSH" className={styles.formInput} />
        </label>

        <label className={styles.field}>
          <span className={styles.fieldLabel}>Versão afetada</span>
          <input value={draft.version} onChange={(event) => update({ version: event.target.value })} placeholder="ex: 8.5p1–9.7p1" className={styles.formInput} />
        </label>

        <label className={styles.field}>
          <span className={styles.fieldLabel}>Tipo</span>
          <select value={draft.vulnerabilityType} onChange={(event) => update({ vulnerabilityType: event.target.value })} className={styles.formSelect}>
            {CVE_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
          </select>
        </label>

        <label className={styles.field}>
          <span className={styles.fieldLabel}>Status de exploração</span>
          <select value={draft.exploitStatus} onChange={(event) => update({ exploitStatus: event.target.value as CveEntry['exploitStatus'] })} className={styles.formSelect}>
            {EXPLOIT_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
        </label>

        <label className={styles.fieldWide}>
          <span className={styles.fieldLabel}>Descrição</span>
          <textarea value={draft.description} onChange={(event) => update({ description: event.target.value })} placeholder="Resumo técnico da vulnerabilidade, vetor e impacto…" className={styles.formTextarea} />
        </label>

        <label className={styles.fieldWide}>
          <span className={styles.fieldLabel}>Impacto</span>
          <textarea value={draft.impact} onChange={(event) => update({ impact: event.target.value })} placeholder="O que um atacante pode alcançar e quais sistemas são afetados…" className={styles.formTextarea} />
        </label>

        <label className={styles.fieldWide}>
          <span className={styles.fieldLabel}>Reprodução</span>
          <textarea value={draft.reproduction} onChange={(event) => update({ reproduction: event.target.value })} placeholder="Ambiente, pré-requisitos e passos seguros para reproduzir…" className={styles.formTextarea} />
        </label>

        <label className={styles.fieldWide}>
          <span className={styles.fieldLabel}>Mitigação</span>
          <textarea value={draft.mitigation} onChange={(event) => update({ mitigation: event.target.value })} placeholder="Versão corrigida, workaround e ações recomendadas…" className={styles.formTextarea} />
        </label>

        <div className={styles.fieldWide}>
          <div className={styles.cveFieldHeading}>
            <span className={styles.fieldLabel}>Blocos de código / PoC</span>
            <button
              type="button"
              onClick={() => update({ codeBlocks: [...draft.codeBlocks, { title: '', language: 'text', code: '' }] })}
              className={styles.inlineAddButton}
            >
              <Plus size={13} />
              adicionar bloco
            </button>
          </div>
          <div className={styles.cveCodeEditorList}>
            {draft.codeBlocks.map((block, index) => (
              <div key={index} className={styles.cveCodeEditor}>
                <div className={styles.cveCodeEditorHead}>
                  <input
                    value={block.title}
                    onChange={(event) => updateCodeBlock(index, { title: event.target.value })}
                    placeholder="título do bloco"
                    className={styles.formInput}
                  />
                  <input
                    value={block.language}
                    onChange={(event) => updateCodeBlock(index, { language: event.target.value })}
                    placeholder="linguagem"
                    className={`${styles.formInput} ${styles.monoInput}`}
                  />
                  <button
                    type="button"
                    onClick={() => update({ codeBlocks: draft.codeBlocks.filter((_, blockIndex) => blockIndex !== index) })}
                    className={styles.dangerButton}
                    aria-label="Remover bloco de código"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <textarea
                  value={block.code}
                  onChange={(event) => updateCodeBlock(index, { code: event.target.value })}
                  placeholder="cole aqui o código, comando, request ou response…"
                  className={styles.formCode}
                  spellCheck={false}
                />
              </div>
            ))}
            {draft.codeBlocks.length === 0 && <div className={styles.cveEmptyField}>nenhum bloco adicionado</div>}
          </div>
        </div>

        <label className={styles.fieldWide}>
          <span className={styles.fieldLabel}>Referências</span>
          <textarea
            value={draft.references.join('\n')}
            onChange={(event) => update({ references: event.target.value.split('\n').map((value) => value.trim()).filter(Boolean) })}
            placeholder={'uma URL por linha\nhttps://nvd.nist.gov/vuln/detail/CVE-…'}
            className={`${styles.formTextarea} ${styles.monoInput}`}
          />
        </label>

        <label className={styles.fieldWide}>
          <span className={styles.fieldLabel}>Suas notas</span>
          <textarea value={draft.notes} onChange={(event) => update({ notes: event.target.value })} placeholder="Hipóteses, ambiente, comandos, referências e pontos para revisar…" className={`${styles.formTextarea} ${styles.notesTextarea}`} />
        </label>

        <div className={styles.field}>
          <span className={styles.fieldLabel}>Reproduzido?</span>
          <div className={styles.segmentedControl}>
            <button type="button" onClick={() => update({ reproduced: true })} className={draft.reproduced ? styles.segmentActive : styles.segment}>sim</button>
            <button type="button" onClick={() => update({ reproduced: false })} className={!draft.reproduced ? styles.segmentActive : styles.segment}>não</button>
          </div>
        </div>

        <label className={styles.field}>
          <span className={styles.fieldLabel}>Link do PoC</span>
          <input type="url" value={draft.pocUrl} onChange={(event) => update({ pocUrl: event.target.value })} placeholder="https://…" className={styles.formInput} />
        </label>

        <label className={styles.fieldWide}>
          <span className={styles.fieldLabel}>Writeup relacionado</span>
          <select value={draft.writeupSlug} onChange={(event) => update({ writeupSlug: event.target.value })} className={styles.formSelect}>
            <option value="">nenhum writeup relacionado</option>
            {writeups.map((writeup) => <option key={writeup.slug} value={writeup.slug}>{writeup.title}</option>)}
          </select>
        </label>
      </div>
    </div>
  );
}
