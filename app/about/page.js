export const metadata = {
  title: 'The standard',
  description:
    'How a piece qualifies for Matter. Shell and lining read separately, a 95 percent default you can move, and what we will not claim.',
  alternates: { canonical: '/about' },
};

export default function AboutPage() {
  return (
    <main id="main" className="wrap">
      <article className="prose">
        <p className="eyebrow">About</p>
        <h1>The standard</h1>
        <p>
          Matter exists because finding a wool coat should not require opening twenty product
          pages and scrolling to the composition line on each one. We read the composition so
          you do not have to, and we let you set the bar rather than setting it for you.
        </p>

        <section>
          <h2>What we are</h2>
          <p>
            A fashion discovery site with unusually high standards about materials. Not a
            sustainability company that happens to sell clothes. We care how a garment is cut
            and who made it desirable first, and what it is made of second. Both have to be
            true for a piece to appear here.
          </p>
        </section>

        <section>
          <h2>How a piece qualifies</h2>
          <ul>
            <li>We index shell composition and lining composition separately. The lining is never folded into the headline number.</li>
            <li>The default view shows pieces that are 95 percent or more natural fiber. You can move that bar in either direction.</li>
            <li>Elastane up to 5 percent is allowed by default, because functional stretch is not what anyone is trying to avoid.</li>
            <li>Thread, trim, interfacing and buttons are not counted.</li>
            <li>Viscose, modal, cupro and bamboo are shown as regenerated cellulosic, separately from both natural and synthetic. Lyocell is separated again, because its closed-loop process is materially different. Bamboo viscose is viscose, whatever the marketing says.</li>
            <li>Recycled polyester receives no credit. It is still plastic and it still sheds.</li>
          </ul>
        </section>

        <section>
          <h2>What we will not claim</h2>
          <p>
            Natural fiber does not mean sustainable, non-toxic, or ethically made. Those are
            real questions with real answers, and composition is not one of them. We show the
            percentages and the source text, and we do not give you a score to argue with.
          </p>
          <p>
            Where a composition is missing, contradictory, or unclear, the piece does not
            appear until a person has checked it.
          </p>
        </section>

        <section>
          <h2>How we make money</h2>
          <p>
            When you buy something after clicking through, the retailer pays us a commission.
            It costs you nothing and it does not change what we show you or the order we show
            it in. The filter is the product. Skewing it would end the business.
          </p>
        </section>
      </article>
    </main>
  );
}
