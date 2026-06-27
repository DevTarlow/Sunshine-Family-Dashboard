# Sunshine Family Dashboard

The Sunshine Family Dashboard is a lightweight, local-first web app designed to be a simple but effective home dashboard.

Packaged in a single Docker container and built with Next.js and SQLite, it allows your family to manage weekly dinner menus, shared grocery lists, daily to-dos, keep track of fitness days, track eating out costs, and take sticky notes.

It also features a live local weather widget and a rotating carousel of your favorite family photos.

The dashboard uses your local LLM to generate unique recipe ideas, custom toast alerts, and generate a vibe of the day. All AI data is processed through your local LLM which can be setup in settings.

Built with privacy in mind, Family Dashboard requires no cloud databases or subscriptions and it runs entirely on your own local network, ensuring your family's data stays fast, secure, and 100% yours.

This is something my wife and I use daily, so I figured some of you may too. Give it a try!

<img width="1352" height="890" alt="sunshine-family-dashboard-screenshot" src="https://github.com/user-attachments/assets/6519c3e3-5b3a-46ff-ac3b-02dfaa87ccb3" />

More photos and info on my projects page: <a href="https://tarlow.space/projects/sunshine-family-dashboard/">Sunshine Family Dashboard</a>

## Features

### Core
- **Member Profiles** – Each family member has a name, emoji, and color
- **Vibe of the Day** – Daily featured AI quote
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

## Quick Start (Recommended)

### 1. Install Docker

Download and install **Docker Desktop** from: https://www.docker.com/products/docker-desktop

### 2. Start the App

**Windows:** Double-click `start.bat`

**Mac/Linux:** Open a terminal, navigate to this folder, and run:
```bash
./start.sh
```

### 3. Open in Browser

Go to: http://localhost:3000

That's it! The app will open in your browser.

## First-Time Setup

1. On first launch, you'll be asked to create your profile
2. Enter your name, pick an emoji, and choose a color
3. Click "Create Profile" to get started

### Setting Up Weather (Optional)

The weather widget needs an API key to work. You can set this up in the app:

1. Click the **gear icon** in the top-right corner
2. Scroll to "Weather Configuration"
3. Enter your OpenWeatherMap API key, city, and units
4. Click "Save Weather Settings"

**Get a free API key:** https://openweathermap.org/api

### Adding Photos

To add photos to the carousel:

1. Put image files (.jpg, .png, .gif, webp) in the `public/photos/` folder
2. Refresh the page to see them in the carousel

### Configuring AI Features (Optional)

AI features (vibe of the day, dinner suggestions, meal prep thumbnails) require a local LLM.

1. Install a local LLM like LM Studio (https://lmstudio.ai/)
2. Click the **gear icon** in Settings
3. Enter your LLM server URL (e.g., http://localhost:11434)
4. Enter the model name (e.g., google/gemma-4-e4b)
5. Click "Save AI Config"

## Accessing from Other Devices

The app runs on your local network. To access from your phone or other computers:

1. Find your computer's IP address:
   - **Windows:** Open Command Prompt and type `ipconfig`
   - **Mac:** Open Terminal and type `ip addr show`
   - **Linux:** Open Terminal and type `ip addr show`

2. On another device, go to: `http://[your-ip-address]:3000`

## Stopping the App

**Windows:** Press Ctrl+C in the terminal window, then close the window

**Mac/Linux:** Press Ctrl+C in the terminal

## Troubleshooting

### Port 3000 is already in use

If you get an error about port 3000, you can change the port in docker-compose.yml:

```yaml
ports:
  - "3001:3000"  # Change to 3001 or another port
```

Then access the app at http://localhost:3001

### Docker won't start

- Make sure Docker Desktop is running (look for the whale icon in your system tray/menu bar)
- Try restarting Docker Desktop
- If that doesn't work, try restarting your computer

### Photos aren't showing

- Make sure image files are in the `public/photos/` folder (not in a subfolder)
- Supported formats: .jpg, .jpeg, .png, .gif, .webp
- Try refreshing the page (F5 or Ctrl+R)

### Weather shows an error

- Check that your API key is correct in Settings
- Make sure you entered your city name correctly
- Free API keys have limits - wait a few minutes if you've hit the limit

### I deleted my profile

No problem! The login page will let you create a new profile. Your previous data is still in the database.

### I want to start fresh

1. Click the **gear icon**
2. Scroll down to "Data & Reset"
3. Click "Reset database"
4. Confirm twice

This will delete ALL data and let you start fresh.

## Manual Setup (Without Docker)

If you prefer not to use Docker:

### Prerequisites

- Node.js 20+ (https://nodejs.org)
- npm (comes with Node.js)

### Steps

```bash
# Install dependencies
npm install

# Copy the environment file
cp .env.example .env
```

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
