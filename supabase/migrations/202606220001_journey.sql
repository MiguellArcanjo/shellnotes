-- shellnotes: private personal journey (questions, library, certificates and projects).

alter table public.private_entries
  drop constraint if exists private_entries_category_check;

alter table public.private_entries
  add constraint private_entries_category_check check (
    category in (
      'program', 'asset', 'finding', 'lead', 'report',
      'payout', 'checklist',
      'study-note', 'study-plan', 'study-session',
      'journey'
    )
  );
