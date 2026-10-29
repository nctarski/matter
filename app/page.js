import Link from 'next/link';
import CatBar from '@/components/CatBar';
import EditRail from '@/components/EditRail';
import edits from '@/data/edits.json';
import { GUIDES } from '@/lib/guides';
import { slugify } from '@/lib/item';
import { labelFor, sectionPieces } from '@/lib/editrules';
import { BIG_BRANDS, CATEGORY_PAGES, MENUS, MIN_BRAND_PIECES } from '@/lib/shop';
import { editHref } from '@/lib/edits';
import { SITE } from '@/lib/site';

export const metadata = {
  title: { absolute: SITE.homeTitle },
  description: SITE.description,
  alternates: { canonical: '/' },
};

/* The homepage is a run of edits, each one a rule over the catalog (see
 * lib/editrules.js) shown three pieces at a time, in the order set in
 * data/edits.json. The brand statement is parked for now, owner decision on
 * 2026-10-28, so the sections carry what the site does on their own. The
 * full grid lives on the shop pages. */
export default function HomePage() {
  const shown = new Set(); // styles already on the page, so no section repeats an earlier one
  return (
    <>
      <CatBar pages={CATEGORY_PAGES} menus={MENUS} />
      <main id="main" className="wrap">
        {edits.map((block, i) => {
          if (block.type !== 'edit') return null;
          const meta = Object.fromEntries((block.picks || []).map((p) => [p.id, p]));
          const pieces = sectionPieces(block, shown).map((item) => ({ item, label: labelFor(block, item), ...(meta[item.id] || {}) }));
          /* A section the catalog cannot fill yet would be a heading above
             nothing. Drop it until the pieces arrive. */
          if (pieces.length === 0) return null;
          return (
            <section
              className={`edit-sec photos-${block.photos || 'model'}`}
              key={block.key || i}
              aria-labelledby={`edit-h-${i}`}
            >
              <div className="ehead">
                <h2 id={`edit-h-${i}`}>{block.title}</h2>
                <span className="by">{block.by}</span>
              </div>
              <p className="enote">{block.note}</p>
              <EditRail pieces={pieces} label={block.title} />
              <div className="emore">
                <Link className="linkbtn" href={editHref(block)}>
                  {block.cta} &rarr;
                </Link>
              </div>
            </section>
          );
        })}

        <section className="browse" aria-labelledby="browse-cats">
          <p className="eyebrow">The full edit</p>
          <h2 id="browse-cats">Shop by category</h2>
          <ul className="catlist">
            {CATEGORY_PAGES.map((c) => (
              <li key={c.slug}>
                <Link href={`/shop/${c.slug}`}>{c.label}</Link>
              </li>
            ))}
            <li>
              <Link href="/shop">Everything</Link>
            </li>
          </ul>
        </section>

        <section className="browse" aria-labelledby="browse-guides">
          <h2 id="browse-guides">Shopping guides</h2>
          <ul className="catlist">
            {GUIDES.map((g) => (
              <li key={g.slug}>
                <Link href={`/guides/${g.slug}`}>{g.title}</Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="browse" aria-labelledby="browse-brands">
          <h2 id="browse-brands">Shop by brand</h2>
          <ul className="brandlist">
            {BIG_BRANDS.map((b) => (
              <li key={b}>
                <Link href={`/brand/${slugify(b)}`}>{b}</Link>
              </li>
            ))}
            <li>
              <Link href="/brands/more">More brands</Link>
            </li>
          </ul>
          <p className="fnote">
            A brand gets its own page once we carry at least {MIN_BRAND_PIECES} of its pieces.
            Smaller brands share one page until then.
          </p>
        </section>
      </main>
    </>
  );
}
