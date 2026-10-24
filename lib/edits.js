/* What each curated edit on the homepage opens, by its "apply" key in
 * data/edits.json. An edit that is really a category goes to that category's
 * page. Anything else opens /shop#edit-<key> with these filters set. */

export const EDIT_CATEGORIES = {
  outerwear: 'outerwear',
  tailoring: 'tailoring',
};

export const EDIT_FILTERS = {
  polo: { nameHas: { words: ['polo', 'henley'], label: 'polos' } },
  fringe: { nameHas: { words: ['fringe'], label: 'fringe' } },
  pure: { threshold: 100, allowStretch: false },
  under300: { maxPrice: 300 },
  cashmere: { fibers: ['Cashmere'] },
};

export const editHref = (key) =>
  EDIT_CATEGORIES[key] ? `/shop/${EDIT_CATEGORIES[key]}`
    : EDIT_FILTERS[key] ? `/shop#edit-${key}`
    : '/shop';
