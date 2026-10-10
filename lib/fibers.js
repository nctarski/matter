// The fiber taxonomy and every rule that depends on it.
// This is the single most important file in the project. Change a tier here
// and the whole catalog is re-classified. Nothing else should hardcode a
// fiber name.

export const TIER_1_NATURAL = [
  // Plant
  'Cotton', 'Organic cotton', 'Linen', 'Hemp', 'Ramie', 'Jute',
  // Animal
  'Wool', 'Merino wool', 'Lambswool', 'Shetland wool', 'Cashmere', 'Mohair',
  'Alpaca', 'Camel hair', 'Yak', 'Angora', 'Silk',
  // Other animal
  'Leather', 'Suede', 'Shearling', 'Down',
];

// Plant-derived but chemically processed. Counted toward neither natural nor
// synthetic. Shown as its own tier on the card.
export const TIER_2_CELLULOSIC = [
  'Viscose', 'Rayon', 'Modal', 'Cupro', 'Acetate', 'Bamboo viscose',
];

// Lyocell is separated from the rest of tier 2 because its closed-loop
// solvent process is materially different. It still does not count as natural.
export const LYOCELL = ['Lyocell', 'TENCEL'];

export const TIER_3_SYNTHETIC = [
  'Polyester', 'Recycled polyester', 'Nylon', 'Polyamide', 'Acrylic',
  'Elastane', 'Spandex', 'Lycra', 'Polypropylene',
  // Metallic yarn, almost always polyester or nylon with a metallised coating.
  // Appears in small percentages in lurex and shot-silk weaves.
  'Metallised fibre',
];

/* Retailers spell the same fiber several ways. Normalise on the way into the
 * catalog so the tiers above stay the single source of truth. Keys are what a
 * product page says, values are what we store.
 *
 * Deliberately NOT normalised: rayon/viscose, spandex/elastane and
 * polyamide/nylon are the same fiber under a US and a European name, and both
 * spellings already sit in the tiers above. We keep the retailer's word so a
 * shopper comparing our card to the product page never sees a word we changed
 * and assumes we got it wrong. */
export const FIBER_ALIASES = {
  'Virgin wool': 'Wool',
  'Lambskin': 'Leather',
  'Lambskin leather': 'Leather',
  'Lamb leather': 'Leather',
  'Calf leather': 'Leather',
  'Sheepskin': 'Leather',
  'Lamb shearling': 'Shearling',
  'Alpaca wool': 'Alpaca',
  'Baby alpaca': 'Alpaca',
  'Mulberry silk': 'Silk',
  'Metallic fibre': 'Metallised fibre',
  'Metallized fiber': 'Metallised fibre',
};

/** Resolve a retailer's spelling to our stored fiber name. */
export const normaliseFiber = (name) => FIBER_ALIASES[name] || name;

// Animal fibers, for the vegan exclusion toggle. This is a values filter,
// not a quality tier.
export const ANIMAL = [
  'Wool', 'Merino wool', 'Lambswool', 'Shetland wool', 'Cashmere', 'Mohair',
  'Alpaca', 'Camel hair', 'Yak', 'Angora', 'Silk',
  'Leather', 'Suede', 'Shearling', 'Down',
];

export const STRETCH = ['Elastane', 'Spandex', 'Lycra'];

// Elastane up to this percentage is allowed by default, because functional
// stretch is not what anyone is trying to avoid.
export const STRETCH_ALLOWANCE = 5;

// What the filter rail starts on when someone lands.
export const DEFAULTS = {
  threshold: 95,
  allowStretch: true,
  naturalLiningOnly: false,
  excludeAnimal: false,
  minPrice: 0,
  maxPrice: 3500,
};

export const PRICE_CEILING = 3500;

/* The top bar. Each entry is either a garment category or an occasion tag,
 * never both. Garment categories are single valued on an item. Occasions are
 * tags, so one silk dress can sit in Dresses and in Wedding guest at once.
 * Add a new occasion by adding an entry here and tagging items in the catalog. */
export const NAV = [
  { label: 'All' },
  { label: 'Wedding guest', tag: 'wedding-guest' },
  { label: 'Dresses', category: 'Dresses' },
  { label: 'Tops & blouses', category: 'Tops & blouses' },
  { label: 'Sweaters', category: 'Sweaters' },
  { label: 'Outerwear', category: 'Outerwear' },
  { label: 'Tailoring', category: 'Tailoring' },
  { label: 'Pants', category: 'Pants' },
  { label: 'Skirts', category: 'Skirts' },
  { label: 'Active', category: 'Active' },
  { label: 'Undergarments', category: 'Undergarments' },
];

/** Every garment category in use, for validating catalog entries. */
export const CATEGORIES = NAV.filter((n) => n.category).map((n) => n.category);

// Fibers offered in the filter rail. A short list beats a complete one.
export const FILTERABLE_FIBERS = [
  'Wool', 'Merino wool', 'Cashmere', 'Alpaca', 'Silk', 'Cotton', 'Linen', 'Hemp',
];

// Swatch values are a muted, fabric-like version of each colour, used for the
// filter swatches and for the placeholder tile before real photography lands.
export const COLOURS = {
  Black: '#232323',
  Ivory: '#ede7da',
  Camel: '#c2a077',
  Grey: '#a5a29c',
  Navy: '#2c3a52',
  Chocolate: '#6b4f3a',
  Oxblood: '#6b2a2c',
  Olive: '#6f7352',
  Blush: '#dfc3bd',
  Blue: '#8fa6bf',
  Green: '#4f6b54',
  Cream: '#e4d9c4',
};

// Colours dark enough that overlay text and the heart need to flip to ivory.
export const DARK_COLOURS = ['Black', 'Navy', 'Chocolate', 'Oxblood', 'Olive', 'Green'];

const sum = (comp, list) =>
  comp.filter(([fiber]) => list.includes(fiber)).reduce((total, [, pct]) => total + pct, 0);

export const naturalPct = (comp) => sum(comp || [], TIER_1_NATURAL);
export const cellulosicPct = (comp) => sum(comp || [], [...TIER_2_CELLULOSIC, ...LYOCELL]);
export const stretchPct = (comp) => sum(comp || [], STRETCH);
export const hasAnimal = (comp) => (comp || []).some(([fiber]) => ANIMAL.includes(fiber));

/** The number shown against the threshold. Elastane within the allowance
 *  counts toward natural when the shopper has left that toggle on. */
export function effectiveNatural(comp, allowStretch) {
  const natural = naturalPct(comp);
  const stretch = stretchPct(comp);
  if (allowStretch && stretch > 0 && stretch <= STRETCH_ALLOWANCE) return natural + stretch;
  return natural;
}

/** A lining passes the natural-lining filter only if it is fully natural.
 *  No lining at all passes too, since there is nothing to hide. */
export const liningIsNatural = (lining) => !lining || naturalPct(lining) === 100;

/** "92% wool / 8% cashmere" */
export const formatComposition = (comp) =>
  (comp || []).map(([fiber, pct]) => `${pct}% ${fiber.toLowerCase()}`).join(' / ');

export const formatPrice = (n) => `$${Number(n).toLocaleString()}`;

/** Does this item survive the shopper's current filter state? */
export function passes(item, f) {
  const effective = effectiveNatural(item.shell, f.allowStretch);
  if (effective < f.threshold) return false;
  if (!f.allowStretch && stretchPct(item.shell) > 0) return false;
  if (item.price < f.minPrice) return false;
  if (f.maxPrice < PRICE_CEILING && item.price > f.maxPrice) return false;
  if (f.naturalLiningOnly && !liningIsNatural(item.lining)) return false;
  if (f.excludeAnimal && hasAnimal(item.shell)) return false;
  if (f.category && item.category !== f.category) return false;
  if (f.tag && !(item.tags || []).includes(f.tag)) return false;
  if (f.colours?.length && !f.colours.includes(item.colour)) return false;
  if (f.fibers?.length && !item.shell.some(([fiber]) => f.fibers.includes(fiber))) return false;
  if (f.retailers?.length && !f.retailers.includes(item.retailer)) return false;
  return true;
}

export function sortItems(items, mode) {
  const out = [...items];
  if (mode === 'asc') return out.sort((a, b) => a.price - b.price);
  if (mode === 'desc') return out.sort((a, b) => b.price - a.price);
  if (mode === 'natural') {
    return out.sort((a, b) => naturalPct(b.shell) - naturalPct(a.shell) || a.price - b.price);
  }
  return out.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
}
