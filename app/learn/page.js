import Link from 'next/link';
import guides from '@/data/guides.json';

export const metadata = {
  title: 'Know your fibers',
  description:
    'What each fiber is actually good at, how to care for it, and where it lets you down. Wool, linen, cotton, silk, cashmere and the regenerated cellulosics.',
  alternates: { canonical: '/learn' },
};

export default function LearnIndex() {
  return (
    <main id="main" className="wrap">
      <article className="prose">
        <p className="eyebrow">Know your fibers</p>
        <h1>What your clothes are made of</h1>
        <p>
          Composition is the one specification on a garment label that is both standardised
          and genuinely predictive. It tells you how a piece will feel, how it will age, how
          often it needs cleaning, and whether the price is doing anything. Here is what each
          fiber is actually good at, and where it lets you down.
        </p>

        <nav className="fibertabs" aria-label="Fiber guides">
          {guides.map((g) => (
            <Link key={g.slug} href={`/learn/${g.slug}`}>{g.title}</Link>
          ))}
        </nav>

        <ul>
          {guides.map((g) => (
            <li key={g.slug}>
              <Link href={`/learn/${g.slug}`}>{g.title}</Link>
              {' — '}
              {g.specs.map((s) => `${s.label.toLowerCase()} ${s.value.toLowerCase()}`).join(', ')}
            </li>
          ))}
        </ul>
      </article>
    </main>
  );
}
