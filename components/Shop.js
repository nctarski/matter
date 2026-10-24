'use client';

import { useEffect, useMemo, useState } from 'react';
import { subOf } from '@/lib/subcats';
import { imageAllowed, isSoldOut, slugify } from '@/lib/item';
import ProductCard from './ProductCard';
import { EDIT_FILTERS } from '@/lib/edits';
import {
  COLOURS, DEFAULTS, EXCLUDABLE, FILTERABLE_FIBERS, PRICE_CEILING,
  formatPrice, passes, sortItems,
} from '@/lib/fibers';

/* The shop grid and its filter rail. It no longer lives on the homepage: each
 * shop page (all pieces, one category, one brand) hands it only the pieces it
 * shows, so a page never ships the whole catalog to the browser. */


/* A brand page starts from a different place than the other shop pages. It
 * shows every piece of that brand, including the ones that miss the 95%
 * default, because the person most likely to be looking is the brand itself
 * and hiding half their range would be its own kind of dishonesty. Sorted most
 * natural first, so the pieces that make the case lead. The rail is still
 * there for anyone who wants to apply the standard. */
const initial = (brand, category) => ({
  ...DEFAULTS,
  ...(brand ? { threshold: 0, sort: 'brand' } : { sort: 'new' }),
  category,        // set on a category page
  tag: null,
  sub: null,       // sub-category label inside the category, see lib/subcats.js
  nameHas: null,   // words in the name, used by edits like fringe that cut across categories
  colours: [],
  fibers: [],
  excluded: [],
  retailers: [],
  brands: brand ? [brand] : [],
});

/* Filters that live here rather than in passes(), because they only exist on
 * the shop pages: a sub-category inside the chosen category, and the name
 * match a cross-category edit uses. */
const extra = (i, f) =>
  (!f.sub || subOf(i) === f.sub) &&
  (!f.nameHas || f.nameHas.words.some((w) => i.name.toLowerCase().includes(w)));
const ok = (i, f) => passes(i, f) && extra(i, f);

const clearHash = () => {
  if (typeof window !== 'undefined' && window.location.hash) {
    history.replaceState(null, '', window.location.pathname + window.location.search);
  }
};

/**
 * items:    the pieces this page covers
 * brand:    set on a brand page
 * category: { label, category } on a category page
 * menu:     that category's sub-category menu, from lib/shop.js
 * heading:  { eyebrow, title, body } for the top of the page
 */
export default function Shop({ items, brand = null, category = null, menu = null, heading }) {
  const cat = category?.category || null;
  const [f, setF] = useState(() => initial(brand, cat));
  const set = (patch) => setF((prev) => ({ ...prev, ...patch }));
  const toggleIn = (key, value) =>
    setF((prev) => ({
      ...prev,
      [key]: prev[key].includes(value)
        ? prev[key].filter((x) => x !== value)
        : [...prev[key], value],
    }));

  const retailers = useMemo(() => [...new Set(items.map((i) => i.retailer))].sort(), [items]);
  const activeSubs = menu?.subs.length ? menu.subs : null;

  /* The part of the address after the # picks a starting point: a
   * sub-category on a category page (/shop/sweaters#cardigans), or one of
   * the homepage edits (/shop#edit-cashmere). Read on arrival and whenever it
   * changes, since the hover menu can change it without leaving the page. */
  useEffect(() => {
    const read = () => {
      const h = decodeURIComponent(window.location.hash.slice(1));
      if (!h) return;
      if (h.startsWith('edit-') && EDIT_FILTERS[h.slice(5)]) {
        setF({ ...initial(brand, cat), ...EDIT_FILTERS[h.slice(5)] });
      } else if (activeSubs) {
        const sub = activeSubs.find((s) => slugify(s.label) === h);
        if (sub) setF((prev) => ({ ...prev, sub: sub.label }));
      }
    };
    read();
    window.addEventListener('hashchange', read);
    return () => window.removeEventListener('hashchange', read);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pickSub = (label) => {
    set({ sub: label });
    if (label) history.replaceState(null, '', `#${slugify(label)}`);
    else clearHash();
  };

  /* Pieces whose retailer has approved us, and therefore have photography,
   * sort ahead of pieces that do not, inside whatever sort the shopper chose.
   * Sold out pieces go after everything in stock, inside the same two groups,
   * so the order is: photographed in stock, photographed sold out, colour tile
   * in stock, colour tile sold out. Both splits keep the chosen sort. */
  const results = useMemo(() => {
    const kept = sortItems(items.filter((i) => ok(i, f)), f.sort);
    const inStockFirst = (list) => [...list.filter((i) => !isSoldOut(i)), ...list.filter(isSoldOut)];
    const withImage = kept.filter((i) => imageAllowed(i) && i.image);
    return withImage.length
      ? [...inStockFirst(withImage), ...inStockFirst(kept.filter((i) => !(imageAllowed(i) && i.image)))]
      : inStockFirst(kept);
  }, [f, items]);

  /* When a filter set returns nothing, find the nearest lower threshold that
   * returns something. Only the threshold is relaxed, because it is the one
   * control where the shopper picked a number rather than a hard rule, and
   * quietly undoing an exclusion they set would be a different promise. */
  const relax = useMemo(() => {
    if (results.length) return null;
    for (let t = f.threshold - 5; t >= 50; t -= 5) {
      const count = items.filter((i) => ok(i, { ...f, threshold: t })).length;
      if (count) return { threshold: t, count };
    }
    return null;
  }, [f, items, results.length]);

  // Two-handle price slider. Keep the handles at least one step apart so they
  // cannot cross and strand the shopper on an empty result set.
  const onMin = (v) => set({ minPrice: Math.min(v, f.maxPrice - 50) });
  const onMax = (v) => set({ maxPrice: Math.max(v, f.minPrice + 50) });

  return (
    <main id="main" className="wrap">
      <div className="fullhead">
        <p className="eyebrow">{heading.eyebrow}</p>
        <h1>{heading.title}</h1>
        <p>{heading.body}</p>
        {/* Says out loud why some tiles are blank. A shopper reads it as a
            design choice and an affiliate reviewer reads it as someone who
            understands that product photography is licensed, not taken. */}
        <p className="photonote">
          Photography appears as each retailer partnership is approved. Until then a
          piece shows its colour.
        </p>
      </div>

        {/* The chosen category's sub-categories, above the filters and pieces.
            The hover menu does the same job on a desktop; this is how a phone
            reaches them, and it shows anyone where they are. */}
        {activeSubs && (
          <div className="subs" role="group" aria-label={`${category?.label} by type`}>
            <button
              type="button"
              aria-pressed={!f.sub}
              onClick={() => pickSub(null)}
            >
              All {category?.label.toLowerCase()}
            </button>
            {activeSubs.map((sub) => (
              <button
                key={sub.label}
                type="button"
                aria-pressed={f.sub === sub.label}
                onClick={() => pickSub(sub.label)}
              >
                {sub.label}
              </button>
            ))}
          </div>
        )}
        <div className="shop">
          <aside className="rail" aria-label="Filters">
            <div className="fgroup">
              <h3>Natural fiber content</h3>
              <div className="readout">
                <output htmlFor="thresh">{f.threshold}%</output>
                <span>and above</span>
              </div>
              <input
                id="thresh" type="range" min={brand ? 0 : 50} max={100} step={5} value={f.threshold}
                aria-label="Minimum natural fiber percentage"
                onChange={(e) => set({ threshold: +e.target.value })}
              />
            </div>

            <div className="fgroup">
              <h3>Price</h3>
              <div className="dual">
                <div className="track" />
                <div
                  className="fill"
                  style={{
                    left: `${(f.minPrice / PRICE_CEILING) * 100}%`,
                    width: `${((f.maxPrice - f.minPrice) / PRICE_CEILING) * 100}%`,
                  }}
                />
                <input
                  type="range" min={0} max={PRICE_CEILING} step={50} value={f.minPrice}
                  aria-label="Minimum price" onChange={(e) => onMin(+e.target.value)}
                />
                <input
                  type="range" min={0} max={PRICE_CEILING} step={50} value={f.maxPrice}
                  aria-label="Maximum price" onChange={(e) => onMax(+e.target.value)}
                />
              </div>
              <div className="priceline">
                <span>{formatPrice(f.minPrice)}</span>
                <span>
                  {f.maxPrice >= PRICE_CEILING ? `${formatPrice(PRICE_CEILING)}+` : formatPrice(f.maxPrice)}
                </span>
              </div>
            </div>

            <div className="fgroup">
              <h3>Colour</h3>
              <div className="swatches">
                {Object.entries(COLOURS).map(([name, hex]) => (
                  <button
                    key={name} type="button" className="sw" title={name} aria-label={name}
                    style={{ background: hex }}
                    aria-pressed={f.colours.includes(name)}
                    onClick={() => toggleIn('colours', name)}
                  />
                ))}
              </div>
            </div>

            <div className="fgroup">
              <h3>Rules</h3>
              <label className="chk">
                <input
                  type="checkbox" checked={f.allowStretch}
                  onChange={(e) => set({ allowStretch: e.target.checked })}
                />
                Allow elastane <small>to 5%</small>
              </label>
              <label className="chk">
                <input
                  type="checkbox" checked={f.naturalLiningOnly}
                  onChange={(e) => set({ naturalLiningOnly: e.target.checked })}
                />
                Natural lining only
              </label>
              <label className="chk">
                <input
                  type="checkbox" checked={f.excludeAnimal}
                  onChange={(e) => set({ excludeAnimal: e.target.checked })}
                />
                Exclude animal fibers
              </label>
            </div>

            <div className="fgroup">
              <h3>Never show me</h3>
              {EXCLUDABLE.map((group) => (
                <button
                  key={group.label} type="button" className="fbtn ex"
                  aria-pressed={f.excluded.includes(group.label)}
                  onClick={() => toggleIn('excluded', group.label)}
                >
                  {group.label}
                </button>
              ))}
              <p className="fnote">Reads the lining too.</p>
            </div>

            <div className="fgroup">
              <h3>Fiber</h3>
              {FILTERABLE_FIBERS.map((fiber) => (
                <button
                  key={fiber} type="button" className="fbtn"
                  aria-pressed={f.fibers.includes(fiber)}
                  onClick={() => toggleIn('fibers', fiber)}
                >
                  {fiber}
                </button>
              ))}
            </div>

            <div className="fgroup">
              <h3>Retailer</h3>
              {retailers.map((r) => (
                <button
                  key={r} type="button" className="fbtn"
                  aria-pressed={f.retailers.includes(r)}
                  onClick={() => toggleIn('retailers', r)}
                >
                  {r}
                </button>
              ))}
            </div>

            <button type="button" className="reset" onClick={() => { setF(initial(brand, category)); clearHash(); }}>
              Reset all filters
            </button>
          </aside>

          <div className="results">
            <div className="rhead">
              <span className="count">
                {results.length} {results.length === 1 ? 'piece' : 'pieces'}
                {f.sub && <> in {f.sub.toLowerCase()}</>}
                {f.nameHas && (
                  <>
                    , {f.nameHas.label}{' '}
                    <button type="button" className="linkbtn clearname" onClick={() => set({ nameHas: null })}>
                      Clear
                    </button>
                  </>
                )}
              </span>
              <div className="sortwrap">
                <label htmlFor="sort">Sort</label>
                <select id="sort" value={f.sort} onChange={(e) => set({ sort: e.target.value })}>
                  {brand && <option value="brand">Featured</option>}
                  <option value="new">New arrivals</option>
                  <option value="natural">Most natural</option>
                  <option value="asc">Price, low to high</option>
                  <option value="desc">Price, high to low</option>
                </select>
              </div>
            </div>

            {results.length ? (
              <div className="grid">
                {results.map((item) => <ProductCard key={item.id} item={item} />)}
              </div>
            ) : (
              <div className="empty">
                <p>Nothing meets that standard right now.</p>
                {/* Some categories cannot clear a high threshold at all. A legging
                    needs more elastane than our allowance by construction, so
                    Active at 95% is always empty. Telling someone the number that
                    does work beats leaving them to guess at the slider. */}
                {relax ? (
                  <>
                    <p>
                      {relax.count} {relax.count === 1 ? 'piece' : 'pieces'} at{' '}
                      {relax.threshold}% and above.
                    </p>
                    <button
                      type="button"
                      className="linkbtn"
                      onClick={() => set({ threshold: relax.threshold })}
                    >
                      Drop to {relax.threshold}% &rarr;
                    </button>
                  </>
                ) : (
                  <p>Widen the price, clear an exclusion, or reset the filters.</p>
                )}
              </div>
            )}
          </div>
        </div>
    </main>
  );
}
