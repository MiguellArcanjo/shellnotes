'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import SiteFooter from '@/components/site/SiteFooter';
import SiteHeader from '@/components/site/SiteHeader';
import { useOwner } from '@/lib/useOwner';
import { countCommands, createBlankCheatsheet, type Cheatsheet } from '@/lib/cheatsheets-data';
import { getRemoteOverrides } from '@/lib/cheatsheetOverrides';
import styles from './Cheatsheets.module.css';

export default function CheatsheetsIndex() {
  const { isOwner } = useOwner();
  const [items, setItems] = useState<Cheatsheet[]>([]);

  useEffect(() => {
    const load = async () => {
    const overrides = await getRemoteOverrides();
    const extras = Object.entries(overrides)
      .map(([slug, override]) => ({ ...createBlankCheatsheet(slug), ...override }))
      .filter((sheet) => sheet.title.trim() !== '');
    setItems(extras);
    };
    void load();
  }, []);

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <SiteHeader active="cheatsheets" />

        <section className={styles.titleSection}>
          <div className={styles.titleSectionMain}>
            <div className={styles.eyebrow}>referência</div>
            <h1 className={styles.title}>Cheatsheets</h1>
            <p className={styles.subtitle}>
              Comandos e payloads que eu sempre esqueço, organizados por fase do engajamento.
              Pensados para escanear rápido e copiar na hora.
            </p>
          </div>
          {isOwner && (
            <Link href="/admin/cheatsheets?new=1" className={styles.newButton}>
              + nova cheatsheet
            </Link>
          )}
        </section>

        <section className={styles.grid}>
          {items.map((sheet) => (
            <Link key={sheet.slug} href={`/cheatsheets/${sheet.slug}`} className={styles.card}>
              <div className={styles.cardHead}>
                <div className={styles.cardKicker}>{sheet.kicker}</div>
                <div className={styles.cardCount}>{countCommands(sheet)} comandos</div>
              </div>
              <div className={styles.cardTitle}>{sheet.title}</div>
              <div className={styles.cardDesc}>{sheet.desc}</div>
            </Link>
          ))}
        </section>

        <SiteFooter />
      </div>
    </div>
  );
}
