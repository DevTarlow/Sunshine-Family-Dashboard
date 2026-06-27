"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Image from "next/image";
import { Camera, ChevronLeft, ChevronRight, Grid2x2, Heart, Loader2, Trash2, X } from "lucide-react";
import { uploadPhoto, deletePhoto, generateCelebration, togglePhotoFavorite } from "@/app/actions";

import CelebrationToast from "./CelebrationToast";

interface CarouselProps {
  photos: string[];
  initialFavorites?: string[];
}

function filenameFromPath(photoPath: string) {
  return photoPath.split("/").pop() ?? photoPath;
}

export default function Carousel({ photos, initialFavorites = [] }: CarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(() =>
    photos.length > 0 ? Math.floor(Math.random() * photos.length) : 0
  );
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [deletingFile, setDeletingFile] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [celebration, setCelebration] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(() => new Set(initialFavorites));
  const [togglingFav, setTogglingFav] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clamp currentIndex when photos list changes (e.g. after delete)
  useEffect(() => {
    if (photos.length > 0 && currentIndex >= photos.length) {
      setCurrentIndex(photos.length - 1);
    }
  }, [photos.length, currentIndex]);

  useEffect(() => {
    if (photos.length === 0 || isPreviewOpen || isGalleryOpen) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % photos.length);
    }, 10000);
    return () => clearInterval(interval);
  }, [photos.length, isPreviewOpen, isGalleryOpen]);

  const goToPrevious = () =>
    setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length);
  const goToNext = () =>
    setCurrentIndex((prev) => (prev + 1) % photos.length);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("photo", file);
    startTransition(async () => {
      await uploadPhoto(formData);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 3000);
      generateCelebration("a family photo was just uploaded to the dashboard").then((msg) => {
        if (msg) setCelebration(msg);
      }).catch(() => {});
    });
  }

  function handleDelete(photoPath: string) {
    const filename = filenameFromPath(photoPath);
    setDeletingFile(filename);
    generateCelebration(`a family photo "${filename}" was removed from the dashboard`).then((msg) => {
      if (msg) setCelebration(msg);
    }).catch(() => {});
    startTransition(async () => {
      await deletePhoto(filename);
      setDeletingFile(null);
    });
  }

  function openLightboxAt(index: number) {
    setCurrentIndex(index);
    setIsGalleryOpen(false);
    setIsPreviewOpen(true);
  }

  function handleToggleFavorite(photoPath: string) {
    setTogglingFav(photoPath);
    // Optimistic update
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(photoPath)) next.delete(photoPath);
      else next.add(photoPath);
      return next;
    });
    startTransition(async () => {
      await togglePhotoFavorite(photoPath);
      setTogglingFav(null);
    });
  }

  // Hidden file input shared between header button and gallery button
  const uploadInput = (
    <input
      ref={fileInputRef}
      type="file"
      accept="image/jpeg,image/png,image/gif,image/webp"
      className="sr-only"
      onChange={handleFileChange}
    />
  );

  const uploadButton = (
    <button
      type="button"
      onClick={() => fileInputRef.current?.click()}
      disabled={isPending}
      className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/40 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 transition disabled:opacity-50"
      aria-label="Upload photo"
    >
      {isPending && !deletingFile ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Camera className="w-4 h-4" />
      )}
      <span className="hidden sm:inline">Upload</span>
    </button>
  );

  return (
    <>
      {uploadInput}
      <CelebrationToast message={celebration} onDismiss={() => setCelebration(null)} />
      {uploadSuccess && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-2 px-4 py-2.5 rounded-lg bg-green-600 text-white text-sm font-medium shadow-lg animate-fade-in pointer-events-none">
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          Photo uploaded!
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        {/* Card header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold dark:text-gray-100">Family Photos</h2>
            {photos.length > 0 && (
              <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                {photos.length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {uploadButton}
            {photos.length > 0 && (
              <button
                type="button"
                onClick={() => setIsGalleryOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 transition"
                aria-label="View all photos"
              >
                <Grid2x2 className="w-4 h-4" />
                <span className="hidden sm:inline">View All</span>
              </button>
            )}
          </div>
        </div>

        {/* Carousel area */}
        {photos.length === 0 ? (
          <div className="bg-gray-100 dark:bg-gray-700 rounded-lg h-[28rem] flex flex-col items-center justify-center gap-3 text-gray-500 dark:text-gray-400">
            <Camera className="w-10 h-10 opacity-40" />
            <p className="text-sm">No photos yet. Upload one to get started!</p>
          </div>
        ) : (
          <div className="relative h-[28rem] bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
            <img
              src={photos[currentIndex]}
              alt={`Photo ${currentIndex + 1}`}
              className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => setIsPreviewOpen(true)}
            />
            <button
              onClick={goToPrevious}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition"
              aria-label="Previous photo"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={goToNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition"
              aria-label="Next photo"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
            {/* Favorite button — top right */}
            <button
              onClick={() => handleToggleFavorite(photos[currentIndex])}
              disabled={isPending}
              className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition disabled:opacity-50"
              aria-label={favorites.has(photos[currentIndex]) ? "Remove from favorites" : "Add to favorites"}
            >
              {togglingFav === photos[currentIndex] && isPending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Heart
                  className={`w-5 h-5 transition ${
                    favorites.has(photos[currentIndex])
                      ? "fill-red-500 text-red-500"
                      : "fill-transparent text-white"
                  }`}
                />
              )}
            </button>
            {/* Dot indicators — only show when ≤ 20 photos to avoid overflow */}
            {photos.length <= 20 && (
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-2">
                {photos.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={`w-2 h-2 rounded-full transition ${
                      index === currentIndex ? "bg-white" : "bg-white/50"
                    }`}
                    aria-label={`Go to photo ${index + 1}`}
                  />
                ))}
              </div>
            )}
            {/* Counter when dots are hidden */}
            {photos.length > 20 && (
              <div className="absolute bottom-2 right-3 text-xs text-white bg-black/50 rounded px-2 py-0.5">
                {currentIndex + 1} / {photos.length}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Full-screen lightbox */}
      {isPreviewOpen && photos.length > 0 && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setIsPreviewOpen(false)}
        >
          <div
            className="relative w-full h-full max-w-5xl flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={photos[currentIndex]}
              alt={`Photo ${currentIndex + 1} – Full Preview`}
              className="max-w-full max-h-full object-contain rounded-lg"
            />
            {/* Prev / Next in lightbox */}
            {photos.length > 1 && (
              <>
                <button
                  onClick={goToPrevious}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition"
                  aria-label="Previous photo"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={goToNext}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition"
                  aria-label="Next photo"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
            <div className="absolute top-4 right-4 flex gap-2">
              <span className="text-white/70 text-sm self-center">
                {currentIndex + 1} / {photos.length}
              </span>
              <button
                onClick={() => setIsPreviewOpen(false)}
                className="bg-white/20 hover:bg-white/40 text-white rounded-full p-2 transition"
                aria-label="Close preview"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Gallery modal */}
      {isGalleryOpen && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setIsGalleryOpen(false)}
        >
          <div
            className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Gallery header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700 shrink-0">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">
                  All Photos
                </h3>
                <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                  {photos.length}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {uploadButton}
                <button
                  onClick={() => setIsGalleryOpen(false)}
                  className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-100 rounded-full p-1.5 transition"
                  aria-label="Close gallery"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Photo grid */}
            <div className="overflow-y-auto p-4 flex-1">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {photos.map((photo, index) => {
                  const filename = filenameFromPath(photo);
                  const isDeleting = deletingFile === filename && isPending;
                  return (
                    <div key={photo} className="relative group aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                      <Image
                        src={photo}
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                        alt={`Photo ${index + 1}`}
                        className="object-cover cursor-pointer transition group-hover:brightness-90"
                        onClick={() => openLightboxAt(index)}
                        unoptimized={photo.endsWith(".gif")}
                        priority={index < 6}
                      />
                      {/* Favorite button */}
                      <button
                        onClick={() => handleToggleFavorite(photo)}
                        disabled={isPending}
                        className="absolute top-1.5 right-1.5 bg-black/60 hover:bg-black/80 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition disabled:cursor-not-allowed"
                        aria-label={favorites.has(photo) ? "Remove from favorites" : "Add to favorites"}
                      >
                        {togglingFav === photo && isPending ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Heart
                            className={`w-3.5 h-3.5 ${
                              favorites.has(photo) ? "fill-red-500 text-red-500" : "fill-transparent text-white"
                            }`}
                          />
                        )}
                      </button>
                      {/* Delete button */}
                      <button
                        onClick={() => handleDelete(photo)}
                        disabled={isPending}
                        className="absolute bottom-1.5 right-1.5 bg-black/60 hover:bg-red-600 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition disabled:cursor-not-allowed"
                        aria-label={`Delete photo ${index + 1}`}
                      >
                        {isDeleting ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                      {/* Index badge */}
                      <div className="absolute top-1.5 left-1.5 bg-black/50 text-white text-xs rounded px-1.5 py-0.5 opacity-0 group-hover:opacity-100 transition">
                        {index + 1}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
