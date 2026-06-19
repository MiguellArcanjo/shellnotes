'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import SiteFooter from '@/components/site/SiteFooter';
import SiteHeader from '@/components/site/SiteHeader';
import { type CveEntry } from '@/lib/cves-data';
import { getAllCvesRemote } from '@/lib/cveStore';
import { useOwner } from '@/lib/useOwner';
import CveCodeBlock from './CveCodeBlock';
import styles from './Cves.module.css';

function findEntry(identifier: string, entries: CveEntry[]) {
  const normalized = decodeURIComponent(identifier).toLowerCase();
  return entries.find(
    (entry) => entry.id.toLowerCase() === normalized || entry.cveId.toLowerCase() === normalized,
  );
}

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className={styles.detailSection}>
      <h2 className={styles.detailHeading}>{title}</h2>
      <div className={styles.detailBody}>{children}</div>
    </section>
  );
}

export default function CveDetailPage({ identifier }: { identifier: string }) {
  const { isOwner } = useOwner();
  const [entry, setEntry] = useState<CveEntry | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    void getAllCvesRemote().then((entries) => {
      const found = findEntry(identifier, entries);
      setEntry(found ?? null);
      setReady(true);
    });
  }, [identifier]);

  const unavailable = !entry || (entry.status !== 'published' && !isOwner);

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <SiteHeader active="cves" />
        <main className={styles.detailMain}>
          {!ready && !entry ? (
            <div className={styles.empty}>Carregando CVE…</div>
          ) : unavailable ? (
            <div className={styles.notFound}>
              <div className={styles.eyebrow}>cve não encontrada</div>
              <h1 className={styles.detailTitle}>Este registro não está disponível.</h1>
              <Link href="/cves" className={styles.backLink}><ArrowLeft size={14} /> voltar para CVEs</Link>
            </div>
          ) : entry && (
            <>
              <div className={styles.detailBackRow}>
                <Link href="/cves" className={styles.backLink}><ArrowLeft size={14} /> todas as CVEs</Link>
                {isOwner && <Link href={`/admin/cves?edit=${encodeURIComponent(entry.id)}`} className={styles.ownerEditLink}>editar no admin</Link>}
              </div>

              <header className={styles.detailHeader}>
                <div>
                  <div className={styles.detailKicker}>{entry.vulnerabilityType} · {entry.exploitStatus}</div>
                  <h1 className={styles.detailTitle}>{entry.cveId}</h1>
                  <p className={styles.detailLead}>{entry.description}</p>
                </div>
                <div className={styles.detailScore}>
                  <span className={`${styles.scoreLarge} ${styles[entry.severity]}`}>{entry.cvss.toFixed(1)}</span>
                  <span>CVSS</span>
                </div>
              </header>

              <div className={styles.factGrid}>
                <div><span>produto</span><strong>{entry.product}</strong></div>
                <div><span>versões afetadas</span><strong>{entry.version}</strong></div>
                <div><span>reproduzido</span><strong>{entry.reproduced ? 'sim' : 'não'}</strong></div>
                <div><span>atualizado</span><strong>{new Date(`${entry.updatedAt}T12:00:00`).toLocaleDateString('pt-BR')}</strong></div>
              </div>

              {entry.impact && <DetailSection title="Impacto"><p>{entry.impact}</p></DetailSection>}
              {entry.reproduction && <DetailSection title="Reprodução"><p>{entry.reproduction}</p></DetailSection>}

              {entry.codeBlocks.length > 0 && (
                <DetailSection title="PoC e código">
                  <div className={styles.codeList}>
                    {entry.codeBlocks.map((block, index) => (
                      <CveCodeBlock key={`${block.title}-${index}`} {...block} />
                    ))}
                  </div>
                </DetailSection>
              )}

              {entry.mitigation && <DetailSection title="Mitigação"><p>{entry.mitigation}</p></DetailSection>}

              {(entry.pocUrl || entry.references.length > 0) && (
                <DetailSection title="Referências">
                  <div className={styles.referenceList}>
                    {[entry.pocUrl, ...entry.references].filter(Boolean).filter((url, index, urls) => urls.indexOf(url) === index).map((url) => (
                      <a key={url} href={url} target="_blank" rel="noreferrer">
                        <span>{url}</span><ExternalLink size={13} />
                      </a>
                    ))}
                  </div>
                </DetailSection>
              )}

              {entry.writeupSlug && (
                <aside className={styles.writeupCallout}>
                  <div>
                    <span>leitura relacionada</span>
                    <strong>Writeup técnico desta vulnerabilidade</strong>
                  </div>
                  <Link href={`/writeups/${entry.writeupSlug}`}>abrir writeup →</Link>
                </aside>
              )}
            </>
          )}
        </main>
        <SiteFooter />
      </div>
    </div>
  );
}
