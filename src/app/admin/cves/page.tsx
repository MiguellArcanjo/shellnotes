import AdminCvesManager from '@/components/admin/AdminCvesManager';

export default async function CVEsPage({
  searchParams,
}: {
  searchParams: Promise<{ new?: string; edit?: string }>;
}) {
  const query = await searchParams;
  if (query.new === '1') return <AdminCvesManager mode="new" />;
  if (query.edit) return <AdminCvesManager mode="edit" entryId={query.edit} />;
  return <AdminCvesManager mode="list" />;
}
