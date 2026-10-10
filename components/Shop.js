'use client';

import { useMemo, useRef, useState } from 'react';
import { catalog, imageAllowed } from '@/lib/catalog';
import edits from '@/data/edits.json';
import ProductCard from './ProductCard';
import {
  COLOURS, DEFAULTS, EXCLUDABLE, FILTERABLE_FIBERS, NAV, PRICE_CEILING,
  formatPrice, passes, sortItems,
} from '@/lib/fibers';

const byId = Object.fromEntries(catalog.map((i) => [i.id, i]));
const RETAILERS = [...new Set(catalog.map((i) => i.retailer))].sort();

/** The filter state each curated edit drops you into when you click through. */
const EDIT_FILTERS = {
  outerwear: { nav: 'Outerwear', category: 'Outerwear' },
  weddingGuest: { nav: 'Wedding guest', tag: 'wedding-guest' },
  pure: { threshold: 100, allowStretch: false },
  under300: { maxPrice: 300 },
  cashmere: { fibers: ['Cashmere'] },
  tailoring: { nav: 'Tailoring', category: 'Tailoring' },
};

/* A brand page starts from a different place than the homepage. It shows every
 * piece of that brand, including the ones that miss the 95% default, because
 * the person most likely to be looking is the brand itself and hiding half
 * their range would be its own kind of dishonesty. Sorted most natural first,
 * so the pieces that make the case lead. The rail is still there for anyone
 * who wants to apply the standard. */
const initial = (brand) => ({
  ...DEFAULTS,
  ...(brand ? { threshold: 0, sort: 'natural' } : { sort: 'new' }),
  nav: 'All',      // which top bar entry is active
  category: null,  // set when that entry is a garment category
  tag: null,       // set when that entry is an occasion
  colours: [],
  fibers: [],
  excluded: [],
  retailers: [],
  brands: brand ? [brand] : [],
});

export default function Shop({ brand = null }) {
  const [f, setF] = useState(() => initial(brand));
  const fullRef = useRef(null);
  const brandPieces = brand ? catalog.filter((i) => i.brand === brand) : catalog;

  const set = (patch) => setF((prev) => ({ ...prev, ...patch }));
  const toggleIn = (key, value) =>
    setF((prev) => ({
      ...prev,
      [key]: prev[key].includes(value)
        ? prev[key].filter((x) => x !== value)
        : [...prev[key], value],
    }));

  const applyEdit = (key) => {
    setF({ ...initial(brand), ...(EDIT_FILTERS[key] || {}) });
    fullRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  /* Pieces whose retailer has approved us, and therefore have photography,
   * sort ahead of pieces that do not, inside whatever sort the shopper chose.
   * Approvals arrive one retailer at a time over weeks, and without this the
   * grid interleaves photographed pieces with bare colour tiles and reads as
   * broken rather than partial. It needs no upkeep: adding a retailer to
   * IMAGE_LICENSED_RETAILERS promotes all of its pieces automatically, and
   * once everything is approved the rule stops having any effect. */
  const results = useMemo(() => {
    const kept = sortItems(catalog.filter((i) => passes(i, f)), f.sort);
    const withImage = kept.filter((i) => imageAllowed(i) && i.image);
    return withImage.length ? [...withImage, ...kept.filter((i) => !(imageAllowed(i) && i.image))] : kept;
  }, [f]);

  /* When a filter set returns nothing, find the nearest lower threshold that
   * returns something. Only the threshold is relaxed, because it is the one
   * control where the shopper picked a number rather than a hard rule, and
   * quietly undoing an exclusion they set would be a different promise. */
  const relax = useMemo(() => {
    if (results.length) return null;
    for (let t = f.threshold - 5; t >= 50; t -= 5) {
      const count = catalog.filter((i) => passes(i, { ...f, threshold: t })).length;
      if (count) return { threshold: t, count };
    }
    return null;
  }, [f, results.length]);

  // Two-handle price slider. Keep the handles at least one step apart so they
  // cannot cross and strand the shopper on an empty result set.
  const onMin = (v) => set({ minPrice: Math.min(v, f.maxPrice - 50) });
  const onMax = (v) => set({ maxPrice: Math.max(v, f.minPrice + 50) });

  return (
    <>
      <div className="catbar">
        <div className="wrap">
          <div className="cats" role="group" aria-label="Category">
            {NAV.map((entry) => (
              <button
                key={entry.label}
                type="button"
                aria-pressed={f.nav === entry.label}
                onClick={() => {
                  set({
                    nav: entry.label,
                    category: entry.category || null,
                    tag: entry.tag || null,
                  });
                  fullRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
              >
                {entry.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main id="main" className="wrap">
        {/* Curated edits and explainer strips, in the order set in data/edits.json.
            A brand page skips straight to that brand's grid. */}
        {!brand && edits.map((block, i) =>
          block.type === 'strip' ? (
            <section className="strip" key={`strip-${i}`}>
              <h2>{block.heading}</h2>
              <p>{block.body}</p>
            </section>
          ) : /* An edit whose picks are all still pending confirmation would
                 render as a heading above nothing. Drop the whole block
                 instead, so the homepage never has a hole in it. */
          block.picks.filter((p) => byId[p.id]).length === 0 ? null : (
            <section className="edit-sec" key={`edit-${i}`} aria-labelledby={`edit-h-${i}`}>
              <div className="ehead">
                <h2 id={`edit-h-${i}`}>{block.title}</h2>
                <span className="by">{block.by}</span>
              </div>
              <p className="enote">{block.note}</p>
              <div className="trio">
                {block.picks
                  .filter((p) => byId[p.id])
                  .map((p) => <ProductCard key={p.id} item={byId[p.id]} note={p.note} />)}
              </div>
              <div className="emore">
                <button type="button" className="linkbtn" onClick={() => applyEdit(block.apply)}>
                  {block.cta} &rarr;
                </button>
              </div>
            </section>
          )
        )}

        <div className="fullhead" ref={fullRef}>
          {brand ? (
            <>
              <p className="eyebrow">{brand} at MATTER</p>
              <h2>{brand}, read label first</h2>
              <p>
                {brandPieces.length} {brandPieces.length === 1 ? 'piece' : 'pieces'} indexed,
                every composition read from the product page and shown shell and lining
                separately. Sorted most natural first.
              </p>
            </>
          ) : (
            <>
              <p className="eyebrow">The full edit</p>
              <h2>Set your own standard</h2>
              <p>
                {catalog.length} pieces, every composition read shell and lining separately.
                Move the bar and watch what survives it.
              </p>
            </>
          )}
          {/* Says out loud why the tiles are blank. A shopper reads it as a
              design choice and an affiliate reviewer reads it as someone who
              understands that product photography is licensed, not taken. */}
          <p className="photonote">
            Photography appears as each retailer partnership is approved. Until then a
            piece shows its colour.
          </p>
        </div>

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
              {RETAILERS.map((r) => (
                <button
                  key={r} type="button" className="fbtn"
                  aria-pressed={f.retailers.includes(r)}
                  onClick={() => toggleIn('retailers', r)}
                >
                  {r}
                </button>
              ))}
            </div>

            <button type="button" className="reset" onClick={() => setF(initial(brand))}>
              Reset all filters
            </button>
          </aside>

          <div className="results">
            <div className="rhead">
              <span className="count">
                {results.length} {results.length === 1 ? 'piece' : 'pieces'}
              </span>
              <div className="sortwrap">
                <label htmlFor="sort">Sort</label>
                <select id="sort" value={f.sort} onChange={(e) => set({ sort: e.target.value })}>
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
    </>
  );
}
