import Weather from "@/app/components/Weather";
import VibeOfTheDay from "@/app/components/VibeOfTheDay";
import CannonBeachCam from "@/app/components/CannonBeachCam";
import Carousel from "@/app/components/Carousel";
import TodoList from "@/app/components/TodoList";
import GroceryList from "@/app/components/GroceryList";
import Notes from "@/app/components/Notes";
import DiningOut from "@/app/components/DiningOut";
import FitnessTracker from "@/app/components/FitnessTracker";
import MealPrepFridge from "@/app/components/MealPrepFridge";
import LinkBoard from "@/app/components/LinkBoard";
import Calendar from "@/app/components/Calendar";
import WeeklyPlanner from "@/app/components/WeeklyPlanner";
import TodayMeals from "@/app/components/TodayMeals";
import RecipeHub from "@/app/components/RecipeHub";
import FamilyStatsPage from "@/app/components/FamilyStatsPage";
import ArchivePage from "@/app/components/ArchivePage";
import { getNotes, getTodos, getGroceries, getPhotos, getDiningOutEntries, getFitnessLogs, getMealPrepItems, getUnreadCounts, getFavoritePhotos, getSharedLinks, getCamUrl, getFamilyStats, getChartData } from "@/app/actions";
import { getCurrentMemberId } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const page = params.page;

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  if (page === "calendar") {
    return (
      <main className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-950 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <header className="mb-8">
            <a href="/">
              <img src="/app-photos/sunshine-dashboard.png" alt="Sunshine Family Dashboard" className="w-auto mx-auto block" />
            </a>
            <p className="text-gray-600 dark:text-gray-400 text-center mt-4">
              Family events and important dates
            </p>
          </header>
          <Calendar />
          <footer className="mt-8 text-center text-gray-500 text-sm">
            <p>© {new Date().getFullYear()} Family Dashboard - Built with Next.js</p>
          </footer>
        </div>
      </main>
    );
  }

  if (page === "weekly-planner") {
    return (
      <main className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-950 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <header className="mb-8">
            <a href="/">
              <img src="/app-photos/sunshine-dashboard.png" alt="Sunshine Family Dashboard" className="w-auto mx-auto block" />
            </a>
            <p className="text-gray-600 dark:text-gray-400 text-center mt-4">
              Plan your family meals for the week
            </p>
          </header>
          <WeeklyPlanner />
          <footer className="mt-8 text-center text-gray-500 text-sm">
            <p>© {new Date().getFullYear()} Family Dashboard - Built with Next.js</p>
          </footer>
        </div>
      </main>
    );
  }

  if (page === "recipes") {
    return (
      <main className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-950 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <header className="mb-8">
            <a href="/">
              <img src="/app-photos/sunshine-dashboard.png" alt="Sunshine Family Dashboard" className="w-auto mx-auto block" />
            </a>
            <p className="text-gray-600 dark:text-gray-400 text-center mt-4">
              Your family recipe collection
            </p>
          </header>
          <RecipeHub />
          <footer className="mt-8 text-center text-gray-500 text-sm">
            <p>© {new Date().getFullYear()} Family Dashboard - Built with Next.js</p>
          </footer>
        </div>
      </main>
    );
  }

  if (page === "family-stats") {
    const [stats, chartData] = await Promise.all([
      getFamilyStats(),
      getChartData(),
    ]);
    return (
      <main className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-950 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <header className="mb-8">
            <a href="/">
              <img src="/app-photos/sunshine-dashboard.png" alt="Sunshine Family Dashboard" className="w-auto mx-auto block" />
            </a>
            <p className="text-gray-600 dark:text-gray-400 text-center mt-4">
              Track your family&apos;s activity and progress
            </p>
          </header>
          <FamilyStatsPage stats={stats} chartData={chartData} />
          <footer className="mt-8 text-center text-gray-500 text-sm">
            <p>© {new Date().getFullYear()} Family Dashboard - Built with Next.js</p>
          </footer>
        </div>
      </main>
    );
  }

  if (page === "archive") {
    return (
      <main className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-950 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <header className="mb-8">
            <a href="/">
              <img src="/app-photos/sunshine-dashboard.png" alt="Sunshine Family Dashboard" className="w-auto mx-auto block" />
            </a>
            <p className="text-gray-600 dark:text-gray-400 text-center mt-4">
              Browse archived notes, todos, and meal prep items
            </p>
          </header>
          <ArchivePage />
          <footer className="mt-8 text-center text-gray-500 text-sm">
            <p>© {new Date().getFullYear()} Family Dashboard - Built with Next.js</p>
          </footer>
        </div>
      </main>
    );
  }

  // Default dashboard
  const [notes, todos, groceries, photos, diningOut, fitnessLogs, currentMemberId, mealPrepItems, unreadCounts, favoritePhotos, sharedLinks, camUrl] = await Promise.all([
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
    getCamUrl(),
  ]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-950 p-4 md:p-8 pb-24 lg:pb-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <a href="/">
            <img src="/app-photos/sunshine-dashboard.png" alt="Sunshine Family Dashboard" className="w-auto mx-auto block" />
          </a>
          <p className="text-gray-600 dark:text-gray-400 text-center mt-4">
            &ldquo;Alone we can do so little, together we can do so much.&rdquo; &mdash; Helen Keller
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-min">
          <div className="md:col-span-1">
            <VibeOfTheDay />
          </div>

          <div className="md:col-span-1">
            <Weather />
          </div>

          <div className="md:col-span-1">
            <CannonBeachCam initialCamUrl={camUrl} />
          </div>

          <div className="md:col-span-2 lg:col-span-3">
            <Carousel photos={photos} initialFavorites={favoritePhotos} />
          </div>

          <div className="md:col-span-1 lg:col-span-2">
            <TodayMeals />
          </div>

          <div className="md:col-span-1 lg:col-span-1">
            <MealPrepFridge initialItems={mealPrepItems} unreadCount={unreadCounts.mealPrep} />
          </div>

          <div className="md:col-span-2 lg:col-span-3">
            <FitnessTracker initialLogs={fitnessLogs.map((log: any) => ({ ...log, date: log.date.toISOString() }))} currentMemberId={currentMemberId} />
          </div>

          <div className="md:col-span-1">
            <DiningOut initialEntries={diningOut} unreadCount={unreadCounts.diningOut} />
          </div>

          <div className="md:col-span-1">
            <TodoList initialTodos={todos} unreadCount={unreadCounts.todos} />
          </div>

          <div className="md:col-span-1">
            <GroceryList initialGroceries={groceries} unreadCount={unreadCounts.groceries} />
          </div>

          <div className="md:col-span-2 lg:col-span-1">
            <Notes initialNotes={notes} unreadCount={unreadCounts.notes} />
          </div>

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
