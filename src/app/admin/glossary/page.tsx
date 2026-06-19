import AdminGlossaryManager from '@/components/admin/AdminGlossaryManager';

export default async function Page({ searchParams }: { searchParams: Promise<{ new?: string; edit?: string }> }) {
  const query = await searchParams;
  if (query.new === '1') return <AdminGlossaryManager mode="new" />;
  if (query.edit) return <AdminGlossaryManager mode="edit" entryKey={query.edit} />;
  return <AdminGlossaryManager mode="list" />;
}
