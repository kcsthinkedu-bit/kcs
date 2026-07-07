-- Book Helper / KCSedutech common-account Supabase schema
-- Apply in the Supabase SQL Editor for the corporate KCSedutech project.
--
-- This script creates only book-editor-owned tables.
-- It does NOT create separate book_teachers or book_classes tables.
-- Common account, organization, class, student, entitlement data should stay in:
--   auth.users
--   profiles or user_settings
--   organizations / academies / schools
--   organization_members / academy_members
--   class_groups
--   students
--   service_entitlements

create extension if not exists pgcrypto;

create table if not exists public.book_projects (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid references auth.users(id) on delete set null,
  organization_id uuid,
  class_group_id uuid,
  student_id uuid,
  service_key text not null default 'book_editor',
  book_type text not null default 'coloringbook'
    check (book_type in ('coloringbook', 'picturebook', 'storybook', 'worksheet')),
  title text not null default '',
  description text not null default '',
  paper text not null default 'A4',
  status text not null default 'draft'
    check (status in ('draft', 'submitted', 'reviewed', 'archived')),
  settings jsonb not null default '{}'::jsonb,
  project_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.book_assets (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.book_projects(id) on delete cascade,
  owner_user_id uuid references auth.users(id) on delete set null,
  asset_type text not null default 'image'
    check (asset_type in ('image', 'cover_image', 'page_image', 'attachment')),
  storage_provider text not null default 'vercel_blob',
  storage_path text not null default '',
  public_url text not null default '',
  mime_type text not null default '',
  file_size bigint not null default 0,
  width integer,
  height integer,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.book_pages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.book_projects(id) on delete cascade,
  page_index integer not null,
  spread_index integer,
  side text not null default 'right'
    check (side in ('left', 'right', 'single')),
  page_role text not null default 'content'
    check (page_role in ('front_cover', 'back_cover', 'inside_cover', 'content', 'blank', 'auto_summary')),
  title text not null default '',
  body_text text not null default '',
  image_asset_id uuid references public.book_assets(id) on delete set null,
  layout_json jsonb not null default '{}'::jsonb,
  page_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.book_templates (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid references auth.users(id) on delete set null,
  organization_id uuid,
  service_key text not null default 'book_editor',
  template_key text not null default '',
  name text not null default '',
  visibility text not null default 'system'
    check (visibility in ('system', 'organization', 'private')),
  book_type text not null default 'coloringbook'
    check (book_type in ('coloringbook', 'picturebook', 'storybook', 'worksheet')),
  template_json jsonb not null default '{}'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.book_exports (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.book_projects(id) on delete cascade,
  requested_by_user_id uuid references auth.users(id) on delete set null,
  export_type text not null default 'print'
    check (export_type in ('print', 'pdf', 'json')),
  paper text not null default 'A4',
  status text not null default 'ready'
    check (status in ('queued', 'ready', 'failed', 'expired')),
  file_url text not null default '',
  export_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.book_submissions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.book_projects(id) on delete set null,
  owner_user_id uuid references auth.users(id) on delete set null,
  organization_id uuid,
  class_group_id uuid,
  student_id uuid,
  service_key text not null default 'book_editor',
  kind text not null default 'submission'
    check (kind in ('submission', 'review')),
  teacher_id text not null default '',
  teacher_name text not null default '',
  class_code text not null default '',
  submission_code text not null default '',
  school_name text not null default '',
  class_name text not null default '',
  student_name text not null default '',
  student_number text not null default '',
  title text not null default '',
  paper text not null default 'A4',
  spread_count integer not null default 0,
  source_url text not null default '',
  legacy_pathname text not null default '',
  legacy_url text not null default '',
  book_json jsonb not null default '{}'::jsonb,
  submitted_at timestamptz,
  saved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- If an older draft schema was already applied, add the new common-reference
-- columns without requiring a destructive rebuild.
alter table public.book_submissions add column if not exists project_id uuid;
alter table public.book_submissions add column if not exists owner_user_id uuid;
alter table public.book_submissions add column if not exists organization_id uuid;
alter table public.book_submissions add column if not exists class_group_id uuid;
alter table public.book_submissions add column if not exists student_id uuid;
alter table public.book_submissions add column if not exists service_key text not null default 'book_editor';
alter table public.book_submissions add column if not exists source_url text not null default '';
alter table public.book_submissions add column if not exists legacy_pathname text not null default '';
alter table public.book_submissions add column if not exists legacy_url text not null default '';

create index if not exists book_projects_owner_idx
  on public.book_projects (owner_user_id, created_at desc);

create index if not exists book_projects_class_group_idx
  on public.book_projects (organization_id, class_group_id, created_at desc);

create unique index if not exists book_pages_project_page_uidx
  on public.book_pages (project_id, page_index);

create index if not exists book_assets_project_idx
  on public.book_assets (project_id, created_at desc);

create index if not exists book_templates_lookup_idx
  on public.book_templates (service_key, visibility, active, created_at desc);

create index if not exists book_exports_project_idx
  on public.book_exports (project_id, created_at desc);

create index if not exists book_submissions_project_idx
  on public.book_submissions (project_id, created_at desc);

create index if not exists book_submissions_owner_idx
  on public.book_submissions (owner_user_id, created_at desc);

create index if not exists book_submissions_class_group_idx
  on public.book_submissions (organization_id, class_group_id, created_at desc);

create index if not exists book_submissions_student_idx
  on public.book_submissions (student_id, created_at desc);

create index if not exists book_submissions_legacy_teacher_idx
  on public.book_submissions (teacher_id, created_at desc);

create index if not exists book_submissions_legacy_class_code_idx
  on public.book_submissions (class_code, created_at desc);

create unique index if not exists book_submissions_legacy_pathname_uidx
  on public.book_submissions (legacy_pathname)
  where legacy_pathname <> '';

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_book_projects_updated_at on public.book_projects;
create trigger set_book_projects_updated_at
before update on public.book_projects
for each row execute function public.set_updated_at();

drop trigger if exists set_book_assets_updated_at on public.book_assets;
create trigger set_book_assets_updated_at
before update on public.book_assets
for each row execute function public.set_updated_at();

drop trigger if exists set_book_pages_updated_at on public.book_pages;
create trigger set_book_pages_updated_at
before update on public.book_pages
for each row execute function public.set_updated_at();

drop trigger if exists set_book_templates_updated_at on public.book_templates;
create trigger set_book_templates_updated_at
before update on public.book_templates
for each row execute function public.set_updated_at();

drop trigger if exists set_book_exports_updated_at on public.book_exports;
create trigger set_book_exports_updated_at
before update on public.book_exports
for each row execute function public.set_updated_at();

drop trigger if exists set_book_submissions_updated_at on public.book_submissions;
create trigger set_book_submissions_updated_at
before update on public.book_submissions
for each row execute function public.set_updated_at();

alter table public.book_projects enable row level security;
alter table public.book_assets enable row level security;
alter table public.book_pages enable row level security;
alter table public.book_templates enable row level security;
alter table public.book_exports enable row level security;
alter table public.book_submissions enable row level security;

-- The current Vercel API reads/writes with the service role key.
-- Browser clients should not read these tables directly until common Auth and
-- per-service RLS policies are finalized.
revoke all on public.book_projects from anon, authenticated;
revoke all on public.book_assets from anon, authenticated;
revoke all on public.book_pages from anon, authenticated;
revoke all on public.book_templates from anon, authenticated;
revoke all on public.book_exports from anon, authenticated;
revoke all on public.book_submissions from anon, authenticated;

comment on table public.book_projects is
  'Book editor project records. Account, organization, class, student, and service entitlement records remain in the KCSedutech common schema.';

comment on column public.book_projects.owner_user_id is
  'Common auth.users.id for the teacher or creator who owns this project.';

comment on column public.book_projects.organization_id is
  'Common organization/academy/school id. Add the final FK after confirming the exact shared table name.';

comment on column public.book_projects.class_group_id is
  'Common class_groups.id. Add the final FK after confirming the exact shared table name.';

comment on column public.book_projects.student_id is
  'Common students.id when this project is attached to a student.';

-- Optional FK examples after the common table names are confirmed:
-- alter table public.book_projects
--   add constraint book_projects_organization_id_fkey
--   foreign key (organization_id) references public.organizations(id) on delete set null;
-- alter table public.book_projects
--   add constraint book_projects_class_group_id_fkey
--   foreign key (class_group_id) references public.class_groups(id) on delete set null;
-- alter table public.book_projects
--   add constraint book_projects_student_id_fkey
--   foreign key (student_id) references public.students(id) on delete set null;
