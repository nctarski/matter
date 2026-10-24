import sitemap from '@/app/sitemap';
import { SITE } from '@/lib/site';

/* IndexNow tells Bing and the other engines that use it which pages exist.
 * Bing feeds Copilot and other AI search tools, so new pieces and
 * pages are picked up in days instead of weeks. Vercel calls this once a day
 * on the schedule in vercel.json. The key file at /7b74d12255ff6a06a064eb9fce0d7661.txt proves we own
 * the site. */

export const dynamic = 'force-dynamic';
const KEY = '7b74d12255ff6a06a064eb9fce0d7661';

export async function GET(request) {
  const ua = request.headers.get('user-agent') || '';
  if (!ua.includes('vercel-cron')) return new Response('Not found', { status: 404 });
  const host = new URL(SITE.url).host;
  const urlList = sitemap().map((e) => e.url);
  const res = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ host, key: KEY, keyLocation: `${SITE.url}/${KEY}.txt`, urlList }),
  });
  return Response.json({ submitted: urlList.length, status: res.status });
}
