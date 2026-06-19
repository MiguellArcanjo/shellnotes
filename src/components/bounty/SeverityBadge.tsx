import { SEVERITY_LABELS, type Severity } from '@/lib/bounty-data';
import styles from './Bounty.module.css';

const SEVERITY_BADGE_CLASS: Record<Severity, string> = {
  critical: 'severityBadgeCritical',
  high: 'severityBadgeHigh',
  medium: 'severityBadgeMedium',
  low: 'severityBadgeLow',
};

export default function SeverityBadge({ severity }: { severity: Severity }) {
  return (
    <span className={`${styles.severityBadge} ${styles[SEVERITY_BADGE_CLASS[severity]]}`}>
      <span className={`${styles.severity} ${styles[severity]}`} />
      {SEVERITY_LABELS[severity]}
    </span>
  );
}
