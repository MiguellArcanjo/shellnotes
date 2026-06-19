import { type AssetStatus } from '@/lib/assets-data';
import styles from './Bounty.module.css';

const ASSET_STATUS_CLASS: Record<AssetStatus, string> = {
  'não testado': 'assetStatusNaoTestado',
  'em andamento': 'assetStatusEmAndamento',
  testado: 'assetStatusTestado',
  interessante: 'assetStatusInteressante',
  morto: 'assetStatusMorto',
};

export default function AssetStatusTag({ status }: { status: AssetStatus }) {
  return (
    <span className={`${styles.assetStatusTag} ${styles[ASSET_STATUS_CLASS[status]]}`}>
      <span className={styles.assetStatusDot} />
      {status}
    </span>
  );
}
