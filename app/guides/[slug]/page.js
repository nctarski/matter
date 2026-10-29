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
        {g.question && <p className="gquestion">{g.question}</p>}
      </div>

      {/* A guide is an answer, not a grid. The verdict first, then the three
          pieces that show the shape of the market, then what to check on any
          piece, then every piece we carry that fits. */}
      <section className="verdict" aria-labelledby="verdict-h">
        <h2 id="verdict-h">Our answer</h2>
        <p>{g.verdict}</p>
        {g.intro.map((p, i) => <p key={i} className="gintro">{p}</p>)}
      </section>

      {g.three.length > 0 && (
        <section className="edit-sec photos-model" aria-labelledby="three-h">
          <div className="ehead">
            <h2 id="three-h">Our three</h2>
            <span className="by">Low, middle and top of the range</span>
          </div>
          <div className="trio">
            {g.three.map((p, i) => (
              <ProductCard
                key={p.item.id}
                item={p.item}
                label={['Entry', 'Middle', 'Top'][i]}
                note={p.note || undefined}
              />
            ))}
          </div>
        </section>
      )}

      {g.check && (
        <section className="checklist" aria-labelledby="check-h">
          <h2 id="check-h">What to check before you buy</h2>
          <ul>
            {g.check.map((c, i) => <li key={i}>{c}</li>)}
          </ul>
          {g.learn && (
            <p>
              <Link className="linkbtn" href={`/learn/${g.learn}`}>Read the fiber guide &rarr;</Link>
            </p>
          )}
        </section>
      )}

      <section aria-labelledby="all-h">
        <div className="ehead">
          <h2 id="all-h">Every one that qualifies</h2>
          <span className="by">{g.pieces.length} pieces, lowest price first</span>
        </div>
        <p className="updated">Rebuilt from the catalog at every update. Updated {updated}.</p>
        <div className="grid guidegrid">
          {g.pieces.map((item) => <ProductCard key={item.id} item={item} />)}
        </div>
      </section>
    </main>
  );
}
