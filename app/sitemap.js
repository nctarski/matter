import guides from '@/data/guides.json';
import { slugify } from '@/lib/catalog';
import { GUIDES } from '@/lib/guides';
import { SITE } from '@/lib/site';
import { BIG_BRANDS, CATEGORY_PAGES } from '@/lib/shop';
import { EDIT_RULES } from '@/lib/editrules';

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
    { url: `${SITE.url}/guides`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    ...GUIDES.map((g) => ({
      url: `${SITE.url}/guides/${g.slug}`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    })),
    { url: `${SITE.url}/brands`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${SITE.url}/brands/more`, lastModified: now, changeFrequency: 'weekly', priority: 0.4 },
    ...Object.keys(EDIT_RULES).map((key) => ({
      url: `${SITE.url}/edit/${key}`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.8,
    })),
    ...BIG_BRANDS.map((b) => ({
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
