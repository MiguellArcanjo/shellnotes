'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import SiteFooter from '@/components/site/SiteFooter';
import SiteHeader from '@/components/site/SiteHeader';
import { useOwner } from '@/lib/useOwner';
import { createBlankCheatsheet, type Cheatsheet } from '@/lib/cheatsheets-data';
import { getRemoteOverrides } from '@/lib/cheatsheetOverrides';
import CheatsheetDetail from './CheatsheetDetail';
import styles from './Cheatsheets.module.css';

export default function CheatsheetView({
  seed,
  slug,
}: {
  seed: Cheatsheet | null;
  slug: string;
}) {
  const router = useRouter();
  const { isOwner } = useOwner();
  const [sheet, setSheet] = useState<Cheatsheet | null>(seed);

  useEffect(() => {
    let active = true;
    const load = async () => {
    const remote = (await getRemoteOverrides())[slug];
    if (!active) return;
    if (remote) {
      setSheet({ ...(seed ?? createBlankCheatsheet(slug)), ...remote });
      return;
    }
    setSheet(null);
    };
    void load();
    return () => {
      active = false;
    };
  }, [seed, slug]);

  if (!sheet) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <SiteHeader active="cheatsheets" />
          <div className={styles.emptyState}>
            Esta cheatsheet não existe. <Link href="/cheatsheets">Voltar para cheatsheets</Link>.
          </div>
          <SiteFooter />
        </div>
      </div>
    );
  }

  return (
    <CheatsheetDetail
      sheet={sheet}
      isOwner={isOwner}
      onEdit={() => router.push(`/admin/cheatsheets?edit=${encodeURIComponent(sheet.slug)}`)}
    />
  );
}
