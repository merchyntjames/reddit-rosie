-- Reddit Rosie — Supabase schema
-- Exported 2026-08-21 from the production Merchynt project via introspection.
-- Run this in a NEW Supabase project's SQL editor (or via `apply_migration`)
-- when standing up a client fork.
--
-- IMPORTANT for client forks:
--   1. Edit restrict_email_domain() below — it is hard-coded to the allowed
--      login email domain (@merchynt.com in the original).
--   2. Review the RLS policies before going live. Several anon policies are
--      intentionally wide open (public read/update) from the pre-auth era of
--      the app; tighten them if the client fork holds anything sensitive.

-- ---------------------------------------------------------------------------
-- Functions
-- ---------------------------------------------------------------------------

create or replace function public.update_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- CHANGE THE DOMAIN below for each client fork.
create or replace function public.restrict_email_domain()
returns trigger
language plpgsql
security definer
as $$
begin
  if new.email is not null and new.email not like '%@merchynt.com' then
    raise exception 'Only @merchynt.com email addresses are allowed';
  end if;
  return new;
end;
$$;

-- Attach the domain restriction to auth signups.
-- (Supabase: triggers on auth.users must be created by the postgres role;
-- run this in the SQL editor.)
drop trigger if exists restrict_email_domain_trigger on auth.users;
create trigger restrict_email_domain_trigger
  before insert or update on auth.users
  for each row execute function public.restrict_email_domain();

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create sequence if not exists public.conversations_display_id_seq;

create table public.conversations (
  id text primary key,
  subreddit text not null,
  title text not null,
  selftext text default ''::text,
  author_username text not null,
  permalink text not null,
  url text default ''::text,
  score integer default 0,
  comments_count integer default 0,
  relevance_score integer not null,
  matched_keywords text[] default '{}'::text[],
  search_type text default 'narrow'::text,
  search_label text default ''::text,
  status text not null default 'new'::text,
  corporate_draft text default ''::text,
  personal_draft text default ''::text,
  discovered_at timestamptz not null,
  first_seen_at timestamptz not null default now(),
  status_changed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  display_id integer not null default nextval('public.conversations_display_id_seq')
);

alter sequence public.conversations_display_id_seq owned by public.conversations.display_id;

create table public.settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

create table public.scan_history (
  id bigint generated always as identity primary key,
  source text not null default 'reddit-rss'::text,
  total_fetched integer not null default 0,
  total_queries integer not null default 0,
  quality_posts integer not null default 0,
  filtered_out integer not null default 0,
  new_posts integer not null default 0,
  status text not null default 'success'::text,
  error_message text,
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

create table public.activity_log (
  id bigint generated always as identity primary key,
  action text not null,
  conversation_id text references public.conversations(id),
  subreddit text,
  post_title text,
  details text,
  created_at timestamptz not null default now(),
  user_id uuid references auth.users(id),
  user_email text
);

create table public.user_conversation_statuses (
  user_id uuid not null references auth.users(id),
  conversation_id text not null references public.conversations(id),
  status text not null default 'new'::text,
  status_changed_at timestamptz not null default now(),
  primary key (user_id, conversation_id)
);

create table public.dismiss_feedback (
  id bigint generated always as identity primary key,
  conversation_id text references public.conversations(id),
  reason text not null,
  custom_feedback text,
  created_at timestamptz not null default now()
);

create table public.conversation_drafts (
  id bigint generated always as identity primary key,
  conversation_id text not null references public.conversations(id),
  draft_type text not null,
  creator_id text,
  creator_name text,
  content text not null,
  version integer not null default 1,
  reroll_feedback text,
  created_at timestamptz not null default now()
);

create table public.training_submissions (
  id bigint generated always as identity primary key,
  conversation_id text references public.conversations(id),
  draft_type text not null,
  creator_id text,
  original_draft text not null,
  rewritten_draft text not null,
  created_at timestamptz not null default now()
);

create table public.api_usage (
  id bigint generated always as identity primary key,
  call_type text not null,
  conversation_id text references public.conversations(id),
  model text not null,
  input_tokens integer not null default 0,
  output_tokens integer not null default 0,
  web_search_requests integer not null default 0,
  input_cost numeric not null default 0,
  output_cost numeric not null default 0,
  search_cost numeric not null default 0,
  total_cost numeric not null default 0,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------

create trigger conversations_updated_at
  before update on public.conversations
  for each row execute function public.update_updated_at();

create trigger settings_updated_at
  before update on public.settings
  for each row execute function public.update_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.conversations enable row level security;
alter table public.settings enable row level security;
alter table public.scan_history enable row level security;
alter table public.activity_log enable row level security;
alter table public.user_conversation_statuses enable row level security;
alter table public.dismiss_feedback enable row level security;
alter table public.conversation_drafts enable row level security;
alter table public.training_submissions enable row level security;
alter table public.api_usage enable row level security;

-- conversations
create policy "Allow public read access to conversations" on public.conversations for select to anon using (true);
create policy "Allow public status updates on conversations" on public.conversations for update to anon using (true) with check (true);
create policy "Authenticated users can read conversations" on public.conversations for select to authenticated using (true);

-- settings
create policy "Allow public read access to settings" on public.settings for select to anon using (true);
create policy "Allow public update settings" on public.settings for update to anon using (true) with check (true);
create policy "Authenticated users can read settings" on public.settings for select to authenticated using (true);
create policy "Authenticated users can update settings" on public.settings for update to authenticated using (true) with check (true);

-- scan_history
create policy "Allow public read access to scan_history" on public.scan_history for select to anon using (true);
create policy "Authenticated users can read scan_history" on public.scan_history for select to authenticated using (true);

-- activity_log
create policy "Allow public insert to activity_log" on public.activity_log for insert to anon with check (true);
create policy "Allow public read access to activity_log" on public.activity_log for select to anon using (true);
create policy "Authenticated users can insert activity_log" on public.activity_log for insert to authenticated with check (true);
create policy "Authenticated users can read activity_log" on public.activity_log for select to authenticated using (true);

-- user_conversation_statuses
create policy "Anon can insert statuses" on public.user_conversation_statuses for insert to anon with check (true);
create policy "Anon can read all statuses" on public.user_conversation_statuses for select to anon using (true);
create policy "Anon can update statuses" on public.user_conversation_statuses for update to anon using (true) with check (true);
create policy "Users can insert own statuses" on public.user_conversation_statuses for insert to authenticated with check (auth.uid() = user_id);
create policy "Users can read own statuses" on public.user_conversation_statuses for select to authenticated using (auth.uid() = user_id);
create policy "Users can update own statuses" on public.user_conversation_statuses for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- dismiss_feedback
create policy "Allow public insert dismiss_feedback" on public.dismiss_feedback for insert to anon with check (true);
create policy "Allow public read dismiss_feedback" on public.dismiss_feedback for select to anon using (true);
create policy "Allow authenticated insert dismiss_feedback" on public.dismiss_feedback for insert to authenticated with check (true);
create policy "Allow authenticated read dismiss_feedback" on public.dismiss_feedback for select to authenticated using (true);

-- conversation_drafts
create policy "Allow all insert drafts" on public.conversation_drafts for insert to anon with check (true);
create policy "Allow all read drafts" on public.conversation_drafts for select to anon using (true);
create policy "Allow all update drafts" on public.conversation_drafts for update to anon using (true) with check (true);
create policy "Auth insert drafts" on public.conversation_drafts for insert to authenticated with check (true);
create policy "Auth read drafts" on public.conversation_drafts for select to authenticated using (true);
create policy "Auth update drafts" on public.conversation_drafts for update to authenticated using (true) with check (true);

-- training_submissions
create policy "Allow all insert training" on public.training_submissions for insert to anon with check (true);
create policy "Allow all read training" on public.training_submissions for select to anon using (true);
create policy "Auth insert training" on public.training_submissions for insert to authenticated with check (true);
create policy "Auth read training" on public.training_submissions for select to authenticated using (true);

-- api_usage
create policy "Allow all insert usage" on public.api_usage for insert to anon with check (true);
create policy "Allow all read usage" on public.api_usage for select to anon using (true);
create policy "Auth insert usage" on public.api_usage for insert to authenticated with check (true);
create policy "Auth read usage" on public.api_usage for select to authenticated using (true);
