/** Structured data for search engines and AI tools, rendered into the page. */
export default function JsonLd({ data }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

/** The first pieces on a page as an ItemList, so a machine reading the page
 *  knows it is a list of products and what they are. */
export const itemList = (name, items, max = 30) => ({
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name,
  numberOfItems: items.length,
  itemListElement: items.slice(0, max).map((i, n) => ({
    '@type': 'ListItem',
    position: n + 1,
    name: `${i.brand} ${i.name}`,
    url: i.url,
  })),
});
