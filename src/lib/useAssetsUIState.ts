'use client';

import { useEffect, useState } from 'react';
import type { SectionKey } from './assets-data';

export type AssetColumnKey = 'host' | 'type' | 'program' | 'stack' | 'status' | 'priority' | 'findings';

export type Density = 'compacto' | 'confortável';

export type AssetsUIState = {
  sectionOrder: SectionKey[];
  collapsedSections: SectionKey[];
  columnVisibility: Record<AssetColumnKey, boolean>;
  density: Density;
  panelWidthPct: number;
  listCollapsed: boolean;
};

const STORAGE_KEY = 'shellnotes-alvos-ui-state-v1';

export const DEFAULT_SECTION_ORDER: SectionKey[] = ['identificacao', 'rede', 'fingerprint', 'superficie', 'triagem'];

export const DEFAULT_ASSETS_UI_STATE: AssetsUIState = {
  sectionOrder: DEFAULT_SECTION_ORDER,
  collapsedSections: [],
  columnVisibility: {
    host: true,
    type: true,
    program: true,
    stack: true,
    status: true,
    priority: true,
    findings: true,
  },
  density: 'confortável',
  panelWidthPct: 50,
  listCollapsed: false,
};

function readState(): AssetsUIState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_ASSETS_UI_STATE;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_ASSETS_UI_STATE,
      ...parsed,
      columnVisibility: { ...DEFAULT_ASSETS_UI_STATE.columnVisibility, ...parsed.columnVisibility },
    };
  } catch {
    return DEFAULT_ASSETS_UI_STATE;
  }
}

function writeState(state: AssetsUIState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // localStorage unavailable or quota exceeded
  }
}

export function useAssetsUIState() {
  const [state, setState] = useState<AssetsUIState>(DEFAULT_ASSETS_UI_STATE);

  useEffect(() => {
    // localStorage is only available client-side, so the persisted state
    // must be synced after mount rather than computed during render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState(readState());
  }, []);

  const update = (patch: Partial<AssetsUIState>) => {
    setState((current) => {
      const next = { ...current, ...patch };
      writeState(next);
      return next;
    });
  };

  return { state, update };
}
