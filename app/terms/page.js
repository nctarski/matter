import { SITE } from '@/lib/site';

export const metadata = {
  title: 'Terms',
  description: 'The terms you agree to by using Matter.',
  alternates: { canonical: '/terms' },
};

export default function TermsPage() {
  return (
    <main id="main" className="wrap">
      <article className="prose">
        <p className="eyebrow">Terms</p>
        <h1>Terms of use</h1>
        <p>
          By using Matter you agree to what follows. It is short because the site is
          simple. We do not sell anything, hold your money, or keep an account for you.
        </p>

        <section>
          <h2>What Matter is</h2>
          <p>
            A discovery and reference site. We index clothing sold by other retailers
            and show you what each piece is made of. Every purchase happens on the
            retailer&rsquo;s own site, under their terms. Your order, payment, sizing,
            shipping, returns and customer service are between you and them. We are
            not a party to that sale and cannot resolve a problem with it.
          </p>
        </section>

        <section>
          <h2>About the composition data</h2>
          <p>
            We take composition from retailer product pages and recheck it on a
            schedule. We try hard to get it right, and it is the reason the site
            exists. It can still be wrong, because retailers make mistakes, change
            suppliers mid-season, and occasionally mislabel a garment outright.
          </p>
          <p>
            So treat what you see here as a well-researched guide rather than a
            guarantee, and check the label on the garment itself before you rely on it,
            particularly if you have an allergy or sensitivity. If you find something
            wrong, tell us at <a href={`mailto:${SITE.email}`}>{SITE.email}</a> and we
            will fix it.
          </p>
        </section>

        <section>
          <h2>Prices and availability</h2>
          <p>
            Prices and stock change constantly and the retailer&rsquo;s own page is
            always the authority. What you see here may be out of date by the time you
            click.
          </p>
        </section>

        <section>
          <h2>Our writing, and other people&rsquo;s</h2>
          <p>
            The fiber guides, editorial notes and site design are ours. Please do not
            republish them wholesale. Quoting a passage with a link back is welcome.
          </p>
          <p>
            Brand names, product names and product images belong to their owners and
            appear here to identify the pieces we are writing about. That is not an
            endorsement by them of us.
          </p>
        </section>

        <section>
          <h2>Liability</h2>
          <p>
            Matter is provided as it is. We are not liable for losses arising from
            using the site, from relying on composition or price information, or from
            anything that happens on a retailer&rsquo;s site after you click through.
            Nothing here limits any right you have that cannot legally be limited.
          </p>
        </section>

        <section>
          <h2>Changes and contact</h2>
          <p>
            We may update these terms. Continuing to use the site after a change means
            you accept it. Questions go to{' '}
            <a href={`mailto:${SITE.email}`}>{SITE.email}</a>.
          </p>
        </section>
      </article>
    </main>
  );
}
