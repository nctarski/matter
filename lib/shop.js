import { catalog } from './catalog';
import { slugify } from './item';
import { NAV } from './fibers';
import { subMenus } from './subcats';

/* Shop pages. Each garment category gets its own URL, /shop/sweaters and so
 * on, so the homepage can stay an edited front page instead of carrying the
 * whole catalog, and so Google has a real page to rank for "cashmere
 * sweaters" rather than one long grid. A category with no pieces gets no page,
 * and it comes back on its own once the catalog grows into it. */

export const CATEGORY_PAGES = NAV.filter((n) => n.category)
  .map((n) => ({
    label: n.label,
    category: n.category,
    slug: slugify(n.label),
    count: catalog.filter((i) => i.category === n.category).length,
  }))
  .filter((c) => c.count > 0);

export const categoryFromSlug = (slug) => CATEGORY_PAGES.find((c) => c.slug === slug) || null;

/** Sub-category menus for the category bar, worked out once from the full catalog. */
export const MENUS = subMenus(catalog);

const FOLD = [
  [/wool|merino/i, 'Wool'], [/cotton/i, 'Cotton'], [/cashmere/i, 'Cashmere'], [/silk/i, 'Silk'],
  [/linen|flax/i, 'Linen'], [/leather|suede|shearling/i, 'Leather'], [/alpaca/i, 'Alpaca'], [/mohair/i, 'Mohair'], [/camel/i, 'Camel'], [/hemp/i, 'Hemp'],
];

const TITLE_FIBERS = ['Wool', 'Cashmere', 'Silk', 'Linen', 'Cotton', 'Leather', 'Alpaca', 'Mohair', 'Hemp', 'Camel'];

/** The fibers a set of pieces is mostly made of, most common first. Used in titles. */
export const topFibers = (items, n = 3) => {
  const weight = {};
  for (const i of items) {
    for (const [fiber, pct] of i.shell || []) {
      // Fold the variants into the word people search for: organic cotton
      // and Pima cotton are cotton, merino and virgin wool are wool.
      const key = FOLD.find(([re]) => re.test(fiber))?.[1] || fiber;
      // Titles name only the natural fibers a shopper searches by.
      if (!TITLE_FIBERS.includes(key)) continue;
      weight[key] = (weight[key] || 0) + pct;
    }
  }
  return Object.entries(weight).sort((a, b) => b[1] - a[1]).slice(0, n).map(([f]) => f);
};

/** "Cashmere, Wool and Silk" */
export const listWords = (words) =>
  words.length < 2 ? words.join('') : `${words.slice(0, -1).join(', ')} and ${words[words.length - 1]}`;

/* Brand pages. A brand gets its own page once we carry at least
 * MIN_BRAND_PIECES of its pieces. Below that, a page would be one or two
 * cards and a filter rail, which reads as thin to a shopper and to Google
 * alike. Those brands share /brands/more until they grow into a page, and
 * their old addresses redirect there. */
export const MIN_BRAND_PIECES = 5;

const brandCounts = catalog.reduce((acc, i) => ((acc[i.brand] = (acc[i.brand] || 0) + 1), acc), {});
const allBrands = Object.keys(brandCounts).sort((a, b) => a.localeCompare(b));
export const BIG_BRANDS = allBrands.filter((b) => brandCounts[b] >= MIN_BRAND_PIECES);
export const THIN_BRANDS = allBrands.filter((b) => brandCounts[b] < MIN_BRAND_PIECES);
