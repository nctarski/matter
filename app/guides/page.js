import Link from 'next/link';
import { GUIDES } from '@/lib/guides';

export const metadata = {
  title: 'Shopping Guides',
  description: 'Edited answers to the questions shoppers ask about fabric, each with every piece we carry that answers it.',
  alternates: { canonical: '/guides' },
};

export default function GuidesPage() {
  return (
    <main id="main" className="wrap">
      <div className="fullhead">
        <p className="eyebrow">The guides</p>
        <h1>Shopping guides</h1>
        <p>One question each, answered with every piece we carry that fits, read label first.</p>
      </div>
      <ul className="guidelist">
        {GUIDES.map((g) => (
          <li key={g.slug}>
            <Link href={`/guides/${g.slug}`}>
              <span className="gtitle">{g.title}</span>
              <span className="gdesc">{g.description}</span>
              <span className="gcount">{g.pieces.length} pieces</span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
