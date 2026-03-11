import type { MetadataRoute } from "next";
import { getBaseUrl } from "@/lib/seo";
import { slugify } from "@/lib/utils";
import {
  getSitemapTakeoffs,
  getSitemapPilots,
  getSitemapWings,
} from "@/lib/queries/sitemap";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getBaseUrl();

  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, changeFrequency: "daily", priority: 1.0 },
    { url: `${baseUrl}/takeoffs`, changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/pilots`, changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/wings`, changeFrequency: "daily", priority: 0.8 },
    { url: `${baseUrl}/flights`, changeFrequency: "daily", priority: 0.8 },
    { url: `${baseUrl}/records`, changeFrequency: "weekly", priority: 0.7 },
  ];

  const [takeoffs, pilots, wings] = await Promise.all([
    getSitemapTakeoffs(),
    getSitemapPilots(),
    getSitemapWings(),
  ]);

  const takeoffPages: MetadataRoute.Sitemap = (takeoffs as any[]).map((t) => ({
    url: `${baseUrl}/takeoffs/${t.id}-${slugify(t.name)}`,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const pilotPages: MetadataRoute.Sitemap = (pilots as any[]).map((p) => ({
    url: `${baseUrl}/pilots/${p.username}`,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  const wingPages: MetadataRoute.Sitemap = (wings as any[]).map((w) => ({
    url: `${baseUrl}/wings/${w.id}-${slugify(w.name)}`,
    changeFrequency: "monthly",
    priority: 0.5,
  }));

  return [...staticPages, ...takeoffPages, ...pilotPages, ...wingPages];
}
