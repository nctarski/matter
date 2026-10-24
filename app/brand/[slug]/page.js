import { notFound } from 'next/navigation';
import CatBar from '@/components/CatBar';
import Shop from '@/components/Shop';
import { BRANDS, brandFromSlug, slugify, catalog } from '@/lib/catalog';
import { CATEGORY_PAGES, MENUS, listWords, topFibers } from '@/lib/shop';

/* One static page per brand in the catalog, built at deploy time. This is the
 * URL that goes into an affiliate application or an email to the brand. It
 * also happens to be good SEO, because "brand + cashmere" is a query people
 * actually type. */

export function generateStaticParams() {
  return BRANDS.map((b) => ({ slug: slugify(b) }));
}

export function generateMetadata({ params }) {
  const brand = brandFromSlug(params.slug);
  if (!brand) return {};
  const pieces = catalog.filter((i) => i.brand === brand);
  const n = pieces.length;
  return {
    title: topFibers(pieces).length ? `${brand} in ${listWords(topFibers(pieces))}` : brand,
    description: `${n} ${brand} ${n === 1 ? 'piece' : 'pieces'} indexed by fiber composition, shell and lining read separately.`,
    alternates: { canonical: `/brand/${params.slug}` },
  };
}

export default function BrandPage({ params }) {
  const brand = brandFromSlug(params.slug);
  if (!brand) notFound();
  const pieces = catalog.filter((i) => i.brand === brand);
  return (
    <>
      <CatBar pages={CATEGORY_PAGES} menus={MENUS} />
      <Shop
        items={pieces}
        brand={brand}
        heading={{
          eyebrow: `${brand} at MATTER`,
          title: `${brand}, read label first`,
          body: `${pieces.length} ${pieces.length === 1 ? 'piece' : 'pieces'} indexed, every composition read from the product page and shown shell and lining separately. Sorted most natural first.`,
        }}
      />
    </>
  );
}
