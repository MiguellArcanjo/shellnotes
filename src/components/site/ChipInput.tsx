'use client';

import { useState } from 'react';
import styles from './ChipInput.module.css';

export default function ChipInput({
  values,
  onChange,
  placeholder,
  monospace,
}: {
  values: string[];
  onChange: (next: string[]) => void;
  placeholder: string;
  monospace?: boolean;
}) {
  const [draftValue, setDraftValue] = useState('');

  const commit = () => {
    const v = draftValue.trim();
    if (v && !values.includes(v)) {
      onChange([...values, v]);
    }
    setDraftValue('');
  };

  return (
    <div className={styles.chipInputWrap}>
      {values.map((v) => (
        <span key={v} className={monospace ? styles.chipMono : styles.chip}>
          {v}
          <button
            type="button"
            onClick={() => onChange(values.filter((x) => x !== v))}
            className={styles.chipRemove}
            aria-label={`Remover ${v}`}
          >
            ×
          </button>
        </span>
      ))}
      <input
        type="text"
        value={draftValue}
        onChange={(e) => setDraftValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            commit();
          } else if (e.key === 'Backspace' && draftValue === '' && values.length > 0) {
            onChange(values.slice(0, -1));
          }
        }}
        onBlur={commit}
        placeholder={placeholder}
        className={styles.chipInputField}
      />
    </div>
  );
}
