import Link from 'next/link';
import CatBar from '@/components/CatBar';
import ProductCard from '@/components/ProductCard';
import Statement from '@/components/Statement';
import edits from '@/data/edits.json';
import { BRANDS, catalog } from '@/lib/catalog';
import { slugify } from '@/lib/item';
import { CATEGORY_PAGES, MENUS } from '@/lib/shop';
import { editHref } from '@/lib/edits';
import { SITE } from '@/lib/site';

export const metadata = {
  title: { absolute: SITE.homeTitle },
  description: SITE.description,
  alternates: { canonical: '/' },
};

const byId = Object.fromEntries(catalog.map((i) => [i.id, i]));

/* The homepage is the edited front page: the statement, the curated edits,
 * and a way into each category and brand. The full grid lives on the shop
 * pages, so this page stays fast and every category has its own address. */
export default function HomePage() {
  return (
    <>
      <CatBar pages={CATEGORY_PAGES} menus={MENUS} />
      <main id="main" className="wrap">
        <Statement />

        {/* Curated edits and explainer strips, in the order set in data/edits.json. */}
        {edits.map((block, i) =>
          block.type === 'strip' ? (
            <section className="strip" key={`strip-${i}`}>
              <h2>{block.heading}</h2>
              <p>{block.body}</p>
            </section>
          ) : /* An edit whose picks are all still pending confirmation would
                 render as a heading above nothing. Drop the whole block
                 instead, so the homepage never has a hole in it. */
          block.picks.filter((p) => byId[p.id]).length === 0 ? null : (
            <section
              className={`edit-sec photos-${block.photos || 'model'}`}
              key={`edit-${i}`}
              aria-labelledby={`edit-h-${i}`}
            >
              <div className="ehead">
                <h2 id={`edit-h-${i}`}>{block.title}</h2>
                <span className="by">{block.by}</span>
              </div>
              <p className="enote">{block.note}</p>
              <div className="trio">
                {block.picks
                  .filter((p) => byId[p.id])
                  .map((p) => (
                    <ProductCard key={p.id} item={byId[p.id]} note={p.note} image={p.image} label={p.label} />
                  ))}
              </div>
              <div className="emore">
                <Link className="linkbtn" href={editHref(block.apply)}>
                  {block.cta} &rarr;
                </Link>
              </div>
            </section>
          )
        )}

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

        <section className="browse" aria-labelledby="browse-brands">
          <h2 id="browse-brands">Shop by brand</h2>
          <ul className="brandlist">
            {BRANDS.map((b) => (
              <li key={b}>
                <Link href={`/brand/${slugify(b)}`}>{b}</Link>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </>
  );
}
