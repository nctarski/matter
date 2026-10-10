import { SITE } from '@/lib/site';

export const metadata = {
  title: 'Affiliate disclosure',
  description: 'How Matter makes money, stated plainly.',
  alternates: { canonical: '/disclosure' },
};

export default function DisclosurePage() {
  return (
    <main id="main" className="wrap">
      <article className="prose">
        <p className="eyebrow">Disclosure</p>
        <h1>How we make money</h1>
        <p>
          Matter earns affiliate commission. When you click through to a retailer and
          buy something, that retailer pays us a percentage of the sale. It costs you
          nothing, and the price you pay is the same either way.
        </p>

        <section>
          <h2>What that does not change</h2>
          <p>
            It does not change which pieces appear here, the order they appear in, or
            what we say about them. A piece qualifies on composition and on whether we
            would wear it, and on nothing else. We do not accept payment for placement,
            we do not take money to feature a brand, and we do not rank by commission
            rate.
          </p>
          <p>
            The filter is the product. Skewing it would end the business, which is the
            most reliable guarantee we can offer you.
          </p>
        </section>

        <section>
          <h2>What this means in practice</h2>
          <ul>
            <li>Some outbound links on this site are affiliate links.</li>
            <li>
              Clicking one may place a cookie from the retailer or from an affiliate
              network, which is how the sale is attributed to us.
            </li>
            <li>
              Not every link earns a commission. Many brands have no affiliate program
              and we include them anyway when the piece deserves it.
            </li>
            <li>
              We are not paid to write the fiber guides, and no brand reviews them
              before publication.
            </li>
          </ul>
        </section>

        <section>
          <h2>Questions</h2>
          <p>
            If anything here is unclear, or you think we have got something wrong,
            write to <a href={`mailto:${SITE.email}`}>{SITE.email}</a>. We would rather
            hear it.
          </p>
        </section>
      </article>
    </main>
  );
}
