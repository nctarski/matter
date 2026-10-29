import { notFound } from 'next/navigation';
import CatBar from '@/components/CatBar';
import JsonLd, { itemList } from '@/components/JsonLd';
import Shop from '@/components/Shop';
import edits from '@/data/edits.json';
import { EDIT_RULES, editPieces } from '@/lib/editrules';
import { CATEGORY_PAGES, MENUS } from '@/lib/shop';

/* One static page per homepage edit: every live piece that answers the
 * edit's rule, with the full filter rail. This is where "Shop the holiday
 * edit" lands, and it gives each edit an address worth ranking. */

const blockOf = (key) => edits.find((b) => b.rule === key) || null;

export function generateStaticParams() {
  return Object.keys(EDIT_RULES).map((key) => ({ key }));
}

export function generateMetadata({ params }) {
  const rule = EDIT_RULES[params.key];
  if (!rule) return {};
  const block = blockOf(params.key);
  return {
    title: rule.title,
    description: block?.note || rule.title,
    alternates: { canonical: `/edit/${params.key}` },
  };
}

export default function EditPage({ params }) {
  const rule = EDIT_RULES[params.key];
  if (!rule) notFound();
  const block = blockOf(params.key);
  const items = editPieces(params.key);
  return (
    <>
      <JsonLd data={itemList(`${rule.title} at MATTER`, items)} />
      <CatBar pages={CATEGORY_PAGES} menus={MENUS} />
      <Shop
        items={items}
        groupSets={params.key === 'sets'}
        heading={{
          eyebrow: block?.by || 'The edit',
          title: rule.title,
          body: block?.note || '',
        }}
      />
    </>
  );
}
