'use client';

import { type ReactNode, useState } from 'react';
import styles from './Writeups.module.css';

const TOKEN_PATTERN =
  /(\/\*[\s\S]*?\*\/|\/\/[^\n]*|#[^\n]*)|(`(?:\\.|[^`])*`|"(?:\\.|[^"])*"|'(?:\\.|[^'])*')|\b(const|let|var|function|return|if|else|for|while|class|import|from|export|async|await|def|try|catch|throw|new|true|false|null|undefined|SELECT|FROM|WHERE|INSERT|UPDATE|DELETE|CREATE|TABLE|AND|OR|AS|INTO|VALUES)\b|\b(\d+(?:\.\d+)?)\b/g;

function highlightCode(code: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let index = 0;

  for (const match of code.matchAll(TOKEN_PATTERN)) {
    if (match.index === undefined) continue;
    if (match.index > lastIndex) nodes.push(code.slice(lastIndex, match.index));
    const className = match[1]
      ? styles.codeComment
      : match[2]
        ? styles.codeString
        : match[3]
          ? styles.codeKeyword
          : styles.codeNumber;
    nodes.push(<span key={index++} className={className}>{match[0]}</span>);
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < code.length) nodes.push(code.slice(lastIndex));
  return nodes;
}

function CopyIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15V5a2 2 0 0 1 2-2h10" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

export default function CodeBlock({ code, language }: { code: string; language?: string }) {
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
    <div className={styles.bodyCode}>
      {language && <div className={styles.bodyCodeLang}>{language}</div>}
      <div className={styles.bodyCodeRow}>
        <code className={styles.bodyCodeText}>{highlightCode(code)}</code>
        <button type="button" onClick={handleCopy} aria-label="Copiar código" className={styles.bodyCodeCopy}>
          {copied ? <CheckIcon /> : <CopyIcon />}
        </button>
      </div>
    </div>
  );
}
