'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import SiteFooter from '@/components/site/SiteFooter';
import SiteHeader from '@/components/site/SiteHeader';
import type { Writeup } from '@/lib/writeups-data';
import { getRemoteWriteups } from '@/lib/writeupOverrides';
import styles from './Home.module.css';

const shortcuts = [
  { title: 'writeups', href: '/writeups', desc: 'Análises completas de exploração, do recon ao root.' },
  { title: 'cheatsheets', href: '/cheatsheets', desc: 'Comandos e payloads organizados para consulta rápida.' },
  { title: 'cves', href: '/cves', desc: 'Notas técnicas sobre vulnerabilidades estudadas a fundo.' },
];

export default function Home() {
  const [writeups, setWriteups] = useState<Writeup[]>([]);

  useEffect(() => {
    void getRemoteWriteups().then((items) => {
      setWriteups(
        items
          .filter((writeup) => writeup.status === 'published')
          .sort((a, b) => b.date.localeCompare(a.date))
          .slice(0, 5),
      );
    });
  }, []);

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <SiteHeader />
        <section className={styles.hero}>
          <h1 className={styles.heroTitle}>Notas de campo sobre segurança ofensiva — writeups, CVEs e metodologia.</h1>
          <p className={styles.heroSubtitle}>Eu quebro coisas para entender como elas funcionam, e escrevo aqui o que aprendo no caminho — do recon ao root, com o raciocínio inteiro à mostra.</p>
        </section>
        <section id="writeups" className={styles.writeupsSection}>
          <div className={styles.sectionLabel}>writeups recentes</div>
          <div className={styles.writeupsList}>
            {writeups.map((writeup) => (
              <Link key={writeup.slug} href={`/writeups/${writeup.slug}`} className={styles.writeupItem}>
                <div className={styles.writeupLabel}>writeup</div>
                <h3 className={styles.writeupTitle}>{writeup.title}</h3>
                <div className={styles.writeupMeta}>{writeup.dateLabel} · {writeup.read} · {writeup.tags.join(', ')}</div>
                <p className={styles.writeupSummary}>{writeup.summary}</p>
              </Link>
            ))}
          </div>
          <Link href="/writeups" className={styles.viewAllLink}>ver todos os writeups →</Link>
        </section>
        <section className={styles.shortcutsSection}>
          <div className={styles.sectionLabel}>explorar</div>
          <div className={styles.shortcutsGrid}>
            {shortcuts.map((shortcut) => (
              <Link key={shortcut.title} href={shortcut.href} className={styles.shortcutCard}>
                <div className={styles.shortcutTitle}>{shortcut.title}</div>
                <div className={styles.shortcutDesc}>{shortcut.desc}</div>
              </Link>
            ))}
          </div>
        </section>
        <SiteFooter />
      </div>
    </div>
  );
}
