"use client";

import { useState, useEffect } from "react";

const DEFAULT_CAM_URL = "https://camstills.cdn-surfline.com/us-west-2/wc-cannonbeach/latest_full.jpg";

interface CannonBeachCamProps {
  initialCamUrl?: string | null;
}

export default function CannonBeachCam({ initialCamUrl }: CannonBeachCamProps) {
  const [camUrl, setCamUrl] = useState(initialCamUrl || DEFAULT_CAM_URL);

  // Listen for CAM URL changes from settings
  useEffect(() => {
    const handler = (e: CustomEvent) => {
      if (e.detail?.camUrl) {
        setCamUrl(e.detail.camUrl);
      }
    };
    window.addEventListener("camUrlChanged" as any, handler as any);
    return () => window.removeEventListener("camUrlChanged" as any, handler as any);
  }, []);

  // Cache-buster floored to the nearest hour — image refreshes once per hour
  const hourlyKey = Math.floor(Date.now() / 3_600_000);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden flex flex-col h-full">
      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2">
        <span className="text-xl">📸</span>
        <h2 className="font-semibold text-gray-800 dark:text-gray-100 text-lg">Live Camera Snapshot</h2>
      </div>

      <div className="relative h-72">
        <img
          src={`${camUrl}?v=${hourlyKey}`}
          alt="Live cam"
          className="absolute inset-0 w-full h-full object-cover"
          onError={(e) => {
            // If the custom URL fails, fall back to default
            const target = e.currentTarget;
            if (target.src !== `${DEFAULT_CAM_URL}?v=${hourlyKey}`) {
              target.src = `${DEFAULT_CAM_URL}?v=${hourlyKey}`;
            }
          }}
        />
      </div>
    </div>
  );
}
