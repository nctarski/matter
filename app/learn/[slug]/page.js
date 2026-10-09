import Link from 'next/link';
import { notFound } from 'next/navigation';
import guides from '@/data/guides.json';

// Every guide is built at deploy time as its own static page, which is what
// lets Google index them and what makes them load instantly.
export function generateStaticParams() {
  return guides.map((g) => ({ slug: g.slug }));
}

export function generateMetadata({ params }) {
  const guide = guides.find((g) => g.slug === params.slug);
  if (!guide) return {};
  return {
    title: guide.title,
    description: guide.intro[0]?.slice(0, 155),
    alternates: { canonical: `/learn/${guide.slug}` },
  };
}

/** The guide text is written as plain prose with the odd <strong> for a term.
 *  Rendering it as markup rather than escaping it keeps those emphases. */
const Html = ({ as: Tag = 'p', html, ...rest }) => (
  <Tag {...rest} dangerouslySetInnerHTML={{ __html: html }} />
);

export default function GuidePage({ params }) {
  const guide = guides.find((g) => g.slug === params.slug);
  if (!guide) notFound();

  return (
    <main id="main" className="wrap">
      <article className="prose">
        <p className="eyebrow">Know your fibers</p>

        <nav className="fibertabs" aria-label="Fiber guides">
          {guides.map((g) => (
            <Link
              key={g.slug}
              href={`/learn/${g.slug}`}
              aria-current={g.slug === guide.slug ? 'page' : undefined}
            >
              {g.title}
            </Link>
          ))}
        </nav>

        <Html as="h1" html={guide.title} />
        {guide.intro.map((para, i) => <Html key={i} html={para} />)}

        <dl className="specs">
          {guide.specs.map((s) => (
            <div className="spec" key={s.label}>
              <dt>{s.label}</dt>
              <dd>{s.value}</dd>
            </div>
          ))}
        </dl>

        {guide.sections.map((section, i) => (
          <section key={i}>
            {section.pull && <Html className="pull" html={section.pull} />}
            {section.heading && <Html as="h2" className="prose-h" html={section.heading} />}
            {section.body && <Html html={section.body} />}
            {section.list && (
              <ul>
                {section.list.map((item, j) => <Html as="li" key={j} html={item} />)}
              </ul>
            )}
          </section>
        ))}
      </article>
    </main>
  );
}
