# Auditoría Tech Lead — `courses/[id]` (detalle de curso)

Fecha: 2026-08-18
Alcance auditado: `src/app/courses/[id]/page.tsx` y los componentes que compone
(`CourseCurriculum`, `ReviewList`, `EnrollButton`), más los layouts padre.
Dimensiones: accesibilidad (a11y) y SEO técnico.

Resultado de la auditoría: **BLOQUEADO — 2 hallazgos blocking.**

**Estado a 2026-08-18:** ✅ Todos los hallazgos accionables resueltos (2, 3, 4, 5
y 1). Solo queda abierto el 6 (nit, backlog). El hallazgo 1 se resolvió con la
opción B (redirect) — ver
[historia-usuario-ruta-detalle-curso-por-id.md](historia-usuario-ruta-detalle-curso-por-id.md#implementación-final).
Ver [CHANGELOG.md](../CHANGELOG.md).

---

## Clasificación de hallazgos

| # | Hallazgo | Severidad | Clasificación | Documento |
|---|---|---|---|---|
| 1 ✅ | Ruta fuera de `(main)`: sin Navbar/Footer y con `<main>` anidado | blocking | **HU** — decisión de producto sobre la ruta | [historia-usuario-ruta-detalle-curso-por-id.md](historia-usuario-ruta-detalle-curso-por-id.md) |
| 2 ✅ | Estrellas de reseñas comunicadas solo por color | blocking | **Fix** | [fix-a11y-estrellas-resenas.md](fix-a11y-estrellas-resenas.md) |
| 3 ✅ | Avatares de reseña sin `alt` | important | **Fix** | [fix-a11y-estrellas-resenas.md](fix-a11y-estrellas-resenas.md) |
| 4 ✅ | Falta `metadataBase` (OG + canonical no resuelven) | important | **Otros** — deuda técnica global | [deuda-tecnica-seo-metadatabase.md](deuda-tecnica-seo-metadatabase.md) |
| 5 ✅ | Falta JSON-LD `BreadcrumbList` | important | **Fix** | [fix-seo-breadcrumb-jsonld.md](fix-seo-breadcrumb-jsonld.md) |
| 6 | `description` puede quedar bajo el rango recomendado | nit | **Otros** — backlog, no accionable aún | [deuda-tecnica-seo-metadatabase.md](deuda-tecnica-seo-metadatabase.md) |

### Criterio de clasificación aplicado

- **HU** — requiere una decisión de producto antes de tocar código. El hallazgo 1
  no tiene una única corrección correcta: mover la ruta, convertirla en redirect o
  dejarla como está son tres productos distintos. Se documenta como historia para
  que la decisión sea explícita y no quede enterrada en un commit.
- **Fix** — defecto con causa y parche conocidos, sin decisión de producto pendiente.
  Se aplica y se verifica. Los hallazgos 2, 3 y 5 entran aquí.
- **Otros** — no es un defecto de esta página sino deuda que la excede
  (hallazgo 4, afecta a todas las rutas con metadata) o una observación de
  backlog sin acción inmediata clara (hallazgo 6).

---

## Nota sobre el origen de los hallazgos

Conviene separar qué introdujo esta tarea y qué ya existía, porque cambia a quién
corresponde cada corrección:

- **Introducido por la página nueva:** hallazgos 1 y 5.
- **Preexistente, heredado al componer `ReviewList`:** hallazgos 2 y 3. Afectan
  igualmente a `/cursos/[slug]`, que ya renderizaba ese componente en producción.
- **Preexistente, global:** hallazgo 4. Ninguna ruta del proyecto define
  `metadataBase`.

---

## Estado de bloqueo

~~Los hallazgos 2 y 3 se pueden corregir de inmediato: son independientes de la
decisión pendiente sobre la ruta.~~ Resueltos.

~~El hallazgo 1 bloquea el cierre de la tarea hasta que se elija una de las tres
opciones descritas en la HU.~~ Resuelto con la opción B (redirect): `courses/[id]`
resuelve el ID y redirige a `/cursos/[slug]`, que pasó a ser la única página de
detalle y absorbió el `canonical`, el `BreadcrumbList` y el resto de las mejoras
de a11y/SEO.

Solo queda abierto el hallazgo 6 (nit), sin bloqueo asociado.
