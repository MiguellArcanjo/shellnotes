'use client';

import { useState } from 'react';
import styles from './Writeups.module.css';

function EyeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15V5a2 2 0 0 1 2-2h10" />
    </svg>
  );
}

export default function FlagBlock({ value }: { value: string }) {
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // clipboard unavailable, nothing to fall back to
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className={styles.flagBlock}>
      <div className={styles.flagLabel}>flag</div>
      {revealed ? (
        <div className={styles.flagValueRow}>
          <code className={styles.flagValue}>{value}</code>
          <button type="button" onClick={handleCopy} className={styles.flagAction}>
            <CopyIcon />
            {copied ? 'copiado' : 'copiar'}
          </button>
        </div>
      ) : (
        <button type="button" onClick={() => setRevealed(true)} className={styles.flagAction}>
          <EyeIcon />
          revelar flag
        </button>
      )}
    </div>
  );
}
