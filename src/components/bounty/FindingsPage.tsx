'use client';

import { useEffect, useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createBlankFinding, PIPELINE_STATUSES, type Finding, type PayoutStatus } from '@/lib/findings-data';
import { getAllFindings } from '@/lib/findingOverrides';
import { getAllPrograms } from '@/lib/programOverrides';
import { SEVERITY_LABELS, SEVERITY_ORDER, type Program } from '@/lib/bounty-data';
import FindingEditor from './FindingEditor';
import styles from './Bounty.module.css';

const PAYOUT_CLASS: Record<PayoutStatus, string> = {
  'não aplicável': 'payoutNA',
  pendente: 'payoutPendente',
  pago: 'payoutPago',
};

const TODOS = 'todos';

export default function FindingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [items, setItems] = useState<Finding[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [editing, setEditing] = useState<Finding | null>(null);
  const [programFilter, setProgramFilter] = useState(TODOS);
  const [severityFilter, setSeverityFilter] = useState(TODOS);
  const [statusFilter, setStatusFilter] = useState(TODOS);

  useEffect(() => {
    // overrides are stored locally and only exist in the browser
    const storedFindings = getAllFindings();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setItems(storedFindings);
    setPrograms(getAllPrograms());
    const requestedId = searchParams.get('edit');
    const requestedFinding = requestedId
      ? storedFindings.find((finding) => finding.id === requestedId)
      : undefined;
    if (requestedFinding) {
      setEditing(requestedFinding);
      router.replace('/bounty/findings', { scroll: false });
    }
  }, [router, searchParams]);

  const programName = (programId: string) => programs.find((p) => p.id === programId)?.name || programId;

  const filtered = useMemo(
    () =>
      items.filter(
        (finding) =>
          (programFilter === TODOS || finding.programId === programFilter) &&
          (severityFilter === TODOS || finding.severity === severityFilter) &&
          (statusFilter === TODOS || finding.status === statusFilter),
      ),
    [items, programFilter, severityFilter, statusFilter],
  );

  const handleExit = () => {
    setEditing(null);
    setItems(getAllFindings());
    setPrograms(getAllPrograms());
  };

  if (editing) {
    return <FindingEditor finding={editing} programs={programs} onExit={handleExit} />;
  }

  return (
    <>
      <section className={styles.toolbarRow}>
        <div>
          <div className={styles.eyebrow}>bug bounty</div>
          <h1 className={styles.title}>Findings</h1>
          <p className={styles.subtitle}>Vulnerabilidades em andamento, da descoberta ao payout.</p>
        </div>
        <button
          type="button"
          onClick={() => setEditing(createBlankFinding(`finding-${Date.now()}`))}
          className={styles.newButton}
        >
          <Plus size={14} />
          novo finding
        </button>
      </section>

      <section className={styles.filtersRow} aria-label="Filtros">
        <select value={programFilter} onChange={(event) => setProgramFilter(event.target.value)} className={styles.filterSelect}>
          <option value={TODOS}>todos os programas</option>
          {programs.map((program) => (
            <option key={program.id} value={program.id}>{program.name || program.id}</option>
          ))}
        </select>
        <select value={severityFilter} onChange={(event) => setSeverityFilter(event.target.value)} className={styles.filterSelect}>
          <option value={TODOS}>todas as severidades</option>
          {SEVERITY_ORDER.map((severity) => (
            <option key={severity} value={severity}>{SEVERITY_LABELS[severity]}</option>
          ))}
        </select>
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className={styles.filterSelect}>
          <option value={TODOS}>todos os status</option>
          {PIPELINE_STATUSES.map((status) => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>
      </section>

      <section className={styles.findingsList} aria-label="Findings">
        {filtered.length === 0 && (
          <div className={styles.emptyState}>nenhum finding encontrado com esses filtros.</div>
        )}
        {filtered.map((finding) => (
          <button
            key={finding.id}
            type="button"
            onClick={() => setEditing(finding)}
            className={styles.findingRow}
          >
            <span className={`${styles.severity} ${styles[finding.severity]}`} aria-label={finding.severity} />
            <div>
              <div className={styles.findingRowTitle}>{finding.title || 'sem título'}</div>
              <div className={styles.findingRowProgram}>{programName(finding.programId).toUpperCase()}</div>
            </div>
            <div className={styles.findingRowStatus}>{finding.status}</div>
            <div className={`${styles.findingRowPayout} ${styles[PAYOUT_CLASS[finding.payoutStatus]]}`}>
              {finding.payoutStatus}
            </div>
          </button>
        ))}
      </section>
    </>
  );
}
