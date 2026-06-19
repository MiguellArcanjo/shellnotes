'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import type { Program } from '@/lib/bounty-data';
import type { Finding } from '@/lib/findings-data';
import { getAllFindings } from '@/lib/findingOverrides';
import { getAllPrograms } from '@/lib/programOverrides';
import { createBlankReport, REPORT_STATUSES, type Report } from '@/lib/reports-data';
import { getAllReports } from '@/lib/reportOverrides';
import ReportDetailPanel from './ReportDetailPanel';
import ReportStatusTag from './ReportStatusTag';
import styles from './Bounty.module.css';

const TODOS = 'todos';

export default function ReportsPage() {
  const [items, setItems] = useState<Report[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [programFilter, setProgramFilter] = useState(TODOS);
  const [statusFilter, setStatusFilter] = useState(TODOS);

  useEffect(() => {
    // overrides are stored locally and only exist in the browser
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setItems(getAllReports());
    setPrograms(getAllPrograms());
    setFindings(getAllFindings());
  }, []);

  const programName = (programId: string) => programs.find((p) => p.id === programId)?.name || programId;
  const findingTitle = (findingId: string) => findings.find((f) => f.id === findingId)?.title || findingId;

  const filtered = useMemo(
    () =>
      items.filter(
        (report) =>
          (programFilter === TODOS || report.programId === programFilter) &&
          (statusFilter === TODOS || report.status === statusFilter),
      ),
    [items, programFilter, statusFilter],
  );

  const selected = items.find((report) => report.id === selectedId) || null;

  const handleCreate = () => {
    const blank = createBlankReport(`report-${Date.now()}`);
    setItems((current) => [blank, ...current]);
    setSelectedId(blank.id);
  };

  const handleUpdate = useCallback((updated: Report) => {
    setItems((current) => current.map((report) => (report.id === updated.id ? updated : report)));
  }, []);

  return (
    <>
      <section className={styles.toolbarRow}>
        <div>
          <div className={styles.eyebrow}>bug bounty</div>
          <h1 className={styles.title}>Reports</h1>
          <p className={styles.subtitle}>Reports submetidos aos programas, normalmente gerados a partir de um finding confirmado.</p>
        </div>
        <button type="button" onClick={handleCreate} className={styles.newButtonAccent}>
          <Plus size={14} />
          novo report
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
          {REPORT_STATUSES.map((status) => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>
      </section>

      <section className={styles.reportsSplit} aria-label="Reports">
        <div className={styles.reportsListCol}>
          {filtered.length === 0 && (
            <div className={styles.emptyState}>nenhum report encontrado com esses filtros.</div>
          )}
          {filtered.map((report) => (
            <button
              key={report.id}
              type="button"
              onClick={() => setSelectedId(report.id)}
              className={`${styles.reportCard} ${selectedId === report.id ? styles.reportCardActive : ''}`}
            >
              <div className={styles.reportCardHead}>
                <span className={styles.reportCardTitle}>{report.title || 'sem título'}</span>
                <ReportStatusTag status={report.status} />
              </div>
              <div className={styles.reportCardMeta}>
                <span className={styles.reportCardProgram}>{programName(report.programId).toUpperCase()}</span>
                {report.findingId && (
                  <>
                    <span className={styles.reportCardSep}>·</span>
                    <span>{findingTitle(report.findingId)}</span>
                  </>
                )}
              </div>
              <div className={styles.reportCardFoot}>
                <span>{report.submittedAt || 'sem data'}</span>
                <span className={styles.reportCardBounty}>{report.bounty || '—'}</span>
              </div>
            </button>
          ))}
        </div>

        <div className={styles.reportDetailCol}>
          {selected ? (
            <ReportDetailPanel
              key={selected.id}
              report={selected}
              programs={programs}
              findings={findings}
              onChange={handleUpdate}
              onClose={() => setSelectedId(null)}
            />
          ) : (
            <div className={styles.reportDetailEmpty}>
              selecione um report na lista, ou crie um novo a partir de um finding.
            </div>
          )}
        </div>
      </section>
    </>
  );
}
