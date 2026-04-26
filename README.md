# Family Dashboard

The Sunshine Family Dashboard is a lightweight, local-first web app designed to be a simple but effective home dashboard.

Packaged in a single Docker container and built with Next.js and SQLite, it allows your family to manage weekly dinner menus, shared grocery lists, daily to-dos, keep track of fitness days, track eating out costs, and take sticky notes.

It also features a live local weather widget and a rotating carousel of your favorite family photos.

The dashboard uses your local LLM to generate unique recipe ideas, custom toast alerts, and generate a vibe of the day. All AI data is processed through your local LLM which can be setup in settings.

Built with privacy in mind, Family Dashboard requires no cloud databases or subscriptions and it runs entirely on your own local network, ensuring your family’s data stays fast, secure, and 100% yours.

This is something my wife and I use daily, so I figured some of you may too. Give it a try!

## Features

- **Weather** - Current conditions for your city
- **Photo Carousel** - Auto-rotating family photos
- **Weekly Dinners** - Plan meals for each day
- **Fitness Tracker** - Track daily exercise for the whole family
- **Dining Out Log** - Track restaurant visits
- **To-Do List** - Family task list with checkboxes
- **Grocery List** - Shopping list with "bought" status
- **Notes** - Shared notes for the family
- **Meal Prep** - Plan weekly meal prep items
- **Achievements** - Earn badges for family activities
- **Vibe of the Day** - AI-generated uplifting message
- **And more!** - Explore the dashboard to discover all features

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

# Start the development server
npm run dev
```

Then open http://localhost:3000

## Tech Details

- **Framework:** Next.js 15 (App Router)
- **Database:** SQLite (stored in prisma/dev.db)
- **ORM:** Prisma
- **Styling:** Tailwind CSS

## License

MIT