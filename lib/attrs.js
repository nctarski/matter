/* Attributes a shopper narrows by inside a category, where the garment name
 * does not say what the piece is ("The Marion Dress"). Dresses first, owner
 * decision 2026-10-28; pants and skirts can follow the same shape.
 *
 * Each piece can carry item.attrs, set by the sweep from the retailer's
 * product page (description, tags, photo). Where that is missing, the name
 * is read as a first pass. The product page wins over the name. A value the
 * catalog cannot fill stays unknown and the piece still shows under "All". */

export const ATTRS = {
  Dresses: [
    { key: 'occasion', label: 'Occasion', values: ['everyday', 'cocktail', 'black tie'] },
    { key: 'length', label: 'Length', values: ['mini', 'midi', 'maxi'] },
    { key: 'sleeve', label: 'Sleeve', values: ['sleeveless', 'short sleeve', 'long sleeve'] },
  ],
};

/** Fewer pieces than this and a chip is hidden, so nobody clicks into an empty shelf. */
export const MIN_ATTR = 4;

const NAME_RULES = {
  length: [
    ['maxi', /\bmaxi\b|\bgown\b|floor|full.?length|ankle/i],
    ['midi', /\bmidi\b|mid.?length|tea.?length|below.the.knee/i],
    ['mini', /\bmini\b|\bshort dress\b|\bshort\b/i],
  ],
  sleeve: [
    ['sleeveless', /sleeveless|strapless|\btank\b|\bcami\b|\bslip\b|halter|bandeau|\btube\b|one.?shoulder|spaghetti/i],
    ['short sleeve', /short.?sleeve|t-shirt dress|\btee dress|cap.?sleeve|flutter.?sleeve|puff.?sleeve/i],
    ['long sleeve', /long.?sleeve|\bls\b|turtleneck|high.?neck|funnel|sweater dress|knit dress|shirt.?dress|shirtdress|trench dress/i],
  ],
  occasion: [
    ['black tie', /\bgown\b|evening|floor.?length|\bball\b/i],
    ['cocktail', /cocktail|sequin|satin|velvet|lace|embroider|feather|metallic|lam[eé]\b|party|strapless|bias|organza|taffeta|tulle|beaded|corset/i],
    ['everyday', /\btee\b|t-shirt|sweater|knit|shirt|denim|cotton|linen|poplin|jersey|smocked|tiered|polo|corduroy|cord\b|flannel|midi|mini|day dress|sundress|wrap/i],
  ],
};

/** What the name alone says, for one attribute. */
export const guessAttr = (item, key) => {
  const rules = NAME_RULES[key] || [];
  const hit = rules.find(([, re]) => re.test(item.name));
  return hit ? hit[0] : null;
};

/** The piece's attributes: what the sweep read, then what the name says. */
export const attrsOf = (item) => {
  const defs = ATTRS[item.category];
  if (!defs) return {};
  const out = {};
  for (const d of defs) out[d.key] = item.attrs?.[d.key] || guessAttr(item, d.key) || null;
  return out;
};

/** For a category's pieces, the chip groups worth showing, with counts. */
export const attrMenus = (category, items) => {
  const defs = ATTRS[category];
  if (!defs) return [];
  return defs
    .map((d) => {
      const counts = {};
      for (const i of items) {
        const v = attrsOf(i)[d.key];
        if (v) counts[v] = (counts[v] || 0) + 1;
      }
      return { ...d, values: d.values.map((v) => ({ value: v, count: counts[v] || 0 })).filter((v) => v.count >= MIN_ATTR) };
    })
    .filter((d) => d.values.length >= 2);
};
