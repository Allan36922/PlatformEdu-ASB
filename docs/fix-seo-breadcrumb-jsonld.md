# Fix SEO — Falta JSON-LD `BreadcrumbList` en el detalle de curso

**Severidad:** important
**Archivo:** `src/app/courses/[id]/page.tsx`
**Dimensión:** SEO técnico — datos estructurados
**Estado:** ✅ RESUELTO (2026-08-18) — `BreadcrumbList` emitido con URLs absolutas.
**Origen:** introducido por la página nueva.

---

## Descripción

La página renderiza un breadcrumb visual (Inicio / Cursos / título del curso)
dentro de un `<nav aria-label="Ruta de navegación">`, pero no lo expone como dato
estructurado. La checklist del Tech Lead pide `BreadcrumbList` explícitamente en
las páginas de detalle y catálogo.

Sin él, Google no dispone de la jerarquía de la página y muestra la URL cruda en
el resultado de búsqueda en lugar de la ruta legible
(`eduplatform.com › Cursos › Nombre del curso`).

El JSON-LD de `Course` ya está presente en la página e incluye `aggregateRating`
cuando hay reseñas; lo que falta es únicamente el breadcrumb.

## Parche

Añadir el objeto junto al `jsonLd` existente:

```diff
+  const breadcrumbLd = {
+    "@context": "https://schema.org",
+    "@type": "BreadcrumbList",
+    itemListElement: [
+      { "@type": "ListItem", position: 1, name: "Inicio", item: "/" },
+      { "@type": "ListItem", position: 2, name: "Cursos", item: "/cursos" },
+      { "@type": "ListItem", position: 3, name: course.title, item: `/cursos/${course.slug}` },
+    ],
+  };
```

Y emitirlo en un segundo `<script>`:

```diff
       <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
+      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
```

## Dependencias

Este fix **debe aplicarse después** de resolver la historia
[historia-usuario-ruta-detalle-curso-por-id.md](historia-usuario-ruta-detalle-curso-por-id.md):

- Si la ruta se convierte en redirect (opción B), este fix se aplica en
  `src/app/(main)/cursos/[slug]/page.tsx` en lugar de en `courses/[id]`, porque
  esa pasa a ser la única página de detalle.
- Los `item` del breadcrumb deben apuntar a la URL canónica final.

Además, `item` con rutas relativas requiere `metadataBase` para resolverse a URLs
absolutas — ver
[deuda-tecnica-seo-metadatabase.md](deuda-tecnica-seo-metadatabase.md). Schema.org
espera URLs absolutas en `item`; con rutas relativas los validadores emiten aviso.

## Verificación

- [ ] El HTML servido contiene dos bloques `application/ld+json`: `Course` y `BreadcrumbList`.
- [ ] El Rich Results Test de Google valida ambos sin errores.
- [ ] Los `item` del breadcrumb son URLs absolutas y resuelven a páginas existentes.
- [ ] El breadcrumb estructurado coincide con el breadcrumb visible en pantalla.
