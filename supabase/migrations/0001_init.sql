-- anyone-tasks initial schema
-- Run this in the Supabase SQL editor after creating the project.

create extension if not exists "pgcrypto";

-- Enums
do $$ begin
  create type request_status as enum ('pending', 'in_progress', 'completed', 'rejected', 'info_provided');
exception when duplicate_object then null; end $$;

do $$ begin
  create type request_type as enum ('feature', 'bug', 'question', 'info');
exception when duplicate_object then null; end $$;

-- Requests
create table if not exists public.requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Who submitted
  submitted_by_email text not null,
  submitted_by_name text,

  -- Content
  project text not null,
  title text not null,
  request text not null,
  context text,
  files jsonb not null default '[]'::jsonb,
  type request_type not null default 'feature',

  -- Scores (1=low, 5=high)
  complexity_score smallint check (complexity_score between 1 and 5),
  criticality_score smallint check (criticality_score between 1 and 5),
  urgency_score smallint check (urgency_score between 1 and 5),
  complexity_reason text,
  criticality_reason text,
  urgency_reason text,

  -- Safety
  safety_notes text,

  -- Digest the dev's Claude can use
  digest text,

  -- Status + response
  status request_status not null default 'pending',
  response text,
  response_at timestamptz,
  responded_by_email text
);

create index if not exists requests_status_idx on public.requests(status);
create index if not exists requests_urgency_idx on public.requests(urgency_score desc);
create index if not exists requests_project_idx on public.requests(project);
create index if not exists requests_created_at_idx on public.requests(created_at desc);

-- Updated_at trigger
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists requests_set_updated_at on public.requests;
create trigger requests_set_updated_at
  before update on public.requests
  for each row execute function public.set_updated_at();

-- API tokens used by the MCP server.
-- We store sha256 of the token; we never store the plaintext.
create table if not exists public.api_tokens (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  last_used_at timestamptz,
  revoked_at timestamptz,
  user_email text not null,
  user_name text,
  label text,
  token_hash text not null unique
);

create index if not exists api_tokens_active_idx on public.api_tokens(token_hash) where revoked_at is null;

-- Row Level Security
alter table public.requests enable row level security;
alter table public.api_tokens enable row level security;

-- Dashboard policies: authenticated users can do everything.
-- We gate which emails can sign in at the app level via ALLOWED_EMAILS.
drop policy if exists "requests_select_authed" on public.requests;
create policy "requests_select_authed" on public.requests
  for select to authenticated using (true);

drop policy if exists "requests_update_authed" on public.requests;
create policy "requests_update_authed" on public.requests
  for update to authenticated using (true) with check (true);

drop policy if exists "requests_insert_authed" on public.requests;
create policy "requests_insert_authed" on public.requests
  for insert to authenticated with check (true);

-- API tokens are only accessible to the service role.
-- No policies for anon/authenticated => no access from the client.
