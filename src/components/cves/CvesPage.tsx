'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import SiteFooter from '@/components/site/SiteFooter';
import SiteHeader from '@/components/site/SiteHeader';
import { type CveEntry } from '@/lib/cves-data';
import { getAllCvesRemote } from '@/lib/cveStore';
import styles from './Cves.module.css';

const ALL = 'todos';

export default function CvesPage() {
  const [items, setItems] = useState<CveEntry[]>([]);
  const [search, setSearch] = useState('');
  const [severity, setSeverity] = useState(ALL);
  const [type, setType] = useState(ALL);

  useEffect(() => {
    void getAllCvesRemote().then((entries) => {
      setItems(entries.filter((entry) => entry.status === 'published'));
    });
  }, []);

  const types = useMemo(() => Array.from(new Set(items.map((item) => item.vulnerabilityType))).sort(), [items]);
  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();
    return items
      .filter((item) =>
        (!query ||
          item.cveId.toLowerCase().includes(query) ||
          item.product.toLowerCase().includes(query) ||
          item.description.toLowerCase().includes(query)) &&
        (severity === ALL || item.severity === severity) &&
        (type === ALL || item.vulnerabilityType === type),
      )
      .sort((a, b) => b.cvss - a.cvss);
  }, [items, search, severity, type]);

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <SiteHeader active="cves" />
        <main>
          <section className={styles.intro}>
            <div className={styles.eyebrow}>vulnerabilidades</div>
            <h1 className={styles.title}>CVEs</h1>
            <p className={styles.subtitle}>Notas técnicas sobre vulnerabilidades públicas, reprodução em laboratório e referências para investigação.</p>
          </section>
          <section className={styles.controls} aria-label="Busca e filtros">
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="buscar por CVE, produto ou descrição…" className={styles.search} />
            <select value={severity} onChange={(event) => setSeverity(event.target.value)} className={styles.select}>
              <option value={ALL}>todas as severidades</option>
              <option value="critical">crítico</option>
              <option value="high">alto</option>
              <option value="medium">médio</option>
              <option value="low">baixo</option>
            </select>
            <select value={type} onChange={(event) => setType(event.target.value)} className={styles.select}>
              <option value={ALL}>todos os tipos</option>
              {types.map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </section>
          <section className={styles.list}>
            {visible.map((item) => (
              <Link key={item.id} href={`/cves/${item.cveId.toLowerCase()}`} className={styles.row}>
                <div className={styles.identifier}>{item.cveId}</div>
                <div className={`${styles.score} ${styles[item.severity]}`}>{item.cvss.toFixed(1)}</div>
                <div>
                  <div className={styles.product}>{item.product} · {item.version}</div>
                  <div className={styles.description}>{item.description}</div>
                </div>
                <div className={styles.meta}>{item.vulnerabilityType}<br />{item.exploitStatus}</div>
              </Link>
            ))}
            {visible.length === 0 && <div className={styles.empty}>Nenhuma CVE encontrada.</div>}
          </section>
        </main>
        <SiteFooter />
      </div>
    </div>
  );
}
