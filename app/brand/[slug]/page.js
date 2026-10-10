import { notFound } from 'next/navigation';
import Shop from '@/components/Shop';
import { BRANDS, brandFromSlug, slugify, catalog } from '@/lib/catalog';
import { SITE } from '@/lib/site';

/* One static page per brand in the catalog, built at deploy time. This is the
 * URL that goes into an affiliate application or an email to the brand. It
 * also happens to be good SEO, because "brand + natural fiber" is a query
 * people actually type. */

export function generateStaticParams() {
  return BRANDS.map((b) => ({ slug: slugify(b) }));
}

export function generateMetadata({ params }) {
  const brand = brandFromSlug(params.slug);
  if (!brand) return {};
  const n = catalog.filter((i) => i.brand === brand).length;
  return {
    title: brand,
    description: `${n} ${brand} ${n === 1 ? 'piece' : 'pieces'} indexed by fiber composition, shell and lining read separately.`,
    alternates: { canonical: `/brand/${params.slug}` },
  };
}

export default function BrandPage({ params }) {
  const brand = brandFromSlug(params.slug);
  if (!brand) notFound();
  return <Shop brand={brand} />;
}
