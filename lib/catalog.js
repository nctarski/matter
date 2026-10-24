import raw from '@/data/catalog.json';
import { isPublishable, isHiddenSoldOut, slugify } from './item';

// The per-piece helpers live in lib/item.js. Re-exported here so existing
// imports keep working.
export * from './item';

/** Everything a shopper can see. */
export const catalog = raw.filter((item) => isPublishable(item) && !isHiddenSoldOut(item));

/** Classified, not yet confirmed. Used by the data audit script. */
export const pending = raw.filter((item) => !isPublishable(item));

export const BRANDS = [...new Set(catalog.map((i) => i.brand))].sort();

export const brandFromSlug = (slug) => BRANDS.find((b) => slugify(b) === slug) || null;

export default catalog;
