import { createClient } from './client';

export type PrivateCategory =
  | 'program'
  | 'asset'
  | 'finding'
  | 'lead'
  | 'report'
  | 'payout'
  | 'checklist';

export async function upsertPrivateEntry<T extends object>(
  category: PrivateCategory,
  entryKey: string,
  data: T,
) {
  const supabase = createClient();
  const { error } = await supabase.from('private_entries').upsert(
    {
      category,
      entry_key: entryKey,
      data,
    },
    { onConflict: 'category,entry_key' },
  );
  if (error) throw error;
}

export async function deletePrivateEntry(category: PrivateCategory, entryKey: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from('private_entries')
    .delete()
    .eq('category', category)
    .eq('entry_key', entryKey);
  if (error) throw error;
}

export async function listPrivateEntries<T>(
  category: PrivateCategory,
): Promise<{ entryKey: string; data: T }[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('private_entries')
    .select('entry_key,data')
    .eq('category', category)
    .order('updated_at', { ascending: false });
  if (error) return [];
  return (data ?? []).map((row) => ({
    entryKey: row.entry_key,
    data: row.data as T,
  }));
}
