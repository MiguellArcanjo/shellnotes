'use client';

import Link from 'next/link';
import { useOwner } from '@/lib/useOwner';
import { useTheme } from '@/lib/useTheme';
import styles from './Site.module.css';
import { MoonIcon, SunIcon } from './ThemeIcons';

const NAV_ITEMS = [
  { key: 'writeups', label: 'writeups', href: '/writeups' },
  { key: 'cheatsheets', label: 'cheatsheets', href: '/cheatsheets' },
  { key: 'cves', label: 'cves', href: '/cves' },
  { key: 'til', label: 'til', href: '/til' },
  { key: 'glossario', label: 'glossário', href: '/glossario' },
] as const;

export default function SiteHeader({ active }: { active?: typeof NAV_ITEMS[number]['key'] }) {
  const { isDark, toggleTheme } = useTheme();
  const { isOwner } = useOwner();

  return (
    <header className={styles.header}>
      <Link href={isOwner ? '/writeups' : '/'} className={styles.logo}>
        shellnotes<span className={styles.dot}>.</span>
      </Link>
      <nav className={styles.nav}>
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.key}
            href={item.href}
            className={item.key === active ? styles.navLinkActive : styles.navLink}
          >
            {item.label}
          </Link>
        ))}
        {isOwner && (
          <Link href="/admin" className={styles.adminLink}>
            admin
          </Link>
        )}
        <button
          type="button"
          onClick={toggleTheme}
          aria-label="Alternar tema"
          className={styles.themeButton}
        >
          {isDark ? <SunIcon /> : <MoonIcon />}
        </button>
      </nav>
    </header>
  );
}
