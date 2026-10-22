// Everything about the brand that copy or metadata needs, in one place.

export const SITE = {
  name: 'MATTER',
  tagline: 'Good taste goes deeper',

  // Change this to your real domain before launch. It is used for canonical
  // URLs, the sitemap and social cards, so getting it wrong hurts SEO.
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://mattertheedit.com',

  description:
    'A curated fashion discovery destination for people who care equally about style and material composition. Shell and lining composition read separately on every piece.',

  // Set up at Cloudflare under Email, Email Routing. Free, forwards to your
  // Gmail, and keeps your personal address off a public page.
  email: 'natalie@mattertheedit.com',

  // ONE SWITCH, and it is the important one.
  //
  // While false, every page tells search engines not to index it and robots.txt
  // disallows everything. That is deliberate while the catalog is sample data:
  // a first crawl of placeholder inventory is a bad way to start a new domain,
  // and thin content is hard to recover from.
  //
  // Flip to true once the catalog holds real, verified pieces with working
  // outbound links. Nothing else has to change.
  //
  // Flipped on 10 October 2026, at 29 verified pieces across seven retailers,
  // every link live. Done ahead of the affiliate applications, since a site
  // telling every crawler to stay away is a poor look to a network reviewer,
  // and the SEO clock is the one thing here that cannot be caught up later.
  indexable: true,
};
