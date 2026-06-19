'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import SiteFooter from '@/components/site/SiteFooter';
import SiteHeader from '@/components/site/SiteHeader';
import { getRemoteGlossary, type GlossaryEntryWithKey } from '@/lib/glossaryStore';
import { useOwner } from '@/lib/useOwner';
import styles from './Glossary.module.css';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export default function GlossaryPage() {
  const { isOwner } = useOwner();
  const [terms, setTerms] = useState<GlossaryEntryWithKey[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    void getRemoteGlossary().then(setTerms);
  }, []);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return query
      ? terms.filter((term) =>
          term.term.toLowerCase().includes(query) ||
          term.abbr.toLowerCase().includes(query) ||
          term.def.toLowerCase().includes(query))
      : terms;
  }, [search, terms]);

  const groups = useMemo(() => {
    const map = new Map<string, GlossaryEntryWithKey[]>();
    filtered.forEach((term) => {
      const letter = (term.term[0] ?? '#').toUpperCase();
      map.set(letter, [...(map.get(letter) ?? []), term]);
    });
    return [...map.entries()].sort().map(([letter, entries]) => ({
      letter,
      terms: entries.sort((a, b) => a.term.localeCompare(b.term)),
    }));
  }, [filtered]);
  const presentLetters = new Set(groups.map((group) => group.letter));

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <SiteHeader active="glossario" />
        <section className={styles.titleSection}>
          <div className={styles.titleSectionMain}>
            <div className={styles.eyebrow}>referência</div>
            <h1 className={styles.title}>Glossário</h1>
            <p className={styles.subtitle}>Os termos de segurança ofensiva que aparecem pelo site, definidos em uma frase.</p>
          </div>
          {isOwner && <Link href="/admin/glossary?new=1" className={styles.newButton}>+ novo termo</Link>}
        </section>

        <section className={styles.searchSection}>
          <div className={styles.searchInner}>
            <div className={styles.searchBox}>
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="buscar termo…" className={styles.searchInput} />
            </div>
            <div className={styles.azRow}>
              {ALPHABET.map((letter) => presentLetters.has(letter)
                ? <a key={letter} href={`#g-${letter}`} className={styles.azLetter}>{letter}</a>
                : <span key={letter} className={styles.azLetterDisabled}>{letter}</span>)}
            </div>
          </div>
        </section>

        <section className={styles.termsSection}>
          {groups.map((group) => (
            <div key={group.letter} id={`g-${group.letter}`} className={styles.group}>
              <div className={styles.groupLetter}>{group.letter}</div>
              <div className={styles.glossGrid}>
                {group.terms.map((term) => (
                  <div key={term._key} className={styles.glossItem}>
                    <div className={styles.termName}>{term.term}</div>
                    {term.abbr && <div className={styles.termAbbr}>{term.abbr}</div>}
                    <div className={styles.termDef}>{term.def}</div>
                    {isOwner && (
                      <div className={styles.itemOwnerBar}>
                        <Link href={`/admin/glossary?edit=${encodeURIComponent(term._key)}`} className={styles.itemAction}>editar</Link>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
          {filtered.length === 0 && <div className={styles.emptyState}>Nenhum termo corresponde à busca.</div>}
        </section>
        <SiteFooter />
      </div>
    </div>
  );
}
