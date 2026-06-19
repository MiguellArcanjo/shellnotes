'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import WriteupEditor from '@/components/writeups/WriteupEditor';
import { createBlankWriteup, type Writeup } from '@/lib/writeups-data';
import { getRemoteOverride, saveOverride } from '@/lib/writeupOverrides';
import styles from './Admin.module.css';

export default function AdminWriteupForm({
  seed,
  slug,
}: {
  seed: Writeup | null;
  slug: string;
}) {
  const router = useRouter();
  const [writeup, setWriteup] = useState<Writeup | null>(seed);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const remote = slug !== 'new' ? await getRemoteOverride(slug) : undefined;
      if (!active) return;
      if (remote) {
        setWriteup({ ...(seed ?? createBlankWriteup(slug)), ...remote });
        return;
      }
    if (slug === 'new') {
      // Generate the local draft id only in the browser to avoid hydration drift.
      setWriteup(createBlankWriteup(`writeup-${Date.now()}`));
      return;
    }

    setWriteup(null);
    };
    void load();
    return () => {
      active = false;
    };
  }, [seed, slug]);

  if (!writeup) {
    return (
      <div className={styles.loading}>
        {slug === 'new' ? 'Preparando novo writeup…' : 'Writeup não encontrado.'}
      </div>
    );
  }

  return (
    <div className={styles.editorWrap}>
      <WriteupEditor
        writeup={writeup}
        backHref="/admin/writeups"
        onExit={(updated) => {
          void saveOverride(updated.slug, updated).then(() => {
            router.push('/admin/writeups');
          });
        }}
      />
    </div>
  );
}
