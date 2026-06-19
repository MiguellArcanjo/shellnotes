import { createClient } from './client';

function safeFileName(name: string) {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .toLowerCase();
}

export async function uploadContentFile(file: File, folder = 'uploads') {
  const supabase = createClient();
  const bucket = process.env.NEXT_PUBLIC_SUPABASE_CONTENT_BUCKET!;
  const path = `${folder}/${crypto.randomUUID()}-${safeFileName(file.name)}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: '3600',
    contentType: file.type || undefined,
  });
  if (error) throw error;
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

export async function uploadPrivateFile(file: File, folder = 'uploads') {
  const supabase = createClient();
  const bucket = process.env.NEXT_PUBLIC_SUPABASE_BOUNTY_BUCKET!;
  const path = `${folder}/${crypto.randomUUID()}-${safeFileName(file.name)}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: '3600',
    contentType: file.type || undefined,
  });
  if (error) throw error;
  return path;
}
