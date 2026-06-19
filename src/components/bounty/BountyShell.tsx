'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  BarChart3,
  CircleDollarSign,
  Crosshair,
  FileSearch,
  FileText,
  Home,
  LayoutDashboard,
  Lightbulb,
  ListChecks,
  Lock,
  Radar,
} from 'lucide-react';
import { MoonIcon, SunIcon } from '@/components/site/ThemeIcons';
import { useOwner } from '@/lib/useOwner';
import { useTheme } from '@/lib/useTheme';
import { hydratePrivateCache } from '@/lib/supabase/hydrate';
import styles from './Bounty.module.css';

const NAV_ITEMS = [
  { key: 'dashboard', label: 'dashboard', icon: LayoutDashboard, href: '/bounty' },
  { key: 'programas', label: 'programas', icon: Radar, href: '/bounty/programas' },
  { key: 'alvos', label: 'alvos', icon: Crosshair, href: '/bounty/alvos' },
  { key: 'findings', label: 'findings', icon: FileSearch, href: '/bounty/findings' },
  { key: 'pipeline', label: 'pipeline', icon: BarChart3, href: '/bounty/pipeline' },
  { key: 'reports', label: 'reports', icon: FileText, href: '/bounty/reports' },
  { key: 'payouts', label: 'payouts', icon: CircleDollarSign, href: '/bounty/payouts' },
  { key: 'checklists', label: 'checklists', icon: ListChecks, href: '/bounty/checklists' },
  { key: 'leads', label: 'leads', icon: Lightbulb, href: '/bounty/leads' },
] as const;

export default function BountyShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isOwner, isReady } = useOwner();
  const { isDark, toggleTheme } = useTheme();
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    if (!isReady) return;
    if (!isOwner) {
      router.replace('/');
    }
  }, [isOwner, isReady, router]);

  useEffect(() => {
    if (!isReady || !isOwner) return;
    let active = true;
    void hydratePrivateCache().finally(() => {
      if (active) setIsHydrated(true);
    });
    return () => {
      active = false;
    };
  }, [isOwner, isReady]);

  if (!isReady || !isOwner || !isHydrated) {
    return <div className={styles.loading}>verificando acesso…</div>;
  }

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <Link href="/writeups" className={styles.brand}>
          shellnotes<span className={styles.dot}>.</span>
        </Link>
        <div className={styles.privateBadge}>
          <Lock size={12} />
          área privada
        </div>
        <nav className={styles.nav} aria-label="Bug bounty">
          <ul className={styles.navList}>
            {NAV_ITEMS.map(({ key, label, icon: Icon, href }) => {
              const isActive = pathname === href;
              return (
                <li key={key}>
                  <Link href={href} className={isActive ? styles.navItemActive : styles.navItem}>
                    <Icon size={16} strokeWidth={1.7} />
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className={styles.sidebarFooter}>
          <Link href="/admin" className={styles.adminLink}>← painel de conteúdo</Link>
        </div>
      </aside>

      <main className={styles.main}>
        <header className={styles.topbar}>
          <div className={styles.topbarTitle}>Bug bounty</div>
          <div className={styles.topbarActions}>
            <Link href="/" className={styles.themeButton} aria-label="Voltar para a home">
              <Home size={16} />
            </Link>
            <button type="button" onClick={toggleTheme} className={styles.themeButton} aria-label="Alternar tema">
              {isDark ? <SunIcon /> : <MoonIcon />}
            </button>
          </div>
        </header>

        <div className={styles.content}>{children}</div>
      </main>
    </div>
  );
}
