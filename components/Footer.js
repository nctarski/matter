import Link from 'next/link';
import { SITE } from '@/lib/site';

export default function Footer() {
  return (
    <footer>
      <nav className="footlinks" aria-label="Footer">
        <Link href="/about">Our standard</Link>
        <Link href="/learn">Know your fibers</Link>
        <Link href="/disclosure">Disclosure</Link>
        <Link href="/privacy">Privacy</Link>
        <Link href="/terms">Terms</Link>
        <a href={`mailto:${SITE.email}`}>Contact</a>
      </nav>
      {/* The affiliate, data and image notices, folded up. They have to be on
          every page, for the networks and for anyone who asks, but they do not
          have to be read on every page. */}
      <details className="fineprint">
        <summary>The fine print</summary>
        <p>
          Matter earns commission on qualifying purchases made through outbound links.
          It costs you nothing and it does not change what we show you.{' '}
          <Link href="/disclosure">Full disclosure</Link>.
        </p>
        <p>
          Composition data is sourced from retailer product pages and rechecked on a
          schedule. Check the garment label before relying on it.
        </p>
        <p>
          Product images belong to their retailers and brands. To have an image
          removed, email <a href={`mailto:${SITE.email}`}>{SITE.email}</a> and it
          comes down within one business day.
        </p>
      </details>
      <p>&copy; {new Date().getFullYear()} {SITE.name}</p>
    </footer>
  );
}
