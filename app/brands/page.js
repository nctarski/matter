import Link from 'next/link';
import CatBar from '@/components/CatBar';
import { catalog, slugify } from '@/lib/catalog';
import { brandFacts, updatedOn } from '@/lib/brandfacts';
import { BIG_BRANDS, CATEGORY_PAGES, MENUS, MIN_BRAND_PIECES, THIN_BRANDS, listWords } from '@/lib/shop';

export const metadata = {
  title: 'Brands',
  description: `Every brand at MATTER, with how many of its pieces we carry and what they are mostly made of. ${BIG_BRANDS.length} brands with their own page, read label first.`,
  alternates: { canonical: '/brands' },
};

/* The brand index. One line per brand: how many pieces, what they are mostly
 * made of, and for the brands we read from their own store, what share of
 * their women's range cleared the bar. The numbers come from the same facts
 * that head each brand page, so they move together. */
export default function BrandsPage() {
  return (
    <>
      <CatBar pages={CATEGORY_PAGES} menus={MENUS} />
      <main id="main" className="wrap">
        <div className="fullhead">
          <p className="eyebrow">Brands</p>
          <h1>Shop by brand</h1>
        </div>
        <ul className="brandindex">
          {BIG_BRANDS.map((b) => {
            const f = brandFacts(b);
            const share = f.ledger ? Math.round((100 * f.ledger.cleared) / f.ledger.read) : null;
            return (
              <li key={b}>
                <Link href={`/brand/${slugify(b)}`}>
                  <span className="bname">{b}</span>
                  <span className="bfacts">
                    {f.n} {f.n === 1 ? 'piece' : 'pieces'}
                    {f.fibers.length ? `, mostly ${listWords(f.fibers).toLowerCase()}` : ''}
                    {share !== null ? `. ${share}% of what we read at ${b} was 95% natural fiber or more.` : ''}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
        <section className="browse" aria-labelledby="thin-brands">
          <h2 id="thin-brands">More brands</h2>
          <p className="fnote">
            A brand gets its own page once we carry at least {MIN_BRAND_PIECES} of its pieces.
            These {THIN_BRANDS.length} share one page until then.
          </p>
          <ul className="brandlist">
            {THIN_BRANDS.map((b) => (
              <li key={b}>
                <Link href={`/brands/more#${slugify(b)}`}>
                  {b} <span className="bcount">({catalog.filter((i) => i.brand === b).length})</span>
                </Link>
              </li>
            ))}
          </ul>
          <p className="updated">Updated {updatedOn()}</p>
        </section>
      </main>
    </>
  );
}
