# FamilyDashboard — Agent Reference

## Project

**Sunshine Family Dashboard** — local Next.js family sharing app (weather, photos, dinners, fitness, dining-out, todos, groceries, notes, calendar, recipes, weekly planner, stats, archive). Runs on port 3000 (dev on 3000 with `-H 0.0.0.0`; `docker-compose.yml` also uses 3000).

## Stack

Next.js 15 (App Router) · React 19 · TypeScript · Tailwind 3 (darkMode: class) · lucide-react · Prisma 6 · SQLite · Cookie auth · cheerio (OG fetch) · @google/genai (Gemini)

## Commands

| Command | What |
|---------|------|
| `npm run dev` | Dev server on port 3000, LAN-accessible (`-H 0.0.0.0`) |
| `npm run lint` | Only available lint/check — no test or typecheck script |
| `npx prisma migrate dev --name <desc>` | Schema change + generate |
| `npx prisma generate` | Regenerate client after pulling migrations |
| `npx prisma studio` | Browse/edit DB |
| `npx prisma db push` | Push schema without migration (used in Docker entrypoint) |

No test suite exists.

## .env

```
DATABASE_URL="file:./dev.db"
OPENWEATHERMAP_API_KEY / _CITY / _UNITS
```

## Docker

`Dockerfile` builds + `docker-entrypoint.sh` runs `prisma db push` (not migrate) then `npm start`. `docker-compose.yml` mounts `public/photos:ro`, `public/backgrounds:ro`, and a `db-data` volume for the prisma directory.

## Architecture

```
page.tsx (server) → Promise.all([queries]) → initialXxx props → client components
  → client calls server action → mutates DB + revalidatePath("/") → re-render
```

- **Auth**: middleware guards all routes except `/login`, `/_next`, `/api`, `/photos`, `/backgrounds`, `/sw.js`, `/manifest.json`, `/icons`. Check is `family-member-id` cookie (parseInt > 0).
- **Session helpers** in `lib/session.ts`: `getCurrentMemberId()`, `getCurrentMember()`, `getCurrentMemberTheme()`
- **Barrel import** at `@/app/actions` re-exports 23 action modules (all except `shared.ts` and `backup.ts`). Components use `import { ... } from "@/app/actions"`.
- **`backup.ts`** is a standalone `"use server"` file NOT in the barrel (never imported by any component).
- **`shared.ts`** is NOT in the barrel — import directly from `@/app/actions/shared` for helpers like `callAI`, `tryAction`, `checkAndAwardAchievements`.
- **Activity store** (`lib/activityStore.ts`) is an in-memory global, max 30 entries per server instance. Lost on restart.

## DB Models (24)

Member, FitnessLog, Dinner, Note, Todo, Grocery, GroceryCategory, DiningOut, MealPrepItem, MemberReadState, Achievement, MemberAchievement, MemberStats, PhotoFavorite, SharedLink, CalendarEvent, RecipeLink, PlannedMeal, ArchivedMeal, ArchivedNote, DeletedTodo, DeletedMealPrepItem, FamilySetting, Comment

**Key schema details:**
- `Member.aiProvider` — `"local"` (default, OpenAI-compatible) or `"gemini"`
- `Member.accentColor` — stored as string key (e.g. `"blue"`, `"red"`), consumed via Tailwind classes
- `Member.panelVisibility` — JSON string array of section names to hide
- `FitnessLog` — `@@unique([memberId, date])`, dates stored as UTC midnight
- `CalendarEvent.eventTime` — stored as string (e.g. `"14:00"`)
- `Grocery.category` — free-text string, default `"Other"`

**Delete cascades**: Cascade for FitnessLog, MemberReadState, MemberAchievement, MemberStats, PhotoFavorite. SetNull for Notes, Todos, Groceries, DiningOut, MealPrepItem, SharedLink, CalendarEvent, RecipeLink, PlannedMeal, Comments.

## Conventions

- `"use client"` on interactive components. Each action module uses `"use server"` (barrel re-export strips the directive).
- Mutations call `revalidatePath("/")`. Member attribution via `getCurrentMemberId()`.
- **Dark mode** toggle in layout calls `updateMemberTheme` server action → `class="dark"` on `<html>`.
- **Unread badges**: `IntersectionObserver` at 25% threshold → `markSectionRead(section)`. Sections: notes, todos, groceries, diningOut, mealPrep, dinners, sharedLinks, recipes (8 sections).
- **LLM**: two backends — local OpenAI-compatible (`callLocalLLM`, per-member serverUrl+model) or Google Gemini (`callGemini`, uses `GEMINI_API_KEY` env var + `@google/genai`). Selected by `Member.aiProvider`. Graceful empty-string fallback on failure.
- **Editing MealPrepItem** does not regenerate the LLM emoji.
- **PWA**: registers SW on network IP; skips + clears caches on localhost.
- **Photos/uploads**: supported types `image/jpeg`, `image/png`, `image/gif`, `image/webp`. Max 10 MB.

## Important Files

| File | Purpose |
|------|---------|
| `lib/prisma.ts` | PrismaClient singleton (globalThis caching) |
| `lib/session.ts` | Cookie-based session helpers |
| `lib/activityStore.ts` | In-memory activity feed (ephemeral) |
| `lib/navigation.tsx` | Nav definitions with `?page=` routing |
| `app/actions/shared.ts` | Action result types, LLM helpers, achievements logic, week bounds |
| `app/actions/backup.ts` | Standalone export/import server action |
| `middleware.ts` | Route guard → redirect to `/login` |
| `UPDATE.md` | June 2026 feature changelog |

## Pages

Dashboard grid: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`. Sub-pages via `/?page=`:
- calendar, weekly-planner, recipes, family-stats, archive

## Files to Read First When Debugging

- `app/page.tsx` — main dashboard + page routing
- `app/layout.tsx` — root layout, nav, theme, activity/achievement dropdowns
- `middleware.ts` — auth guard
- `app/actions/shared.ts` — shared types, LLM abstraction, achievements
