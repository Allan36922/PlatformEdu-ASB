# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

EduPlatform — a course-marketplace app (Udemy/Gumroad-style) built with **Next.js 16 (App Router)**, **Supabase** (Postgres + RLS, Auth, Storage), and **Stripe Checkout**. Spanish-language UI throughout (copy, route segments, error messages).

Implemented: role-based auth/onboarding, instructor course authoring with drag-and-drop curriculum, catalog with filters/search, Stripe checkout, a learning player with progress + quizzes, PDF certificates with public verification, reviews, and instructor/student dashboards.

Out of scope (schema exists, no UI/logic): admin panel, instructor payouts via Stripe Connect.

## Commands

```bash
npm run dev          # dev server (localhost:3000)
npm run build        # production build
npm run start        # serve production build
npm run lint         # eslint
npm run test         # vitest run (all tests, once)
npx vitest            # vitest watch mode
npx vitest run src/lib/utils.test.ts        # single test file
npx vitest run -t "name of test"            # single test by name
npx tsc --noEmit -p .                        # typecheck only (no test runner does this automatically)
```

Tests live next to the code they cover (`*.test.ts`), currently under `src/lib/` (validations, stripe, utils) — jsdom environment, Testing Library, config in `vitest.config.ts`/`vitest.setup.ts`.

There is no CI config in this repo — `lint`, `test`, and `tsc --noEmit` are the checks to run manually before considering a change done.

## Architecture

### Data flow and auth model

- **Three Supabase client factories**, each for a specific context — pick the right one:
  - `src/lib/supabase/server.ts` — `createClient()`, cookie-based, respects RLS. Use in Server Components, Server Actions, Route Handlers.
  - `src/lib/supabase/client.ts` — browser client for Client Components.
  - `src/lib/supabase/admin.ts` — `createAdminClient()`, uses the service-role key and **bypasses RLS**. Reserved for trusted server-only code (Stripe webhook, certificate generation, and Server Actions that write to tables RLS locks to backend-only, e.g. `enrollments`, `transactions`). Never expose to client code.
  - `src/lib/supabase/middleware.ts` — `updateSession()`, called from `src/middleware.ts` on every request. Refreshes the auth session cookie and redirects unauthenticated users away from protected prefixes (`/instructor`, `/estudiante`, `/aprender`, `/onboarding`, `/checkout`) to `/login?redirect=<path>`.
- **RLS is the real authorization boundary**, not application code — `enrollments`, `transactions`, and `certificates` only accept `INSERT` from the service role (see `supabase/migrations/0002_rls.sql`). Course curriculum (section/lesson titles) is publicly readable for published courses; lesson `content_url`/`content_text`/`attachment_url` access is enforced separately at the Storage layer based on enrollment.
- Migrations are plain SQL, applied in order from `supabase/migrations/`: `0001_init.sql` (schema), `0002_rls.sql` (RLS policies), `0003_storage.sql` (Storage buckets/policies), `0004_functions.sql` (triggers: auto-create profile on signup, recompute course progress, issue certificates, roll up rating/student counts).
- `src/types/database.ts` is the hand-maintained source of truth for table shapes (`Profile`, `Course`, `Section`, `Lesson`, `QuizQuestion`, `Enrollment`, `LessonProgress`, `Review`, `Certificate`, `Transaction`) — keep it in sync when migrations change columns.

### Server Actions and queries split

- `src/lib/actions/*.ts` — all mutations (`"use server"`), one file per domain (auth, courses, curriculum, enrollments, checkout, progress, quiz, reviews, profile, certificates). Convention: return `{ error: string }` on failure instead of throwing, and `redirect()` on success where the action navigates the user (see `enrollFreeCourseAction` in `enrollments.ts` for the canonical pattern: validate → use `createAdminClient()` only for the RLS-locked write → `redirect()`).
- `src/lib/queries/*.ts` — all reads for Server Components, one file per domain (`courses.ts`, `learning.ts`, `student-dashboard.ts`, `instructor-dashboard.ts`, `instructor.ts`, `certificates.ts`). `getCourseBySlug`, `searchCourses`, `getFeaturedCourses`, `getFirstLessonId` in `courses.ts` are the core catalog/detail queries.
- `src/lib/validations/*.ts` — Zod schemas shared between forms and actions (`courseCategories`, `courseLevels`, `lessonTypes` live in `course.ts` and are the enum sources of truth for the UI).

### Payments

Two independent, idempotent write paths land in `enrollments`/`transactions`, both keyed on `stripe_checkout_session_id` / `stripe_payment_intent_id` so retries don't duplicate rows:
1. `src/app/api/stripe/webhook/route.ts` — verifies the Stripe signature, then on `checkout.session.completed` upserts the enrollment, inserts the transaction (commission split via `calculateCommission` in `src/lib/stripe/server.ts`), and increments the instructor's balance via the `increment_instructor_balance` RPC.
2. `src/app/(main)/checkout/success/page.tsx` — a fallback that re-checks the Stripe session and upserts the enrollment directly, in case the webhook hasn't landed yet by the time the user is redirected back.

Free courses (`price = 0`) skip Stripe entirely via `enrollFreeCourseAction`.

### Route structure

- `src/app/(auth)/` — login/signup, no navbar/footer chrome.
- `src/app/(main)/` — everything else (shares layout with `Navbar`/`Footer` from `src/components/layout/`): landing, `/cursos` catalog + `/cursos/[slug]` detail, `/checkout/[courseId]` + `/checkout/success`, `/aprender/[courseId]/[lessonId]` learning player, `/instructor` + `/instructor/cursos/*` authoring, `/estudiante` dashboard, `/perfil`, `/certificados/verificar/[code]` (public verification).
- `src/app/api/stripe/webhook/`, `src/app/api/certificates/[id]/` — Route Handlers (webhook receiver; signed-URL certificate download that generates the PDF on first request via `ensureCertificatePdf`).
- `src/app/auth/callback/` — OAuth/email callback that exchanges the code for a session.
- Components are organized by domain, not by type: `components/{courses,catalog,checkout,player,dashboard,landing,layout,auth}/` plus `components/ui/` for the shadcn primitives.

### UI components and theming

- shadcn/ui components in `src/components/ui/` are generated on top of **`@base-ui/react`** primitives, not Radix — e.g. `Button`/`Badge` take a `render` prop (Base UI composition) instead of `asChild` to render as a different element (`<Button render={<Link href="...">Text</Link>} />`). Follow this pattern when composing these primitives with `next/link` or other elements.
- The app is dark-only: `dark` is a permanent class on `<html>` (`src/app/layout.tsx`), and the palette lives entirely in the `.dark` block of `src/app/globals.css` (the `:root` light block is unused/dead). Components must use semantic Tailwind tokens (`bg-primary`, `text-muted-foreground`, `border`, etc.) rather than literal colors to stay theme-consistent — the existing `dark:` variants throughout `components/ui/*` depend on that permanent `dark` class to activate.
- Fonts: Sora (`font-heading`, display), Manrope (`font-sans`, body), JetBrains Mono (`font-mono`), loaded via `next/font/google` in `layout.tsx`.
- `LevelBadge` (`src/components/courses/level-badge.tsx`) maps a course level to a colored `Badge` variant (`beginner`/`intermediate`/`advanced`) — use it instead of rendering the level as plain text.
