import Link from 'next/link';
import { notFound } from 'next/navigation';
import JsonLd, { itemList } from '@/components/JsonLd';
import ProductCard from '@/components/ProductCard';
import { updatedOn } from '@/lib/brandfacts';
import { GUIDES, guideFromSlug } from '@/lib/guides';
import { SITE } from '@/lib/site';

export function generateStaticParams() {
  return GUIDES.map((g) => ({ slug: g.slug }));
}

export function generateMetadata({ params }) {
  const g = guideFromSlug(params.slug);
  if (!g) return {};
  return { title: g.title, description: g.description, alternates: { canonical: `/guides/${g.slug}` } };
}

export default function GuidePage({ params }) {
  const g = guideFromSlug(params.slug);
  if (!g) notFound();
  const updated = updatedOn();
  return (
    <main id="main" className="wrap">
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: g.title,
          description: g.description,
          dateModified: new Date().toISOString().slice(0, 10),
          publisher: { '@type': 'Organization', name: SITE.name, url: SITE.url },
          mainEntityOfPage: `${SITE.url}/guides/${g.slug}`,
        }}
      />
      <JsonLd data={itemList(g.title, g.pieces)} />
      <div className="fullhead">
        <p className="eyebrow">{g.eyebrow}</p>
        <h1>{g.title}</h1>
        {g.intro.map((p, i) => <p key={i}>{p}</p>)}
        {g.learn && (
          <p>
            <Link className="linkbtn" href={`/learn/${g.learn}`}>Read the fiber guide &rarr;</Link>
          </p>
        )}
        <p className="updated">{g.pieces.length} pieces, lowest price first. Updated {updated}.</p>
      </div>
      <div className="grid guidegrid">
        {g.pieces.map((item) => <ProductCard key={item.id} item={item} />)}
      </div>
    </main>
  );
}
