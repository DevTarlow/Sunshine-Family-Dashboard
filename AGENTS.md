# FamilyDashboard — Agent Reference

## Project

**Sunshine Family Dashboard** — local Next.js family sharing app (weather, photos, dinners, fitness, dining-out, todos, groceries, notes, calendar, recipes, weekly planner, stats, archive). Runs on port 3001. Each member has name/emoji/color/accent color.

**Dev:** `npm run dev` in project root

## Stack

Next.js 15 (App Router) · React 19 · TypeScript · Tailwind 3 (darkMode: class) · lucide-react · Prisma 6 · SQLite · Cookie auth · cheerio (OG fetch)

## File Layout

```
app/
  actions/          # 24 modular server action files
    shared.ts       #   shared helpers (LLM, achievements, types)
    members.ts      #   member CRUD, theme, config
    dinners.ts      #   generateCelebration, weekly dinners
    ...
  actions.ts        # barrel re-export
  components/       # 35 React components
  login/            # login page
  layout.tsx        # root layout with nav bars
  page.tsx          # dashboard + ?page= routing
lib/                # prisma, session, activityStore, navigation
prisma/             # schema, migrations, dev.db
public/             # photos/, backgrounds/, Vibe/, icons/, manifest.json, sw.js
middleware.ts       # route guard → /login
```

## .env

```
DATABASE_URL="file:./dev.db"
OPENWEATHERMAP_API_KEY / _CITY / _UNITS
GEMINI_API_KEY (optional)
```

## DB Models (18)

| Model | Key Fields |
|-------|-----------|
| Member | name*, emoji, color, theme, accentColor, notificationsEnabled, backgroundImage, panelVisibility(JSON), camUrl, llmServerUrl, llmModel |
| FitnessLog | memberId, date; unique [memberId,date] |
| Dinner | dayOfWeek*, meal; comments |
| Note | content, createdAt, memberId?; comments; index createdAt |
| Todo | task, isDone, reminderInterval?, lastReminderSentAt?, memberId? |
| Grocery | item, isBought, category(default Other), memberId? |
| GroceryCategory | name*, isDefault |
| DiningOut | amount, description, date; comments; index date |
| MealPrepItem | label, imageUrl, consumptionTime?, memberId?; index createdAt |
| MemberReadState | memberId, section*, lastSeenAt; unique [memberId,section] |
| Achievement | key*, name, emoji, description, category |
| MemberAchievement | memberId, achievementId, earnedAt; unique [memberId,achievementId] |
| MemberStats | memberId*, todosCompleted, photosUploaded |
| PhotoFavorite | memberId, filename*; unique [memberId,filename] |
| SharedLink | url, title, description, memberId?; index createdAt |
| CalendarEvent | title, description, eventDate, eventTime, color; memberId? |
| RecipeLink | url*, title, rating, featured, category; comments, plannedMeals |
| PlannedMeal | mealDate, dayOfWeek, mealTime, mealName, sortOrder; recipeLinkId? |
| ArchivedMeal | originalId?, mealDate, dayOfWeek, mealTime, mealName, recipeLink? |
| ArchivedNote | originalId?, content, createdAt, archivedAt, memberName/Emoji/Color? |
| DeletedTodo | originalId?, task, isDone, createdAt, deletedAt, member meta |
| DeletedMealPrepItem | originalId?, label, imageUrl, consumptionTime?, createdAt, deletedAt |
| FamilySetting | key*, value |
| Comment | content, memberId?, optional parent FK (noteId/diningOutId/dinnerId/recipeLinkId/plannedMealId) |

**Schema changes:** `npx prisma migrate dev --name <desc>` then `npx prisma generate`

## Member Session

- Cookie: `family-member-id` (httpOnly, sameSite: lax)
- `lib/session.ts` — `getCurrentMemberId()`, `getCurrentMember()`, `getCurrentMemberTheme()`
- Login creates/selects member → sets cookie → redirects `/`

## Data Flow

```
page.tsx (server) → Promise.all([queries]) → initialXxx props → client components
  → client calls server action → mutates DB + revalidatePath("/") → re-render
```

All queries/mutations in `app/actions/*.ts` (`"use server"`). Barrel at `app/actions.ts` re‑exports without directive.

## Action Modules (24)

| Module | Actions |
|--------|---------|
| shared | LLM helper, celebrations, achievements seeding/awarding, types, emoji fetch, week bounds |
| members | get/create/select/delete members, theme, notifications, cam URL, LLM config, accent color |
| dinners | get/set/clear/reorder dinners, suggestDinnerIdea |
| notes | CRUD |
| todos | CRUD, toggle (awards achievements) |
| groceries | CRUD, categories CRUD, bulk clear |
| weather | current + 5-day forecast |
| photos | list, upload, delete, favorites |
| backgrounds | list, upload, set, profile data, panel visibility |
| diningOut | entries (current month), last month total, CRUD with achievements |
| fitness | logs (current week), toggle with achievements |
| mealPrep | CRUD (LLM emoji), checkExpiredItems |
| readState | markSectionRead, getUnreadCounts |
| sharedLinks | CRUD |
| activity | getActivityFeed, getMembersLastSeen |
| achievements | getAchievementsData |
| comments | get (by parent type), add, delete |
| stats | getFamilyStats (aggregate) |
| calendarEvents | CRUD (month filter) |
| weeklyPlanner | getWeekStart, get/set planned meals, archive cleanup, getArchivedMeals |
| recipes | paginated list (search/filter), CRUD, categories, export/import, OG metadata fetch |
| archive | archiveOldNotes, getArchivedNotes/DeletedTodos/DeletedMealPrepItems |
| backup | exportData, importData |
| charts | getChartData (6-month monthly stats) |
| atAGlance | computeAtAGlanceSummary, getAtAGlanceData |

## Components (35)

Server: VibeOfTheDay, Weather

Dashboard client: Carousel, WeeklyDinners, FitnessTracker, DiningOut, TodoList, GroceryList, Notes, MealPrepFridge, LinkBoard, CalendarWidget, CannonBeachCam

Page client: Calendar, WeeklyPlanner, RecipeHub, FamilyStatsPage, ArchivePage

Shared: MemberBadge, CelebrationToast, ErrorToast, ImageLightbox, CommentThread, AchievementsDropdown, ActivityDropdown

Modals: ProfileModal, ProfileModalTrigger, SettingsModal, SettingsModalTrigger

Nav: DesktopNav, Sidebar, SidebarToggle, MobileBottomNav, MobileMoreMenu

Infra: AutoRefresh, PwaRegister, MemberPresenceProvider

## Page Layout

Dashboard grid: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`

Sub-pages via `?page=`: calendar, weekly-planner, recipes, family-stats, archive

## Key Conventions

- `"use client"` on interactive components. `"use server"` on each action module.
- Mutations call `revalidatePath("/")`. Member attribution via `getCurrentMemberId()`.
- `onDelete: SetNull` for members (exception: FitnessLog, MemberReadState, MemberAchievement, MemberStats, PhotoFavorite → Cascade).
- Fitness dates = UTC midnight. DiningOut filtered to current calendar month.
- **Dark mode**: `layout.tsx` reads `getCurrentMemberTheme()` → `class="dark"` on `<html>`.
- **Accent color**: stored in `Member.accentColor`, used in UI via Tailwind.
- **Panel visibility**: JSON array in `Member.panelVisibility` — filters dashboard widgets.
- **Unread badges**: `IntersectionObserver` at 25% → `markSectionRead(section)`. Sections: notes, todos, groceries, diningOut, mealPrep, dinners, sharedLinks, recipes.
- **PWA**: registers SW on network IP, skips on localhost (clears caches).
- **LLM**: per-member configured server URL + model. Used by `generateCelebration()`, `fetchFoodEmoji()`, `suggestDinnerIdea()`. Graceful fallback.
- **Recipe OG metadata**: fetched in background via `cheerio` after adding URL.
- **Editing MealPrepItem** does not regenerate the LLM emoji.
- Components import from `@/app/actions` (barrel re-exports all). Types shared via `shared.ts`.
