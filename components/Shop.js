'use client';

import { useMemo, useRef, useState } from 'react';
import catalog from '@/data/catalog.json';
import edits from '@/data/edits.json';
import ProductCard from './ProductCard';
import {
  COLOURS, DEFAULTS, FILTERABLE_FIBERS, NAV, PRICE_CEILING,
  formatPrice, passes, sortItems,
} from '@/lib/fibers';

const byId = Object.fromEntries(catalog.map((i) => [i.id, i]));
const RETAILERS = [...new Set(catalog.map((i) => i.retailer))].sort();

/** The filter state each curated edit drops you into when you click through. */
const EDIT_FILTERS = {
  outerwear: { nav: 'Outerwear', category: 'Outerwear' },
  pure: { threshold: 100, allowStretch: false },
  under300: { maxPrice: 300 },
  cashmere: { fibers: ['Cashmere'] },
  tailoring: { nav: 'Tailoring', category: 'Tailoring' },
};

const initial = () => ({
  ...DEFAULTS,
  nav: 'All',      // which top bar entry is active
  category: null,  // set when that entry is a garment category
  tag: null,       // set when that entry is an occasion
  colours: [],
  fibers: [],
  retailers: [],
  sort: 'new',
});

export default function Shop() {
  const [f, setF] = useState(initial);
  const fullRef = useRef(null);

  const set = (patch) => setF((prev) => ({ ...prev, ...patch }));
  const toggleIn = (key, value) =>
    setF((prev) => ({
      ...prev,
      [key]: prev[key].includes(value)
        ? prev[key].filter((x) => x !== value)
        : [...prev[key], value],
    }));

  const applyEdit = (key) => {
    setF({ ...initial(), ...(EDIT_FILTERS[key] || {}) });
    fullRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const results = useMemo(() => sortItems(catalog.filter((i) => passes(i, f)), f.sort), [f]);

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
        {/* Curated edits and explainer strips, in the order set in data/edits.json */}
        {edits.map((block, i) =>
          block.type === 'strip' ? (
            <section className="strip" key={`strip-${i}`}>
              <h2>{block.heading}</h2>
              <p>{block.body}</p>
            </section>
          ) : (
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
          <p className="eyebrow">The full edit</p>
          <h2>Set your own standard</h2>
          <p>
            {catalog.length} pieces, every composition read shell and lining separately.
            Move the bar and watch what survives it.
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
                id="thresh" type="range" min={50} max={100} step={5} value={f.threshold}
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

            <button type="button" className="reset" onClick={() => setF(initial())}>
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
              <p className="empty">
                Nothing meets that standard right now. Lower the threshold, widen the
                price, or allow a blend.
              </p>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
