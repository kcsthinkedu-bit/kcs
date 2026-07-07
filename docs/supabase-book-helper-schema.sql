-- Book Helper / Coloringbook Supabase schema
-- Apply in the Supabase SQL Editor for the corporate KCSedutech project.

create extension if not exists pgcrypto;

create table if not exists public.book_teachers (
  teacher_id text primary key,
  name text not null,
  email text not null unique,
  email_hash text not null unique,
  school_name text default '',
  password_hash jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.book_classes (
  code text primary key,
  teacher_id text not null references public.book_teachers(teacher_id) on delete cascade,
  teacher_name text default '',
  teacher_email text default '',
  school_name text default '',
  class_name text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.book_submissions (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('submission', 'review')),
  teacher_id text default '',
  teacher_name text default '',
  class_code text default '',
  submission_code text default '',
  school_name text default '',
  class_name text default '',
  student_name text default '',
  student_number text default '',
  title text default '',
  paper text default 'A4',
  spread_count integer not null default 0,
  source_url text default '',
  book_json jsonb not null,
  submitted_at timestamptz,
  saved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists book_classes_teacher_id_idx
  on public.book_classes (teacher_id, created_at desc);

create index if not exists book_submissions_teacher_id_idx
  on public.book_submissions (teacher_id, created_at desc);

create index if not exists book_submissions_class_code_idx
  on public.book_submissions (class_code, created_at desc);

create index if not exists book_submissions_student_idx
  on public.book_submissions (teacher_id, class_code, student_name, student_number);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_book_teachers_updated_at on public.book_teachers;
create trigger set_book_teachers_updated_at
before update on public.book_teachers
for each row execute function public.set_updated_at();

drop trigger if exists set_book_classes_updated_at on public.book_classes;
create trigger set_book_classes_updated_at
before update on public.book_classes
for each row execute function public.set_updated_at();

drop trigger if exists set_book_submissions_updated_at on public.book_submissions;
create trigger set_book_submissions_updated_at
before update on public.book_submissions
for each row execute function public.set_updated_at();

alter table public.book_teachers enable row level security;
alter table public.book_classes enable row level security;
alter table public.book_submissions enable row level security;

-- The Vercel API reads/writes with the service role key.
-- Browser clients should not read these tables directly.
revoke all on public.book_teachers from anon, authenticated;
revoke all on public.book_classes from anon, authenticated;
revoke all on public.book_submissions from anon, authenticated;
