import { notFound } from 'next/navigation';
import CatBar from '@/components/CatBar';
import Shop from '@/components/Shop';
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
  const brands = [...new Set(items.map((i) => i.brand))].filter((b) => BRANDS.includes(b)).slice(0, 3);
  return {
    title: fibers ? `Women's ${c.label} in ${fibers}` : `Women's ${c.label}`,
    description: `${c.label} from ${listWords(brands)} and more, every composition read shell and lining separately, so you know what a piece is made of before you click.`,
    alternates: { canonical: `/shop/${c.slug}` },
  };
}

export default function CategoryPage({ params }) {
  const c = categoryFromSlug(params.slug);
  if (!c) notFound();
  const items = piecesOf(c);
  return (
    <>
      <CatBar pages={CATEGORY_PAGES} menus={MENUS} current={c.label} />
      <Shop
        items={items}
        category={{ label: c.label, category: c.category }}
        menu={MENUS[c.category] || null}
        heading={{
          eyebrow: 'Shop',
          title: c.label,
          body: `${items.length} ${items.length === 1 ? 'piece' : 'pieces'} in ${listWords(topFibers(items)).toLowerCase()} and more, every composition read shell and lining separately.`,
        }}
      />
    </>
  );
}
