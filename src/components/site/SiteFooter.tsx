'use client';

import OwnerToggle from './OwnerToggle';
import { useSiteSettings } from '@/lib/useSiteSettings';
import styles from './Site.module.css';

export default function SiteFooter() {
  const { settings } = useSiteSettings();

  return (
    <footer className={styles.footer}>
      <div>
        <div className={styles.footerBrand}>
          shellnotes<span className={styles.dot}>.</span>
        </div>
        <div className={styles.footerTagline}>{settings.tagline}</div>
      </div>
      <nav className={styles.footerNav}>
        <a href={settings.githubUrl} target={settings.githubUrl === '#' ? undefined : '_blank'} rel="noreferrer" className={styles.footerLink}>github</a>
        <a href={settings.linkedinUrl} target={settings.linkedinUrl === '#' ? undefined : '_blank'} rel="noreferrer" className={styles.footerLink}>linkedin</a>
        <a href={settings.rssUrl} target={settings.rssUrl.startsWith('http') ? '_blank' : undefined} rel="noreferrer" className={styles.footerLink}>rss</a>
        <OwnerToggle />
      </nav>
    </footer>
  );
}
