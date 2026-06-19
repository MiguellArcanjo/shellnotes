import AdminWriteupsManager from '@/components/admin/AdminWriteupsManager';

export default async function WriteupsPage({
  searchParams,
}: {
  searchParams: Promise<{ new?: string; edit?: string }>;
}) {
  const query = await searchParams;

  if (query.new === '1') {
    return <AdminWriteupsManager mode="new" />;
  }

  if (query.edit) {
    return <AdminWriteupsManager mode="edit" slug={query.edit} />;
  }

  return <AdminWriteupsManager mode="list" />;
}
