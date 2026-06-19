'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import SiteFooter from '@/components/site/SiteFooter';
import SiteHeader from '@/components/site/SiteHeader';
import { useOwner } from '@/lib/useOwner';
import {
  DIFFICULTIES as BASE_DIFFICULTIES,
  PLATFORMS as BASE_PLATFORMS,
  SYSTEMS as BASE_SYSTEMS,
  type Writeup,
} from '@/lib/writeups-data';
import { getRemoteWriteups } from '@/lib/writeupOverrides';
import styles from './Writeups.module.css';

const PLATFORMS = ['Todas', ...BASE_PLATFORMS];
const DIFFICULTIES = ['Todas', ...BASE_DIFFICULTIES];
const SYSTEMS = ['Todos', ...BASE_SYSTEMS];

const PAGE_SIZE = 8;
const LOAD_MORE_STEP = 6;

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={styles.searchIcon}>
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" />
    </svg>
  );
}

function FilterRow({
  label,
  options,
  isActive,
  onSelect,
}: {
  label: string;
  options: string[];
  isActive: (option: string) => boolean;
  onSelect: (option: string) => void;
}) {
  return (
    <div className={styles.filterRow}>
      <div className={styles.filterLabel}>{label}</div>
      <div className={styles.pillGroup}>
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onSelect(option)}
            className={isActive(option) ? styles.pillActive : styles.pillInactive}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function WriteupsPage() {
  const { isOwner } = useOwner();
  const [data, setData] = useState<Writeup[]>([]);
  const [search, setSearch] = useState('');
  const [platform, setPlatform] = useState('Todas');
  const [difficulty, setDifficulty] = useState('Todas');
  const [os, setOs] = useState('Todos');
  const [tags, setTags] = useState<string[]>([]);
  const [visible, setVisible] = useState(PAGE_SIZE);

  const loadData = async () => {
    setData(await getRemoteWriteups());
  };

  useEffect(() => {
    // overrides live in localStorage, only readable client-side after mount
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadData();
  }, []);

  const visibleData = useMemo(
    () => data.filter((w) => w.status === 'published' || isOwner),
    [data, isOwner],
  );

  const publishedData = useMemo(
    () => data.filter((writeup) => writeup.status === 'published'),
    [data],
  );

  const allTags = useMemo(
    () =>
      Array.from(
        new Set(
          publishedData
            .flatMap((writeup) => writeup.tags)
            .map((tag) => tag.trim())
            .filter(Boolean),
        ),
      ).sort((a, b) => a.localeCompare(b, 'pt-BR')),
    [publishedData],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return visibleData
      .filter((w) => platform === 'Todas' || w.platform === platform)
      .filter((w) => difficulty === 'Todas' || w.difficulty === difficulty)
      .filter((w) => os === 'Todos' || w.os === os)
      .filter((w) => tags.every((t) => w.tags.includes(t)))
      .filter(
        (w) =>
          !q ||
          w.title.toLowerCase().includes(q) ||
          w.platform.toLowerCase().includes(q) ||
          w.tags.some((t) => t.includes(q)),
      )
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [visibleData, search, platform, difficulty, os, tags]);

  const total = filtered.length;
  const shown = filtered.slice(0, visible);
  const hasFilters =
    !!search || platform !== 'Todas' || difficulty !== 'Todas' || os !== 'Todos' || tags.length > 0;
  const hasMore = total > visible;
  const allShown = total > 0 && !hasMore;
  const endLabel = total > PAGE_SIZE ? 'você chegou ao fim' : '';
  const resultLabel = total === 1 ? '1 writeup' : `${total} writeups`;

  const toggleTag = (t: string) => {
    setTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
    setVisible(PAGE_SIZE);
  };

  const clearAll = () => {
    setSearch('');
    setPlatform('Todas');
    setDifficulty('Todas');
    setOs('Todos');
    setTags([]);
    setVisible(PAGE_SIZE);
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <SiteHeader active="writeups" />

        <section className={styles.titleSection}>
          <div className={styles.titleSectionMain}>
            <div className={styles.eyebrow}>índice</div>
            <h1 className={styles.title}>Writeups</h1>
            <p className={styles.subtitle}>
              Toda análise de exploração que publiquei, da mais recente à mais antiga. Filtre
              por plataforma, dificuldade, sistema ou tag.
            </p>
          </div>

          {isOwner && (
            <Link href="/admin/writeups?new=1" className={styles.newButton}>
              + novo writeup
            </Link>
          )}
        </section>

        <section className={styles.filtersSection}>
          <div className={styles.searchBox}>
            <SearchIcon />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setVisible(PAGE_SIZE);
              }}
              placeholder="buscar por título, tag ou plataforma…"
              className={styles.searchInput}
            />
          </div>

          <div className={styles.filterRows}>
            <FilterRow
              label="plataforma"
              options={PLATFORMS}
              isActive={(o) => platform === o}
              onSelect={(o) => {
                setPlatform(o);
                setVisible(PAGE_SIZE);
              }}
            />
            <FilterRow
              label="dificuldade"
              options={DIFFICULTIES}
              isActive={(o) => difficulty === o}
              onSelect={(o) => {
                setDifficulty(o);
                setVisible(PAGE_SIZE);
              }}
            />
            <FilterRow
              label="sistema"
              options={SYSTEMS}
              isActive={(o) => os === o}
              onSelect={(o) => {
                setOs(o);
                setVisible(PAGE_SIZE);
              }}
            />
            <FilterRow
              label="tags"
              options={allTags}
              isActive={(o) => tags.includes(o)}
              onSelect={toggleTag}
            />
          </div>

          <div className={styles.resultsRow}>
            <div className={styles.resultLabel}>{resultLabel}</div>
            {hasFilters && (
              <button type="button" onClick={clearAll} className={styles.clearButton}>
                limpar filtros
              </button>
            )}
          </div>
        </section>

        <section className={styles.listSection}>
          <div className={styles.list}>
            {shown.map((w) => (
              <Link key={w.slug} href={`/writeups/${w.slug}`} className={styles.listItem}>
                <div className={styles.listLabel}>
                  writeup
                  {w.status === 'draft' && <span className={styles.statusBadgeDraft}> rascunho</span>}
                </div>
                <h3 className={styles.listTitle}>{w.title}</h3>
                <div className={styles.listMeta}>
                  {w.dateLabel} · {w.read} · {w.difficulty} · {w.platform}
                </div>
                <div className={styles.listTags}>{w.tags.join('   ·   ')}</div>
              </Link>
            ))}
          </div>

          {total === 0 && (
            <div className={styles.emptyState}>Nenhum writeup corresponde a esses filtros.</div>
          )}

          <div className={styles.loadMoreRow}>
            {hasMore && (
              <button
                type="button"
                onClick={() => setVisible((v) => v + LOAD_MORE_STEP)}
                className={styles.loadMoreButton}
              >
                carregar mais
              </button>
            )}
            {!hasMore && allShown && endLabel && (
              <div className={styles.endLabel}>{endLabel}</div>
            )}
          </div>
        </section>

        <SiteFooter />
      </div>
    </div>
  );
}
