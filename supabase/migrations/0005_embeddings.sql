-- supabase/migrations/0005_embeddings.sql

create extension if not exists vector;
alter table public.courses
  add column if not exists embedding vector(384);

create index if not exists courses_embedding_idx
  on public.courses using hnsw (embedding vector_cosine_ops);

-- ---------------------------------------------------------------------------
-- Generar el embedding automáticamente al insertar o publicar un curso.
-- Usa pg_net para invocar de forma asíncrona (no bloqueante) la Edge Function
-- "embed-course" (supabase/functions/embed-course/index.ts), que arma el
-- texto (título, descripción, nivel, categoría y temario — ver
-- buildCourseEmbeddingText en la app), genera el vector con gte-small y hace
-- el UPDATE de courses.embedding con la service role key.
-- ---------------------------------------------------------------------------

create extension if not exists pg_net;

-- Antes de que este trigger funcione, configura una vez por entorno (SQL
-- Editor, con permisos de owner de la base de datos):
--   alter database postgres set app.settings.supabase_functions_url = 'https://<project-ref>.supabase.co/functions/v1';
--   alter database postgres set app.settings.service_role_key = '<service-role-key>';
-- (la service role key nunca se hardcodea en una migración versionada).

create or replace function trigger_generate_course_embedding()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform net.http_post(
    url := current_setting('app.settings.supabase_functions_url', true) || '/embed-course',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := jsonb_build_object('courseId', new.id)
  );
  return new;
end;
$$;

-- Dos triggers en vez de uno combinado: TG_OP no está disponible en la
-- cláusula WHEN (solo dentro del body de la función), y OLD no existe para
-- INSERT, así que un único trigger INSERT OR UPDATE no puede distinguirlos ahí.

create trigger courses_generate_embedding_insert
  after insert on courses
  for each row
  when (new.status = 'published')
  execute function trigger_generate_course_embedding();

create trigger courses_generate_embedding_update
  after update of status on courses
  for each row
  when (new.status = 'published' and old.status is distinct from new.status)
  execute function trigger_generate_course_embedding();