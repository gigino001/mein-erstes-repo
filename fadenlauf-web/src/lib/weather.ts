import type { Wx } from "./prompts";
import { dayStart } from "./util";

const KEY = "fadenlauf-wx";
export const loadWx = (): Wx => {
  try { const w = JSON.parse(localStorage.getItem(KEY) || "null"); if (w && w.day === dayStart()) return { temp: w.temp ?? "", cond: Array.isArray(w.cond) ? w.cond : [] }; } catch { /* leer */ }
  return { temp: "", cond: [] };
};
export const saveWx = (w: Wx) => { try { localStorage.setItem(KEY, JSON.stringify({ day: dayStart(), ...w })); } catch { /* privat */ } };

/** WMO-Wettercode (Open-Meteo) → unsere fünf Chips. */
export function conditionsFrom(code: number, wind: number): string[] {
  const c: string[] = [];
  if (code === 0 || code === 1) c.push("Sonnig"); else if (code === 2 || code === 3 || code === 45 || code === 48) c.push("Bewölkt");
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82) || code >= 95) c.push("Regen");
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) c.push("Schnee");
  if (wind >= 30) c.push("Wind");
  return c;
}

/** Standort-Wetter über Open-Meteo (kein Schlüssel nötig). Nur nach Klick des Nutzers. */
export async function fetchWeather(): Promise<Wx> {
  const pos = await new Promise<GeolocationPosition>((res, rej) => navigator.geolocation.getCurrentPosition(res, rej, { timeout: 10000, maximumAge: 600000 }));
  const { latitude, longitude } = pos.coords;
  const r = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude.toFixed(2)}&longitude=${longitude.toFixed(2)}&current=temperature_2m,weather_code,wind_speed_10m`);
  if (!r.ok) throw new Error("weather");
  const j = await r.json();
  return { temp: String(Math.round(j.current.temperature_2m)), cond: conditionsFrom(j.current.weather_code, j.current.wind_speed_10m) };
}
