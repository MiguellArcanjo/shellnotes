import { type ReportStatus } from '@/lib/reports-data';
import styles from './Bounty.module.css';

const REPORT_STATUS_CLASS: Record<ReportStatus, string> = {
  submetido: 'reportStatusSubmetido',
  triado: 'reportStatusTriado',
  aceito: 'reportStatusAceito',
  duplicado: 'reportStatusDuplicado',
  resolvido: 'reportStatusResolvido',
};

export default function ReportStatusTag({ status }: { status: ReportStatus }) {
  return (
    <span className={`${styles.reportStatusTag} ${styles[REPORT_STATUS_CLASS[status]]}`}>
      <span className={styles.reportStatusDot} />
      {status}
    </span>
  );
}
