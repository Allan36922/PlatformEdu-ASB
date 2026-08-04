-- ============================================================================
-- 0002_rls.sql
-- Row Level Security: funciones auxiliares y políticas por tabla.
-- Todas las tablas con datos sensibles quedan protegidas (100% de cobertura,
-- requisito no funcional de seguridad de la especificación).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Funciones auxiliares (security definer para evitar recursión de RLS)
-- ---------------------------------------------------------------------------

create or replace function is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function is_course_instructor(target_course_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from courses
    where id = target_course_id and instructor_id = auth.uid()
  );
$$;

create or replace function is_enrolled(target_course_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from enrollments
    where course_id = target_course_id and student_id = auth.uid()
  );
$$;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------

alter table profiles enable row level security;

create policy "profiles_select_public"
  on profiles for select
  using (true);

create policy "profiles_update_own"
  on profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "profiles_insert_own"
  on profiles for insert
  with check (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- courses
-- ---------------------------------------------------------------------------

alter table courses enable row level security;

create policy "courses_select_published_or_owner"
  on courses for select
  using (
    status = 'published'
    or instructor_id = auth.uid()
    or is_admin()
  );

create policy "courses_insert_own"
  on courses for insert
  with check (
    instructor_id = auth.uid()
    and exists (select 1 from profiles where id = auth.uid() and role in ('instructor', 'admin'))
  );

create policy "courses_update_own"
  on courses for update
  using (instructor_id = auth.uid() or is_admin())
  with check (instructor_id = auth.uid() or is_admin());

create policy "courses_delete_own"
  on courses for delete
  using (instructor_id = auth.uid() or is_admin());

-- ---------------------------------------------------------------------------
-- sections (el temario es visible públicamente para cursos publicados;
-- el contenido real de las lecciones se protege a nivel de Storage)
-- ---------------------------------------------------------------------------

alter table sections enable row level security;

create policy "sections_select_published_or_owner"
  on sections for select
  using (
    is_course_instructor(course_id)
    or is_admin()
    or exists (select 1 from courses c where c.id = course_id and c.status = 'published')
  );

create policy "sections_write_owner"
  on sections for all
  using (is_course_instructor(course_id) or is_admin())
  with check (is_course_instructor(course_id) or is_admin());

-- ---------------------------------------------------------------------------
-- lessons
-- ---------------------------------------------------------------------------

alter table lessons enable row level security;

create policy "lessons_select_published_or_owner"
  on lessons for select
  using (
    exists (
      select 1 from sections s
      join courses c on c.id = s.course_id
      where s.id = section_id
        and (c.status = 'published' or c.instructor_id = auth.uid() or is_admin())
    )
  );

create policy "lessons_write_owner"
  on lessons for all
  using (
    exists (
      select 1 from sections s
      where s.id = section_id and (is_course_instructor(s.course_id) or is_admin())
    )
  )
  with check (
    exists (
      select 1 from sections s
      where s.id = section_id and (is_course_instructor(s.course_id) or is_admin())
    )
  );

-- ---------------------------------------------------------------------------
-- quiz_questions (mismas reglas que lessons, ocultando la respuesta correcta
-- no es posible a nivel de fila, así que se restringe el SELECT completo a
-- dueño/inscrito; el cliente público del catálogo no necesita las preguntas)
-- ---------------------------------------------------------------------------

alter table quiz_questions enable row level security;

create policy "quiz_questions_select_owner_or_enrolled"
  on quiz_questions for select
  using (
    exists (
      select 1 from lessons l
      join sections s on s.id = l.section_id
      where l.id = lesson_id
        and (is_course_instructor(s.course_id) or is_enrolled(s.course_id) or is_admin())
    )
  );

create policy "quiz_questions_write_owner"
  on quiz_questions for all
  using (
    exists (
      select 1 from lessons l
      join sections s on s.id = l.section_id
      where l.id = lesson_id and (is_course_instructor(s.course_id) or is_admin())
    )
  )
  with check (
    exists (
      select 1 from lessons l
      join sections s on s.id = l.section_id
      where l.id = lesson_id and (is_course_instructor(s.course_id) or is_admin())
    )
  );

-- ---------------------------------------------------------------------------
-- enrollments (solo lectura de las propias inscripciones; el INSERT lo hace
-- el webhook de Stripe con la service role key, nunca el cliente)
-- ---------------------------------------------------------------------------

alter table enrollments enable row level security;

create policy "enrollments_select_own_or_instructor"
  on enrollments for select
  using (
    student_id = auth.uid()
    or is_course_instructor(course_id)
    or is_admin()
  );

-- ---------------------------------------------------------------------------
-- lesson_progress
-- ---------------------------------------------------------------------------

alter table lesson_progress enable row level security;

create policy "lesson_progress_select_own"
  on lesson_progress for select
  using (
    student_id = auth.uid()
    or exists (
      select 1 from lessons l
      join sections s on s.id = l.section_id
      where l.id = lesson_id and is_course_instructor(s.course_id)
    )
    or is_admin()
  );

create policy "lesson_progress_write_own"
  on lesson_progress for all
  using (student_id = auth.uid())
  with check (
    student_id = auth.uid()
    and exists (
      select 1 from lessons l
      join sections s on s.id = l.section_id
      where l.id = lesson_id and is_enrolled(s.course_id)
    )
  );

-- ---------------------------------------------------------------------------
-- reviews (solo estudiantes inscritos pueden opinar; lectura pública)
-- ---------------------------------------------------------------------------

alter table reviews enable row level security;

create policy "reviews_select_public"
  on reviews for select
  using (true);

create policy "reviews_insert_enrolled"
  on reviews for insert
  with check (student_id = auth.uid() and is_enrolled(course_id));

create policy "reviews_update_own"
  on reviews for update
  using (student_id = auth.uid())
  with check (student_id = auth.uid());

create policy "reviews_delete_own"
  on reviews for delete
  using (student_id = auth.uid() or is_admin());

-- ---------------------------------------------------------------------------
-- certificates (solo lectura propia; INSERT vía función/servicio)
-- ---------------------------------------------------------------------------

alter table certificates enable row level security;

create policy "certificates_select_own"
  on certificates for select
  using (
    student_id = auth.uid()
    or is_course_instructor(course_id)
    or is_admin()
  );

-- ---------------------------------------------------------------------------
-- transactions (solo lectura propia; INSERT vía webhook con service role)
-- ---------------------------------------------------------------------------

alter table transactions enable row level security;

create policy "transactions_select_own"
  on transactions for select
  using (
    instructor_id = auth.uid()
    or student_id = auth.uid()
    or is_admin()
  );
