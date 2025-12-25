-- Minimal schema for the API.
-- Note: you can replace "users" with auth.users if you're using Supabase Auth.

-- Needed for gen_random_uuid() on older/newer Postgres setups.
create extension if not exists "pgcrypto";

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  email text unique,
  google_sub text unique,
  name text,
  picture text,
  created_at timestamptz not null default now()
);

create table if not exists public.user_google_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  refresh_token_enc text not null,
  scopes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id)
);

create table if not exists public.forms (
  id uuid primary key default gen_random_uuid(),
  google_form_id text not null,
  google_form_url text not null,
  edit_url text,
  responder_url text,
  archived boolean not null default false,
  title text,
  description text,
  prompt text,
  form_type text,
  audience text,
  language text,
  tone text,
  created_at timestamptz not null default now(),
  created_by text not null,
  user_id uuid references public.users(id)
);

create index if not exists forms_google_form_id_idx on public.forms (google_form_id);
create index if not exists forms_created_by_idx on public.forms (created_by);
create index if not exists forms_user_id_idx on public.forms (user_id);

create table if not exists public.form_questions (
  id uuid primary key default gen_random_uuid(),
  form_id uuid not null references public.forms(id) on delete cascade,
  question_order int not null,
  ai_question_id text,
  title text not null,
  type text not null,
  required boolean not null default false,
  validation jsonb,
  created_at timestamptz not null default now(),
  created_by text not null
);

create index if not exists form_questions_form_id_idx on public.form_questions (form_id);
