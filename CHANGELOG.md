# Changelog

Todos los cambios relevantes de EduPlatform se documentan en este archivo.

El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/).
Las categorías usadas son: `Added` (nuevo), `Changed` (cambio en algo existente),
`Fixed` (corrección de defecto), `Removed` (eliminado) y `Docs` (documentación).

> **Cómo mantener este archivo:** cada cambio se añade bajo `[Unreleased]` en el
> momento de hacerlo, no al cerrar la versión. Al publicar una versión se renombra
> `[Unreleased]` con el número y la fecha, y se abre un `[Unreleased]` vacío arriba.
> Cada entrada describe el efecto observable, no el commit, y enlaza al documento
> de `docs/` cuando exista.

---

## [Unreleased]

### Added

- Ruta `src/app/courses/[id]/page.tsx` para enlaces que solo conocen el ID del
  curso y no su slug (p. ej. los que produce la API del agente Edy,
  `/api/agent/courses/[id]`). Resuelve el ID con `getPublishedCourseById` (ya
  filtra `status = 'published'`) y hace `redirect()` a `/cursos/[slug]`, la única
  página de detalle. Ver [docs/historia-usuario-ruta-detalle-curso-por-id.md](docs/historia-usuario-ruta-detalle-curso-por-id.md).
- Datos estructurados JSON-LD `BreadcrumbList` en el detalle de curso, además del
  `Course` que ya se emitía. Google puede mostrar la ruta
  (`Inicio › Cursos › Curso`) en el resultado de búsqueda en lugar de la URL cruda.
  Ver [docs/fix-seo-breadcrumb-jsonld.md](docs/fix-seo-breadcrumb-jsonld.md).
- `metadataBase` en el layout raíz, derivado de `NEXT_PUBLIC_SITE_URL` con
  fallback a `http://localhost:3000`. Las URLs relativas de `openGraph.images` y
  `alternates.canonical` ahora resuelven al dominio real en producción en lugar
  de a localhost, y desaparece el warning de build.
  Ver [docs/deuda-tecnica-seo-metadatabase.md](docs/deuda-tecnica-seo-metadatabase.md).
  - **Requiere configuración:** definir `NEXT_PUBLIC_SITE_URL` en el entorno de
    producción para que surta efecto.
- `alternates.canonical`, `openGraph` y `generateMetadata` con description
  derivada del curso en `/cursos/[slug]` — antes solo tenía `title` y
  `description`. Junto con el punto anterior, resuelve el warning de
  `metadataBase` para esta ruta.

### Fixed

- **a11y (blocking):** la puntuación de las reseñas se comunicaba únicamente por
  color (estrella ámbar frente a gris), sin equivalente textual. Un lector de
  pantalla leía la reseña sin su calificación y un usuario con daltonismo no
  distinguía las estrellas rellenas. El grupo de estrellas pasa a exponerse como
  `role="img"` con `aria-label="Calificación: N de 5 estrellas"`, y cada icono se
  marca `aria-hidden`. Afecta a `/cursos/[slug]`, la única página que compone
  `ReviewList`.
  Ver [docs/fix-a11y-estrellas-resenas.md](docs/fix-a11y-estrellas-resenas.md).
- **a11y/SEO:** los avatares de la lista de reseñas y el avatar del instructor se
  renderizaban sin `alt`, de modo que un lector de pantalla leía la URL del
  archivo de Supabase Storage. Se añade `alt` descriptivo y se marca el fallback
  de iniciales como decorativo.
  Ver [docs/fix-a11y-estrellas-resenas.md](docs/fix-a11y-estrellas-resenas.md).
- **a11y (blocking):** `courses/[id]` se renderizaba fuera del grupo de layout
  `(main)`, sin `Navbar` ni `Footer`, y anidaba un `<main>` propio dentro del
  `<main>` que el layout ya aporta. Resuelto convirtiendo la ruta en un redirect
  a `/cursos/[slug]`, que sí hereda el chrome completo del sitio.
  Ver [docs/historia-usuario-ruta-detalle-curso-por-id.md](docs/historia-usuario-ruta-detalle-curso-por-id.md).

### Changed

- `/cursos/[slug]` gana landmarks y jerarquía semántica: breadcrumb `<nav
  aria-label>`, `<section aria-labelledby>` en cada bloque de contenido, la
  tarjeta de inscripción pasa a `<aside>`, y las URLs de imagen y video de la
  cabecera llevan `aria-hidden`/`sr-only` donde el ícono es puramente decorativo.
  Efecto: cero cambio visual, pero un lector de pantalla ahora navega la página
  por secciones en vez de leerla como un bloque plano.

### Docs

- [docs/auditoria-tech-lead-courses-id.md](docs/auditoria-tech-lead-courses-id.md) —
  auditoría de a11y y SEO de la página de detalle por ID, con la clasificación de
  los 6 hallazgos en HU / fix / otros.
- [docs/historia-usuario-ruta-detalle-curso-por-id.md](docs/historia-usuario-ruta-detalle-curso-por-id.md) —
  historia de usuario para la decisión pendiente sobre la ruta.
- [docs/fix-a11y-estrellas-resenas.md](docs/fix-a11y-estrellas-resenas.md),
  [docs/fix-seo-breadcrumb-jsonld.md](docs/fix-seo-breadcrumb-jsonld.md),
  [docs/deuda-tecnica-seo-metadatabase.md](docs/deuda-tecnica-seo-metadatabase.md) —
  detalle de cada hallazgo con su parche y criterios de verificación.
- Skills de Claude Code en `.claude/skills/`: `tech-lead` (auditoría de a11y y SEO
  técnico) e `historia-usuario` (generación de historias de usuario).

### Pendiente

Elementos identificados y documentados que **no** se han resuelto todavía:

- **404 sin navegación en todo el sitio** (descubierto al verificar el criterio 5
  de la HU de la ruta por ID). No existe ningún `not-found.tsx` (global ni por
  segmento) en el proyecto — cualquier 404, no solo el de cursos, cae al mínimo
  de Next sin `Navbar`/`Footer`. Fuera del alcance de esa historia porque no es
  específico de esa ruta; queda como ítem de backlog aparte.
- **Meta description potencialmente corta** (nit). `short_description` no tiene
  longitud mínima en el esquema; si es muy breve, la description queda bajo los
  ~120–160 caracteres recomendados. Dos opciones abiertas en
  [docs/deuda-tecnica-seo-metadatabase.md](docs/deuda-tecnica-seo-metadatabase.md).

---

## Historial previo

Los cambios anteriores a la introducción de este archivo no están desglosados
aquí. Referencia en el historial de git:

- `968a540` — widget del agente Edy en iframe (ver
  [docs/historia-usuario-widget-edy.md](docs/historia-usuario-widget-edy.md)).
- `a301c01` — embeddings.
- `5f3db7f` — nuevo design system.
- `1022ce4` — commit inicial.
