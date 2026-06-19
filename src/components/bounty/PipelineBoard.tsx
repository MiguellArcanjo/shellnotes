'use client';

import { useEffect, useState, type DragEvent } from 'react';
import { type Program } from '@/lib/bounty-data';
import { PIPELINE_STATUSES, type Finding, type PipelineStatus } from '@/lib/findings-data';
import { getAllFindings, saveOverride } from '@/lib/findingOverrides';
import { getAllPrograms } from '@/lib/programOverrides';
import styles from './Bounty.module.css';

const DRAG_TYPE = 'text/finding-id';

export default function PipelineBoard() {
  const [items, setItems] = useState<Finding[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<PipelineStatus | null>(null);

  useEffect(() => {
    // overrides are stored locally and only exist in the browser
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setItems(getAllFindings());
    setPrograms(getAllPrograms());
  }, []);

  const programName = (programId: string) => programs.find((p) => p.id === programId)?.name || programId;

  const moveTo = (id: string, status: PipelineStatus) => {
    setItems((current) => current.map((finding) => (finding.id === id ? { ...finding, status } : finding)));
    saveOverride(id, { status });
  };

  const handleDrop = (status: PipelineStatus) => (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragOverColumn(null);
    const id = event.dataTransfer.getData(DRAG_TYPE) || draggingId;
    if (id) moveTo(id, status);
    setDraggingId(null);
  };

  return (
    <>
      <section className={styles.intro}>
        <div className={styles.eyebrow}>bug bounty</div>
        <h1 className={styles.title}>Pipeline</h1>
        <p className={styles.subtitle}>Arraste um finding entre colunas para atualizar o status no fluxo.</p>
      </section>

      <section className={styles.kanbanBoard} aria-label="Pipeline de findings">
        {PIPELINE_STATUSES.map((status) => {
          const columnItems = items.filter((finding) => finding.status === status);
          return (
            <div
              key={status}
              className={`${styles.kanbanColumn} ${dragOverColumn === status ? styles.kanbanColumnOver : ''}`}
              onDragOver={(event) => {
                event.preventDefault();
                setDragOverColumn(status);
              }}
              onDragLeave={() => setDragOverColumn((current) => (current === status ? null : current))}
              onDrop={handleDrop(status)}
            >
              <div className={styles.kanbanColumnHead}>
                <span className={styles.kanbanColumnLabel}>{status}</span>
                <span className={styles.kanbanColumnCount}>{String(columnItems.length).padStart(2, '0')}</span>
              </div>
              <div className={styles.kanbanColumnBody}>
                {columnItems.map((finding) => (
                  <div
                    key={finding.id}
                    draggable
                    onDragStart={(event) => {
                      event.dataTransfer.setData(DRAG_TYPE, finding.id);
                      event.dataTransfer.effectAllowed = 'move';
                      setDraggingId(finding.id);
                    }}
                    onDragEnd={() => setDraggingId(null)}
                    className={`${styles.kanbanCard} ${draggingId === finding.id ? styles.kanbanCardDragging : ''}`}
                  >
                    <div className={styles.kanbanCardHead}>
                      <span className={`${styles.severity} ${styles[finding.severity]}`} aria-label={finding.severity} />
                      <div className={styles.kanbanCardTitle}>{finding.title || 'sem título'}</div>
                    </div>
                    <div className={styles.kanbanCardProgram}>{programName(finding.programId).toUpperCase()}</div>
                  </div>
                ))}
                {columnItems.length === 0 && <div className={styles.kanbanEmpty}>vazio</div>}
              </div>
            </div>
          );
        })}
      </section>
    </>
  );
}
