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
        <p>
          Each guide takes one question a shopper actually asks and answers it: a verdict,
          the three pieces that show the shape of the market, what to check on the label
          before you buy, and then every piece we carry that qualifies, rebuilt at every update.
        </p>
      </div>
      <ul className="guidelist">
        {GUIDES.map((g) => (
          <li key={g.slug}>
            <Link href={`/guides/${g.slug}`}>
              <span className="gtitle">{g.title}</span>
              <span className="gdesc">{g.question || g.description}</span>
              <span className="gcount">{g.pieces.length} pieces</span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
