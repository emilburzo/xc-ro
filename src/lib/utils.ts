export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
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
