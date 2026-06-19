'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import type { Program } from '@/lib/bounty-data';
import type { Finding } from '@/lib/findings-data';
import { getAllFindings } from '@/lib/findingOverrides';
import { getAllPrograms } from '@/lib/programOverrides';
import { createBlankPayout, formatAmount, type Payout } from '@/lib/payouts-data';
import { deletePayout, getAllPayouts } from '@/lib/payoutOverrides';
import { getAllReports } from '@/lib/reportOverrides';
import type { Report } from '@/lib/reports-data';
import PayoutDetailPanel from './PayoutDetailPanel';
import styles from './Bounty.module.css';

// Demo dataset mixes US$ and € amounts; aggregates below sum the raw numbers
// under a single nominal "US$" label rather than doing real FX conversion.
const AGGREGATE_CURRENCY = 'US$';

function monthKey(dateStr: string): string {
  return dateStr.slice(0, 7);
}

function buildMonthlySeries(items: Payout[], monthsBack = 12) {
  const now = new Date();
  const months: { key: string; label: string; total: number }[] = [];
  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
    months.push({ key, label, total: 0 });
  }
  const byKey = new Map(months.map((m) => [m.key, m]));
  items.forEach((payout) => {
    if (payout.status !== 'pago' || !payout.date) return;
    const bucket = byKey.get(monthKey(payout.date));
    if (bucket) bucket.total += payout.amount;
  });
  return months;
}

function buildProgramBreakdown(items: Payout[], programs: Program[]) {
  const map = new Map<string, { programId: string; pago: number; pendente: number }>();
  items.forEach((payout) => {
    if (!payout.programId) return;
    const entry = map.get(payout.programId) || { programId: payout.programId, pago: 0, pendente: 0 };
    if (payout.status === 'pago') entry.pago += payout.amount;
    else entry.pendente += payout.amount;
    map.set(payout.programId, entry);
  });
  return Array.from(map.values())
    .map((entry) => ({ ...entry, programName: programs.find((p) => p.id === entry.programId)?.name || entry.programId }))
    .sort((a, b) => b.pago + b.pendente - (a.pago + a.pendente));
}

export default function PayoutsPage() {
  const [items, setItems] = useState<Payout[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draftPayout, setDraftPayout] = useState<Payout | null>(null);

  useEffect(() => {
    // overrides are stored locally and only exist in the browser
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setItems(getAllPayouts());
    setPrograms(getAllPrograms());
    setFindings(getAllFindings());
    setReports(getAllReports());
  }, []);

  const programName = (programId: string) => programs.find((p) => p.id === programId)?.name || programId;
  const linkedLabel = (payout: Payout) => {
    const finding = findings.find((f) => f.id === payout.findingId);
    if (finding) return finding.title || finding.id;
    const report = reports.find((r) => r.id === payout.reportId);
    if (report) return report.title || report.id;
    return '—';
  };

  const totals = useMemo(() => {
    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const sum = (predicate: (p: Payout) => boolean) =>
      items.filter(predicate).reduce((acc, p) => acc + p.amount, 0);
    return {
      recebido: sum((p) => p.status === 'pago'),
      pendente: sum((p) => p.status === 'pendente'),
      mes: sum((p) => p.status === 'pago' && monthKey(p.date) === currentMonthKey),
      ano: sum((p) => p.status === 'pago' && p.date.slice(0, 4) === String(now.getFullYear())),
    };
  }, [items]);

  const monthlySeries = useMemo(() => buildMonthlySeries(items), [items]);
  const maxMonthly = Math.max(1, ...monthlySeries.map((m) => m.total));

  const breakdown = useMemo(() => buildProgramBreakdown(items, programs), [items, programs]);
  const maxBreakdown = Math.max(1, ...breakdown.map((b) => b.pago + b.pendente));

  const sortedItems = useMemo(
    () => [...items].sort((a, b) => (b.date || '').localeCompare(a.date || '')),
    [items],
  );

  const selected = items.find((payout) => payout.id === selectedId) || null;
  const panelPayout = draftPayout || selected;

  const handleCreate = () => {
    setSelectedId(null);
    setDraftPayout(createBlankPayout(`payout-${Date.now()}`));
  };

  const handleSelect = (id: string) => {
    setDraftPayout(null);
    setSelectedId(id);
  };

  const handleClosePanel = () => {
    setDraftPayout(null);
    setSelectedId(null);
  };

  const handleUpdate = useCallback((updated: Payout) => {
    setItems((current) => current.map((payout) => (payout.id === updated.id ? updated : payout)));
  }, []);

  // only invoked when the user explicitly finalizes a new payout — this is
  // what makes it show up in the table, per the "fill in first" requirement
  const handleFinalizeCreate = useCallback((created: Payout) => {
    setItems((current) => [created, ...current]);
    setDraftPayout(null);
    setSelectedId(created.id);
  }, []);

  const handleDelete = useCallback((id: string) => {
    deletePayout(id);
    setItems((current) => current.filter((payout) => payout.id !== id));
    setSelectedId(null);
    setDraftPayout(null);
  }, []);

  return (
    <>
      <section className={styles.toolbarRow}>
        <div>
          <div className={styles.eyebrow}>bug bounty</div>
          <h1 className={styles.title}>Payouts</h1>
          <p className={styles.subtitle}>Recompensas recebidas e pendentes, por mês e por programa.</p>
        </div>
        <button type="button" onClick={handleCreate} className={styles.newButtonAccent}>
          <Plus size={14} />
          novo payout
        </button>
      </section>

      <section className={styles.metrics} aria-label="Resumo de payouts">
        <article className={styles.payoutMetric}>
          <div className={styles.metricLabel}>total recebido</div>
          <div className={styles.payoutMetricValue}>{AGGREGATE_CURRENCY} {formatAmount(totals.recebido)}</div>
        </article>
        <article className={styles.payoutMetric}>
          <div className={styles.metricLabel}>pendente</div>
          <div className={styles.payoutMetricValue}>{AGGREGATE_CURRENCY} {formatAmount(totals.pendente)}</div>
        </article>
        <article className={styles.payoutMetric}>
          <div className={styles.metricLabel}>ganho no mês</div>
          <div className={styles.payoutMetricValue}>{AGGREGATE_CURRENCY} {formatAmount(totals.mes)}</div>
        </article>
        <article className={styles.payoutMetric}>
          <div className={styles.metricLabel}>ganho no ano</div>
          <div className={styles.payoutMetricValue}>{AGGREGATE_CURRENCY} {formatAmount(totals.ano)}</div>
        </article>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <h2 className={styles.sectionTitle}>Ganhos ao longo do tempo</h2>
          <span className={styles.sectionMeta}>últimos 12 meses, valores pagos</span>
        </div>
        <div className={styles.payoutChart} aria-label="Gráfico de ganhos por mês">
          {monthlySeries.map((month) => (
            <div key={month.key} className={styles.payoutChartBar}>
              <span className={styles.payoutChartBarValue}>{month.total > 0 ? formatAmount(month.total) : ''}</span>
              <div className={styles.payoutChartBarTrack}>
                <div
                  className={styles.payoutChartBarFill}
                  style={{ height: `${(month.total / maxMonthly) * 100}%` }}
                />
              </div>
              <span className={styles.payoutChartBarLabel}>{month.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <h2 className={styles.sectionTitle}>Detalhamento por programa</h2>
          <span className={styles.sectionMeta}>{breakdown.length} programas com payouts</span>
        </div>
        <div className={styles.payoutBreakdown}>
          {breakdown.map((entry) => (
            <div key={entry.programId} className={styles.payoutBreakdownRow}>
              <span className={styles.payoutBreakdownProgram}>{entry.programName.toUpperCase()}</span>
              <div className={styles.payoutBreakdownBarTrack}>
                <div
                  className={styles.payoutBreakdownBarPago}
                  style={{ width: `${(entry.pago / maxBreakdown) * 100}%` }}
                />
                <div
                  className={styles.payoutBreakdownBarPendente}
                  style={{ width: `${(entry.pendente / maxBreakdown) * 100}%` }}
                />
              </div>
              <span className={styles.payoutBreakdownAmount}>
                {formatAmount(entry.pago)} pago{entry.pendente > 0 ? ` · ${formatAmount(entry.pendente)} pendente` : ''}
              </span>
            </div>
          ))}
          {breakdown.length === 0 && <div className={styles.emptyState}>nenhum payout registrado ainda.</div>}
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <h2 className={styles.sectionTitle}>Todos os payouts</h2>
          <span className={styles.sectionMeta}>{items.length} registros</span>
        </div>
        <div className={panelPayout ? styles.payoutsLayoutSplit : styles.payoutsLayout}>
          <div className={styles.reportsListCol}>
            {sortedItems.length === 0 && (
              <div className={styles.emptyState}>nenhum payout encontrado.</div>
            )}
            {sortedItems.map((payout) => (
              <button
                key={payout.id}
                type="button"
                onClick={() => handleSelect(payout.id)}
                className={`${styles.reportCard} ${selectedId === payout.id ? styles.reportCardActive : ''}`}
              >
                <div className={styles.reportCardHead}>
                  <span className={styles.reportCardTitle}>{linkedLabel(payout)}</span>
                  <span className={payout.status === 'pago' ? styles.payoutPago : styles.payoutPendente}>
                    {payout.currency} {formatAmount(payout.amount)}
                  </span>
                </div>
                <div className={styles.reportCardMeta}>
                  <span className={styles.reportCardProgram}>{programName(payout.programId).toUpperCase()}</span>
                </div>
                <div className={styles.reportCardFoot}>
                  <span>{payout.date || 'sem data'}</span>
                  <span className={payout.status === 'pago' ? styles.payoutPago : styles.payoutPendente}>{payout.status}</span>
                </div>
              </button>
            ))}
          </div>

          {panelPayout && (
            <div className={styles.reportDetailCol}>
              <PayoutDetailPanel
                key={panelPayout.id}
                payout={panelPayout}
                programs={programs}
                findings={findings}
                reports={reports}
                isNew={!!draftPayout}
                onChange={draftPayout ? handleFinalizeCreate : handleUpdate}
                onClose={handleClosePanel}
                onDelete={handleDelete}
              />
            </div>
          )}
        </div>
      </section>
    </>
  );
}
