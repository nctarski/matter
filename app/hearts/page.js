import HeartsView from '@/components/HeartsView';

export const metadata = {
  title: 'My hearts',
  description: 'The pieces you have saved, grouped by retailer.',
  // A personal list has nothing for a search engine to index.
  robots: { index: false, follow: true },
};

export default function HeartsPage() {
  return <HeartsView />;
}
