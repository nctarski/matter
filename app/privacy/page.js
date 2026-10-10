import { SITE } from '@/lib/site';

export const metadata = {
  title: 'Privacy',
  description: 'What Matter collects, which is very little, and what happens to it.',
  alternates: { canonical: '/privacy' },
};

export default function PrivacyPage() {
  return (
    <main id="main" className="wrap">
      <article className="prose">
        <p className="eyebrow">Privacy</p>
        <h1>What we collect</h1>
        <p>
          Very little. There are no accounts on Matter, so there is nothing to sign
          into and no profile to build. Here is the whole picture.
        </p>

        <section>
          <h2>Your hearted pieces</h2>
          <p>
            When you heart a piece, that is saved in your own browser and nowhere
            else. It does not reach us, it does not sync to your other devices, and
            clearing your browser data erases it. We cannot see what you have saved.
          </p>
        </section>

        <section>
          <h2>Your email, only if you give it</h2>
          <p>
            If you subscribe to The Matter Edit, we store your email address with our
            email provider for the purpose of sending you that newsletter. We do not
            sell it, rent it, or pass it to brands. Every email carries an unsubscribe
            link, and unsubscribing removes you.
          </p>
        </section>

        <section>
          <h2>Analytics</h2>
          <p>
            We use privacy-respecting analytics to understand which pages people read
            and which pieces get clicked. That tells us what to curate more of. We do
            not use it to identify you personally, and we do not run advertising
            trackers or sell data to anyone.
          </p>
        </section>

        <section>
          <h2>Affiliate cookies</h2>
          <p>
            When you click through to a retailer, that retailer or an affiliate network
            may place a cookie so the sale is attributed to us. That cookie is theirs,
            not ours, and it is governed by their privacy policy rather than this one.
            Our <a href="/disclosure">affiliate disclosure</a> explains the
            arrangement.
          </p>
        </section>

        <section>
          <h2>Your rights</h2>
          <p>
            You can ask us what we hold about you, ask us to correct it, or ask us to
            delete it. Since the only thing we are likely to hold is an email address,
            that is usually a one line request and a quick answer. Write to{' '}
            <a href={`mailto:${SITE.email}`}>{SITE.email}</a>.
          </p>
        </section>

        <section>
          <h2>Changes</h2>
          <p>
            If this policy changes in a way that matters, we will say so here and, for
            anything significant, in the newsletter. We will not quietly start
            collecting more than this.
          </p>
        </section>
      </article>
    </main>
  );
}
