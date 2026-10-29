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
  'quince-cashmere': (i) =>
    i.brand === 'Quince' && share(i.shell, (f) => f.includes('cashmere')) > 0,
  // The everyday shapes, in merino, cashmere or a blend of the two.
  'merino-or-cashmere': (i) =>
    ['Sweaters', 'Tops'].includes(i.category) &&
    EVERYDAY.test(i.name) &&
    (share(i.shell, (f) => f.includes('merino')) >= 95 ||
      share(i.shell, (f) => f.includes('cashmere')) === 100 ||
      (share(i.shell, (f) => f.includes('merino')) > 0 &&
        share(i.shell, (f) => f.includes('cashmere')) > 0 &&
        share(i.shell, (f) => NATURAL.test(f)) >= 95)),
  'bright-purple': (i) => (i.tags || []).includes('bright-purple'),
  linen: (i) =>
    !['Sleep & lounge', 'Undergarments'].includes(i.category) &&
    share(i.shell, (f) => /linen|flax/.test(f)) >= 50 &&
    share(i.shell, (f) => NATURAL.test(f)) >= 95,
};

const EVERYDAY = /crew|v-neck|vneck|\bv neck|turtleneck|mock|pullover|jumper|\bsweater\b/i;
const NATURAL = /wool|merino|cashmere|alpaca|mohair|camel|yak|silk|cotton|linen|flax|hemp|ramie/;
const WASHED = /wash|garment.?dye|stonewash|twill|canvas|heavy|crinkle|gauze|slub/i;

/* Orders a guide can ask for with "sort". The default is lowest price first. */
const SORTS = {
  'merino-first': (a, b) => {
    const tier = (i) =>
      share(i.shell, (f) => f.includes('cashmere')) === 100 ? 2
        : share(i.shell, (f) => f.includes('merino')) >= 95 ? 0 : 1;
    return tier(a) - tier(b) || a.price - b.price;
  },
  // Silk, wool and cashmere first, since protein fibers hold the dye best.
  'protein-first': (a, b) => {
    const p = (i) => share(i.shell, (f) => /silk|wool|merino|cashmere|alpaca|mohair|camel|yak/.test(f));
    return (p(b) >= 50) - (p(a) >= 50) || a.price - b.price;
  },
  // Blends first, then washed and twill linen, then the rest.
  'crease-first': (a, b) => {
    const tier = (i) =>
      share(i.shell, (f) => /linen|flax/.test(f)) < 100 ? 0 : WASHED.test(i.name) ? 1 : 2;
    return tier(a) - tier(b) || a.price - b.price;
  },
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

const ALL = Object.fromEntries(catalog.map((i) => [i.id, i]));

/* A guide's "three" is either spread automatically across its own pieces, or
 * pinned in the JSON as { heading, by, labels, picks: [{ id, note }] }. Pinned
 * picks can come from anywhere in the catalog, so a guide about one brand can
 * set it beside the same garment from two others. A pinned piece that has
 * sold out or left the catalog drops out, and if fewer than two remain the
 * guide falls back to the automatic spread. */
export const GUIDES = guides.map((g) => {
  const pieces = catalog.filter(RULES[g.rule]).sort(SORTS[g.sort] || ((a, b) => a.price - b.price));
  const spec = g.three || {};
  const pinned = (spec.picks || g.picks || []).map((p, n) => ({ item: ALL[p.id], note: p.note || null, label: spec.labels?.[n] })).filter((p) => p.item);
  const three = pinned.length >= 2
    ? pinned
    : spread(pieces).map((item, n) => ({ item, note: null, label: ['Entry', 'Middle', 'Top'][n] }));
  return {
    ...g,
    pieces,
    three,
    threeHeading: pinned.length >= 2 && spec.heading ? spec.heading : 'Our three',
    threeBy: pinned.length >= 2 && spec.by ? spec.by : 'Low, middle and top of the range',
    orderNote: g.orderNote || 'lowest price first',
  };
});

export const guideFromSlug = (slug) => GUIDES.find((g) => g.slug === slug) || null;
