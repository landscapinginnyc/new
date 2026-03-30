import type { MetadataRoute } from "next";
import { services, areas, getAllBoroughs, getBoroughUrl, getAreaUrl, getAreaServiceUrl, getServiceUrl } from "@/lib/siteData";
import { blogPosts } from "@/lib/blogPosts";
import { jobs } from "@/lib/jobs";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://www.landscapinginnyc.com";

  /* Static pages */
  const staticPages: MetadataRoute.Sitemap = [
    { url: base, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${base}/services`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/areas`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/estimate`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/faq`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/blog`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/contact`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
  ];

  /* Service pages (18) */
  const servicePages: MetadataRoute.Sitemap = services.map((s) => ({
    url: `${base}${getServiceUrl(s)}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  /* Borough pages (7) */
  const boroughs = getAllBoroughs();
  const boroughPages: MetadataRoute.Sitemap = boroughs.map((b) => ({
    url: `${base}${getBoroughUrl(b.slug)}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  /* Area pages (~137) */
  const areaPages: MetadataRoute.Sitemap = areas.map((a) => ({
    url: `${base}${getAreaUrl(a)}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  /* Area x Service combo pages (~137 x 18 = ~2,466) */
  const areaServicePages: MetadataRoute.Sitemap = [];
  for (const area of areas) {
    for (const service of services) {
      areaServicePages.push({
        url: `${base}${getAreaServiceUrl(area, service)}`,
        lastModified: new Date(),
        changeFrequency: "monthly" as const,
        priority: 0.5,
      });
    }
  }

  /* Blog posts */
  const blogPages: MetadataRoute.Sitemap = blogPosts.map((p) => ({
    url: `${base}/blog/${p.slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  /* Careers pages */
  const careersPages: MetadataRoute.Sitemap = [
    { url: `${base}/careers`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.7 },
  ];

  /* Careers borough pages (7) */
  const careersBoroughPages: MetadataRoute.Sitemap = boroughs.map((b) => ({
    url: `${base}/careers/${b.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  /* Careers area pages (~137) */
  const careersAreaPages: MetadataRoute.Sitemap = areas.map((a) => ({
    url: `${base}/careers/${a.boroughSlug}/${a.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.5,
  }));

  /* Careers job pages (~137 areas x 6 jobs = ~822) */
  const careersJobPages: MetadataRoute.Sitemap = [];
  for (const area of areas) {
    for (const job of jobs) {
      careersJobPages.push({
        url: `${base}/careers/${area.boroughSlug}/${area.slug}/${job.slug}`,
        lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.5,
      });
    }
  }

  /* Legal and guide pages */
  const legalPages: MetadataRoute.Sitemap = [
    { url: `${base}/pricing`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.9 },
    { url: `${base}/about`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.7 },
    { url: `${base}/apply`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.7 },
    { url: `${base}/privacy-policy`, lastModified: new Date(), changeFrequency: "yearly" as const, priority: 0.3 },
    { url: `${base}/terms`, lastModified: new Date(), changeFrequency: "yearly" as const, priority: 0.3 },
    { url: `${base}/landscaping-101`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.8 },
    { url: `${base}/get-a-free-estimate`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.8 },
  ];

  return [...staticPages, ...servicePages, ...blogPages, ...legalPages, ...careersPages, ...careersBoroughPages, ...careersAreaPages, ...careersJobPages, ...boroughPages, ...areaPages, ...areaServicePages];
}
