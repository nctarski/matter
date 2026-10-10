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
