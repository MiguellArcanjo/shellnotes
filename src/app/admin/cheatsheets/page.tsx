import AdminCheatsheetsManager from '@/components/admin/AdminCheatsheetsManager';

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ new?: string; edit?: string }>;
}) {
  const query = await searchParams;
  if (query.new === '1') return <AdminCheatsheetsManager mode="new" />;
  if (query.edit) return <AdminCheatsheetsManager mode="edit" slug={query.edit} />;
  return <AdminCheatsheetsManager mode="list" />;
}
