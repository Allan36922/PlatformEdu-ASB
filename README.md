# EduPlatform

Plataforma EdTech de cursos online (estilo Udemy/Gumroad) construida con **Next.js 16 (App Router)**, **Supabase** (Postgres, Auth, Storage) y **Stripe Checkout**.

Este repositorio implementa el MVP funcional descrito en la especificación: autenticación y onboarding por rol, creación de cursos con curriculum arrastrable, catálogo con filtros y búsqueda, checkout con Stripe, player de aprendizaje con progreso y quizzes, certificados en PDF con verificación pública, reseñas y dashboards de instructor/estudiante.

**Fuera de alcance en esta primera versión** (estructura de datos lista, sin UI/lógica completa): panel de administrador y payouts de instructores vía Stripe Connect.

## Stack

- Next.js 16 (App Router, TypeScript, Server Actions) + Tailwind CSS + shadcn/ui (sobre primitivas de `@base-ui/react`)
- Supabase: Postgres con Row Level Security, Auth (email/password + OAuth), Storage
- Stripe Checkout para pagos únicos
- `@dnd-kit` para reordenar secciones/lecciones por drag and drop
- `@react-pdf/renderer` para generar el PDF del certificado
- Vitest + Testing Library para tests unitarios

## Diseño

La interfaz usa un tema oscuro único ("Edutech": fondo casi negro, acento primario violeta, detalles en ámbar) definido como variables CSS en `src/app/globals.css` y aplicado globalmente vía la clase `dark` en `<html>` (`src/app/layout.tsx`). Tipografía: **Sora** (títulos), **Manrope** (cuerpo) y **JetBrains Mono** (código/datos), cargadas con `next/font/google`. Los componentes de `src/components/ui/` son shadcn/ui estándar; al consumir únicamente los tokens semánticos (`bg-primary`, `text-muted-foreground`, etc.) heredan el tema sin necesitar estilos por componente.

## Puesta en marcha

### 1. Instalar dependencias

```bash
npm install
```

### 2. Crear el proyecto de Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com).
2. En el **SQL Editor**, ejecuta en orden los archivos de `supabase/migrations/`:
   - `0001_init.sql` — enums, tablas e índices
   - `0002_rls.sql` — funciones auxiliares y políticas de Row Level Security
   - `0003_storage.sql` — buckets de Storage y sus políticas de acceso
   - `0004_functions.sql` — triggers de negocio (perfil automático al registrarse, recálculo de progreso, emisión de certificados, rating y conteo de estudiantes)

   O bien, si usas la CLI de Supabase: `supabase db push` desde la raíz del proyecto (con el CLI enlazado a tu proyecto).

3. En **Authentication -> Providers**, habilita Email y, si quieres OAuth, Google y/o GitHub (configura las credenciales OAuth de cada proveedor y agrega `https://tu-proyecto.supabase.co/auth/v1/callback` como redirect URI en cada uno).
4. En **Authentication -> URL Configuration**, agrega `http://localhost:3000/auth/callback` (y la URL de producción cuando la tengas) a las Redirect URLs permitidas.

### 3. Crear la cuenta de Stripe

1. Crea una cuenta en [stripe.com](https://stripe.com) (modo test es suficiente para desarrollo).
2. Copia la **Secret key** y la **Publishable key** desde *Developers -> API keys*.
3. Crea un webhook (*Developers -> Webhooks -> Add endpoint*) apuntando a `https://tu-dominio/api/stripe/webhook` con el evento `checkout.session.completed`, y copia el **Signing secret**. Para probar en local, usa `stripe listen --forward-to localhost:3000/api/stripe/webhook`.

### 4. Variables de entorno

Copia `.env.example` a `.env.local` y completa los valores de Supabase y Stripe obtenidos arriba:

```bash
cp .env.example .env.local
```

### 5. Levantar el proyecto

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Scripts

| Comando | Descripción |
| --- | --- |
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run start` | Sirve el build de producción |
| `npm run lint` | ESLint |
| `npm run test` | Tests unitarios (Vitest) |

## Estructura del proyecto

```
supabase/migrations/   Esquema SQL, RLS, Storage y funciones de negocio
src/
  app/                  Rutas (App Router)
    (auth)/              Login, registro
    (main)/               Landing, catálogo, curso, checkout, aprender,
                           instructor/*, estudiante, perfil, certificados
    api/                  Route Handlers (webhook de Stripe, descarga de certificados)
  components/            Componentes de UI por dominio (courses, catalog, checkout, player, dashboard, landing, layout, auth, ui)
  lib/
    supabase/             Clientes de Supabase (browser, server, admin, middleware)
    stripe/                Cliente de Stripe y cálculo de comisión de plataforma
    actions/               Server Actions (mutaciones)
    queries/                Lecturas de datos para Server Components
    validations/            Esquemas zod
    certificates/            Generación del PDF del certificado
  types/database.ts        Tipos TypeScript del esquema de base de datos
```

## Notas de seguridad

- Row Level Security está habilitado en todas las tablas con datos sensibles. Las tablas `enrollments`, `transactions` y `certificates` solo aceptan `INSERT` desde el backend (service role), nunca desde el cliente.
- El acceso a videos y adjuntos de lecciones se protege a nivel de Storage (bucket privado) verificando inscripción del estudiante; el temario (títulos de secciones/lecciones) es visible públicamente en cursos publicados para la página de detalle.
- El webhook de Stripe valida la firma (`STRIPE_WEBHOOK_SECRET`) antes de procesar cualquier evento.
