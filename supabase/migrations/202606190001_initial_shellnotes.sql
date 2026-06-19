-- shellnotes: database, authorization and storage foundation

create extension if not exists pgcrypto;

create table if not exists public.app_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.app_admins enable row level security;

create or replace function public.is_shellnotes_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.app_admins
    where user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_shellnotes_admin() from public;
grant execute on function public.is_shellnotes_admin() to anon, authenticated;

create table if not exists public.content_entries (
  id uuid primary key default gen_random_uuid(),
  content_type text not null check (
    content_type in ('writeup', 'cheatsheet', 'til', 'glossary', 'cve')
  ),
  slug text not null,
  status text not null default 'draft' check (status in ('draft', 'published')),
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz,
  unique (content_type, slug)
);

create index if not exists content_entries_type_status_idx
  on public.content_entries (content_type, status);
create index if not exists content_entries_updated_idx
  on public.content_entries (updated_at desc);
create index if not exists content_entries_data_gin_idx
  on public.content_entries using gin (data);

alter table public.content_entries enable row level security;

drop policy if exists "published content is public" on public.content_entries;
create policy "published content is public"
on public.content_entries for select
to anon, authenticated
using (status = 'published' or public.is_shellnotes_admin());

drop policy if exists "admins create content" on public.content_entries;
create policy "admins create content"
on public.content_entries for insert
to authenticated
with check (public.is_shellnotes_admin());

drop policy if exists "admins update content" on public.content_entries;
create policy "admins update content"
on public.content_entries for update
to authenticated
using (public.is_shellnotes_admin())
with check (public.is_shellnotes_admin());

drop policy if exists "admins delete content" on public.content_entries;
create policy "admins delete content"
on public.content_entries for delete
to authenticated
using (public.is_shellnotes_admin());

create table if not exists public.private_entries (
  id uuid primary key default gen_random_uuid(),
  category text not null check (
    category in (
      'program', 'asset', 'finding', 'lead', 'report',
      'payout', 'checklist'
    )
  ),
  entry_key text not null,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (category, entry_key)
);

create index if not exists private_entries_category_idx
  on public.private_entries (category, updated_at desc);

alter table public.private_entries enable row level security;

drop policy if exists "admins manage private entries" on public.private_entries;
create policy "admins manage private entries"
on public.private_entries for all
to authenticated
using (public.is_shellnotes_admin())
with check (public.is_shellnotes_admin());

create table if not exists public.site_settings (
  setting_key text primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.site_settings enable row level security;

drop policy if exists "site settings are public" on public.site_settings;
create policy "site settings are public"
on public.site_settings for select
to anon, authenticated
using (true);

drop policy if exists "admins manage site settings" on public.site_settings;
create policy "admins manage site settings"
on public.site_settings for all
to authenticated
using (public.is_shellnotes_admin())
with check (public.is_shellnotes_admin());

insert into public.site_settings (setting_key, data)
values (
  'general',
  jsonb_build_object(
    'tagline', 'notas de campo sobre segurança ofensiva',
    'githubUrl', '#',
    'linkedinUrl', '#',
    'rssUrl', '#'
  )
)
on conflict (setting_key) do nothing;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists content_entries_set_updated_at on public.content_entries;
create trigger content_entries_set_updated_at
before update on public.content_entries
for each row execute function public.set_updated_at();

drop trigger if exists private_entries_set_updated_at on public.private_entries;
create trigger private_entries_set_updated_at
before update on public.private_entries
for each row execute function public.set_updated_at();

drop trigger if exists site_settings_set_updated_at on public.site_settings;
create trigger site_settings_set_updated_at
before update on public.site_settings
for each row execute function public.set_updated_at();

-- Register the single owner if this Auth user already exists.
insert into public.app_admins (user_id)
select id
from auth.users
where lower(email) = lower('contato.miguelarcanjo2305@gmail.com')
on conflict (user_id) do nothing;

-- Automatically register this owner if the Auth user is created later.
create or replace function public.register_shellnotes_owner()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if lower(new.email) = lower('contato.miguelarcanjo2305@gmail.com') then
    insert into public.app_admins (user_id)
    values (new.id)
    on conflict (user_id) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists register_shellnotes_owner_after_signup on auth.users;
create trigger register_shellnotes_owner_after_signup
after insert or update of email on auth.users
for each row execute function public.register_shellnotes_owner();

insert into storage.buckets (id, name, public)
values
  ('content-media', 'content-media', true),
  ('bounty-files', 'bounty-files', false)
on conflict (id) do update set public = excluded.public;

drop policy if exists "public reads content media" on storage.objects;
create policy "public reads content media"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'content-media');

drop policy if exists "admins upload content media" on storage.objects;
create policy "admins upload content media"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'content-media'
  and public.is_shellnotes_admin()
);

drop policy if exists "admins update content media" on storage.objects;
create policy "admins update content media"
on storage.objects for update
to authenticated
using (
  bucket_id = 'content-media'
  and public.is_shellnotes_admin()
)
with check (
  bucket_id = 'content-media'
  and public.is_shellnotes_admin()
);

drop policy if exists "admins delete content media" on storage.objects;
create policy "admins delete content media"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'content-media'
  and public.is_shellnotes_admin()
);

drop policy if exists "admins manage bounty files" on storage.objects;
create policy "admins manage bounty files"
on storage.objects for all
to authenticated
using (
  bucket_id = 'bounty-files'
  and public.is_shellnotes_admin()
)
with check (
  bucket_id = 'bounty-files'
  and public.is_shellnotes_admin()
);
