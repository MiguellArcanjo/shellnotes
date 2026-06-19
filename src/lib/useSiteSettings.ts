'use client';

import { useEffect, useState } from 'react';
import {
  DEFAULT_SITE_SETTINGS,
  getSiteSettings,
  getRemoteSiteSettings,
  saveSiteSettings,
  subscribeSiteSettings,
  type SiteSettings,
} from './siteSettings';

export function useSiteSettings() {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);

  useEffect(() => {
    const sync = () => setSettings(getSiteSettings());
    sync();
    void getRemoteSiteSettings().then((remote) => {
      if (remote) setSettings(remote);
    });
    return subscribeSiteSettings(sync);
  }, []);

  const save = (next: SiteSettings) => {
    saveSiteSettings(next);
    setSettings(next);
  };

  return { settings, save };
}
