# Deuda técnica SEO — `metadataBase` ausente y descripciones cortas

Agrupa los hallazgos de la auditoría que **no son defectos de `courses/[id]`**
sino deuda que excede esa página.

---

## 1. Falta `metadataBase` en el proyecto (important)

**Archivo:** `src/app/layout.tsx`
**Alcance:** global — todas las rutas con metadata.

### Descripción

Ninguna parte del proyecto define `metadataBase` (verificado con
`grep -rn "metadataBase" src/`, sin resultados).

Next.js resuelve contra esa base las URLs relativas de `openGraph.images`,
`alternates.canonical` y `twitter.images`. Sin ella:

- Emite un warning en cada build.
- Cae a `http://localhost:3000`, de modo que en producción las previews sociales
  y los `canonical` apuntan a un host inválido.

Afecta directamente al `canonical` y al `openGraph.images` declarados en
`src/app/courses/[id]/page.tsx`, pero también a cualquier ruta futura que use
URLs relativas en su metadata.

### Parche

En `src/app/layout.tsx`:

```diff
 export const metadata: Metadata = {
+  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
   title: {
     default: "EduPlatform — Cursos online para impulsar tu carrera",
     template: "%s | EduPlatform",
   },
```

Requiere definir `NEXT_PUBLIC_SITE_URL` en el entorno de producción (p. ej.
`https://eduplatform.com`). El fallback a localhost mantiene el desarrollo local
sin configuración extra.

### Verificación

- [ ] `npm run build` no emite el warning de `metadataBase`.
- [ ] En un deploy de preview, el `og:image` y el `canonical` del HTML servido son URLs absolutas del dominio real.
- [ ] `NEXT_PUBLIC_SITE_URL` está definida en el entorno de producción.

---

## 2. La meta description puede quedar bajo el rango recomendado (nit)

**Archivo:** `src/app/courses/[id]/page.tsx`
**Alcance:** cualquier página que derive su description de `short_description`.

### Descripción

La description se construye así:

```ts
course.short_description ??
course.description?.slice(0, 155) ??
`Curso de ${course.category} en EduPlatform.`
```

`short_description` es nullable y **no tiene longitud mínima** en el esquema
(`src/types/database.ts:31`). Si un instructor escribe 20 caracteres, la meta
description queda muy por debajo de los ~120–160 recomendados, y Google la
sustituirá por un fragmento extraído de la página.

El fallback solo actúa cuando `short_description` es `null`, no cuando es
demasiado corta.

### Opciones

1. **Completar en el cliente** — si `short_description` es más corta que ~120
   caracteres, concatenar el inicio de `description` hasta llegar al rango.
   Corrige el síntoma sin tocar la base de datos.
2. **Validar en origen** — añadir longitud mínima al schema Zod de
   `src/lib/validations/course.ts` para que el instructor no pueda guardar una
   descripción corta. Corrige la causa, pero afecta al flujo de autoría y no
   arregla las filas ya existentes.

Sin decisión tomada: es un *nit* y queda a criterio del equipo. La opción 1 es la
de menor fricción; la 2 es la correcta a largo plazo. No hay bloqueo en ninguno
de los dos casos.
