import CatBar from '@/components/CatBar';
import Shop from '@/components/Shop';
import { catalog } from '@/lib/catalog';
import { CATEGORY_PAGES, MENUS } from '@/lib/shop';

export const metadata = {
  title: "Shop Women's Cashmere, Silk, Wool and Linen",
  description: `${catalog.length} pieces from the brands worth knowing, every composition read shell and lining separately. Set your own standard and see what survives it.`,
  alternates: { canonical: '/shop' },
};

export default function ShopAllPage() {
  return (
    <>
      <CatBar pages={CATEGORY_PAGES} menus={MENUS} current="All" />
      <Shop
        items={catalog}
        heading={{ eyebrow: 'The full edit', title: 'Set your own standard' }}
      />
    </>
  );
}
