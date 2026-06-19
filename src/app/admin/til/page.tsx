import AdminTilManager from '@/components/admin/AdminTilManager';

export default async function Page({ searchParams }: { searchParams: Promise<{ new?: string; edit?: string }> }) {
  const query = await searchParams;
  if (query.new === '1') return <AdminTilManager mode="new" />;
  if (query.edit) return <AdminTilManager mode="edit" entryKey={query.edit} />;
  return <AdminTilManager mode="list" />;
}
