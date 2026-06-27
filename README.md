# Sunshine Family Dashboard

A local web application for managing family activities, built with Next.js 15, TypeScript, and Tailwind CSS. Runs on your local network for shared family access.

## Features

### Core
- **Member Profiles** – Each family member has a name, emoji, and color
- **Vibe of the Day** – Daily featured photo
- **Weather Widget** – Current conditions + 5‑day forecast (OpenWeatherMap)
- **Photo Carousel** – Auto‑rotating family photo slideshow with favorites and upload

### Planning & Tracking
- **Weekly Dinners** – 7‑day dinner grid with drag‑to‑reorder, AI suggestions, comments
- **Weekly Meal Planner** – Full weekly meal planner with breakfast/lunch/dinner slots, recipe links
- **Grocery List** – Categorized shopping list with copy‑to‑clipboard
- **To‑Do List** – Tasks with completion tracking, reminder intervals, achievements
- **Dining Out Log** – Monthly expense tracking with per‑member totals and last month comparison

### Communication
- **Shared Notes** – Collaborative note‑taking with edit history
- **Comment Threads** – Inline replies on notes, dinners, dining entries, and planned meals
- **Link Board** – Family bookmarks board
- **Activity Feed** – Recent family activity log

### Health & Lifestyle
- **Fitness Tracker** – Weekly workout logging per member
- **Meal Prep Fridge** – Track prepped meals with LLM‑generated emojis, consumption windows, and expiry alerts

### Organization
- **Calendar** – Monthly events with color‑coding, add/edit/delete
- **Recipe Hub** – Bookmark recipes with OG metadata, ratings, categories, search, featured sorting
- **Family Stats** – Aggregate statistics with 6‑month charts (dining, workouts, todos, photos)
- **Archive** – Browse archived notes, deleted todos, and deleted meal prep items
- **Achievements** – Gamification system with 12 badges across fitness, todos, photos, and dining

### Administration
- **Settings Modal** – Theme toggle, accent color, auto‑refresh, notifications, camera URL, AI configuration, widget visibility, data backup/restore
- **Profile Modal** – Member backgrounds, favorite photos, personal stats
- **Data Backup/Restore** – Export/import all database content as JSON

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| UI Library | React 19 |
| Language | TypeScript |
| Styling | Tailwind CSS 3 |
| Icons | lucide-react |
| Database | SQLite |
| ORM | Prisma 6 |
| AI | OpenAI‑compatible local LLM (optional) |

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy `.env` and fill in your values:

```env
# Database
DATABASE_URL="file:./dev.db"

# OpenWeatherMap (required for weather)
OPENWEATHERMAP_API_KEY="your_api_key_here"
OPENWEATHERMAP_CITY="your_city_name"
OPENWEATHERMAP_UNITS="imperial"  # or "metric"

# Google Gemini API (optional – used for dinner suggestions, celebrations)
GEMINI_API_KEY="your_gemini_api_key"
```

Get keys at:
- **OpenWeatherMap**: https://openweathermap.org/api
- **Gemini API**: https://ai.google.dev/

### 3. Initialize the Database

```bash
npx prisma migrate dev
```

### 4. Add Photos (Optional)

Add image files to `public/photos/` for the carousel feature. Add background images to `public/backgrounds/`. Set the Vibe of the Day at `public/Vibe/vibe-of-the-day-photo.jpg`.

### 5. Configure a Local LLM (Optional)

For AI features (dinner suggestions, food emojis, celebrations), configure a local LLM server in Settings → Local AI Configuration. Supports any OpenAI‑compatible endpoint (Ollama, LM Studio, etc.).

### 6. Start the Development Server

```bash
npm run dev
```

The application is accessible at:
- **Local**: http://localhost:3000
- **Network**: http://[your-local-ip]:3000 (the `-H 0.0.0.0` flag enables LAN access)

## Usage

### Navigation
- **Desktop**: Use the top navigation bar or click the hamburger menu for the sidebar
- **Mobile**: Use the bottom navigation bar or the "More" menu (three dots)
- **Pages**: Dashboard (`/`), Calendar (`/?page=calendar`), Weekly Planner (`/?page=weekly-planner`), Recipe Hub (`/?page=recipes`), Family Stats (`/?page=family-stats`), Archive (`/?page=archive`)

### Per‑Member Settings
Each family member has their own theme (light/dark), accent color, notification preferences, LLM configuration, and widget visibility. Click the gear icon in the header to open Settings.

### Unread Badges
Six sections (Notes, Todos, Groceries, DiningOut, MealPrep, SharedLinks) show red badges when other members added items. Badges clear automatically when you view the section.

## Project Structure

```
FamilyDashboard/
├── app/
│   ├── actions/             # Modular server actions (24 modules)
│   │   ├── members.ts
│   │   ├── dinners.ts
│   │   ├── calendarEvents.ts
│   │   ├── recipes.ts
│   │   ├── weeklyPlanner.ts
│   │   ├── charts.ts
│   │   └── ...
│   ├── actions.ts           # Barrel re‑export of all action modules
│   ├── components/          # All React components
│   ├── login/               # Login page
│   ├── layout.tsx           # Root layout with navigation
│   ├── page.tsx             # Dashboard + multi‑page routing
│   └── globals.css          # Global styles
├── lib/
│   ├── prisma.ts            # Prisma client singleton
│   ├── session.ts           # Session helpers
│   ├── activityStore.ts     # In‑memory activity log
│   └── navigation.tsx       # Navigation item definitions
├── prisma/
│   ├── schema.prisma        # DB schema (18 models)
│   ├── migrations/          # Migration history
│   └── dev.db               # SQLite database
├── public/
│   ├── photos/              # Family photos for Carousel
│   ├── backgrounds/         # Background images for Profile modal
│   ├── Vibe/                # Vibe of the Day photo
│   ├── icons/               # PWA icons
│   ├── manifest.json        # PWA manifest
│   └── sw.js                # Service worker
├── middleware.ts            # Route guard
├── .env                     # Environment variables
└── package.json
```

## PWA Support

The dashboard can be installed as a Progressive Web App on supported devices for a native‑like experience. Tap "Add to Home Screen" in your browser.

## Database

SQLite via Prisma. The database file is at `prisma/dev.db`.

**Reset:**
```bash
rm prisma/dev.db
npx prisma migrate dev
```

**Browse (Prisma Studio):**
```bash
npx prisma studio
```

## Building for Production

```bash
npm run build
npm start
```

## License

MIT
