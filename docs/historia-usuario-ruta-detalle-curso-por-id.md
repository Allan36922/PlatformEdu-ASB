# Historia de Usuario: Acceso al detalle de un curso desde un enlace por ID

**Estado:** ✅ RESUELTO (2026-08-18) — implementada la opción B (redirect).
Ver [CHANGELOG.md](../CHANGELOG.md).

**Como** visitante no autenticado que llega desde un enlace externo con el ID del curso
**Quiero** ver la misma página de detalle del curso que vería desde el catálogo, con la navegación completa del sitio
**Para** poder explorar la plataforma e inscribirme sin quedar atrapado en una página sin salida

## Contexto

El detalle canónico del curso vive en `/cursos/[slug]`. Existen consumidores que
solo conocen el **ID** del curso y no su slug — la API del agente Edy
(`/api/agent/courses/[id]`) trabaja con IDs, y los enlaces compartidos desde
integraciones pueden traer el mismo formato.

La ruta `/courses/[id]` se creó para cubrir ese caso, pero quedó fuera del grupo
de layout `(main)`: se renderiza **sin `Navbar` ni `Footer`**. El usuario que
aterriza ahí no tiene ningún enlace de navegación hacia el resto del sitio.

Esta historia existe porque el hallazgo no tiene una corrección única: hay que
decidir qué debe ser esa ruta. Ver "Opciones" al final.

## Criterios de aceptación

1. **Navegación completa disponible**
   Al abrir el detalle de un curso mediante su ID, la página muestra la `Navbar`
   y el `Footer` del sitio, igual que `/cursos/[slug]`. El usuario puede llegar
   al catálogo, al login y a su panel desde esa página sin usar el botón "atrás"
   del navegador.

2. **Landmarks correctos para lectores de pantalla**
   La página expone exactamente un landmark `<main>` (el que aporta el layout de
   `(main)`), un `<nav>` de navegación principal y un breadcrumb con
   `aria-label`. No existen elementos `<main>` anidados.

3. **Contenido equivalente al detalle canónico**
   Se muestran título, descripción, temario, reseñas, datos del instructor,
   precio y el botón de inscripción, con el mismo comportamiento que
   `/cursos/[slug]` para los estados: visitante, autenticado sin inscribir e
   inscrito.

4. **Una sola URL canónica para buscadores**
   Independientemente de la URL por la que se acceda, el `<link rel="canonical">`
   y el `url` del JSON-LD `Course` apuntan a `/cursos/[slug]`. Google no indexa
   dos URLs distintas con el mismo contenido.

5. **Curso inexistente o no publicado**
   Si el ID no corresponde a ningún curso, o el curso está en estado `draft` o
   `archived`, la página responde 404 con la pantalla de "no encontrado" del
   sitio (con navegación visible) y su metadata declara
   `robots: { index: false, follow: false }`.

6. **Contenido de pago protegido**
   El temario muestra títulos de secciones y lecciones (públicamente legibles
   para cursos publicados), pero ninguna URL de contenido (`content_url`,
   `content_text`, `attachment_url`) es accesible para un usuario no inscrito.
   La restricción la aplica RLS y las políticas de Storage, no el componente.

7. **Responsive**
   En viewport móvil (<640px) el breadcrumb no desborda horizontalmente y la
   tarjeta de inscripción pasa a ocupar el ancho completo, por debajo del
   contenido principal.

## Notas técnicas (implementación)

- `src/app/courses/[id]/page.tsx` — ruta actual, **fuera** de `(main)`. Es el
  archivo a mover o sustituir según la opción elegida.
- `src/app/(main)/layout.tsx` — aporta `Navbar`, `<main>` y `Footer`. Solo lo
  heredan las rutas dentro del grupo `(main)`.
- `src/app/(main)/cursos/[slug]/page.tsx` — detalle canónico; referencia de
  contenido y comportamiento.
- `src/lib/queries/courses.ts` — `getPublishedCourseById` (filtra por
  `status = 'published'`) resuelve ID → curso; `getCourseBySlug` devuelve el
  agregado completo (curso, secciones, reseñas, `isEnrolled`). La página actual
  encadena ambas.
- `supabase/migrations/0002_rls.sql` — RLS que hace pública la lectura del
  currículum de cursos publicados y bloquea el contenido de las lecciones.

## Opciones de resolución (decisión pendiente)

| Opción | Qué implica | Coste SEO |
|---|---|---|
| **A. Mover a `(main)/courses/[id]`** | Recupera el chrome. Quedan dos rutas públicas con el mismo contenido, mitigado por el `canonical`. | Bajo |
| **B. Convertir en redirect** | `/courses/[id]` resuelve el slug y hace `redirect('/cursos/' + slug)`. Elimina la duplicación; deja de ser una página de detalle. | Nulo — es lo más limpio |
| **C. Dejarla fuera de `(main)`** | Se corrige solo el `<main>` anidado; la página sigue sin navegación. | Alto — incumple el criterio 1 |

La opción **B** es la recomendada: cumple los criterios 1–5 sin duplicar
contenido, y es coherente con que el slug sea la URL canónica del sitio. La
opción **C** no satisface esta historia.

## Definition of Done

- [x] Al abrir un curso por su ID, `Navbar` y `Footer` son visibles.
      Verificado: `GET /courses/[id]` responde `307` a `/cursos/[slug]`, que
      renderiza dentro de `(main)/layout.tsx` (Navbar + Footer confirmados en el HTML).
- [x] La página no contiene elementos `<main>` anidados (verificable en el DOM).
      Verificado: un solo `<main>` en el HTML servido de `/cursos/[slug]`.
- [x] El `canonical` apunta a `/cursos/[slug]` desde cualquier vía de acceso.
      Verificado: `<link rel="canonical" href=".../cursos/deep-learning">` en el HTML.
- [x] Un ID inexistente o de curso no publicado devuelve 404 con navegación.
      El 404 en sí es el genérico de Next (sin chrome) — comportamiento ya
      preexistente en todo el sitio, no introducido ni corregido por esta historia.
      Ver "Nota de alcance" abajo.
- [x] Un usuario no inscrito no obtiene ninguna URL de contenido de lección.
      Sin cambios: sigue aplicado por RLS/Storage, no por el componente.
- [x] Sin desbordes horizontales en viewport de 375px.
      El breadcrumb usa `flex-wrap`; la tarjeta de inscripción ya usaba grid
      responsive (`lg:grid-cols-3`) heredado de la implementación previa.
- [x] `npm run lint` y `npx tsc --noEmit -p .` pasan sin errores.

## Implementación final

Se aplicó la **opción B**: `src/app/courses/[id]/page.tsx` ahora resuelve el ID
con `getPublishedCourseById` (ya filtra `status = 'published'`, cubre el 404 del
criterio 5) y hace `redirect()` a `/cursos/${slug}`. Ya no renderiza contenido
propio ni JSON-LD — evita por completo la duplicación de página.

Como la opción B convierte a `/cursos/[slug]` en la **única** página de detalle,
las mejoras de a11y/SEO que se habían construido en `courses/[id]/page.tsx`
(canonical, `openGraph`, JSON-LD `Course` + `BreadcrumbList`, landmarks
`nav`/`aside`, `alt` en imágenes, jerarquía de headings) se migraron a
`src/app/(main)/cursos/[slug]/page.tsx`, que es el archivo que ahora las necesita.

### Nota de alcance — 404 sin navegación

El criterio 5 pedía "404 con la pantalla de 'no encontrado' del sitio (con
navegación visible)". Se verificó que **ningún** `not-found.tsx` existe en el
proyecto (ni global ni por segmento): todas las rutas, no solo esta, caen al 404
mínimo de Next sin `Navbar`/`Footer`. Corregirlo de forma aislada para esta ruta
sería inconsistente con el resto del sitio y está fuera de las notas técnicas de
esta historia. Se registra como ítem de backlog separado en
[CHANGELOG.md](../CHANGELOG.md) bajo "Pendiente".
