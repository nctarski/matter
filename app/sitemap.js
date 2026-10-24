import guides from '@/data/guides.json';
import { BRANDS, slugify } from '@/lib/catalog';
import { SITE } from '@/lib/site';
import { CATEGORY_PAGES } from '@/lib/shop';

export default function sitemap() {
  const now = new Date();
  return [
    { url: SITE.url, lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: `${SITE.url}/shop`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    ...CATEGORY_PAGES.map((c) => ({
      url: `${SITE.url}/shop/${c.slug}`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    })),
    { url: `${SITE.url}/learn`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE.url}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    // Low priority, but affiliate reviewers and Google both like to see that
    // these exist and are reachable.
    { url: `${SITE.url}/disclosure`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${SITE.url}/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${SITE.url}/terms`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    ...BRANDS.map((b) => ({
      url: `${SITE.url}/brand/${slugify(b)}`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.7,
    })),
    ...guides.map((g) => ({
      url: `${SITE.url}/learn/${g.slug}`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    })),
  ];
}
