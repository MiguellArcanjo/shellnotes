'use client';

import { useState } from 'react';
import styles from './Cheatsheets.module.css';

function CopyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15V5a2 2 0 0 1 2-2h10" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.copiedColor}>
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

export default function CodeBlock({ note, code }: { note: string; code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      // clipboard unavailable, nothing to fall back to
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div>
      <div className={styles.itemNote}>{note}</div>
      <div className={styles.codeBlock}>
        <code className={styles.code}>{code}</code>
        <button
          type="button"
          onClick={handleCopy}
          aria-label="Copiar comando"
          className={styles.copyButton}
        >
          {copied ? (
            <>
              <CheckIcon />
              <span className={styles.copiedColor}>copiado</span>
            </>
          ) : (
            <>
              <CopyIcon />
              <span>copiar</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
