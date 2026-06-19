'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Book,
  BookOpen,
  FileText,
  LayoutDashboard,
  Lightbulb,
  Lock,
  Shield,
  Settings,
  Target,
} from 'lucide-react';
import styles from './Admin.module.css';

const navigation = [
  { name: 'dashboard', href: '/admin', icon: LayoutDashboard, exact: true },
  { name: 'writeups', href: '/admin/writeups', icon: FileText },
  { name: 'cheatsheets', href: '/admin/cheatsheets', icon: BookOpen },
  { name: 'til', href: '/admin/til', icon: Lightbulb },
  { name: 'cves', href: '/admin/cves', icon: Shield },
  { name: 'glossário', href: '/admin/glossary', icon: Book },
  { name: 'configurações', href: '/admin/configuracoes', icon: Settings },
  { name: 'bug bounty', href: '/bounty', icon: Target },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className={styles.sidebar}>
      <Link href="/writeups" className={styles.brand}>
        shellnotes<span className={styles.dot}>.</span>
      </Link>
      <div className={styles.privateBadge}>
        <Lock size={12} />
        área privada
      </div>
      <nav className={styles.nav} aria-label="Painel de conteúdo">
        <ul className={styles.navList}>
          {navigation.map(({ name, href, icon: Icon, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href);
            return (
              <li key={href}>
                <Link href={href} className={active ? styles.navItemActive : styles.navItem}>
                  <Icon size={16} strokeWidth={1.7} />
                  {name}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className={styles.sidebarFooter}>
        <Link href="/bounty" className={styles.sidebarLink}>ir para bug bounty →</Link>
      </div>
    </aside>
  );
}
