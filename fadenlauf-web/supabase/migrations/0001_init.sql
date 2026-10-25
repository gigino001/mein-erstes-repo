-- Fadenlauf: ein Dokument-Speicher pro Person, geschützt durch Row-Level-Security.
create table if not exists public.docs (
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  col        text not null,
  id         text not null,
  data       jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, col, id)
);
create index if not exists docs_col_idx on public.docs (user_id, col, created_at desc);

alter table public.docs enable row level security;
create policy "docs: nur eigene Zeilen lesen"   on public.docs for select using (user_id = auth.uid());
create policy "docs: nur eigene Zeilen anlegen" on public.docs for insert with check (user_id = auth.uid());
create policy "docs: nur eigene Zeilen ändern"  on public.docs for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "docs: nur eigene Zeilen löschen" on public.docs for delete using (user_id = auth.uid());

-- Felder atomar zusammenführen (ersetzt „erst null setzen, dann neu schreiben“).
create or replace function public.patch_doc(p_col text, p_id text, p_patch jsonb) returns void
language sql security invoker as $$
  update public.docs set data = data || p_patch, updated_at = now()
  where user_id = auth.uid() and col = p_col and id = p_id;
$$;

-- Löscht wirklich alles dieser Person (auch Zeilen, die nie in der App geladen waren).
create or replace function public.wipe_me() returns void
language sql security invoker as $$ delete from public.docs where user_id = auth.uid(); $$;

-- Tageslimit für KI-Aufrufe (schützt das kostenlose Kontingent).
create table if not exists public.ai_usage (
  user_id uuid not null references auth.users (id) on delete cascade,
  day     date not null default current_date,
  n       int  not null default 0,
  primary key (user_id, day)
);
alter table public.ai_usage enable row level security; -- keine Policy: nur die Edge-Function (service role) darf schreiben

-- Privater Bildspeicher; jede Person sieht nur ihren Ordner.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('images', 'images', false, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;
create policy "images: eigener Ordner lesen"   on storage.objects for select using (bucket_id = 'images' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "images: eigener Ordner anlegen" on storage.objects for insert with check (bucket_id = 'images' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "images: eigener Ordner löschen" on storage.objects for delete using (bucket_id = 'images' and (storage.foldername(name))[1] = auth.uid()::text);
