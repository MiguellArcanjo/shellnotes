import { createClient } from './client';

export type ContentType = 'writeup' | 'cheatsheet' | 'til' | 'glossary' | 'cve' | 'thm-room';

type ContentRow<T> = {
  slug: string;
  status: 'draft' | 'published';
  data: T;
};

export async function listContentEntries<T>(contentType: ContentType): Promise<ContentRow<T>[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('content_entries')
    .select('slug,status,data')
    .eq('content_type', contentType)
    .order('updated_at', { ascending: false });
  if (error) return [];
  return (data ?? []) as ContentRow<T>[];
}

export async function getContentEntry<T>(
  contentType: ContentType,
  slug: string,
): Promise<ContentRow<T> | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('content_entries')
    .select('slug,status,data')
    .eq('content_type', contentType)
    .eq('slug', slug)
    .maybeSingle();
  if (error) return null;
  return data as ContentRow<T> | null;
}

export async function upsertContentEntry<T extends object>(
  contentType: ContentType,
  slug: string,
  status: 'draft' | 'published',
  data: T,
) {
  const supabase = createClient();
  const { error } = await supabase.from('content_entries').upsert(
    {
      content_type: contentType,
      slug,
      status,
      data,
      published_at: status === 'published' ? new Date().toISOString() : null,
    },
    { onConflict: 'content_type,slug' },
  );
  if (error) throw error;
}

export async function deleteContentEntry(contentType: ContentType, slug: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from('content_entries')
    .delete()
    .eq('content_type', contentType)
    .eq('slug', slug);
  if (error) throw error;
}
