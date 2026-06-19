'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import styles from './Cves.module.css';

export default function CveCodeBlock({
  title,
  language,
  code,
}: {
  title: string;
  language: string;
  code: string;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard can be unavailable in restricted browsers.
    }
  };

  return (
    <div className={styles.codeBlock}>
      <div className={styles.codeHead}>
        <div>
          <span className={styles.codeTitle}>{title || 'código'}</span>
          {language && <span className={styles.codeLanguage}>{language}</span>}
        </div>
        <button type="button" onClick={copy} className={styles.copyButton}>
          {copied ? <Check size={13} /> : <Copy size={13} />}
          {copied ? 'copiado' : 'copiar'}
        </button>
      </div>
      <pre className={styles.codePre}><code>{code}</code></pre>
    </div>
  );
}
