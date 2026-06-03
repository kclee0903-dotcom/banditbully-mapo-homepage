-- Bandibuli customer reviews: table, RLS policies, and Storage policies.
-- Run this SQL in the Supabase SQL editor after creating a project.

create extension if not exists pgcrypto;

create or replace function public.is_review_admin()
returns boolean
language sql
stable
as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean, false)
      or coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false);
$$;

create or replace function public.request_header(header_name text)
returns text
language plpgsql
stable
as $$
begin
  return coalesce(current_setting('request.headers', true)::jsonb ->> header_name, '');
exception when others then
  return '';
end;
$$;

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  nickname text not null check (char_length(trim(nickname)) between 1 and 30),
  site_type text not null check (site_type in ('신축 아파트', '구축 올수리', '새가구 반입', '인테리어 후 냄새', '대형시설', '기타')),
  rating integer not null check (rating between 1 and 5),
  review_text text not null check (char_length(trim(review_text)) >= 20),
  image_url text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'hidden', 'rejected')),
  confirm_token text not null default encode(gen_random_bytes(32), 'hex'),
  consent_agreed boolean not null default false,
  display_date date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  approved_at timestamptz
);

create index if not exists reviews_public_status_date_idx on public.reviews (status, display_date desc, created_at desc);
create index if not exists reviews_confirm_lookup_idx on public.reviews (id, confirm_token);

create or replace function public.set_reviews_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  if new.status = 'approved' and old.status is distinct from 'approved' and new.approved_at is null then
    new.approved_at = now();
  end if;
  return new;
end;
$$;

drop trigger if exists reviews_set_updated_at on public.reviews;
create trigger reviews_set_updated_at
before update on public.reviews
for each row execute function public.set_reviews_updated_at();

alter table public.reviews enable row level security;

revoke all on public.reviews from anon, authenticated;
grant select, insert on public.reviews to anon, authenticated;
grant update, delete on public.reviews to authenticated;

drop policy if exists "Public can read approved reviews or matching confirm token" on public.reviews;
create policy "Public can read approved reviews or matching confirm token"
on public.reviews
for select
to anon, authenticated
using (
  status = 'approved'
  or confirm_token = public.request_header('x-confirm-token')
  or public.is_review_admin()
);

drop policy if exists "Public can submit pending reviews" on public.reviews;
create policy "Public can submit pending reviews"
on public.reviews
for insert
to anon, authenticated
with check (
  status = 'pending'
  and consent_agreed = true
  and rating between 1 and 5
  and site_type in ('신축 아파트', '구축 올수리', '새가구 반입', '인테리어 후 냄새', '대형시설', '기타')
  and char_length(trim(nickname)) between 1 and 30
  and char_length(trim(review_text)) >= 20
);

drop policy if exists "Review admins can manage every review" on public.reviews;
create policy "Review admins can manage every review"
on public.reviews
for all
to authenticated
using (public.is_review_admin())
with check (public.is_review_admin());

-- Storage bucket. If you prefer the dashboard, create a public bucket named review-images.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'review-images',
  'review-images',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can read review images" on storage.objects;
create policy "Public can read review images"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'review-images');

drop policy if exists "Public can upload safe review images" on storage.objects;
create policy "Public can upload safe review images"
on storage.objects
for insert
to anon, authenticated
with check (
  bucket_id = 'review-images'
  and lower(storage.extension(name)) in ('jpg', 'jpeg', 'png', 'webp', 'gif')
);

drop policy if exists "Review admins can manage review images" on storage.objects;
create policy "Review admins can manage review images"
on storage.objects
for all
to authenticated
using (bucket_id = 'review-images' and public.is_review_admin())
with check (bucket_id = 'review-images' and public.is_review_admin());
