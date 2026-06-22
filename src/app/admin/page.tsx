'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Book, BookOpen, FileText, Lightbulb, Shield } from 'lucide-react';
import { listContentEntries, type ContentType } from '@/lib/supabase/content';
import styles from '@/components/admin/Admin.module.css';

const definitions: { name: string; type: ContentType; icon: typeof FileText; href: string }[] = [
  { name: 'Writeups', type: 'writeup', icon: FileText, href: '/admin/writeups' },
  { name: 'Cheatsheets', type: 'cheatsheet', icon: BookOpen, href: '/admin/cheatsheets' },
  { name: 'TIL', type: 'til', icon: Lightbulb, href: '/admin/til' },
  { name: 'CVEs', type: 'cve', icon: Shield, href: '/admin/cves' },
  { name: 'Glossário', type: 'glossary', icon: Book, href: '/admin/glossary' },
];

export default function AdminDashboard() {
  const [counts, setCounts] = useState<Partial<Record<ContentType, number>>>({});

  useEffect(() => {
    void Promise.all(definitions.map(async ({ type }) => [type, (await listContentEntries(type)).length] as const))
      .then((entries) => setCounts(Object.fromEntries(entries) as Partial<Record<ContentType, number>>));
  }, []);

  return (
    <div className={styles.page}>
      <section>
        <div className={styles.eyebrow}>conteúdo</div>
        <h1 className={styles.title}>Dashboard</h1>
        <p className={styles.subtitle}>Visão geral do conteúdo armazenado no Supabase.</p>
      </section>
      <section className={styles.metrics}>
        {definitions.map(({ name, type, icon: Icon, href }) => (
          <Link key={type} href={href} className={styles.metric}>
            <Icon size={17} strokeWidth={1.7} className={styles.metricIcon} />
            <div className={styles.metricValue}>{counts[type] ?? 0}</div>
            <div className={styles.metricLabel}>{name}</div>
          </Link>
        ))}
      </section>
    </div>
  );
}
