-- ============================================================================
-- 0004_functions.sql
-- Triggers y funciones de negocio: creación de perfil al registrarse,
-- recálculo de progreso del curso y emisión del registro de certificado.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Crear fila en profiles automáticamente cuando alguien se registra en
-- Supabase Auth (email/password u OAuth).
-- ---------------------------------------------------------------------------

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', ''),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ---------------------------------------------------------------------------
-- updated_at genérico
-- ---------------------------------------------------------------------------

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on profiles
  for each row execute function set_updated_at();

create trigger courses_set_updated_at
  before update on courses
  for each row execute function set_updated_at();

create trigger reviews_set_updated_at
  before update on reviews
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Emitir el registro de certificado (idempotente) cuando un estudiante
-- completa el 100% de un curso. La generación del PDF ocurre en la
-- aplicación (Next.js); aquí solo se reserva el código de verificación.
-- ---------------------------------------------------------------------------

create or replace function issue_certificate_if_complete(p_student_id uuid, p_course_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into certificates (student_id, course_id, verification_code)
  values (p_student_id, p_course_id, encode(gen_random_bytes(8), 'hex'))
  on conflict (student_id, course_id) do nothing;
end;
$$;

-- ---------------------------------------------------------------------------
-- Recalcular el progreso del enrollment cada vez que cambia lesson_progress,
-- y disparar la emisión del certificado al llegar al 100%.
-- ---------------------------------------------------------------------------

create or replace function recalc_enrollment_progress()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_course_id uuid;
  v_total_lessons integer;
  v_completed_lessons integer;
  v_percent integer;
begin
  select s.course_id into v_course_id
  from lessons l
  join sections s on s.id = l.section_id
  where l.id = new.lesson_id;

  if v_course_id is null then
    return new;
  end if;

  select count(*) into v_total_lessons
  from lessons l
  join sections s on s.id = l.section_id
  where s.course_id = v_course_id;

  select count(*) into v_completed_lessons
  from lesson_progress lp
  join lessons l on l.id = lp.lesson_id
  join sections s on s.id = l.section_id
  where s.course_id = v_course_id
    and lp.student_id = new.student_id
    and lp.completed_at is not null;

  v_percent := case when v_total_lessons = 0 then 0
    else round(v_completed_lessons * 100.0 / v_total_lessons)
  end;

  update enrollments
  set progress_percent = v_percent,
      completed_at = case when v_percent = 100 then coalesce(completed_at, now()) else null end
  where student_id = new.student_id and course_id = v_course_id;

  if v_percent = 100 then
    perform issue_certificate_if_complete(new.student_id, v_course_id);
  end if;

  return new;
end;
$$;

create trigger lesson_progress_recalc
  after insert or update on lesson_progress
  for each row execute function recalc_enrollment_progress();

-- ---------------------------------------------------------------------------
-- Mantener rating_average / rating_count / student_count denormalizados en
-- courses para que el catálogo no tenga que agregar en cada request.
-- ---------------------------------------------------------------------------

create or replace function recalc_course_rating()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_course_id uuid := coalesce(new.course_id, old.course_id);
begin
  update courses c
  set rating_average = coalesce((select round(avg(rating)::numeric, 2) from reviews where course_id = v_course_id), 0),
      rating_count = (select count(*) from reviews where course_id = v_course_id)
  where c.id = v_course_id;
  return coalesce(new, old);
end;
$$;

create trigger reviews_recalc_rating
  after insert or update or delete on reviews
  for each row execute function recalc_course_rating();

create or replace function recalc_course_student_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_course_id uuid := coalesce(new.course_id, old.course_id);
begin
  update courses c
  set student_count = (select count(*) from enrollments where course_id = v_course_id)
  where c.id = v_course_id;
  return coalesce(new, old);
end;
$$;

create trigger enrollments_recalc_student_count
  after insert or delete on enrollments
  for each row execute function recalc_course_student_count();

-- ---------------------------------------------------------------------------
-- Incremento atómico del saldo disponible del instructor (webhook de Stripe).
-- ---------------------------------------------------------------------------

create or replace function increment_instructor_balance(p_instructor_id uuid, p_amount numeric)
returns void
language sql
security definer
set search_path = public
as $$
  update profiles set balance_available = balance_available + p_amount where id = p_instructor_id;
$$;
