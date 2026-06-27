import { LayoutDashboard, BarChart3, CalendarDays, Bookmark, ClipboardList, Archive } from "lucide-react";
import type { ReactNode } from "react";

export interface NavItem {
  href: string;
  label: string;
  icon: ReactNode;
  page: string | null;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Dashboard", icon: <LayoutDashboard className="w-5 h-5" />, page: null },
  { href: "/?page=calendar", label: "Calendar", icon: <CalendarDays className="w-5 h-5" />, page: "calendar" },
  { href: "/?page=weekly-planner", label: "Weekly Planner", icon: <ClipboardList className="w-5 h-5" />, page: "weekly-planner" },
  { href: "/?page=family-stats", label: "Family Stats", icon: <BarChart3 className="w-5 h-5" />, page: "family-stats" },
  { href: "/?page=recipes", label: "Recipe Hub", icon: <Bookmark className="w-5 h-5" />, page: "recipes" },
  { href: "/?page=archive", label: "Archive", icon: <Archive className="w-5 h-5" />, page: "archive" },
];

export function isNavItemActive(item: NavItem, pathname: string, searchParams: URLSearchParams): boolean {
  const currentPage = searchParams.get("page");
  if (item.page === null) {
    return pathname === "/" && !searchParams.has("page");
  }
  return pathname === "/" && currentPage === item.page;
}
