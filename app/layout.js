import './globals.css';
import { SITE } from '@/lib/site';
import { HeartsProvider } from '@/components/HeartsProvider';
import Nav from '@/components/Nav';
import Signup from '@/components/Signup';
import Footer from '@/components/Footer';

export const metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: SITE.homeTitle,
    template: `%s | ${SITE.name}`,
  },
  description: SITE.description,
  openGraph: {
    siteName: SITE.name,
    type: 'website',
    title: SITE.homeTitle,
    description: SITE.description,
  },
  twitter: { card: 'summary_large_image' },
  // Driven by SITE.indexable, so there is one place to flip when the real
  // catalog lands rather than a setting hiding in several files.
  robots: SITE.indexable
    ? { index: true, follow: true }
    : { index: false, follow: false },
};

/* Tells Google who publishes the site and what it is called, so a search for
 * MATTER can show the name and site search properly. */
const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${SITE.url}/#organization`,
      name: SITE.name,
      url: SITE.url,
      logo: `${SITE.url}/icon.svg`,
      email: SITE.email,
      description: SITE.description,
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE.url}/#website`,
      name: SITE.name,
      alternateName: 'MATTER The Edit',
      url: SITE.url,
      publisher: { '@id': `${SITE.url}/#organization` },
    },
  ],
};

export const viewport = { themeColor: '#f7f5ef' };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* Impact.com site ownership check. Impact's own snippet uses a value
            attribute; content is added too so either style of checker reads
            it. Safe to leave in place after verification. */}
        <meta
          name="impact-site-verification"
          value="edc5d1d2-1c47-40f3-9751-1dfda03aeb64"
          content="edc5d1d2-1c47-40f3-9751-1dfda03aeb64"
        />
        {/* Loaded from Google rather than through next/font, so a slow or
            blocked font fetch can never fail a deploy. If you later want the
            faces self-hosted (slightly faster, no layout shift), swap this
            for next/font/google in this file. Nothing else has to change,
            because every rule points at --display and --ui. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,500;0,6..96,600;1,6..96,500&family=Inter:wght@400;500&display=swap"
        />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </head>
      <body>
        <a className="skip" href="#main">Skip to content</a>
        <HeartsProvider>
          <Nav />
          {children}
          <div className="wrap">
            <Signup />
            <Footer />
          </div>
        </HeartsProvider>
      </body>
    </html>
  );
}
