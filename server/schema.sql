create extension if not exists "pgcrypto";

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  post_url text unique,
  text text,
  likes int,
  comments int,
  shares int,
  viral_score float,
  posted_at timestamp,
  fetched_at timestamp default now(),
  query_used text,
  platform text default 'linkedin'
);

create index if not exists posts_posted_at_idx on public.posts (posted_at desc);
create index if not exists posts_viral_score_idx on public.posts (viral_score desc);
