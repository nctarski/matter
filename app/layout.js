import './globals.css';
import { SITE } from '@/lib/site';
import { HeartsProvider } from '@/components/HeartsProvider';
import Nav from '@/components/Nav';
import Signup from '@/components/Signup';
import Footer from '@/components/Footer';

export const metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} · ${SITE.tagline}`,
    template: `%s · ${SITE.name}`,
  },
  description: SITE.description,
  openGraph: {
    siteName: SITE.name,
    type: 'website',
    title: `${SITE.name} · ${SITE.tagline}`,
    description: SITE.description,
  },
  robots: { index: true, follow: true },
};

export const viewport = { themeColor: '#f7f5ef' };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
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
