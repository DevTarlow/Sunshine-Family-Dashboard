import path from "path";
import fs from "fs/promises";

const VIBE_FILE = path.join(process.cwd(), "public", "Vibe", "vibe-of-the-day-photo.jpg");

export default async function VibeOfTheDay() {
  let mtimeMs: number | null = null;

  try {
    const stat = await fs.stat(VIBE_FILE);
    mtimeMs = stat.mtimeMs;
  } catch {
    // File not found — render placeholder
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden flex flex-col h-full">
      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2">
        <span className="text-xl">✨</span>
        <h2 className="font-semibold text-gray-800 dark:text-gray-100 text-lg">Vibe of the Day</h2>
      </div>

      <div className="relative h-72">
        {mtimeMs !== null ? (
          <img
            src={`/vibe?v=${Math.floor(mtimeMs)}`}
            alt="Vibe of the Day"
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <p className="text-gray-400 dark:text-gray-500 text-sm p-6 text-center">
            No vibe photo found. Drop an image at{" "}
            <code className="font-mono">public/Vibe/vibe-of-the-day-photo.jpg</code>.
          </p>
        )}
      </div>
    </div>
  );
}
