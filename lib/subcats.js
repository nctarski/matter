/* Sub-categories, read from the product name.
 *
 * Only the categories whose names reliably say what the piece is get
 * sub-categories. Sweaters, tops and outerwear name the garment ("Cashmere
 * Crewneck", "Shrunken Polo", "Barn Jacket"). Dresses, pants and skirts mostly
 * do not ("The Marion Dress", "Everywear Pant"), so splitting them by length or
 * leg shape would need a tagging pass from the photo first. Until then they
 * stay whole rather than half sorted.
 *
 * Rules run in order and the first match wins, so put the more specific
 * garment first (a polo collar cardigan is a cardigan, not a polo). A piece
 * that matches nothing still shows under "All" for its category.
 *
 * A sub-category with fewer than MIN_SUB pieces is hidden from the menus, so a
 * shopper never clicks into a near empty shelf. It reappears on its own once
 * the catalog grows into it. */

export const MIN_SUB = 4;

/* The order the menus show, which is not the matching order above: the
 * everyday shapes first, the specialist ones after. */
const SHOW_ORDER = {
  Sweaters: ['Crewnecks', 'Cardigans', 'Turtlenecks', 'V-necks', 'Polos', 'Quarter zips',
    'Vests', 'Sweatshirts and hoodies', 'Knit shirts and tees'],
  Tops: ['Tees', 'Shirts', 'Blouses', 'Tanks and camis', 'Polos', 'Sweatshirts', 'Vests'],
  Outerwear: ['Coats', 'Jackets', 'Vests'],
};

export const SUBCATEGORIES = {
  Sweaters: [
    { label: 'Cardigans', match: /cardigan/ },
    { label: 'Vests', match: /\bvest\b/ },
    { label: 'Polos', match: /polo|henley|rugby/ },
    { label: 'Quarter zips', match: /zip/ },
    { label: 'Turtlenecks', match: /turtle|t-neck|mock|funnel|high neck|stand ?neck|roll neck/ },
    { label: 'V-necks', match: /v-neck|vneck|deep v|\bv neck|double-v|airy v\b/ },
    { label: 'Sweatshirts and hoodies', match: /sweatshirt|hoodie|anorak/ },
    { label: 'Knit shirts and tees', match: /shirt|\btee\b|t - shirt|button down|\bshell\b|\btop\b/ },
    { label: 'Crewnecks', match: /crew|sweater|pullover|jumper|knit/ },
  ],
  Tops: [
    { label: 'Sweatshirts', match: /sweatshirt|hoodie/ },
    { label: 'Polos', match: /polo|henley|rugby/ },
    { label: 'Tees', match: /\btee\b|t-shirt/ },
    { label: 'Tanks and camis', match: /tank|cami|bralette|\bshell\b/ },
    { label: 'Shirts', match: /shirt|button/ },
    { label: 'Blouses', match: /blouse|\btop\b/ },
    { label: 'Vests', match: /\bvest\b/ },
  ],
  Outerwear: [
    { label: 'Vests', match: /\bvest\b/ },
    { label: 'Coats', match: /coat|trench|\bmac\b|balmacaan|cape|poncho|duster|parka/ },
    { label: 'Jackets', match: /jacket|bomber|blouson|blazer|shacket|overshirt|windbreaker|zip-up/ },
  ],
};

/** The sub-category label for a piece, or null. */
export const subOf = (item) => {
  const rules = SUBCATEGORIES[item.category];
  if (!rules) return null;
  const name = item.name.toLowerCase();
  const hit = rules.find((r) => r.match.test(name));
  return hit ? hit.label : null;
};

/** For each category with sub-categories, the ones big enough to show. */
export const subMenus = (items) => {
  const out = {};
  for (const [cat, rules] of Object.entries(SUBCATEGORIES)) {
    const inCat = items.filter((i) => i.category === cat);
    const counts = {};
    for (const i of inCat) {
      const s = subOf(i);
      if (s) counts[s] = (counts[s] || 0) + 1;
    }
    out[cat] = {
      total: inCat.length,
      subs: (SHOW_ORDER[cat] || rules.map((r) => r.label))
        .map((label) => ({ label, count: counts[label] || 0 }))
        .filter((s) => s.count >= MIN_SUB),
    };
  }
  return out;
};
