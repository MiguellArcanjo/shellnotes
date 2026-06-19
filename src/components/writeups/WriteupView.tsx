'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import SiteFooter from '@/components/site/SiteFooter';
import SiteHeader from '@/components/site/SiteHeader';
import { useOwner } from '@/lib/useOwner';
import { createBlankWriteup, type Writeup } from '@/lib/writeups-data';
import { getRemoteOverride } from '@/lib/writeupOverrides';
import WriteupBody from './WriteupBody';
import styles from './Writeups.module.css';

export default function WriteupView({ seed, slug }: { seed: Writeup | null; slug: string }) {
  const { isOwner } = useOwner();
  const [current, setCurrent] = useState<Writeup | null>(seed);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const remote = await getRemoteOverride(slug);
      if (!active) return;
      if (remote) {
        setCurrent({ ...(seed ?? createBlankWriteup(slug)), ...remote });
        return;
      }
    setNotFound(true);
    };
    void load();
    return () => {
      active = false;
    };
  }, [seed, slug]);

  if (notFound) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <SiteHeader active="writeups" />
          <div className={styles.emptyState}>
            Este writeup não existe ou ainda não carregou. <Link href="/writeups">Voltar para writeups</Link>.
          </div>
          <SiteFooter />
        </div>
      </div>
    );
  }

  if (!current) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <SiteHeader active="writeups" />
          <SiteFooter />
        </div>
      </div>
    );
  }

  const isHiddenDraft = current.status === 'draft' && !isOwner;

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <SiteHeader active="writeups" />

        <section className={styles.detailHeader}>
          <div className={styles.breadcrumb}>
            <Link href="/writeups" className={styles.breadcrumbLink}>writeups</Link>
            <span className={styles.breadcrumbSep}>/</span>
            <span className={styles.breadcrumbCurrent}>{current.title}</span>
          </div>

          {isOwner && (
            <div className={styles.ownerBar}>
              <span className={current.status === 'published' ? styles.statusBadgePublished : styles.statusBadgeDraft}>
                {current.status === 'published' ? 'publicado' : 'rascunho'}
              </span>
              <Link href={`/admin/writeups?edit=${encodeURIComponent(current.slug)}`} className={styles.editButton}>
                editar
              </Link>
            </div>
          )}
        </section>

        {isHiddenDraft ? (
          <div className={styles.emptyState}>Este writeup ainda está em rascunho.</div>
        ) : (
          <>
            <section className={styles.readerTitleSection}>
              <h1 className={styles.readerTitle}>{current.title}</h1>
              <div className={styles.readerMetaRow}>
                <span>{current.dateLabel}</span>
                <span>·</span>
                <span>{current.read}</span>
                <span>·</span>
                <span>{current.difficulty}</span>
                <span>·</span>
                <span>{current.platform}</span>
                <span>·</span>
                <span>{current.os}</span>
              </div>
              <div className={styles.readerPillsRow}>
                {current.tags.map((t) => <span key={t} className={styles.readerTagPill}>{t}</span>)}
              </div>
              {current.mitre.length > 0 && (
                <div className={styles.readerPillsRow}>
                  {current.mitre.map((m) => <span key={m} className={styles.readerMitrePill}>{m}</span>)}
                </div>
              )}
            </section>

            <WriteupBody content={current.content} />
          </>
        )}

        <SiteFooter />
      </div>
    </div>
  );
}
