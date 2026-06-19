'use client';

import { useEffect, useState } from 'react';
import {
  DEFAULT_TAXONOMY,
  getAssetTaxonomy,
  getRemoteAssetTaxonomy,
  saveAssetTaxonomy,
  subscribeAssetTaxonomy,
  type AssetTaxonomy,
} from './assetTaxonomy';

export function useAssetTaxonomy() {
  const [taxonomy, setTaxonomy] = useState<AssetTaxonomy>(DEFAULT_TAXONOMY);

  useEffect(() => {
    const sync = () => setTaxonomy(getAssetTaxonomy());
    sync();
    void getRemoteAssetTaxonomy().then((remote) => {
      if (remote) setTaxonomy(remote);
    });
    return subscribeAssetTaxonomy(sync);
  }, []);

  const save = (next: AssetTaxonomy) => {
    saveAssetTaxonomy(next);
    setTaxonomy(next);
  };

  return { taxonomy, save };
}
