/* Helpers that work on a single catalog entry. Kept apart from lib/catalog.js,
 * which imports the whole catalog, so a client component that only needs to
 * read one piece does not ship every piece to the browser. */

/* Composition, link, price and colour arrive at different times. The
 * composition is read first, often from a screenshot or a pasted label, and the
 * link and price are confirmed against the live product page afterwards. So an
 * entry can sit in the catalog fully classified and not yet ready to show.
 *
 * A piece goes live only when all four are present. The reasons, in order of
 * how badly each one would embarrass us:
 *   url    - a card with no outbound link earns nothing and looks broken
 *   price  - a null price silently escapes every price filter
 *   colour - drives the swatch filter and the placeholder tile
 *
 * This is the one gate between "we have read the label" and "a shopper can
 * see it", and it is why the pending pile below is worth keeping visible. */
/* Product images are licensed by the retailer, not by the affiliate network,
 * and the licence lasts exactly as long as the program relationship does.
 * Every agreement reviewed says the same thing: on termination or removal
 * from a program, stop using that advertiser's creative immediately.
 *
 * So image rights are tracked per retailer, in one place, and a retailer is
 * added here only once its program approval is in hand. Removing a name from
 * this list drops every image for that retailer on the next deploy without
 * touching the catalog, which is the one-operation exit those clauses
 * require. Items stay live and keep their colour tile. */
export const IMAGE_LICENSED_RETAILERS = [
  // Shown ahead of program approval, by owner decision on 2026-10-22, to build
  // the traffic record those applications need. Any takedown request removes
  // the retailer from this list the same day.
  'Massimo Dutti',
  'Revolve',
  // Brand stores read through their public Shopify catalogs, same decision.
  'White + Warren', 'Guest In Residence', 'Naadam', 'Brochu Walker',
  'Sea New York', 'Ulla Johnson', 'St. Agni', 'Gabriela Hearst', 'Tibi',
  'Christy Dawn', 'Jenni Kayne', 'Faherty', 'Anine Bing', 'Kotn',
  'Lisa Says Gah',
];

export const imageAllowed = (item) => IMAGE_LICENSED_RETAILERS.includes(item.retailer);

/** The image to render, or empty when we have no right to show one. */
export const licensedImage = (item) => (imageAllowed(item) ? item.image || '' : '');

export const isPublishable = (item) =>
  Boolean(item.url) &&
  typeof item.price === 'number' &&
  item.price > 0 &&
  Boolean(item.colour);

/* Stock, from scripts/apply-stock.mjs. A piece with no stock data is treated
 * as in stock, because most retailers are not checked yet and a missing check
 * is not news. soldOutSince is set only when a check found no size available.
 *
 * Sold out pieces stay on the site for 14 days, marked and sorted last, since
 * restocks often come back inside that window. After that they are hidden but
 * kept in catalog.json, so a restock brings the piece straight back with its
 * composition already read. Days are counted at build time. */
export const SOLD_OUT_HIDE_DAYS = 14;

export const isSoldOut = (item) => Boolean(item.soldOutSince);

const daysSince = (date) =>
  Math.floor((Date.now() - Date.parse(`${date}T00:00:00Z`)) / 86400000);

export const isHiddenSoldOut = (item) =>
  isSoldOut(item) && daysSince(item.soldOutSince) > SOLD_OUT_HIDE_DAYS;

/** Available sizes in the retailer's order, or null when there is no stock data. */
export const availableSizes = (item) =>
  Array.isArray(item.stock?.sizes)
    ? item.stock.sizes.filter((s) => s.available).map((s) => s.size)
    : null;



/** Why each pending item is held back, for the audit output. */
export const missingFields = (item) => {
  const missing = [];
  if (!item.url) missing.push('url');
  if (typeof item.price !== 'number' || item.price <= 0) missing.push('price');
  if (!item.colour) missing.push('colour');
  return missing;
};

/* Brand landing pages. Each brand in the catalog gets its own URL, which is
 * what goes into an affiliate application or an email to that brand, instead
 * of the homepage. A reviewer lands on their own pieces with the composition
 * data front and centre, rather than on a general grid where they have to
 * go looking for themselves. */
export const slugify = (name) =>
  name
    .toLowerCase()
    .replace(/[&+]/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
