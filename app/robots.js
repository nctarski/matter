import { SITE } from '@/lib/site';

export default function robots() {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: '/hearts' }],
    sitemap: `${SITE.url}/sitemap.xml`,
  };
}
