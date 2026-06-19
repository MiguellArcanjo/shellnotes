'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useOwner } from '@/lib/useOwner';
import AdminHeader from './AdminHeader';
import AdminSidebar from './AdminSidebar';
import styles from './Admin.module.css';

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isOwner, isReady } = useOwner();

  useEffect(() => {
    if (isReady && !isOwner) router.replace('/');
  }, [isOwner, isReady, router]);

  if (!isReady || !isOwner) {
    return <div className={styles.accessLoading}>verificando acesso…</div>;
  }

  return (
    <div className={styles.shell}>
      <AdminSidebar />
      <div className={styles.main}>
        <AdminHeader />
        <main className={styles.content}>{children}</main>
      </div>
    </div>
  );
}
