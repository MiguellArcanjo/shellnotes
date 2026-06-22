-- shellnotes: study notebook (TryHackMe) — private, owner-only persistence.
--
-- The study notebook stores its data in private_entries (owner-only via RLS),
-- not in content_entries (which is publicly readable). This migration widens
-- the category CHECK constraint to allow the three new study categories.
--
-- Apply with the Supabase SQL editor or `supabase db push`.

alter table public.private_entries
  drop constraint if exists private_entries_category_check;

alter table public.private_entries
  add constraint private_entries_category_check check (
    category in (
      'program', 'asset', 'finding', 'lead', 'report',
      'payout', 'checklist',
      'study-note', 'study-plan', 'study-session'
    )
  );
