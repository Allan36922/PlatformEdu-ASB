-- ============================================================================
-- 0001_init.sql
-- Esquema base de la plataforma EdTech: enums, tablas e índices.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

create type user_role as enum ('student', 'instructor', 'admin');
create type course_status as enum ('draft', 'published');
create type course_level as enum ('beginner', 'intermediate', 'advanced');
create type lesson_type as enum ('video', 'text', 'quiz');
create type transaction_status as enum ('pending', 'completed', 'failed', 'paid_out');

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------

create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role user_role not null default 'student',
  onboarded boolean not null default false,
  full_name text,
  avatar_url text,
  bio text,
  headline text,
  website_url text,
  twitter_url text,
  linkedin_url text,
  stripe_account_id text,
  stripe_account_ready boolean not null default false,
  balance_available numeric(10, 2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table profiles is 'Perfil público de cada usuario (estudiante, instructor o admin), 1:1 con auth.users.';

-- ---------------------------------------------------------------------------
-- courses
-- ---------------------------------------------------------------------------

create table courses (
  id uuid primary key default gen_random_uuid(),
  instructor_id uuid not null references profiles (id) on delete cascade,
  title text not null,
  slug text not null unique,
  description text,
  short_description text,
  thumbnail_url text,
  category text not null,
  level course_level not null default 'beginner',
  price numeric(10, 2) not null default 0 check (price >= 0),
  status course_status not null default 'draft',
  language text not null default 'es',
  rating_average numeric(3, 2) not null default 0,
  rating_count integer not null default 0,
  student_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index courses_instructor_id_idx on courses (instructor_id);
create index courses_status_idx on courses (status);
create index courses_category_idx on courses (category);
create index courses_slug_idx on courses (slug);

-- ---------------------------------------------------------------------------
-- sections
-- ---------------------------------------------------------------------------

create table sections (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses (id) on delete cascade,
  title text not null,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create index sections_course_id_idx on sections (course_id);

-- ---------------------------------------------------------------------------
-- lessons
-- ---------------------------------------------------------------------------

create table lessons (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null references sections (id) on delete cascade,
  title text not null,
  type lesson_type not null default 'video',
  content_url text,
  content_text text,
  attachment_url text,
  duration_seconds integer not null default 0,
  position integer not null default 0,
  is_free_preview boolean not null default false,
  created_at timestamptz not null default now()
);

create index lessons_section_id_idx on lessons (section_id);

-- ---------------------------------------------------------------------------
-- quiz_questions (preguntas de opción múltiple para lecciones tipo quiz)
-- ---------------------------------------------------------------------------

create table quiz_questions (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references lessons (id) on delete cascade,
  question text not null,
  options jsonb not null,
  correct_option integer not null,
  position integer not null default 0
);

create index quiz_questions_lesson_id_idx on quiz_questions (lesson_id);

-- ---------------------------------------------------------------------------
-- enrollments
-- ---------------------------------------------------------------------------

create table enrollments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references profiles (id) on delete cascade,
  course_id uuid not null references courses (id) on delete cascade,
  purchased_at timestamptz not null default now(),
  amount_paid numeric(10, 2) not null default 0,
  stripe_checkout_session_id text,
  progress_percent integer not null default 0 check (progress_percent between 0 and 100),
  completed_at timestamptz,
  unique (student_id, course_id)
);

create index enrollments_student_id_idx on enrollments (student_id);
create index enrollments_course_id_idx on enrollments (course_id);

-- ---------------------------------------------------------------------------
-- lesson_progress
-- ---------------------------------------------------------------------------

create table lesson_progress (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references profiles (id) on delete cascade,
  lesson_id uuid not null references lessons (id) on delete cascade,
  completed_at timestamptz,
  last_position_seconds integer not null default 0,
  updated_at timestamptz not null default now(),
  unique (student_id, lesson_id)
);

create index lesson_progress_student_id_idx on lesson_progress (student_id);
create index lesson_progress_lesson_id_idx on lesson_progress (lesson_id);

-- ---------------------------------------------------------------------------
-- reviews
-- ---------------------------------------------------------------------------

create table reviews (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references profiles (id) on delete cascade,
  course_id uuid not null references courses (id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (student_id, course_id)
);

create index reviews_course_id_idx on reviews (course_id);

-- ---------------------------------------------------------------------------
-- certificates
-- ---------------------------------------------------------------------------

create table certificates (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references profiles (id) on delete cascade,
  course_id uuid not null references courses (id) on delete cascade,
  issued_at timestamptz not null default now(),
  verification_code text not null unique,
  pdf_url text,
  unique (student_id, course_id)
);

create index certificates_student_id_idx on certificates (student_id);
create index certificates_verification_code_idx on certificates (verification_code);

-- ---------------------------------------------------------------------------
-- transactions
-- ---------------------------------------------------------------------------

create table transactions (
  id uuid primary key default gen_random_uuid(),
  instructor_id uuid not null references profiles (id) on delete cascade,
  student_id uuid references profiles (id) on delete set null,
  course_id uuid references courses (id) on delete set null,
  enrollment_id uuid references enrollments (id) on delete set null,
  amount numeric(10, 2) not null,
  platform_fee numeric(10, 2) not null default 0,
  instructor_earnings numeric(10, 2) not null default 0,
  status transaction_status not null default 'completed',
  stripe_payment_intent_id text,
  stripe_transfer_id text,
  created_at timestamptz not null default now()
);

create index transactions_instructor_id_idx on transactions (instructor_id);
create index transactions_status_idx on transactions (status);
