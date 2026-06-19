'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { Check, ExternalLink } from 'lucide-react';
import { useSiteSettings } from '@/lib/useSiteSettings';
import type { SiteSettings } from '@/lib/siteSettings';
import styles from './Admin.module.css';

const FIELDS: {
  key: keyof Pick<SiteSettings, 'githubUrl' | 'linkedinUrl' | 'rssUrl'>;
  label: string;
  placeholder: string;
  hint: string;
}[] = [
  {
    key: 'githubUrl',
    label: 'GitHub',
    placeholder: 'https://github.com/seu-usuario',
    hint: 'Perfil ou organização exibida no rodapé.',
  },
  {
    key: 'linkedinUrl',
    label: 'LinkedIn',
    placeholder: 'https://linkedin.com/in/seu-usuario',
    hint: 'URL pública do seu perfil profissional.',
  },
  {
    key: 'rssUrl',
    label: 'RSS',
    placeholder: '/rss.xml',
    hint: 'Aceita uma URL completa ou um caminho interno.',
  },
];

export default function AdminSettings() {
  const { settings, save } = useSiteSettings();
  const [draft, setDraft] = useState(settings);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // Settings are loaded from browser storage after hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDraft(settings);
  }, [settings]);

  const update = (patch: Partial<SiteSettings>) => {
    setSaved(false);
    setDraft((current) => ({ ...current, ...patch }));
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    save({
      tagline: draft.tagline.trim() || 'notas de campo sobre segurança ofensiva',
      githubUrl: draft.githubUrl.trim() || '#',
      linkedinUrl: draft.linkedinUrl.trim() || '#',
      rssUrl: draft.rssUrl.trim() || '#',
    });
    setSaved(true);
  };

  return (
    <div className={styles.settingsPage}>
      <div className={styles.toolbar}>
        <div>
          <div className={styles.eyebrow}>site</div>
          <h1 className={styles.title}>Configurações</h1>
          <p className={styles.subtitle}>Links e informações globais exibidos nas páginas públicas.</p>
        </div>
      </div>

      <form onSubmit={submit} className={styles.settingsForm}>
        <section className={styles.settingsSection}>
          <div className={styles.settingsSectionIntro}>
            <h2>Rodapé</h2>
            <p>Esses valores são usados em todas as páginas públicas do shellnotes.</p>
          </div>
          <div className={styles.settingsFields}>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Descrição curta</span>
              <input
                value={draft.tagline}
                onChange={(event) => update({ tagline: event.target.value })}
                placeholder="notas de campo sobre segurança ofensiva"
                className={styles.formInput}
              />
              <span className={styles.settingsHint}>Texto mostrado abaixo da marca no rodapé.</span>
            </label>

            {FIELDS.map((field) => (
              <label key={field.key} className={styles.field}>
                <span className={styles.fieldLabel}>{field.label}</span>
                <div className={styles.urlInputWrap}>
                  <input
                    value={draft[field.key]}
                    onChange={(event) => update({ [field.key]: event.target.value })}
                    placeholder={field.placeholder}
                    className={`${styles.formInput} ${styles.monoInput}`}
                  />
                  {draft[field.key] && draft[field.key] !== '#' && (
                    <a
                      href={draft[field.key]}
                      target="_blank"
                      rel="noreferrer"
                      className={styles.urlPreviewButton}
                      aria-label={`Abrir ${field.label}`}
                    >
                      <ExternalLink size={14} />
                    </a>
                  )}
                </div>
                <span className={styles.settingsHint}>{field.hint}</span>
              </label>
            ))}
          </div>
        </section>

        <div className={styles.settingsActions}>
          <span className={styles.savedMessage}>{saved && <><Check size={13} /> configurações salvas</>}</span>
          <button type="submit" className={styles.primaryButton}>salvar alterações</button>
        </div>
      </form>

      <section className={styles.footerPreview}>
        <div>
          <div className={styles.previewBrand}>shellnotes<span>.</span></div>
          <div className={styles.previewTagline}>{draft.tagline}</div>
        </div>
        <div className={styles.previewLinks}>
          <span>github</span>
          <span>linkedin</span>
          <span>rss</span>
          <span>sair</span>
        </div>
      </section>
    </div>
  );
}
