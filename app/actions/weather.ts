"use server";

import { ActionResult, tryAction } from "./shared";

export async function getWeatherData() {
  const apiKey = process.env.OPENWEATHERMAP_API_KEY;
  const city = process.env.OPENWEATHERMAP_CITY || "New York";
  const units = process.env.OPENWEATHERMAP_UNITS || "imperial";
  if (!apiKey || apiKey === "your_api_key_here") {
    return { error: "Please set OPENWEATHERMAP_API_KEY in .env file" };
  }
  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=${units}`;
    const response = await fetch(url, { next: { revalidate: 1800 } });
    if (!response.ok) throw new Error("Weather API request failed");
    const data = await response.json();
    return { temp: Math.round(data.main.temp), description: data.weather[0].description, icon: data.weather[0].icon, city: data.name, units };
  } catch {
    return { error: "Failed to fetch weather data" };
  }
}

export async function getWeatherForecast() {
  const apiKey = process.env.OPENWEATHERMAP_API_KEY;
  const city = process.env.OPENWEATHERMAP_CITY || "New York";
  const units = process.env.OPENWEATHERMAP_UNITS || "imperial";
  if (!apiKey || apiKey === "your_api_key_here") return { days: [] };
  try {
    const url = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${apiKey}&units=${units}`;
    const response = await fetch(url, { next: { revalidate: 1800 } });
    if (!response.ok) return { days: [] };
    const data = await response.json();
    const list: Array<{ dt_txt: string; main: { temp_max: number; temp_min: number }; weather: Array<{ description: string }> }> = data.list;
    const byDate = new Map<string, typeof list>();
    for (const entry of list) {
      const date = entry.dt_txt.split(" ")[0];
      if (!byDate.has(date)) byDate.set(date, []);
      byDate.get(date)!.push(entry);
    }
    const todayStr = new Date().toISOString().split("T")[0];
    const dayAbbrevs = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const days = Array.from(byDate.entries()).slice(0, 5).map(([date, entries], index) => {
      const high = Math.round(Math.max(...entries.map((e) => e.main.temp_max)));
      const low = Math.round(Math.min(...entries.map((e) => e.main.temp_min)));
      const noon = entries.find((e) => e.dt_txt.includes("12:00:00")) ?? entries[Math.floor(entries.length / 2)];
      const description = noon.weather[0].description;
      let label: string;
      if (date === todayStr || index === 0) label = "Today";
      else { const d = new Date(date + "T12:00:00"); label = dayAbbrevs[d.getDay()]; }
      return { label, high, low, description };
    });
    return { days };
  } catch {
    return { days: [] };
  }
}
