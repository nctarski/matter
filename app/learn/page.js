import Link from 'next/link';
import guides from '@/data/guides.json';

export const metadata = {
  title: 'Know your fibers',
  description:
    'How to read a garment label, why the lining matters more than the shell, what you are paying for, and what each fiber is actually good at. Wool, linen, cotton, silk, cashmere, leather and the regenerated cellulosics.',
  alternates: { canonical: '/learn' },
};

const GROUPS = ['Reading the label', 'The fibers'];

export default function LearnIndex() {
  return (
    <main id="main" className="wrap">
      <article className="prose">
        <p className="eyebrow">Know your fibers</p>
        <h1>What your clothes are made of</h1>
        <p>
          Composition is the one specification on a garment label that is both standardised
          and genuinely predictive. It tells you how a piece will feel, how it will age, how
          often it needs cleaning, and whether the price is doing anything. Start with how to
          read the label, then go fiber by fiber.
        </p>

        {GROUPS.map((group) => (
          <section key={group}>
            <h2 className="prose-h">{group}</h2>
            <ul>
              {guides.filter((g) => (g.group || 'The fibers') === group).map((g) => (
                <li key={g.slug}>
                  <Link href={`/learn/${g.slug}`} dangerouslySetInnerHTML={{ __html: g.title }} />
                  {': '}
                  {g.specs.map((s) => `${s.label.toLowerCase()} ${s.value.toLowerCase()}`).join(', ')}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </article>
    </main>
  );
}
