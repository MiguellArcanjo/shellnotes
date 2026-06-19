'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import SiteFooter from '@/components/site/SiteFooter';
import SiteHeader from '@/components/site/SiteHeader';
import { getRemoteTil, type TilEntryWithKey } from '@/lib/tilStore';
import { useOwner } from '@/lib/useOwner';
import styles from './Til.module.css';

const ALL = 'todas';

export default function TilPage() {
  const { isOwner } = useOwner();
  const [tag, setTag] = useState(ALL);
  const [notes, setNotes] = useState<TilEntryWithKey[]>([]);

  useEffect(() => {
    void getRemoteTil().then(setNotes);
  }, []);

  const allTags = useMemo(
    () => Array.from(new Set(notes.flatMap((note) => note.tags))).sort(),
    [notes],
  );
  const list = useMemo(
    () => notes
      .filter((note) => tag === ALL || note.tags.includes(tag))
      .sort((a, b) => b.date.localeCompare(a.date)),
    [notes, tag],
  );
  const countLabel = list.length === 0 ? '' : list.length === 1 ? '1 nota' : `${list.length} notas`;

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <SiteHeader active="til" />

        <section className={styles.titleSection}>
          <div className={styles.titleSectionMain}>
            <div className={styles.eyebrow}>today i learned</div>
            <h1 className={styles.title}>TIL</h1>
            <p className={styles.subtitle}>
              Anotações curtas de campo — uma flag de comando, um detalhe de protocolo, um
              truque que não merece um writeup inteiro mas eu não quero esquecer.
            </p>
          </div>
          {isOwner && (
            <Link href="/admin/til?new=1" className={styles.newButton}>+ nova nota</Link>
          )}
        </section>

        <section className={styles.filterSection}>
          <div className={styles.filterRow}>
            {[ALL, ...allTags].map((filterTag) => (
              <button
                key={filterTag}
                type="button"
                onClick={() => setTag(filterTag)}
                className={filterTag === tag ? styles.pillActive : styles.pillInactive}
              >
                {filterTag}
              </button>
            ))}
          </div>
        </section>

        <section className={styles.feedSection}>
          <div className={styles.feed}>
            {list.map((note) => (
              <article key={note._key} className={styles.note}>
                <div className={styles.noteDate}>{note.dateLabel}</div>
                <div className={styles.noteBody}>
                  <h3 className={styles.noteTitle}>{note.title}</h3>
                  <div className={styles.noteText}>{note.body}</div>
                  {note.code && <div className={styles.noteCode}><code>{note.code}</code></div>}
                  <div className={styles.noteTags}>{note.tags.join('   ·   ')}</div>
                  {isOwner && (
                    <div className={styles.noteOwnerBar}>
                      <Link href={`/admin/til?edit=${encodeURIComponent(note._key)}`} className={styles.itemAction}>
                        editar
                      </Link>
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
          {list.length === 0 && <div className={styles.emptyState}>Nenhuma nota com essa tag ainda.</div>}
          <div className={styles.countLabel}>{countLabel}</div>
        </section>

        <SiteFooter />
      </div>
    </div>
  );
}
