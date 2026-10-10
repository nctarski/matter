'use client';

import { catalog } from '@/lib/catalog';
import ProductCard from './ProductCard';
import { useHearts } from './HeartsProvider';
import { formatPrice } from '@/lib/fibers';

const byId = Object.fromEntries(catalog.map((i) => [i.id, i]));

export default function HeartsView() {
  const { hearts, ready } = useHearts();
  const items = hearts.map((id) => byId[id]).filter(Boolean);

  // Group by retailer so the shopper finishes in as few baskets as possible.
  const groups = {};
  items.forEach((item) => {
    (groups[item.retailer] = groups[item.retailer] || []).push(item);
  });
  const ordered = Object.entries(groups).sort((a, b) => b[1].length - a[1].length);

  return (
    <main id="main" className="wrap">
      <section className="hearts">
        <div>
          <p className="eyebrow">My hearts</p>
          <h2>
            {!ready
              ? 'Your hearted pieces'
              : items.length
              ? `${items.length} ${items.length === 1 ? 'piece' : 'pieces'} hearted`
              : 'Nothing hearted yet'}
          </h2>
        </div>

        {ready && !items.length && (
          <p style={{ color: 'var(--muted)', maxWidth: '54ch' }}>
            Tap the heart on any piece to keep it here. Hearted pieces group by retailer
            so you can finish in as few baskets as possible.
          </p>
        )}

        {ordered.map(([retailer, group]) => {
          const total = group.reduce((sum, i) => sum + i.price, 0);
          const link = group.find((i) => i.url)?.url;
          return (
            <div className="rgroup" key={retailer}>
              <div className="rgtop">
                <div>
                  <h3>{retailer}</h3>
                  <span className="sub">
                    {group.length} {group.length === 1 ? 'piece' : 'pieces'} · {formatPrice(total)}
                  </span>
                </div>
                {link ? (
                  <a className="goto" href={link} target="_blank" rel="nofollow sponsored noopener">
                    Continue to {retailer}
                  </a>
                ) : (
                  <button className="goto" type="button" disabled>
                    Continue to {retailer}
                  </button>
                )}
              </div>
              <div className="savedgrid">
                {group.map((item) => <ProductCard key={item.id} item={item} />)}
              </div>
            </div>
          );
        })}

        <div className="whybox">
          <h4>Why checkout happens on the retailer&rsquo;s site</h4>
          <p>
            Matter does not hold stock, take payment, or handle returns. Every piece is sold
            by the retailer named on the card, and your order, sizing, shipping and returns
            stay with them. Hearting groups your pieces by retailer so you can finish in as
            few baskets as possible.
          </p>
        </div>
      </section>
    </main>
  );
}
