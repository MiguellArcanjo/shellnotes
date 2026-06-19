'use client';

import Link from 'next/link';
import { useOwner } from '@/lib/useOwner';
import styles from './Site.module.css';

export default function OwnerToggle() {
  const { isOwner, logout } = useOwner();

  if (isOwner) {
    return (
      <button type="button" onClick={() => void logout()} className={styles.footerLink}>
        sair
      </button>
    );
  }

  return (
    <Link href="/login" className={styles.footerLink}>
      entrar
    </Link>
  );
}
