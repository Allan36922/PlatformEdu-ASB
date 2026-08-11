-- ============================================================================
-- 0006_match_courses.sql
-- Búsqueda semántica: cursos publicados más cercanos a un embedding de
-- consulta, por distancia coseno sobre courses.embedding (gte-small, 384
-- dimensiones, índice hnsw creado en 0005_embeddings.sql).
-- ============================================================================

create or replace function match_courses(
  query_embedding vector(384),
  match_count integer default 10
)
returns table (
  id uuid,
  similarity float
)
-- No necesita security definer: la política "courses_select_published_or_owner"
-- ya permite leer cursos publicados a cualquier rol, y el filtro por status
-- de abajo excluye explícitamente los cursos no publicados (incluso los
-- propios borradores del instructor que llama la función).
language sql
stable
set search_path = public
as $$
  select
    courses.id,
    1 - (courses.embedding <=> query_embedding) as similarity
  from courses
  where courses.status = 'published'
    and courses.embedding is not null
  order by courses.embedding <=> query_embedding
  limit match_count;
$$;
