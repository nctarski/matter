import Link from 'next/link';
import CatBar from '@/components/CatBar';
import ProductCard from '@/components/ProductCard';
import { catalog, slugify } from '@/lib/catalog';
import { CATEGORY_PAGES, MENUS, MIN_BRAND_PIECES, THIN_BRANDS, BIG_BRANDS } from '@/lib/shop';

export const metadata = {
  title: 'More Brands',
  description: `Brands with fewer than ${MIN_BRAND_PIECES} pieces at MATTER, gathered on one page and read the same way as everything else.`,
  alternates: { canonical: '/brands/more' },
};

export default function MoreBrandsPage() {
  return (
    <>
      <CatBar pages={CATEGORY_PAGES} menus={MENUS} />
      <main id="main" className="wrap">
        <div className="fullhead">
          <p className="eyebrow">Brands</p>
          <h1>More brands</h1>
          <p>
            A brand gets its own page once we carry at least {MIN_BRAND_PIECES} of its pieces.
            Until then, its pieces live here together, read the same way as everything else,
            and they move to a page of their own as soon as the brand reaches {MIN_BRAND_PIECES}.
          </p>
        </div>

        {THIN_BRANDS.map((b) => {
          const pieces = catalog.filter((i) => i.brand === b);
          return (
            <section className="brandgroup" id={slugify(b)} key={b} aria-labelledby={`h-${slugify(b)}`}>
              <div className="ehead">
                <h2 id={`h-${slugify(b)}`}>{b}</h2>
                <span className="by">{pieces.length} {pieces.length === 1 ? 'piece' : 'pieces'}</span>
              </div>
              <div className="grid">
                {pieces.map((item) => <ProductCard key={item.id} item={item} />)}
              </div>
            </section>
          );
        })}

        <section className="browse" aria-labelledby="all-brands">
          <h2 id="all-brands">Brands with their own page</h2>
          <ul className="brandlist">
            {BIG_BRANDS.map((b) => (
              <li key={b}><Link href={`/brand/${slugify(b)}`}>{b}</Link></li>
            ))}
          </ul>
        </section>
      </main>
    </>
  );
}
