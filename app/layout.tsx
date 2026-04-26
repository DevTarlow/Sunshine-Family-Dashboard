import type { Metadata } from "next";
import "./globals.css";
import { getCurrentMember, getCurrentMemberTheme, getCurrentMemberNotificationsEnabled } from "@/lib/session";
import Link from "next/link";
import { logOut, getAchievementsData, getMemberRefreshSettings } from "@/app/actions";
import { getActivities, getLastSeen } from "@/lib/activityStore";
import ActivityDropdown from "@/app/components/ActivityDropdown";
import AchievementsDropdown from "@/app/components/AchievementsDropdown";
import { MemberPresenceProvider } from "@/app/components/MemberPresenceContext";
import AutoRefresh from "@/app/components/AutoRefresh";
import ProfileModalTrigger from "@/app/components/ProfileModalTrigger";
import SettingsModalTrigger from "@/app/components/SettingsModalTrigger";

export const metadata: Metadata = {
  title: "Sunshine Family Dashboard",
  description: "A local family dashboard with dinners, weather, photos, notes, and lists",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const currentMember = await getCurrentMember();
  const theme = await getCurrentMemberTheme();
  const notificationsEnabled = await getCurrentMemberNotificationsEnabled();
  const refreshSettings = await getMemberRefreshSettings();
  const activities = getActivities();
  const lastSeenMap = getLastSeen();
  const achievementsData = currentMember ? await getAchievementsData() : null;

  return (
    <html lang="en" className={theme === "dark" ? "dark" : ""}>
      <body
        className="bg-gray-50 dark:bg-gray-950 antialiased"
        // Temporarily disabled background image to test CSS
        // style={currentMember?.backgroundImage ? {
        //   backgroundImage: `url(${currentMember.backgroundImage})`,
        //   backgroundSize: "cover",
        //   backgroundPosition: "center",
        //   backgroundAttachment: "fixed",
        // } : undefined}
      >
        {currentMember && (
          <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-3 flex items-center justify-between sticky top-0 z-50 shadow-sm">
            <span className="text-sm font-semibold text-gray-500 dark:text-gray-400 hidden sm:block">
              Sunshine Family Dashboard
            </span>
            <div className="flex items-center gap-4 ml-auto">
              <ProfileModalTrigger member={currentMember} />
              <ActivityDropdown activities={activities} />
              {achievementsData && (
                <AchievementsDropdown
                  allAchievements={achievementsData.allAchievements}
                  earnedAchievements={achievementsData.earnedAchievements.map((e) => ({
                    achievementId: e.achievementId,
                    earnedAt: e.earnedAt instanceof Date ? e.earnedAt.toISOString() : String(e.earnedAt),
                  }))}
                  progress={achievementsData.progress}
                />
              )}
              <SettingsModalTrigger 
                currentTheme={theme} 
                notificationsEnabled={notificationsEnabled}
                camUrl={currentMember?.camUrl ?? null}
                autoRefreshInterval={refreshSettings.autoRefreshInterval}
                vibeRefreshInterval={refreshSettings.vibeRefreshInterval}
              />
              <Link
                href="/login"
                className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors underline"
              >
                Switch Profile
              </Link>
              <form action={logOut}>
                <button
                  type="submit"
                  className="text-xs text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                >
                  Sign out
                </button>
              </form>
            </div>
          </header>
        )}
        <AutoRefresh autoRefreshInterval={refreshSettings.autoRefreshInterval} />
        <MemberPresenceProvider lastSeenMap={lastSeenMap} currentMemberId={currentMember?.id ?? null}>
          {children}
        </MemberPresenceProvider>
      </body>
    </html>
  );
}
