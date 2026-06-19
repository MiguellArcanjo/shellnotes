'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import { MoonIcon, SunIcon } from '@/components/site/ThemeIcons';
import { useOwner } from '@/lib/useOwner';
import { useTheme } from '@/lib/useTheme';
import styles from './Login.module.css';

function WarningIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={styles.errorIcon}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v5M12 16h.01" />
    </svg>
  );
}

export default function LoginPage() {
  const { isDark, toggleTheme } = useTheme();
  const { isOwner, login } = useOwner();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [forgotNote, setForgotNote] = useState(false);

  useEffect(() => {
    if (isOwner) {
      router.replace('/writeups');
    }
  }, [isOwner, router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(false);

    const ok = await login(email, password);
    if (ok) {
      router.replace('/writeups');
      return;
    }

    setError(true);
    setSubmitting(false);
  };

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <div className={styles.topBar}>
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Alternar tema"
            className={styles.themeButton}
          >
            {isDark ? <SunIcon /> : <MoonIcon />}
          </button>
        </div>

        <div className={styles.center}>
          <div className={styles.card}>
            <div className={styles.brandRow}>
              <Link href="/" className={styles.brand}>
                shellnotes<span className={styles.dot}>.</span>
              </Link>
              <div className={styles.eyebrow}>área privada</div>
            </div>

            <form className={styles.form} onSubmit={handleSubmit}>
              <div className={styles.field}>
                <label htmlFor="email" className={styles.label}>e-mail</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                  className={styles.input}
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="password" className={styles.label}>senha</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                  className={styles.input}
                />
              </div>

              {error && (
                <div className={styles.errorBox}>
                  <WarningIcon />
                  credenciais inválidas
                </div>
              )}

              <button type="submit" disabled={submitting} className={styles.submitButton}>
                entrar
              </button>
            </form>

            <div className={styles.forgotRow}>
              <button
                type="button"
                onClick={() => setForgotNote(true)}
                className={styles.forgotLink}
              >
                esqueci a senha
              </button>
              {forgotNote && (
                <div className={styles.forgotNote}>
                  Acesso restrito ao dono do site — sem recuperação automática.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
