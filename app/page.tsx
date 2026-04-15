import Weather from "@/app/components/Weather";
import VibeOfTheDay from "@/app/components/VibeOfTheDay";
import CannonBeachCam from "@/app/components/CannonBeachCam";
import Carousel from "@/app/components/Carousel";
import TodoList from "@/app/components/TodoList";
import GroceryList from "@/app/components/GroceryList";
import Notes from "@/app/components/Notes";
import WeeklyDinners from "@/app/components/WeeklyDinners";
import DiningOut from "@/app/components/DiningOut";
import FitnessTracker from "@/app/components/FitnessTracker";
import MealPrepFridge from "@/app/components/MealPrepFridge";
import LinkBoard from "@/app/components/LinkBoard";
import { getDinners, getNotes, getTodos, getGroceries, getPhotos, getDiningOutEntries, getFitnessLogs, getMealPrepItems, getUnreadCounts, getFavoritePhotos, getSharedLinks } from "@/app/actions";
import { getCurrentMemberId } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function Home() {
  // Fetch all data in parallel
  const [dinners, notes, todos, groceries, photos, diningOut, fitnessLogs, currentMemberId, mealPrepItems, unreadCounts, favoritePhotos, sharedLinks] = await Promise.all([
    getDinners(),
    getNotes(),
    getTodos(),
    getGroceries(),
    getPhotos(),
    getDiningOutEntries(),
    getFitnessLogs(),
    getCurrentMemberId(),
    getMealPrepItems(),
    getUnreadCounts(),
    getFavoritePhotos(),
    getSharedLinks(),
  ]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-950 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 dark:text-gray-100 text-center">
            Sunshine Family Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-center mt-2">
            "Alone we can do so little, together we can do so much." — Helen Keller
          </p>
        </header>

        {/* Responsive Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-min">
          {/* Vibe of the Day - spans 1 column */}
          <div className="md:col-span-1">
            <VibeOfTheDay />
          </div>

          {/* Weather Widget - spans 1 column */}
          <div className="md:col-span-1">
            <Weather />
          </div>

          {/* Cannon Beach Cam - spans 1 column */}
          <div className="md:col-span-1">
            <CannonBeachCam />
          </div>

          {/* Photo Carousel - spans full width on larger screens */}
          <div className="md:col-span-2 lg:col-span-3">
            <Carousel photos={photos} initialFavorites={favoritePhotos} />
          </div>

          {/* Weekly Dinners - spans full width on mobile, 2 columns on medium+, 3 columns on large */}
          <div className="md:col-span-2 lg:col-span-3">
            <WeeklyDinners initialDinners={dinners} unreadCount={unreadCounts.dinnerComments} />
          </div>

          {/* Fitness Tracker - full width */}
          <div className="md:col-span-2 lg:col-span-3">
            <FitnessTracker initialLogs={fitnessLogs.map(log => ({ ...log, date: log.date.toISOString() }))} currentMemberId={currentMemberId} />
          </div>

          {/* Dining Out Tracker */}
          <div className="md:col-span-1">
            <DiningOut initialEntries={diningOut} unreadCount={unreadCounts.diningOut} />
          </div>

          {/* Todo List */}
          <div className="md:col-span-1">
            <TodoList initialTodos={todos} unreadCount={unreadCounts.todos} />
          </div>

          {/* Grocery List */}
          <div className="md:col-span-1">
            <GroceryList initialGroceries={groceries} unreadCount={unreadCounts.groceries} />
          </div>

          {/* Shared Notes - spans 1 column on medium, can expand to 2 on large if needed */}
          <div className="md:col-span-2 lg:col-span-1">
            <Notes initialNotes={notes} unreadCount={unreadCounts.notes} />
          </div>

          {/* Meal Prep Fridge */}
          <div className="md:col-span-2 lg:col-span-1">
            <MealPrepFridge initialItems={mealPrepItems} unreadCount={unreadCounts.mealPrep} />
          </div>

          {/* Shared Links Board */}
          <div className="md:col-span-2 lg:col-span-1">
            <LinkBoard initialLinks={sharedLinks} unreadCount={unreadCounts.sharedLinks} />
          </div>
        </div>

        <footer className="mt-8 text-center text-gray-500 text-sm">
          <p>© {new Date().getFullYear()} Family Dashboard - Built with Next.js</p>
        </footer>
      </div>
    </main>
  );
}
