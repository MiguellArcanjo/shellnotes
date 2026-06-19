'use client';

import { useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { parseAssetPasteList } from '@/lib/assetImport';
import type { Asset } from '@/lib/assets-data';
import styles from './Bounty.module.css';

export default function BulkImportAssetsModal({
  open,
  existingHosts,
  onImport,
  onClose,
}: {
  open: boolean;
  existingHosts: string[];
  onImport: (created: Asset[]) => void;
  onClose: () => void;
}) {
  const [text, setText] = useState('');

  const { created, skippedDuplicates } = useMemo(
    () => parseAssetPasteList(text, existingHosts),
    [text, existingHosts],
  );

  if (!open) return null;

  const handleImport = () => {
    if (created.length === 0) return;
    onImport(created);
    setText('');
  };

  return (
    <div className={styles.importOverlay} role="presentation" onClick={onClose}>
      <div className={styles.importModal} role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
        <div className={styles.importModalHead}>
          <h2 className={styles.importModalTitle}>importar lista de alvos</h2>
          <button type="button" onClick={onClose} className={styles.panelCloseButton} aria-label="Fechar">
            <X size={15} />
          </button>
        </div>

        <p className={styles.importModalHint}>
          cole um host por linha. Reconhece hosts simples, saída de texto do{' '}
          <code>httpx</code> (<code>url [200] [título] [tech1,tech2]</code>) e saída
          grepable do <code>nmap -oG</code> (<code>Host: ip (host) Ports: ...</code>).
        </p>

        <textarea
          autoFocus
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder={'api.exemplo.com\nhttps://app.exemplo.com [200] [Exemplo] [nginx,react]\nHost: 10.0.0.5 (gateway.exemplo.com)\tPorts: 443/open/tcp//https///'}
          className={styles.importTextarea}
          spellCheck={false}
        />

        <div className={styles.importPreviewRow}>
          <span>
            {created.length} alvo{created.length === 1 ? '' : 's'} a criar
            {skippedDuplicates > 0 ? ` · ${skippedDuplicates} ignorado${skippedDuplicates === 1 ? '' : 's'} (já existem)` : ''}
          </span>
          <div className={styles.importPreviewActions}>
            <button type="button" onClick={onClose} className={styles.secondaryButtonSmall}>
              cancelar
            </button>
            <button type="button" onClick={handleImport} disabled={created.length === 0} className={styles.saveButton}>
              importar {created.length > 0 ? created.length : ''}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
