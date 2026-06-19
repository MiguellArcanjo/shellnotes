'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Finding } from '@/lib/findings-data';
import type { Program } from '@/lib/bounty-data';
import type { Payout } from '@/lib/payouts-data';
import { getAllFindings } from '@/lib/findingOverrides';
import { getAllPrograms } from '@/lib/programOverrides';
import { getAllPayouts } from '@/lib/payoutOverrides';
import styles from './Bounty.module.css';

const PIPELINE_LABELS = ['lead', 'testando', 'submetido', 'triado', 'resolvido'] as const;

export default function BountyDashboard() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);

  useEffect(() => {
    // The private cache is hydrated from Supabase before this component mounts.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPrograms(getAllPrograms());
    setFindings(getAllFindings());
    setPayouts(getAllPayouts());
  }, []);

  const pendingPayout = payouts
    .filter((payout) => payout.status === 'pendente')
    .reduce((sum, payout) => sum + payout.amount, 0);
  const openFindings = findings.filter((finding) => !['resolvido', 'duplicado', 'informativo', 'N/A', 'fora de escopo', 'descartado'].includes(finding.status));
  const triage = findings.filter((finding) => ['submetido', 'aguardando info'].includes(finding.status));
  const metrics = [
    { label: 'programas ativos', value: String(programs.filter((program) => program.status === 'caçando').length), hint: `${programs.length} cadastrados` },
    { label: 'findings abertos', value: String(openFindings.length), hint: `${findings.length} no total` },
    { label: 'aguardando triagem', value: String(triage.length), hint: 'submetidos ou aguardando info' },
    { label: 'payout pendente', value: `US$ ${pendingPayout.toLocaleString('pt-BR')}`, hint: `${payouts.filter((payout) => payout.status === 'pendente').length} recompensas`, accent: true },
  ];
  const recent = useMemo(() => findings.slice(0, 5), [findings]);

  return (
    <>
      <section className={styles.intro}>
        <div className={styles.eyebrow}>visão geral</div>
        <h1 className={styles.title}>Dashboard</h1>
        <p className={styles.subtitle}>Estado atual dos programas, submissões e recompensas.</p>
      </section>

      <section className={styles.metrics} aria-label="Métricas">
        {metrics.map((metric) => (
          <article key={metric.label} className={metric.accent ? styles.metricAccent : styles.metric}>
            <div className={styles.metricLabel}>{metric.label}</div>
            <div className={styles.metricValue}>{metric.value}</div>
            <div className={styles.metricHint}>{metric.hint}</div>
          </article>
        ))}
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <h2 className={styles.sectionTitle}>Pipeline</h2>
          <span className={styles.sectionMeta}>{findings.length} itens no fluxo</span>
        </div>
        <div className={styles.pipeline}>
          {PIPELINE_LABELS.map((label) => (
            <div key={label} className={styles.pipelineStage}>
              <div className={styles.pipelineLabel}>{label}</div>
              <div className={styles.pipelineCount}>
                {String(findings.filter((finding) => finding.status === label).length).padStart(2, '0')}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <h2 className={styles.sectionTitle}>Findings recentes</h2>
          <span className={styles.sectionMeta}>{recent.length} registros</span>
        </div>
        <div className={styles.findings}>
          {recent.map((finding) => (
            <article key={finding.id} className={styles.finding}>
              <span className={`${styles.severity} ${styles[finding.severity]}`} aria-label={finding.severity} />
              <div>
                <div className={styles.findingTitle}>{finding.title}</div>
                <div className={styles.program}>
                  {(programs.find((program) => program.id === finding.programId)?.name || finding.programId).toUpperCase()}
                </div>
              </div>
              <div className={styles.status}>{finding.status}</div>
            </article>
          ))}
          {recent.length === 0 && <div className={styles.emptyState}>nenhum finding cadastrado.</div>}
        </div>
      </section>
    </>
  );
}
