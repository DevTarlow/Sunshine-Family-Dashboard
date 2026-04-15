# FamilyDashboard — Agent Reference

> **Keep this file updated.** When you add a new component, model, action, or change project structure, update the relevant section here so future agents don't need to re-read the whole codebase.

---

## Project Overview

**Sunshine Family Dashboard** — a local Next.js web app for a family to share a dashboard with weather, photos, weekly dinners, fitness tracking, dining-out tracking, todos, groceries, and notes. Each family member has a profile (name, emoji, color). The app runs locally on the network (`-H 0.0.0.0`, port 3000).

**Dev command:** `npm run dev` (in `/home/tarlow/Documents/VS Code Stuff/FamilyDashboard/`)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| UI Library | React 19 |
| Language | TypeScript |
| Styling | Tailwind CSS 3 (`darkMode: "class"`) |
| Icons | lucide-react |
| ORM | Prisma 6 |
| Database | SQLite (`prisma/dev.db`) |
| Auth | Cookie-based member session (no passwords) |

---

## Project Structure

```
FamilyDashboard/
├── app/
│   ├── layout.tsx           # Root layout — sticky header with member name (ProfileModalTrigger), dark mode toggle (Moon/Sun), + sign out
│   ├── page.tsx             # Home page (server component) — fetches all data in parallel
│   ├── globals.css          # Global styles
│   ├── actions.ts           # ALL server actions (mutations + queries)
│   ├── components/
│   │   ├── Carousel.tsx         # Photo carousel, auto-rotates 10s, full-screen modal, ❤️ favorite buttons
│   │   ├── DiningOut.tsx        # Current-month dining out tracker with total
│   │   ├── FitnessTracker.tsx   # Weekly fitness log grid, per-member checkboxes
│   │   ├── GroceryList.tsx      # Grocery list, toggle bought, clipboard copy
│   │   ├── MemberBadge.tsx      # Colored pill badge for member display
│   │   ├── Notes.tsx            # Create/edit/delete notes inline
│   │   ├── ProfileModal.tsx     # Full-screen profile modal (backgrounds, favorites, stats)
│   │   ├── ProfileModalTrigger.tsx # Clickable member name/emoji in header → opens ProfileModal
│   │   ├── TodoList.tsx         # Checkbox todo list, per-member attribution
│   │   ├── Weather.tsx          # Server component, OpenWeatherMap widget
│   │   └── WeeklyDinners.tsx    # 7-day dinner planner, upsert per day
│   └── login/
│       ├── page.tsx             # Login server page (fetches members list)
│       └── LoginPage.tsx        # Login client component (select or create member)
├── lib/
│   ├── prisma.ts            # Prisma client singleton
│   └── session.ts           # getCurrentMemberId(), getCurrentMember()
├── prisma/
│   ├── schema.prisma        # DB schema (source of truth for models)
│   └── dev.db               # SQLite database file (not committed to git)
├── public/
│   ├── backgrounds/         # Background images served by profile modal — drop images here
│   └── photos/              # Family photos served by Carousel — drop images here
├── middleware.ts            # Route guard: redirects to /login if no member cookie
├── .env                     # Local env vars (never commit)
├── AGENTS.md                # ← This file
└── package.json
```

---

## Environment Variables (`.env`)

```env
DATABASE_URL="file:./dev.db"
OPENWEATHERMAP_API_KEY=<real key>
OPENWEATHERMAP_CITY=gresham
OPENWEATHERMAP_UNITS=imperial
GEMINI_API_KEY=<real key>
```

Weather city and units are read by `getWeatherData()` in `actions.ts`.

---

## Database Models (`prisma/schema.prisma`)

| Model | Key Fields | Notes |
|---|---|---|
| `Member` | `id`, `name` (unique), `emoji`, `color`, `theme`, `backgroundImage`, `createdAt` | Relations to all other models; `theme` is `"light"` or `"dark"`; `backgroundImage` is a nullable path string (e.g. `/backgrounds/abc.jpg`) |
| `FitnessLog` | `id`, `memberId`, `date` (UTC midnight DateTime) | Unique on `[memberId, date]`; onDelete: Cascade |
| `Dinner` | `id`, `dayOfWeek` (unique), `meal` | e.g. `dayOfWeek = "Monday"` |
| `Note` | `id`, `content`, `createdAt`, `updatedAt`, `memberId?` | onDelete: SetNull |
| `Todo` | `id`, `task`, `isDone`, `memberId?` | onDelete: SetNull |
| `Grocery` | `id`, `item`, `isBought`, `memberId?` | onDelete: SetNull |
| `DiningOut` | `id`, `amount` (Float), `description`, `date`, `memberId?` | onDelete: SetNull; month-filtered |
| `MealPrepItem` | `id`, `label`, `imageUrl` (base64 data URI), `createdAt`, `updatedAt`, `memberId?` | onDelete: SetNull; image generated via Gemini API on create |
| `MemberReadState` | `id`, `memberId`, `section` (String), `lastSeenAt` (DateTime) | Unique on `[memberId, section]`; onDelete: Cascade; tracks when each member last viewed each section |
| `Achievement` | `id`, `key` (unique), `name`, `emoji`, `description`, `category` | Static definitions; seeded lazily by `ensureAchievementsSeeded()` |
| `MemberAchievement` | `id`, `memberId`, `achievementId`, `earnedAt` | Unique on `[memberId, achievementId]`; onDelete: Cascade |
| `MemberStats` | `id`, `memberId` (unique), `todosCompleted`, `photosUploaded` | Per-member counters used for achievement progress tracking; onDelete: Cascade |
| `PhotoFavorite` | `id`, `memberId`, `filename` (e.g. `/photos/abc.jpg`) | Unique on `[memberId, filename]`; onDelete: Cascade; per-member photo favorites |
| `Comment` | `id`, `content`, `createdAt`, `memberId?`, `noteId?`, `diningOutId?`, `dinnerId?` | Exactly one of noteId/diningOutId/dinnerId is set; onDelete: Cascade (parent) / SetNull (member); light reply threads on Notes, DiningOut entries, and Dinners |
| `SharedLink` | `id`, `url`, `title`, `description` (default `""`), `createdAt`, `memberId?` | onDelete: SetNull; family bookmarks with optional description |

**After any schema change:** run `npx prisma migrate dev --name <description>` then `npx prisma generate`.

> **Note:** `Todo` and `Grocery` have a `createdAt DateTime @default(now())` field used for unread-state tracking.

---

## Member Session

- Cookie name: `family-member-id` (httpOnly, sameSite: lax)
- `lib/session.ts` — `getCurrentMemberId()` reads cookie → returns `number | null`
- `lib/session.ts` — `getCurrentMember()` queries DB for the full member record
- `lib/session.ts` — `getCurrentMemberTheme()` returns `"light" | "dark"` for the current member (defaults to `"light"` for guests)
- `middleware.ts` — redirects unauthenticated requests (no valid cookie) to `/login`
- Login creates or selects a member, sets the cookie, and redirects to `/`

**Member colors** (used in `MemberBadge.tsx` colorMap): `blue | red | green | purple | orange | pink | yellow | teal`

---

## Data Flow Pattern

```
page.tsx (server)
  └── Promise.all([...all queries...])
        └── passes as initialXxx props to client components
              └── client component calls server action on user interaction
                    └── server action mutates DB + calls revalidatePath("/")
                          └── Next.js re-renders the page with fresh data
```

- **Client components receive `initialXxx` props** — they do NOT hold a local copy of the data; server revalidation drives updates.
- All queries and mutations live in `app/actions.ts` with `"use server"` directive.
- `page.tsx` has `export const dynamic = "force-dynamic"` to prevent caching.

---

## Server Actions (`app/actions.ts`)

### Members
| Action | Description |
|---|---|
| `getMembers()` | All members ordered by createdAt |
| `createAndSelectMember(formData)` | Create new member, set cookie, redirect `/` |
| `selectMember(id)` | Set cookie for existing member, redirect `/` |
| `deleteMember(id)` | Delete member (items → SetNull), clear cookie if self |
| `logOut()` | Delete cookie, redirect `/login` |
| `updateMemberTheme(formData)` | Toggle `theme` field (`"light"` ↔ `"dark"`), `revalidatePath("/")` |

### Celebrations
| Action | Description |
|---|---|
| `generateCelebration(context)` | Calls `gemini-2.5-flash-lite` with a context string; returns a short silly rhyme or celebratory message (1-2 sentences, emojis welcome). Returns `""` on missing key or error. No DB writes, no `revalidatePath`. Used by 7 client components after successful mutations. |

### Dinners
| Action | Description |
|---|---|
| `getDinners()` | All Dinner records |
| `setDinner(dayOfWeek, meal)` | Upsert by dayOfWeek |
| `clearDinner(dayOfWeek)` | Delete dinner for that day |
| `suggestDinnerIdea()` | Fetches current week's dinners, calls `gemini-2.5-flash-lite` to suggest one new dinner idea not already on the list; returns suggestion string or `""` on error/missing key — no DB writes, no `revalidatePath` |

### Notes
| Action | Description |
|---|---|
| `getNotes()` | All notes desc by createdAt, includes member |
| `createNote(content)` | Create with current memberId |
| `updateNote(id, content)` | Update content |
| `deleteNote(id)` | Delete by id |

### Todos
| Action | Description |
|---|---|
| `getTodos()` | All todos asc by id, includes member |
| `createTodo(task)` | Create with current memberId |
| `toggleTodo(id, isDone)` | Update isDone |
| `deleteTodo(id)` | Delete by id |

### Groceries
| Action | Description |
|---|---|
| `getGroceries()` | All groceries asc by id, includes member |
| `createGrocery(item)` | Create with current memberId |
| `toggleGrocery(id, isBought)` | Update isBought |
| `deleteGrocery(id)` | Delete by id |

### Photo Favorites
| Action | Description |
|---|---|
| `getFavoritePhotos()` | Returns `string[]` of favorited filenames for current member |
| `togglePhotoFavorite(filename)` | Upsert/delete `PhotoFavorite` for current member; returns `{ favorited: boolean }` |

### Backgrounds
| Action | Description |
|---|---|
| `getBackgrounds()` | Reads `public/backgrounds/`, returns `/backgrounds/<file>` paths; returns `[]` if dir is empty/missing |
| `uploadBackground(formData)` | Same secure pattern as `uploadPhoto` — validates MIME + ≤10MB, safe filename, writes to `public/backgrounds/`, `revalidatePath("/")` |
| `setMemberBackground(filename \| null)` | Updates `member.backgroundImage`; pass `null` to clear; `revalidatePath("/")` |
| `getProfileData()` | Bundled lazy-fetch: returns `{ backgrounds, favoritePhotos, stats }` — stats include 8 all-time count queries; called when profile modal opens |

### Weather
| Action | Description |
|---|---|
| `getWeatherData()` | Fetches OpenWeatherMap, cached 10min |

### Photos
| Action | Description |
|---|---|
| `getPhotos()` | Reads `public/photos/`, returns `/photos/<file>` paths |
| `uploadPhoto(formData)` | Validates MIME type + size (≤10MB), writes to `public/photos/` with a generated safe filename (never uses original name), `revalidatePath("/")` |
| `deletePhoto(filename)` | Validates no path separators or `..`, unlinks `public/photos/<filename>`, `revalidatePath("/")` |

### DiningOut
| Action | Description |
|---|---|
| `getDiningOutEntries()` | Current month only, includes member |
| `addDiningOutEntry(amount, description, date)` | Create entry |
| `updateDiningOutEntry(id, amount, description, date)` | Update entry |
| `deleteDiningOutEntry(id)` | Delete entry |

### Fitness
| Action | Description |
|---|---|
| `getFitnessLogs()` | Current week (Mon–Sun UTC), includes member |
| `toggleFitnessLog(dateStr)` | Toggle log for current member on given date |

### Meal Prep Fridge
| Action | Description |
|---|---|
| `getMealPrepItems()` | All items desc by createdAt, includes member |
| `createMealPrepItem(label)` | Calls `gemini-2.5-flash-lite` to get a food emoji, stores label + imageUrl + memberId |
| `updateMealPrepItem(id, label)` | Updates label only (no emoji regen) |
| `deleteMealPrepItem(id)` | Delete by id |

### Read State
| Action | Description |
|---|---|
- `markSectionRead(section)` | Upsert `MemberReadState` for current member + section, sets `lastSeenAt = now()`. Valid sections: `notes`, `todos`, `groceries`, `diningOut`, `mealPrep`, `dinners`, `sharedLinks`
| `getUnreadCounts()` | Returns `{ notes, todos, groceries, diningOut, mealPrep, dinnerComments, sharedLinks }` — count of items (and comments) created by other members after current member's `lastSeenAt`. `notes` and `diningOut` include comment counts. `dinnerComments` is separate for WeeklyDinners badge. |

### Achievements
| Action | Description |
|---|---|
| `getAchievementsData()` | Seeds definitions, returns `{ allAchievements, earnedAchievements, progress }` for current member |
| `ensureAchievementsSeeded()` | Private helper — upserts all 12 achievement definitions by `key` |
| `checkAndAwardAchievements(memberId, context)` | Private helper — checks & awards newly earned badges for a given context (`fitness`, `todo`, `photos`, `dining`) |

### Comments
| Action | Description |
|---|---|
| `getCommentsForNote(noteId)` | Returns `CommentWithMember[]` asc by createdAt for a given note |
| `getCommentsForDiningOut(entryId)` | Returns `CommentWithMember[]` asc by createdAt for a given DiningOut entry |
| `getCommentsForDinner(dinnerId)` | Returns `CommentWithMember[]` asc by createdAt for a given Dinner |
| `addComment(content, target)` | Creates a Comment with `noteId`, `diningOutId`, or `dinnerId`; logs activity; `revalidatePath("/")` |
| `deleteComment(id)` | Deletes by id; `revalidatePath("/")` — any family member can delete any comment |

### Shared Links
| Action | Description |
|---|---|
| `getSharedLinks()` | All links desc by createdAt, includes member |
| `createSharedLink(url, title, description)` | Create with current memberId; logs activity; `revalidatePath("/")` |
| `updateSharedLink(id, url, title, description)` | Update all three fields; logs activity; `revalidatePath("/")` |
| `deleteSharedLink(id)` | Delete by id; logs activity; `revalidatePath("/")` |

> **Gemini usage in `actions.ts`:** `fetchFoodEmoji(label)` (private helper) generates a food emoji for MealPrepFridge items. `suggestDinnerIdea()` generates a dinner suggestion for WeeklyDinners. Both use `model: "gemini-2.5-flash-lite"` and `GEMINI_API_KEY` from `.env`.

---

## Components Quick Reference

| File | Type | Props | What it does |
|---|---|---|---|
| `VibeOfTheDay.tsx` | Server | none | Displays `public/Vibe/vibe-of-the-day-photo.jpg`; `stat()`s file for `mtimeMs` cache-buster in URL (`/vibe?v=<mtime>`); graceful placeholder if file missing |
| `Weather.tsx` | Server | none | Calls `getWeatherData()` directly, renders weather card |
| `Carousel.tsx` | Client | `photos: string[]`, `initialFavorites?: string[]` | Auto-rotating photo carousel, click for full-screen lightbox; **❤️ Favorite** button top-right of main carousel (filled red = favorited); **Upload** button (camera icon, auto-submits on file pick via hidden `<input>`); **View All** button opens a full-screen gallery grid modal with delete per photo (trash icon on hover) AND favorite toggle (heart icon on hover); `useTransition` for pending state; optimistic favorite updates |
| `WeeklyDinners.tsx` | Client | `initialDinners`, `unreadCount: number` | 7-day dinner grid, inline edit per day; drag-to-reorder; "Generate AI Suggestion" button; unread badge for new dinner comments; `MessageSquare` chat icon per day with a set meal → opens `CommentThread` below that row |
| `FitnessTracker.tsx` | Client | `initialLogs`, `currentMemberId` | Weekly grid of all members, checkbox to log workout |
| `DiningOut.tsx` | Client | `initialEntries`, `unreadCount: number` | Month's dining-out log, shows running total |
| `TodoList.tsx` | Client | `initialTodos`, `unreadCount: number` | Add/toggle/delete todos with member badge |
| `GroceryList.tsx` | Client | `initialGroceries`, `unreadCount: number` | Add/toggle/delete groceries, copy-to-clipboard |
| `Notes.tsx` | Client | `initialNotes`, `unreadCount: number` | Add/edit/delete notes inline with member badge |
| `MemberBadge.tsx` | Client | `name`, `emoji`, `color` | Colored pill badge, uses Tailwind colorMap |
| `CelebrationToast.tsx` | Client | `message: string \| null`, `onDismiss: () => void` | Fixed bottom-center amber toast with 🎉 prefix; auto-dismisses after 6s; click to dismiss early; slide-up animation; renders null when message is empty |
| `CommentThread.tsx` | Client | `parentType: "note" \| "diningOut" \| "dinner"`, `parentId: number` | Inline reply thread; fetches comments on mount via the appropriate server action; scrollable list with MemberBadge + timestamp + hover-to-delete; controlled text input + Send button; any member can delete any comment; optimistic local delete |
| `MealPrepFridge.tsx` | Client | `initialItems: MealPrepItem[]`, `unreadCount: number` | Add/edit/delete meal prep items; Gemini-generated thumbnail per item |
| `AchievementsDropdown.tsx` | Client | `allAchievements`, `earnedAchievements`, `progress` | Trophy icon in header; dropdown grouped by category (Fitness/To-Do/Photos/Dining Out); earned badges show date; unearned show description + progress bar |
| `ProfileModal.tsx` | Client | `member`, `isOpen`, `onClose` | Full-screen modal with 3 sections: Background chooser (grid + upload), Favorite Photos gallery (lightbox on click, unfavorite on hover), Stats grid (8 metric cards) |
| `ProfileModalTrigger.tsx` | Client | `member` | Renders member emoji+name as a clickable `<button>` in the header; manages `isOpen` state; renders `<ProfileModal>` when open |
| `LinkBoard.tsx` | Client | `initialLinks: SharedLink[]`, `unreadCount: number` | Family bookmarks board; add form with URL (type="url"), title (required), and optional description; items show title as `<a target="_blank" rel="noopener noreferrer">` with ExternalLink icon; inline edit for all three fields; MemberBadge + date; IntersectionObserver unread badge via `markSectionRead("sharedLinks")`; celebration toast on add/delete |

## Page Layout (`page.tsx`)

Grid layout using `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`:

| Widget | Grid span |
|---|---|
| Vibe of the Day | 1 col (first in grid) |
| Weather | 1 col |
| Carousel | Full width (3 cols lg) |
| WeeklyDinners | Full width (3 cols lg) |
| FitnessTracker | Full width (3 cols lg) |
| DiningOut | 1 col |
| TodoList | 1 col |
| GroceryList | 1 col |
| Notes | 1 col (md: 2 col, lg: 1 col) |
| MealPrepFridge | 1 col (md: 2 col, lg: 1 col) |

---

## Common Dev Tasks

### Adding a new component
1. Create `app/components/MyComponent.tsx`
2. Add relevant server actions to `app/actions.ts` under a clearly labelled section
3. If new data is needed, add the model to `prisma/schema.prisma` and migrate
4. Import and fetch data in `app/page.tsx` (add to `Promise.all`)
5. Add the component to `page.tsx` JSX with its grid span
6. Update this file: **Components Quick Reference**, **Server Actions**, **DB Models**, and **Page Layout**

### Adding a new Prisma model
1. Add to `prisma/schema.prisma`
2. Run: `npx prisma migrate dev --name add-<model-name>`
3. Run: `npx prisma generate` (usually auto-triggered by migrate)
4. Add queries/mutations to `app/actions.ts`
5. Update the **Database Models** table in this file

### Running the project
```bash
cd "/home/tarlow/Documents/VS Code Stuff/FamilyDashboard"
npm run dev
# Runs on http://0.0.0.0:3001 — accessible on local network
```

**Port policy:** Always run on port **3001**. If port 3001 is already occupied (e.g. a stale instance), kill it first:
```bash
fuser -k 3001/tcp   # kill any fallback instance too
pkill -f "next dev"
npm run dev
```
Never let Next.js auto-fallback to 3001 — always clear the port and relaunch on 3000.

### Prisma Studio (DB browser)
```bash
npx prisma studio
```

---

## Known Patterns & Conventions

- **`"use server"`** at the top of `actions.ts` — all exports are server actions
- **`"use client"`** at the top of every interactive component
- All mutations call `revalidatePath("/")` to trigger page refresh
- Member attribution: most create actions call `getCurrentMemberId()` and store `memberId` (nullable)
- `onDelete: SetNull` — deleting a member leaves their items in place but unattributed
- `onDelete: Cascade` — deleting a member removes their FitnessLog entries
- Fitness dates are stored as **UTC midnight** (`Date.UTC(y, m, d)`) to prevent timezone shift bugs
- DiningOut entries are filtered to the **current calendar month** in the query
- Photos are served from `public/photos/` — just drop image files there, no config needed
- **Dark mode** uses Tailwind's `class` strategy — `layout.tsx` reads `getCurrentMemberTheme()` and applies `class="dark"` to `<html>`. Theme is per-member, stored in `Member.theme`. The toggle is a `<form>` with `action={updateMemberTheme}` — no client JS needed. All components use `dark:` Tailwind variants (gray-800 cards, gray-700 rows, gray-100/gray-400 text)
- **Unread badges** — six sections (Notes, Todos, Groceries, DiningOut, MealPrep, SharedLinks) show a red pill badge when other members have added items since the current member last viewed that section. Badge clears via `IntersectionObserver` at 25% visibility, calling `markSectionRead(section)` server action. State is optimistic (local `markedRead` flag) and persists server-side in `MemberReadState`. `getUnreadCounts()` is fetched in `page.tsx` `Promise.all` and passed as `unreadCount` prop to each component.
- Weather is a **server component** that fetches directly (not passed as a prop from page.tsx)
- MealPrepFridge images use **Gemini image generation** (`gemini-2.5-flash-lite` via `@google/genai`) — requires `GEMINI_API_KEY` in `.env`; image stored as base64 data URI in `imageUrl` column
- Editing a MealPrepItem label does **not** regenerate the image — edit is label-only for speed
