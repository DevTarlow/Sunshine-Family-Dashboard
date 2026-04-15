"use client";

import { useEffect, useState, useTransition } from "react";
import Image from "next/image";
import {
  X,
  Heart,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Dumbbell,
  CheckSquare,
  Camera,
  UtensilsCrossed,
  StickyNote,
  ShoppingCart,
  Star,
  Trophy,
} from "lucide-react";
import {
  getProfileData,
  togglePhotoFavorite,
} from "@/app/actions";

interface Member {
  id: number;
  name: string;
  emoji: string;
  color: string;
  backgroundImage?: string | null;
  createdAt: Date | string;
}

interface ProfileModalProps {
  member: Member;
  isOpen: boolean;
  onClose: () => void;
}

const colorMap: Record<string, string> = {
  blue: "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300",
  red: "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300",
  green: "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300",
  purple: "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300",
  orange: "bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300",
  pink: "bg-pink-100 dark:bg-pink-900/40 text-pink-700 dark:text-pink-300",
  yellow: "bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300",
  teal: "bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300",
};

type ProfileData = Awaited<ReturnType<typeof getProfileData>>;

export default function ProfileModal({ member, isOpen, onClose }: ProfileModalProps) {
  const [profileData, setProfileData] = useState<ProfileData>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [togglingFav, setTogglingFav] = useState<string | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setIsLoading(true);
    getProfileData().then((data) => {
      setProfileData(data);
      if (data) setFavorites(new Set(data.favoritePhotos));
      setIsLoading(false);
    });
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const colorClass = colorMap[member.color] ?? colorMap.blue;
  const memberSince = profileData?.stats.memberSince
    ? new Date(profileData.stats.memberSince).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : "";

  function handleToggleFavorite(filename: string) {
    setTogglingFav(filename);
    const next = new Set(favorites);
    if (next.has(filename)) {
      next.delete(filename);
    } else {
      next.add(filename);
    }
    setFavorites(next);
    startTransition(async () => {
      await togglePhotoFavorite(filename);
      setTogglingFav(null);
    });
  }

  const favoritesList = profileData ? [...favorites] : [];
  const stats = profileData?.stats;

  const statCards = stats
    ? [
        { icon: <Dumbbell className="w-5 h-5" />, label: "Workouts Logged", value: stats.fitnessLogs, color: "text-green-600 dark:text-green-400" },
        { icon: <CheckSquare className="w-5 h-5" />, label: "Todos Completed", value: stats.todosCompleted, color: "text-blue-600 dark:text-blue-400" },
        { icon: <Camera className="w-5 h-5" />, label: "Photos Uploaded", value: stats.photosUploaded, color: "text-purple-600 dark:text-purple-400" },
        { icon: <UtensilsCrossed className="w-5 h-5" />, label: "Dining Out Entries", value: stats.diningOutEntries, color: "text-orange-600 dark:text-orange-400" },
        { icon: <StickyNote className="w-5 h-5" />, label: "Notes Created", value: stats.notesCreated, color: "text-yellow-600 dark:text-yellow-400" },
        { icon: <ShoppingCart className="w-5 h-5" />, label: "Groceries Added", value: stats.groceriesAdded, color: "text-teal-600 dark:text-teal-400" },
        { icon: <Heart className="w-5 h-5" />, label: "Favorite Photos", value: stats.favoritePhotos, color: "text-red-600 dark:text-red-400" },
        { icon: <Trophy className="w-5 h-5" />, label: "Achievements Earned", value: stats.achievementsEarned, color: "text-amber-600 dark:text-amber-400" },
      ]
    : [];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Modal panel */}
        <div
          className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 shrink-0">
            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">My Profile</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-full p-1.5 transition"
              aria-label="Close profile"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable content */}
          <div className="overflow-y-auto flex-1 p-6 space-y-8">
            {isLoading ? (
              <div className="flex items-center justify-center py-20 text-gray-400">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            ) : (
              <>
                {/* ── Profile Header ── */}
                <div className="flex items-center gap-5">
                  <div className={`w-20 h-20 rounded-full flex items-center justify-center text-4xl shrink-0 ${colorClass}`}>
                    {member.emoji}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{member.name}</h3>
                    {memberSince && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-1">
                        <Star className="w-3.5 h-3.5" />
                        Member since {memberSince}
                      </p>
                    )}
                  </div>
                </div>

                {/* ── Favorite Photos ── */}
                <section>
                  <h4 className="text-base font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2 mb-3">
                    <Heart className="w-4 h-4 text-red-500" />
                    Favorite Photos
                    {favoritesList.length > 0 && (
                      <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full font-normal">
                        {favoritesList.length}
                      </span>
                    )}
                  </h4>
                  {favoritesList.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 gap-2 text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800 rounded-xl">
                      <Heart className="w-8 h-8 opacity-30" />
                      <p className="text-sm">No favorites yet — tap the ❤️ on any photo.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {favoritesList.map((photo, index) => {
                        const isToggling = togglingFav === photo && isPending;
                        return (
                          <div key={photo} className="relative group aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                            <Image
                              src={photo}
                              fill
                              sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                              alt={`Favorite photo ${index + 1}`}
                              className="object-cover cursor-pointer transition group-hover:brightness-90"
                              onClick={() => setLightboxIndex(index)}
                              unoptimized={photo.endsWith(".gif")}
                            />
                            {/* Unfavorite button */}
                            <button
                              onClick={() => handleToggleFavorite(photo)}
                              disabled={isPending}
                              className="absolute top-1.5 right-1.5 bg-black/60 hover:bg-red-600 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition disabled:cursor-not-allowed"
                              aria-label="Remove from favorites"
                            >
                              {isToggling ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Heart className="w-3.5 h-3.5 fill-red-400 text-red-400" />
                              )}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>

                {/* ── Stats ── */}
                <section>
                  <h4 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-3">My Stats</h4>
                  {statCards.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {statCards.map((stat) => (
                        <div
                          key={stat.label}
                          className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 flex flex-col gap-2"
                        >
                          <div className={stat.color}>{stat.icon}</div>
                          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stat.value}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 leading-tight">{stat.label}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center py-8 text-gray-400">
                      <Loader2 className="w-5 h-5 animate-spin" />
                    </div>
                  )}
                </section>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox for favorite photos */}
      {lightboxIndex !== null && favoritesList.length > 0 && (
        <div
          className="fixed inset-0 bg-black/95 z-[200] flex items-center justify-center p-4"
          onClick={() => setLightboxIndex(null)}
        >
          <div
            className="relative w-full h-full max-w-5xl flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={favoritesList[lightboxIndex]}
              alt={`Favorite photo ${lightboxIndex + 1}`}
              className="max-w-full max-h-full object-contain rounded-lg"
            />
            {favoritesList.length > 1 && (
              <>
                <button
                  onClick={() => setLightboxIndex((prev) => (prev! - 1 + favoritesList.length) % favoritesList.length)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition"
                  aria-label="Previous"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={() => setLightboxIndex((prev) => (prev! + 1) % favoritesList.length)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition"
                  aria-label="Next"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
            <div className="absolute top-4 right-4 flex gap-2 items-center">
              <span className="text-white/70 text-sm">{lightboxIndex + 1} / {favoritesList.length}</span>
              <button
                onClick={() => setLightboxIndex(null)}
                className="bg-white/20 hover:bg-white/40 text-white rounded-full p-2 transition"
                aria-label="Close"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
