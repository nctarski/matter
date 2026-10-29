/* Sets: pieces that were made to be worn together.
 *
 * Two kinds. A piece sold as a set in one listing (a pajama set, a flight
 * suit, a romper) says so in its name. Matching separates do not: a brand
 * sells "Everywear Cardigan" and "Everywear Pant" in the same cream and never
 * calls them a set. So we look for siblings: same brand, same colour, same
 * collection name once the garment words are stripped, across two or more
 * categories. "Hawthorne Cord Blazer" and "Hawthorne Cord Trouser" in navy
 * are a suit. "100% cashmere sweater" and "100% cashmere cardigan" in grey
 * are not, so a stem that is nothing but fiber words does not count.
 *
 * Name reading is the first pass. The sweep can set item.set to a collection
 * name directly when the retailer page says the pieces are sold together,
 * and that wins. */

const GARMENT = /\b(blazer|jacket|coat|pants?|trousers?|shorts?|skirt|top|blouse|shirt|dress|cardigan|sweater|pullover|crewneck|crew|turtleneck|tank|cami|camisole|bra|bralette|vest|jeans?|leggings?|bermuda|culottes?|knit|polo|tee|t-shirt|hoodie|sweatshirt|bodysuit|slip|gown|jumpsuit|romper|overshirt|shacket|trench|parka|bomber|midi|mini|maxi|cropped|crop|long|short|sleeve|sleeveless|wide.?leg|straight|flare|pencil|pleated|wrap|relaxed|oversized|fitted|high.?waist|high.?rise|low.?rise|ribbed|rib|cable|button|up|zip|pocket|detail|details|neck|v|funnel|mock|boat|henley|asymm|asymmetric)\b/gi;
const FIBER_ONLY = /^(100|\d+|%|cashmere|wool|merino|cotton|silk|linen|leather|suede|nappa|alpaca|mohair|organic|pima|supima|washable|european|mongolian|blend|super|fine|superfine|ultra|luxe|lightweight|brushed|pure|stretch|\s)*$/i;
const SOLD_AS_SET = /\bset\b|co-?ord|two.?piece|matching|twin.?set|\bsuit\b(?!\s*(pants?|trousers?|blazer|jacket))/i;

const COLLECTION_WORDS = (name) =>
  name.toLowerCase().replace(/\s+in\s+.*$/, '').replace(/\s*-\s*studio$/, '').replace(GARMENT, ' ').replace(/[^a-z0-9]+/g, ' ').trim();

/** The name of the collection a piece's name belongs to, or null. */
export const collectionOf = (item) => {
  if (item.set) return item.set;
  const stem = COLLECTION_WORDS(item.name);
  if (stem.length < 4 || FIBER_ONLY.test(stem)) return null;
  return stem;
};

/** Sold as a set in one listing: a pajama set, a romper, a jumpsuit. */
export const soldAsSet = (item) =>
  item.category === 'Sets & jumpsuits' || SOLD_AS_SET.test(item.name);

const key = (item) => {
  const c = collectionOf(item);
  return c ? `${item.brand}|${item.colour}|${c}` : null;
};

/* Matching separates among a list of pieces: groups of two or more, same
 * brand and colour and collection, spanning at least two categories. Sorted
 * so a group reads top to bottom: outerwear, tailoring, sweaters, tops,
 * then everything below the waist. One piece per style inside a group. */
const ORDER = ['Outerwear', 'Tailoring', 'Sweaters', 'Tops', 'Dresses', 'Sets & jumpsuits', 'Pants', 'Denim', 'Skirts', 'Shorts', 'Sleep & lounge', 'Active', 'Undergarments'];
const rank = (i) => (ORDER.indexOf(i.category) + 1 || 99);
const TOP = new Set(['Outerwear', 'Tailoring', 'Sweaters', 'Tops']);
const BOTTOM = new Set(['Pants', 'Denim', 'Skirts', 'Shorts']);

export const setGroups = (items) => {
  const groups = {};
  for (const i of items) {
    const k = key(i);
    if (!k) continue;
    (groups[k] = groups[k] || []).push(i);
  }
  return Object.entries(groups)
    .map(([k, pieces]) => {
      const seen = new Set();
      // One of each style: "Vesta Flare Pant in Chestnut Wool Silk" and
      // "Vesta Flare Pant in Chocolate Fine Cashmere" are one pant.
      const styleName = (p) => p.name.toLowerCase().replace(/\s+in\s+.*$/, '');
      const unique = pieces.filter((p) => (seen.has(styleName(p)) ? false : seen.add(styleName(p))));
      return { key: k, name: collectionOf(unique[0]), brand: unique[0].brand, colour: unique[0].colour, pieces: unique.sort((a, b) => rank(a) - rank(b)) };
    })
    // A set dresses the whole body: something above the waist and something
    // below it. Two tops from one collection are a range, not a set.
    .filter((g) => g.pieces.some((p) => TOP.has(p.category)) && g.pieces.some((p) => BOTTOM.has(p.category)))
    .sort((a, b) => a.brand.localeCompare(b.brand) || a.name.localeCompare(b.name));
};

/** Every piece that is part of a matching set, in group order, with its group. */
export const setPieces = (items) => setGroups(items).flatMap((g) => g.pieces.map((p) => ({ item: p, group: g })));

/** Ids of every piece in a matching set, for pulling them out of a grid. */
export const inSets = (items) => new Set(setPieces(items).map((p) => p.item.id));
