'use client';

import Link from 'next/link';
import { Home } from 'lucide-react';
import { MoonIcon, SunIcon } from '@/components/site/ThemeIcons';
import { useTheme } from '@/lib/useTheme';
import styles from './Admin.module.css';

export default function AdminHeader() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <header className={styles.topbar}>
      <div className={styles.topbarTitle}>Painel de conteúdo</div>
      <div className={styles.topbarActions}>
        <Link href="/" className={styles.themeButton} aria-label="Voltar para a home">
          <Home size={16} />
        </Link>
        <button type="button" onClick={toggleTheme} className={styles.themeButton} aria-label="Alternar tema">
          {isDark ? <SunIcon /> : <MoonIcon />}
        </button>
      </div>
    </header>
  );
}
