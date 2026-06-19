import { type Priority } from '@/lib/assets-data';
import styles from './Bounty.module.css';

const PRIORITY_DOT_CLASS: Record<Priority, string> = {
  crítica: 'critical',
  alta: 'high',
  média: 'medium',
  baixa: 'low',
};

const PRIORITY_BADGE_CLASS: Record<Priority, string> = {
  crítica: 'severityBadgeCritical',
  alta: 'severityBadgeHigh',
  média: 'severityBadgeMedium',
  baixa: 'severityBadgeLow',
};

export default function PriorityTag({ priority, compact = false }: { priority: Priority; compact?: boolean }) {
  if (compact) {
    return (
      <span className={styles.priorityTagCompact}>
        <span className={`${styles.severity} ${styles[PRIORITY_DOT_CLASS[priority]]}`} />
        {priority}
      </span>
    );
  }
  return (
    <span className={`${styles.severityBadge} ${styles[PRIORITY_BADGE_CLASS[priority]]}`}>
      <span className={`${styles.severity} ${styles[PRIORITY_DOT_CLASS[priority]]}`} />
      {priority}
    </span>
  );
}
