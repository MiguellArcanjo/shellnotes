import { listPrivateEntries, type PrivateCategory } from './private';

const STORE_KEYS: Partial<Record<PrivateCategory, string>> = {
  program: 'shellnotes-program-overrides',
  asset: 'shellnotes-asset-overrides-v2',
  finding: 'shellnotes-finding-overrides',
  report: 'shellnotes-report-overrides',
  payout: 'shellnotes-payout-overrides',
  checklist: 'shellnotes-checklist-overrides',
};

export async function hydratePrivateCache() {
  const categories: PrivateCategory[] = [
    'program',
    'asset',
    'finding',
    'lead',
    'report',
    'payout',
    'checklist',
  ];

  await Promise.all(
    categories.map(async (category) => {
      const rows = await listPrivateEntries<Record<string, unknown>>(category);
      if (category === 'lead') {
        localStorage.setItem(
          'shellnotes-bounty-leads',
          JSON.stringify(rows.map((row) => ({ ...row.data, id: row.entryKey }))),
        );
        return;
      }

      const storageKey = STORE_KEYS[category];
      if (!storageKey) return;
      localStorage.setItem(
        storageKey,
        JSON.stringify(
          Object.fromEntries(
            rows.map((row) => {
              const data = { ...row.data };
              delete data.id;
              return [row.entryKey, data];
            }),
          ),
        ),
      );
    }),
  );
}
