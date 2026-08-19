# Fix a11y — Reseñas: puntuación y avatares no accesibles

**Severidad:** blocking (estrellas) + important (avatares)
**Archivo:** `src/components/courses/review-list.tsx`
**Dimensión:** accesibilidad — con impacto secundario en SEO (atributos `alt`)
**Estado:** ✅ RESUELTO (2026-08-18) — parches aplicados en `review-list.tsx`.
**Origen:** preexistente. No lo introdujo `courses/[id]`; se detectó al auditar
esa página porque compone `ReviewList`. Afecta también a
`/cursos/[slug]`, que ya renderiza el componente en producción.

---

## Hallazgo 1 — La puntuación se comunica solo por color

### Descripción

Las 5 estrellas de cada reseña se diferencian únicamente por clase de color:
`fill-amber-400 text-amber-400` cuando están rellenas frente a
`text-muted-foreground` cuando están vacías.

Consecuencias:

- Un lector de pantalla no anuncia nada: la reseña se lee sin su puntuación. El
  dato principal de la reseña es invisible para ese usuario.
- Un usuario con baja visión o con deficiencia en la percepción del rojo/verde no
  distingue de forma fiable una estrella rellena de una vacía.

La checklist del Tech Lead clasifica "contenido solo por color" como *important*.
Aquí sube a **blocking** porque la puntuación no está disponible por **ningún**
otro medio en el componente — no hay texto, ni número, ni `aria-label` alternativo.

### Parche

```diff
-                <span className="flex items-center gap-0.5">
+                <span
+                  className="flex items-center gap-0.5"
+                  role="img"
+                  aria-label={`Calificación: ${review.rating} de 5 estrellas`}
+                >
                   {Array.from({ length: 5 }).map((_, index) => (
                     <Star
                       key={index}
+                      aria-hidden="true"
                       className={`size-3.5 ${
                         index < review.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground"
                       }`}
                     />
                   ))}
                 </span>
```

`role="img"` + `aria-label` hace que el grupo se anuncie como una sola unidad
("Calificación: 4 de 5 estrellas") en lugar de cinco iconos sueltos;
`aria-hidden` en cada `<Star>` evita que se dupliquen en el árbol de accesibilidad.

---

## Hallazgo 2 — Avatares de reseña sin `alt`

### Descripción

`<AvatarImage src={...} />` se renderiza sin atributo `alt`. Base UI produce un
`<img>` real, así que un lector de pantalla lee la URL del archivo — típicamente
una cadena larga de Supabase Storage — en lugar del nombre del estudiante o de
omitir la imagen.

El `AvatarFallback` con las iniciales tampoco está marcado como decorativo, con
lo que se anuncia texto redundante junto al nombre que ya aparece al lado.

### Parche

```diff
             <Avatar className="size-9">
-              <AvatarImage src={review.student?.avatar_url ?? undefined} />
-              <AvatarFallback>{initials}</AvatarFallback>
+              <AvatarImage
+                src={review.student?.avatar_url ?? undefined}
+                alt={`Foto de ${review.student?.full_name ?? "estudiante"}`}
+              />
+              <AvatarFallback aria-hidden="true">{initials}</AvatarFallback>
             </Avatar>
```

El mismo patrón ya se aplicó al avatar del instructor en
`src/app/courses/[id]/page.tsx`.

---

## Verificación

- [ ] Con lector de pantalla, cada reseña anuncia nombre, calificación numérica y comentario.
- [ ] Ninguna imagen de la lista de reseñas lee una URL como texto alternativo.
- [ ] En escala de grises (simulando daltonismo), la puntuación sigue siendo legible.
- [ ] La corrección se refleja también en `/cursos/[slug]`, que comparte el componente.
- [ ] `npm run lint` y `npx tsc --noEmit -p .` pasan sin errores.
