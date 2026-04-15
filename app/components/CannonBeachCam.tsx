const CAM_URL = "https://camstills.cdn-surfline.com/us-west-2/wc-cannonbeach/latest_full.jpg";

export default function CannonBeachCam() {
  // Cache-buster floored to the nearest hour — image refreshes once per hour
  const hourlyKey = Math.floor(Date.now() / 3_600_000);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden flex flex-col h-full">
      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2">
        <span className="text-xl">🌊</span>
        <h2 className="font-semibold text-gray-800 dark:text-gray-100 text-lg">Cannon Beach Cam</h2>
      </div>

      <div className="relative h-72">
        <img
          src={`${CAM_URL}?v=${hourlyKey}`}
          alt="Cannon Beach live cam"
          className="absolute inset-0 w-full h-full object-cover"
        />
      </div>
    </div>
  );
}
