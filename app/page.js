import Shop from '@/components/Shop';
import { SITE } from '@/lib/site';

export const metadata = {
  title: `${SITE.name} · ${SITE.tagline}`,
  description: SITE.description,
  alternates: { canonical: '/' },
};

export default function HomePage() {
  return <Shop />;
}
