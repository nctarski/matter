import { notFound } from 'next/navigation';
import CatBar from '@/components/CatBar';
import Facts from '@/components/Facts';
import JsonLd, { itemList } from '@/components/JsonLd';
import Shop from '@/components/Shop';
import { categoryFacts, categorySummary, updatedOn } from '@/lib/brandfacts';
import { BRANDS, catalog } from '@/lib/catalog';
import { CATEGORY_PAGES, MENUS, categoryFromSlug, listWords, topFibers } from '@/lib/shop';

/* One static page per garment category, built at deploy time. */

export function generateStaticParams() {
  return CATEGORY_PAGES.map((c) => ({ slug: c.slug }));
}

const piecesOf = (c) => catalog.filter((i) => i.category === c.category);

export function generateMetadata({ params }) {
  const c = categoryFromSlug(params.slug);
  if (!c) return {};
  const items = piecesOf(c);
  const fibers = listWords(topFibers(items));
  return {
    title: fibers ? `Women's ${c.label} in ${fibers}` : `Women's ${c.label}`,
    description: categorySummary(c.label, categoryFacts(c.category)).slice(0, 300),
    alternates: { canonical: `/shop/${c.slug}` },
  };
}

export default function CategoryPage({ params }) {
  const c = categoryFromSlug(params.slug);
  if (!c) notFound();
  const items = piecesOf(c);
  return (
    <>
      <JsonLd data={itemList(`Women's ${c.label} at MATTER`, items)} />
      <CatBar pages={CATEGORY_PAGES} menus={MENUS} current={c.label} />
      <Shop
        items={items}
        category={{ label: c.label, category: c.category }}
        menu={MENUS[c.category] || null}
        heading={{ eyebrow: 'Shop', title: c.label }}
        after={<Facts summary={categorySummary(c.label, categoryFacts(c.category))} updated={updatedOn()} collapsed />}
      />
    </>
  );
}
