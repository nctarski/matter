/* Where each homepage edit opens when the shopper asks for all of it.
 *
 * An edit with a "rule" (see lib/editrules.js) has its own page, /edit/<key>,
 * built from that rule with the full filter rail. An edit that is really a
 * category goes to the category page. The few old hash edits still open
 * /shop#edit-<key> with these filters set.
 *
 * This file is imported by the shop grid in the browser, so it must not
 * import the catalog. */

export const EDIT_CATEGORIES = {
  outerwear: 'outerwear',
  tailoring: 'tailoring',
  sweaters: 'sweaters',
};

export const EDIT_FILTERS = {
  polo: { nameHas: { words: ['polo', 'henley'], label: 'polos' } },
  fringe: { nameHas: { words: ['fringe'], label: 'fringe' } },
  pure: { threshold: 100, allowStretch: false },
  under300: { maxPrice: 300 },
  cashmere: { fibers: ['Cashmere'] },
};

export const editHref = (block) => {
  const key = block.apply;
  if (key && EDIT_CATEGORIES[key]) return `/shop/${EDIT_CATEGORIES[key]}`;
  if (block.rule) return `/edit/${block.rule}`;
  if (key && EDIT_FILTERS[key]) return `/shop#edit-${key}`;
  return '/shop';
};
