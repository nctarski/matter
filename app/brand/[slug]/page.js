import { notFound, permanentRedirect } from 'next/navigation';
import CatBar from '@/components/CatBar';
import Facts from '@/components/Facts';
import JsonLd, { itemList } from '@/components/JsonLd';
import Shop from '@/components/Shop';
import { brandFromSlug, slugify, catalog } from '@/lib/catalog';
import { brandFacts, brandSummary, brandTrend, updatedOn } from '@/lib/brandfacts';
import { BIG_BRANDS, CATEGORY_PAGES, MENUS, THIN_BRANDS, listWords, topFibers } from '@/lib/shop';

/* One static page per brand with at least MIN_BRAND_PIECES pieces. This is the
 * URL that goes into an affiliate application or an email to the brand, and
 * "brand + cashmere" is a query people actually type. Smaller brands share
 * /brands/more, and their old addresses redirect there. */

export function generateStaticParams() {
  return BIG_BRANDS.map((b) => ({ slug: slugify(b) }));
}

export function generateMetadata({ params }) {
  const brand = brandFromSlug(params.slug);
  if (!brand || THIN_BRANDS.includes(brand)) return {};
  const f = brandFacts(brand);
  return {
    title: f.fibers.length ? `${brand} in ${listWords(f.fibers)}` : brand,
    description: brandSummary(f).slice(0, 300),
    alternates: { canonical: `/brand/${params.slug}` },
  };
}

export default function BrandPage({ params }) {
  const brand = brandFromSlug(params.slug);
  if (!brand) notFound();
  if (THIN_BRANDS.includes(brand)) permanentRedirect(`/brands/more#${params.slug}`);
  const pieces = catalog.filter((i) => i.brand === brand);
  const f = brandFacts(brand);
  return (
    <>
      <JsonLd data={itemList(`${brand} at MATTER`, pieces)} />
      <CatBar pages={CATEGORY_PAGES} menus={MENUS} />
      <Shop
        items={pieces}
        brand={brand}
        heading={{
          eyebrow: `${brand} at MATTER`,
          title: `${brand}, read label first`,
          body: 'Every composition read from the product page and shown shell and lining separately. Sorted most natural first.',
          photonote: true,
        }}
      >
        <Facts summary={brandSummary(f)} trend={brandTrend(f)} updated={updatedOn()} />
      </Shop>
    </>
  );
}
