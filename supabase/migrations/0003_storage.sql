-- ============================================================================
-- 0003_storage.sql
-- Buckets de Supabase Storage y sus políticas de acceso.
--
-- Convención de rutas (primer segmento siempre identifica al dueño del recurso):
--   course-thumbnails/{course_id}/...        -> público (catálogo)
--   lesson-videos/{course_id}/{lesson_id}/... -> privado, solo dueño o inscrito
--   lesson-attachments/{course_id}/{lesson_id}/... -> privado, solo dueño o inscrito
--   certificates/{student_id}/{certificate_id}.pdf -> privado, solo el propio estudiante
-- ============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('course-thumbnails', 'course-thumbnails', true, 5242880, array['image/png', 'image/jpeg', 'image/webp']),
  ('lesson-videos', 'lesson-videos', false, 2147483648, array['video/mp4', 'video/webm', 'video/quicktime']),
  ('lesson-attachments', 'lesson-attachments', false, 104857600, array['application/pdf', 'application/zip', 'application/x-zip-compressed']),
  ('certificates', 'certificates', false, 5242880, array['application/pdf'])
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- course-thumbnails: lectura pública, escritura solo del instructor dueño
-- ---------------------------------------------------------------------------

create policy "thumbnails_public_read"
  on storage.objects for select
  using (bucket_id = 'course-thumbnails');

create policy "thumbnails_instructor_write"
  on storage.objects for insert
  with check (
    bucket_id = 'course-thumbnails'
    and is_course_instructor(((storage.foldername(name))[1])::uuid)
  );

create policy "thumbnails_instructor_update"
  on storage.objects for update
  using (
    bucket_id = 'course-thumbnails'
    and is_course_instructor(((storage.foldername(name))[1])::uuid)
  );

create policy "thumbnails_instructor_delete"
  on storage.objects for delete
  using (
    bucket_id = 'course-thumbnails'
    and is_course_instructor(((storage.foldername(name))[1])::uuid)
  );

-- ---------------------------------------------------------------------------
-- lesson-videos: solo el instructor dueño o un estudiante inscrito puede leer
-- ---------------------------------------------------------------------------

create policy "videos_read_owner_or_enrolled"
  on storage.objects for select
  using (
    bucket_id = 'lesson-videos'
    and (
      is_course_instructor(((storage.foldername(name))[1])::uuid)
      or is_enrolled(((storage.foldername(name))[1])::uuid)
      or is_admin()
    )
  );

create policy "videos_instructor_write"
  on storage.objects for insert
  with check (
    bucket_id = 'lesson-videos'
    and is_course_instructor(((storage.foldername(name))[1])::uuid)
  );

create policy "videos_instructor_update"
  on storage.objects for update
  using (
    bucket_id = 'lesson-videos'
    and is_course_instructor(((storage.foldername(name))[1])::uuid)
  );

create policy "videos_instructor_delete"
  on storage.objects for delete
  using (
    bucket_id = 'lesson-videos'
    and is_course_instructor(((storage.foldername(name))[1])::uuid)
  );

-- ---------------------------------------------------------------------------
-- lesson-attachments: misma regla que los videos
-- ---------------------------------------------------------------------------

create policy "attachments_read_owner_or_enrolled"
  on storage.objects for select
  using (
    bucket_id = 'lesson-attachments'
    and (
      is_course_instructor(((storage.foldername(name))[1])::uuid)
      or is_enrolled(((storage.foldername(name))[1])::uuid)
      or is_admin()
    )
  );

create policy "attachments_instructor_write"
  on storage.objects for insert
  with check (
    bucket_id = 'lesson-attachments'
    and is_course_instructor(((storage.foldername(name))[1])::uuid)
  );

create policy "attachments_instructor_update"
  on storage.objects for update
  using (
    bucket_id = 'lesson-attachments'
    and is_course_instructor(((storage.foldername(name))[1])::uuid)
  );

create policy "attachments_instructor_delete"
  on storage.objects for delete
  using (
    bucket_id = 'lesson-attachments'
    and is_course_instructor(((storage.foldername(name))[1])::uuid)
  );

-- ---------------------------------------------------------------------------
-- certificates: solo el propio estudiante puede leer su certificado.
-- La escritura la hace exclusivamente el backend con la service role key
-- (no se define policy de insert/update/delete para el rol authenticated).
-- ---------------------------------------------------------------------------

create policy "certificates_read_own"
  on storage.objects for select
  using (
    bucket_id = 'certificates'
    and (
      ((storage.foldername(name))[1])::uuid = auth.uid()
      or is_admin()
    )
  );
