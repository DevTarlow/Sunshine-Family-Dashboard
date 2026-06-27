import { getWeatherData, getWeatherForecast } from "@/app/actions";
import { Cloud, CloudRain, Sun, CloudSnow, Wind } from "lucide-react";

export default async function Weather() {
  const [weather, forecast] = await Promise.all([getWeatherData(), getWeatherForecast()]);

  if ("error" in weather) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold dark:text-gray-100 mb-4">Weather</h2>
        <p className="text-red-500 dark:text-red-400">{weather.error}</p>
      </div>
    );
  }

  const getWeatherIcon = (description: string, size: "lg" | "sm" = "lg") => {
    const cls = size === "lg" ? "w-12 h-12" : "w-4 h-4";
    const desc = description.toLowerCase();
    if (desc.includes("rain")) return <CloudRain className={`${cls} text-blue-200`} />;
    if (desc.includes("cloud")) return <Cloud className={`${cls} text-blue-200`} />;
    if (desc.includes("snow")) return <CloudSnow className={`${cls} text-blue-100`} />;
    if (desc.includes("clear")) return <Sun className={`${cls} text-yellow-300`} />;
    return <Wind className={`${cls} text-blue-200`} />;
  };

  const unitLabel = weather.units === "imperial" ? "F" : "C";

  return (
    <div className="bg-gradient-to-br from-blue-400 to-blue-600 dark:from-blue-950 dark:to-slate-900 rounded-lg shadow-md p-6 text-white h-full flex flex-col">
      <h2 className="text-xl font-bold mb-4">{weather.city}</h2>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-5xl font-bold">
            {weather.temp}°{unitLabel}
          </div>
          <div className="text-lg capitalize mt-2 text-blue-100">{weather.description}</div>
        </div>
        <div>{getWeatherIcon(weather.description)}</div>
      </div>

      {forecast.days.length > 0 && (
        <>
          <div className="border-t border-blue-300/40 dark:border-blue-800/60 mt-4 pt-4">
            <div className="grid grid-cols-5 gap-1 text-center">
              {forecast.days.map((day) => (
                <div key={day.label} className="flex flex-col items-center gap-1">
                  <span className="text-xs font-semibold text-blue-100 uppercase tracking-wide">
                    {day.label}
                  </span>
                  {getWeatherIcon(day.description, "sm")}
                  <span className="text-sm font-bold leading-none">
                    {day.high}°
                  </span>
                  <span className="text-xs text-blue-200 leading-none">
                    {day.low}°
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
