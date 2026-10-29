'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SITE } from '@/lib/site';
import { useHearts } from './HeartsProvider';

const LINKS = [
  { href: '/', label: 'Shop' },
  { href: '/brands', label: 'Brands' },
  { href: '/guides', label: 'Guides' },
  { href: '/learn', label: 'Learn' },
  { href: '/about', label: 'About' },
];

export default function Nav() {
  const pathname = usePathname();
  const { hearts, ready } = useHearts();
  const current = (href) =>
    href === '/' ? pathname === '/'
      : href === '/brands' ? pathname.startsWith('/brand')
      : pathname.startsWith(href);

  return (
    <>
      <div className="wrap">
        <div className="brandbar">
          <Link href="/" className="wordmark">{SITE.name}</Link>
          <p className="tagline">{SITE.tagline}</p>
        </div>
      </div>

      <div className="navbar">
        <div className="wrap">
          <nav className="navinner" aria-label="Main">
            {LINKS.map((l) => (
              <Link key={l.href} href={l.href} aria-current={current(l.href) ? 'page' : undefined}>
                {l.label}
              </Link>
            ))}
            <Link href="/hearts" aria-current={current('/hearts') ? 'page' : undefined}>
              My hearts{' '}
              {/* Rendered only after hydration, so the server and client markup match */}
              {ready && hearts.length > 0 && <span className="tally">({hearts.length})</span>}
            </Link>
          </nav>
        </div>
      </div>
    </>
  );
}
