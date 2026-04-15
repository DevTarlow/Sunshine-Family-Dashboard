# Family Dashboard

A local web application for managing family activities, built with Next.js, TypeScript, and Tailwind CSS.

## Features

- **Weekly Dinners**: Plan meals for each day of the week
- **Weather Widget**: Display current weather conditions (requires OpenWeatherMap API key)
- **Photo Carousel**: Auto-rotating slideshow of family photos
- **Shared Notes**: Collaborative note-taking for family members
- **To-Do List**: Track tasks with checkbox completion
- **Grocery List**: Manage shopping items with "bought" status

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: SQLite
- **ORM**: Prisma
- **Icons**: lucide-react

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Update the `.env` file with your settings:

```env
# OpenWeatherMap API Configuration
OPENWEATHERMAP_API_KEY="your_actual_api_key_here"
OPENWEATHERMAP_CITY="your_city_name"
OPENWEATHERMAP_UNITS="imperial"  # or "metric" for Celsius
```

To get an API key:
1. Visit [OpenWeatherMap](https://openweathermap.org/api)
2. Sign up for a free account
3. Generate an API key
4. Replace `your_actual_api_key_here` with your key

### 3. Add Photos (Optional)

Add image files (`.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`) to the `public/photos/` folder for the carousel feature.

### 4. Start the Development Server

```bash
npm run dev
```

The application will be accessible at:
- **Local**: http://localhost:3000
- **Network**: http://[your-local-ip]:3000

The `-H 0.0.0.0` flag allows access from other devices on your local network.

## Usage

### Weekly Dinners
- Click "Add" next to any day to set a dinner plan
- Click "Edit" to modify an existing plan
- Click the "X" to clear a plan

### Weather
- Updates automatically based on your configured city
- Shows temperature, conditions, and icon
- Data refreshes every 10 minutes

### Photo Carousel
- Automatically rotates every 10 seconds
- Use arrow buttons to navigate manually
- Click dots at the bottom to jump to specific photos

### Shared Notes
- Add notes using the text area at the top
- Click "Edit" to modify existing notes
- Click the "X" to delete notes
- Shows timestamp of last update

### To-Do List
- Add tasks using the input field
- Click checkbox to mark as complete
- Click "X" to delete tasks

### Grocery List
- Add items using the input field
- Click checkbox to mark as bought  
- Click "X" to remove items

## Database

The app uses SQLite with Prisma ORM. The database file is located at `prisma/dev.db`.

To reset the database:

```bash
rm prisma/dev.db
npx prisma db push
```

## Building for Production

```bash
npm run build
npm start
```

## Network Access

The app is configured to be accessible on your local network. Find your local IP address:

**Linux/Mac:**
```bash
ip addr show  # Linux
ifconfig      # Mac
```

**Windows:**
```cmd
ipconfig
```

Then access from other devices at: `http://[your-ip]:3000`

## Project Structure

```
FamilyDashboard/
├── app/
│   ├── actions.ts           # Server Actions for data mutations
│   ├── components/          # React components
│   │   ├── Carousel.tsx
│   │   ├── GroceryList.tsx
│   │   ├── Notes.tsx
│   │   ├── TodoList.tsx
│   │   ├── Weather.tsx
│   │   └── WeeklyDinners.tsx
│   ├── globals.css          # Global styles
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Home page
├── lib/
│   └── prisma.ts            # Prisma client instance
├── prisma/
│   ├── schema.prisma        # Database schema
│   └── dev.db               # SQLite database (generated)
├── public/
│   └── photos/              # Photo carousel images
├── .env                     # Environment variables
└── package.json             # Dependencies and scripts
```

## License

MIT
