import raw from '@/data/catalog.json';

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
  // 'Revolve',      // CJ, approved <date>
  // 'Net-a-Porter', // Rakuten, approved <date>
];

export const imageAllowed = (item) => IMAGE_LICENSED_RETAILERS.includes(item.retailer);

/** The image to render, or empty when we have no right to show one. */
export const licensedImage = (item) => (imageAllowed(item) ? item.image || '' : '');

export const isPublishable = (item) =>
  Boolean(item.url) &&
  typeof item.price === 'number' &&
  item.price > 0 &&
  Boolean(item.colour);

/** Everything a shopper can see. */
export const catalog = raw.filter(isPublishable);

/** Classified, not yet confirmed. Used by the data audit script. */
export const pending = raw.filter((item) => !isPublishable(item));

/** Why each pending item is held back, for the audit output. */
export const missingFields = (item) => {
  const missing = [];
  if (!item.url) missing.push('url');
  if (typeof item.price !== 'number' || item.price <= 0) missing.push('price');
  if (!item.colour) missing.push('colour');
  return missing;
};

export default catalog;
