import { SITE } from '@/lib/site';

export default function robots() {
  // While the catalog is sample data, keep crawlers out entirely. A first
  // crawl of placeholder inventory is a bad way to start a new domain.
  if (!SITE.indexable) {
    return { rules: [{ userAgent: '*', disallow: '/' }] };
  }

  return {
    rules: [{ userAgent: '*', allow: '/', disallow: '/hearts' }],
    sitemap: `${SITE.url}/sitemap.xml`,
  };
}
