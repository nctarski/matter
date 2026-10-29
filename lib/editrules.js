import { catalog } from './catalog';
import { imageAllowed, isSoldOut } from './item';

/* The homepage edits. Each one is a rule over the catalog, so a section
 * refreshes itself at every build as pieces come and go, and an edit never
 * goes stale because nobody re-picked it. Natalie can pin pieces in
 * data/edits.json ("picks"), and pinned pieces lead the section; the rule
 * fills the rest, up to MAX_PICKS.
 *
 * A section shows three pieces at a time. Retailers shoot on their own
 * studio backgrounds, so each group of three is drawn from one retailer
 * where the catalog allows it, and the three read as one set rather than
 * three cut-outs on three colours. Only photographed pieces qualify, since a
 * colour tile in a carousel is a hole, not a piece. */

export const MAX_PICKS = 12;
const PER_RETAILER = 6; // at most two trios from one retailer, so a section is not one brand

const share = (comp, re) =>
  (Array.isArray(comp) ? comp : []).filter(([f]) => re.test(f)).reduce((t, [, p]) => t + p, 0);
const named = (item, re) => re.test(item.name);
const SILK = /silk/i;
const ANIMAL = /wool|merino|cashmere|alpaca|mohair|camel|yak/i;
const NATURAL = /wool|merino|cashmere|alpaca|mohair|camel|yak|silk|cotton|linen|flax|hemp|ramie|leather|suede|shearling/i;

const byPriceDesc = (a, b) => b.price - a.price;
const byPriceAsc = (a, b) => a.price - b.price;
const silkFirst = (a, b) => share(b.shell, SILK) - share(a.shell, SILK) || b.price - a.price;

const blackTie = (i) =>
  ['Dresses', 'Sets & jumpsuits'].includes(i.category) &&
  named(i, /gown|maxi|floor|evening|column|bias|velvet|satin|slip/i) &&
  (share(i.shell, SILK) >= 50 || named(i, /velvet|satin/i));

export const EDIT_RULES = {
  // Party, not gala: the floor length silk goes to Black Tie Ready below.
  holiday: {
    title: 'The Holiday Party Edit',
    match: (i) =>
      ['Dresses', 'Tops', 'Skirts', 'Sets & jumpsuits', 'Tailoring'].includes(i.category) &&
      !blackTie(i) &&
      (share(i.shell, SILK) >= 50 || named(i, /velvet|satin|sequin|metallic|jacquard|brocade|taffeta|lam[eé]\b/i)),
    sort: silkFirst,
  },
  new: {
    title: 'New Arrivals',
    match: (i) => i.isNew,
    sort: byPriceDesc,
  },
  sweaters: {
    title: 'Sweaters',
    match: (i) => i.category === 'Sweaters' && share(i.shell, ANIMAL) >= 95,
    sort: (a, b) => share(b.shell, /cashmere/i) - share(a.shell, /cashmere/i) || b.price - a.price,
  },
  blacktie: {
    title: 'Black Tie Ready',
    match: blackTie,
    sort: byPriceDesc,
  },
  fringe: {
    title: 'This Moment: Fringe',
    match: (i) => named(i, /fringe/i),
    sort: byPriceDesc,
  },
  sets: {
    title: 'Sets',
    match: (i) =>
      i.category === 'Sets & jumpsuits' ||
      (named(i, /\bset\b|two.piece|matching/i) && i.category !== 'Sleep & lounge'),
    sort: byPriceDesc,
  },
  basics: {
    title: 'Quality Basics',
    match: (i) =>
      ['Tops', 'Sweaters', 'Pants'].includes(i.category) &&
      named(i, /\btee\b|t-shirt|tank|turtleneck|crewneck|crew neck|cardigan|trouser|v-neck|henley|long.sleeve|classic|essential/i) &&
      share(i.shell, NATURAL) >= 95 &&
      i.price <= 250,
    sort: byPriceAsc,
  },
  western: {
    title: 'The Western Edit',
    match: (i) =>
      !['Sleep & lounge', 'Undergarments', 'Active'].includes(i.category) &&
      (named(i, /western|cowboy|rancher|prairie|pearl snap|chambray|\bsnap\b|boot.?cut|bandana|yoke|rodeo|ranch/i) ||
        // Suede, shearling and fringe read western on a jacket, a skirt or a
        // pair of pants. Smooth leather does not, and on a silk dress the
        // word suede is usually the colour.
        (i.category !== 'Dresses' && (share(i.shell, /suede|shearling/i) >= 50 || named(i, /fringe/i)))),
    sort: byPriceDesc,
  },
};

const live = (i) => !isSoldOut(i) && imageAllowed(i) && Boolean(i.image);

/* One entry per style. The catalog carries every colourway as its own piece,
 * which is right for the shop grid and wrong for a carousel, where the same
 * sweater three times in a row reads as a bug. */
const styleKey = (i) =>
  `${i.brand}|${i.name}`
    .toLowerCase()
    // Gabriela Hearst and Kotn write the colour into the name: "Anne Dress in
    // Black Silk Satin", "Mona Cardigan in Tawny Port". One style, not one per colour.
    .replace(/\s+in\s+.*$/, '')
    .replace(/[^a-z0-9|]+/g, ' ')
    .trim();

const dedupe = (items) => {
  const seen = new Set();
  return items.filter((i) => {
    const key = styleKey(i);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

/** Every live piece that answers an edit's rule, best first. Used by /edit/[key]. */
export const editPieces = (key) => {
  const rule = EDIT_RULES[key];
  if (!rule) return [];
  return catalog.filter((i) => live(i) && rule.match(i)).sort(rule.sort);
};

/* Arrange a section's pieces so each group of three shares a retailer.
 * Pinned picks lead, in the order given; the trio they start is completed
 * from the same retailer when possible. Then whole trios from the retailers
 * with the most qualifying pieces, then the leftovers. */
export const arrange = (pinned, pool, max = MAX_PICKS) => {
  const out = [];
  const taken = new Set();
  const used = {};
  // Three from a retailer first, so a section shows four studios rather
  // than two. A second trio from the same retailer only when the catalog
  // cannot fill the section otherwise.
  const caps = [3, PER_RETAILER];
  const take = (i) => {
    out.push(i);
    taken.add(i.id);
    used[i.retailer] = (used[i.retailer] || 0) + 1;
  };
  for (const p of pinned) if (!taken.has(p.id)) take(p);

  const rest = () => pool.filter((i) => !taken.has(i.id));

  // Complete the pinned trio from the same retailer first.
  while (out.length % 3 !== 0) {
    const last = out[out.length - 1];
    const same = rest().find((i) => i.retailer === last.retailer);
    if (!same) break;
    take(same);
  }

  // Whole trios, retailer by retailer, the deepest bench first.
  const counts = rest().reduce((acc, i) => ((acc[i.retailer] = (acc[i.retailer] || 0) + 1), acc), {});
  const order = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
  for (const cap of caps) {
    for (const r of order) {
      while (out.length + 3 <= max && (used[r] || 0) + 3 <= cap) {
        const three = rest().filter((i) => i.retailer === r).slice(0, 3);
        if (three.length < 3) break;
        three.forEach(take);
      }
      if (out.length >= max) break;
    }
    if (out.length >= max) break;
  }

  // Anything left fills to a multiple of three, or to the cap.
  for (const i of rest()) {
    if (out.length >= max) break;
    take(i);
  }
  const cut = out.length >= 3 ? out.length - (out.length % 3) : out.length;
  return out.slice(0, cut);
};

/** The pieces a homepage section shows, pinned first, trios by retailer.
 * shown: style keys already on the page, so a gown in the holiday edit does
 * not come round again under Black Tie. Updated in place. */
export const sectionPieces = (block, shown = new Set()) => {
  const byId = Object.fromEntries(catalog.map((i) => [i.id, i]));
  const pinned = (block.picks || []).map((p) => byId[p.id]).filter(Boolean);
  // A section with no rule shows exactly its pinned picks, in order.
  const out = block.rule
    ? arrange(
        pinned,
        dedupe([...pinned, ...editPieces(block.rule)]).filter((i) => !pinned.includes(i) && !shown.has(styleKey(i))),
        block.max || MAX_PICKS,
      )
    : pinned;
  for (const i of out) shown.add(styleKey(i));
  return out;
};
