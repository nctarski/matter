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

export const GUIDES = guides.map((g) => ({
  ...g,
  pieces: catalog.filter(RULES[g.rule]).sort((a, b) => a.price - b.price),
}));

export const guideFromSlug = (slug) => GUIDES.find((g) => g.slug === slug) || null;
