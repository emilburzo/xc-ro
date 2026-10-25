export const CAT_COLORS: Record<string, string> = {
  A: "bg-green-100 text-green-800",
  B: "bg-blue-100 text-blue-800",
  C: "bg-yellow-100 text-yellow-800",
  D: "bg-red-100 text-red-800",
  Z: "bg-purple-100 text-purple-800",
  T: "bg-pink-100 text-pink-800",
  HG: "bg-orange-100 text-orange-800",
  RW2: "bg-gray-100 text-gray-800",
  RW5: "bg-gray-100 text-gray-800",
};

export function removeDiacritics(text: string): string {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function slugify(text: string): string {
  return removeDiacritics(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function takeoffPath(id: number, name: string): string {
  return `/takeoffs/${id}-${slugify(name)}`;
}

export function wingPath(id: number, name: string): string {
  return `/wings/${id}-${slugify(name)}`;
}

export function pilotPath(username: string): string {
  return `/pilots/${username}`;
}

export function flightPath(id: number, pilotName: string, takeoffName?: string | null): string {
  const parts = [slugify(pilotName)];
  if (takeoffName) parts.push(slugify(takeoffName));
  const slug = parts.filter(Boolean).join("-");
  return slug ? `/flights/${id}-${slug}` : `/flights/${id}`;
}

export function dailyPath(day?: string): string {
  return day ? `/daily?date=${day}` : "/daily";
}

export function similarFlightsPath(takeoffName: string, distanceKm: number): string {
  const distMin = distanceKm * 0.8;
  const distMax = distanceKm * 1.2;
  const params = new URLSearchParams({
    takeoff: takeoffName,
    distMin: String(distMin),
    distMax: String(distMax),
    sort: "distance",
  });
  return `/flights?${params.toString()}`;
}

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

export function formatDistance(km: number): string {
  return km.toFixed(1);
}

export function formatNumber(n: number): string {
  return n.toLocaleString("ro-RO");
}

export function formatDate(date: string | Date, locale: string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString(locale === "ro" ? "ro-RO" : "en-US");
}

export function formatTime(date: string | Date, locale: string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleTimeString(locale === "ro" ? "ro-RO" : "en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// The scraper stores `start_time` as Romanian wall-clock time, so a flight's
// calendar day is its day in Bucharest
const RO_TIME_ZONE = "Europe/Bucharest";

/** Today's date in Romania, as `YYYY-MM-DD`. */
export function todayInRomania(now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: RO_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const { year, month, day } = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  return `${year}-${month}-${day}`;
}

/** Returns `value` if it is a real `YYYY-MM-DD` calendar date, otherwise null. */
export function parseDay(value: string | undefined): string | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [y, m, d] = value.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  const valid = date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
  return valid ? value : null;
}

/** Formats a `YYYY-MM-DD` calendar day without shifting it through the runtime's time zone. */
export function formatDay(day: string, locale: string, options: Intl.DateTimeFormatOptions): string {
  const [y, m, d] = day.split("-").map(Number);
  return new Intl.DateTimeFormat(locale === "ro" ? "ro-RO" : "en-US", { ...options, timeZone: "UTC" })
    .format(new Date(Date.UTC(y, m - 1, d)));
}

export type FlightTypeKey = "free" | "fai" | "flat";

// The Romania league names flight types in Romanian, the world league in English
export const FLIGHT_TYPE_MAPPING: Record<FlightTypeKey, string[]> = {
  free: ["free flight", "zbor liber"],
  fai: ["FAI triangle", "triunghi FAI"],
  flat: ["flat triangle", "triunghi plat"],
};

export function flightTypeKey(type: string): FlightTypeKey | null {
  const match = (Object.entries(FLIGHT_TYPE_MAPPING) as [FlightTypeKey, string[]][])
    .find(([, variants]) => variants.includes(type));
  return match ? match[0] : null;
}

export function relativeTime(date: Date, locale: string): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return locale === "ro" ? "azi" : "today";
  if (diffDays === 1) return locale === "ro" ? "ieri" : "yesterday";
  if (diffDays < 30) return locale === "ro" ? `acum ${diffDays} zile` : `${diffDays} days ago`;
  if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return locale === "ro" ? `acum ${months} luni` : `${months} months ago`;
  }
  const years = Math.floor(diffDays / 365);
  return locale === "ro" ? `acum ${years} ani` : `${years} years ago`;
}
