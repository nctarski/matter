import guides from '@/data/shopping-guides.json';
import { catalog } from './catalog';
import { liningIsNatural } from './fibers';

/* Shopping guides: an edited answer to one question a shopper actually asks,
 * with the pieces that answer it underneath. The words live in
 * data/shopping-guides.json. The rule that picks the pieces lives here, keyed
 * by the guide's "rule", so the list refreshes itself at every build. */

const share = (comp, test) =>
  (Array.isArray(comp) ? comp : []).filter(([fiber]) => test(fiber.toLowerCase())).reduce((t, [, p]) => t + p, 0);
const ANIMAL_WOOLS = /wool|merino|cashmere|alpaca|mohair|camel|yak/;

export const RULES = {
  'cashmere-sweaters-under-300': (i) =>
    i.category === 'Sweaters' && share(i.shell, (f) => f.includes('cashmere')) === 100 && i.price <= 300,
  'wool-coats-natural-lining': (i) =>
    i.category === 'Outerwear' && share(i.shell, (f) => ANIMAL_WOOLS.test(f)) >= 80 && liningIsNatural(i.lining),
  'silk-dresses': (i) =>
    i.category === 'Dresses' && share(i.shell, (f) => f.includes('silk')) === 100,
};

import { imageAllowed } from './item';

/* "Our three": three photographed pieces that answer the question, spread
 * across the price range (the cheapest that clears the bar, one from the
 * middle, one near the top) and from three different brands where possible,
 * so the shopper sees the shape of the market before the full list. A guide
 * can pin its own three with "picks": [{ id, note }] in the JSON. */
const spread = (pieces) => {
  const shot = pieces.filter((i) => imageAllowed(i) && i.image);
  const pool = shot.length >= 3 ? shot : pieces;
  if (pool.length <= 3) return pool;
  const want = [0, Math.floor(pool.length / 2), pool.length - 1];
  const out = [];
  for (const n of want) {
    let k = n;
    // Walk outward until the brand is one we have not used yet.
    while (k < pool.length && out.some((o) => o.brand === pool[k].brand)) k++;
    if (k >= pool.length) k = n;
    if (!out.includes(pool[k])) out.push(pool[k]);
  }
  return out;
};

export const GUIDES = guides.map((g) => {
  const pieces = catalog.filter(RULES[g.rule]).sort((a, b) => a.price - b.price);
  const byId = Object.fromEntries(pieces.map((i) => [i.id, i]));
  const pinned = (g.picks || []).map((p) => ({ item: byId[p.id], note: p.note })).filter((p) => p.item);
  const three = pinned.length ? pinned : spread(pieces).map((item) => ({ item, note: null }));
  return { ...g, pieces, three };
});

export const guideFromSlug = (slug) => GUIDES.find((g) => g.slug === slug) || null;
