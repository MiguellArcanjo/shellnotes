'use client';

import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { createBlankProgram, type Program } from '@/lib/bounty-data';
import { getAllPrograms } from '@/lib/programOverrides';
import ProgramEditor from './ProgramEditor';
import styles from './Bounty.module.css';

const STATUS_CLASS: Record<Program['status'], string> = {
  'caçando': 'statusHunting',
  pausado: 'statusPaused',
  arquivado: 'statusArchived',
};

export default function ProgramsPage() {
  const [items, setItems] = useState<Program[]>([]);
  const [editing, setEditing] = useState<Program | null>(null);
  const [editingIsNew, setEditingIsNew] = useState(false);

  useEffect(() => {
    // overrides are stored locally and only exist in the browser
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setItems(getAllPrograms());
  }, []);

  const handleExit = () => {
    setEditing(null);
    setItems(getAllPrograms());
  };

  if (editing) {
    return <ProgramEditor program={editing} isNew={editingIsNew} onExit={handleExit} />;
  }

  return (
    <>
      <section className={styles.toolbarRow}>
        <div>
          <div className={styles.eyebrow}>bug bounty</div>
          <h1 className={styles.title}>Programas</h1>
          <p className={styles.subtitle}>
            Programas em caça, pausados e arquivados — abra um card para ver escopo, regras e tabela de recompensa.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditingIsNew(true);
            setEditing(createBlankProgram(`programa-${Date.now()}`));
          }}
          className={styles.newButton}
        >
          <Plus size={14} />
          novo programa
        </button>
      </section>

      <section className={styles.programsGrid} aria-label="Programas">
        {items.map((program) => (
          <button
            key={program.id}
            type="button"
            onClick={() => {
              setEditingIsNew(false);
              setEditing(program);
            }}
            className={styles.programCard}
          >
            <div className={styles.programCardHead}>
              <span className={styles.platformTag}>{program.platform}</span>
              <span className={`${styles.statusRow} ${styles[STATUS_CLASS[program.status]]}`}>
                <span className={styles.statusDot} />
                {program.status}
              </span>
            </div>
            <div className={styles.programName}>{program.name || 'sem nome'}</div>
            <div className={styles.rewardRange}>{program.rewardRange || 'faixa não definida'}</div>
            <div className={styles.programCardFoot}>
              <span className={styles.typeTag}>{program.type === 'VDP' ? 'VDP' : 'pago'}</span>
            </div>
          </button>
        ))}
      </section>
    </>
  );
}
